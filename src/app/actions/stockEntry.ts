'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface ParsedXmlSupplier {
  document: string
  name: string
  tradeName: string | null
  ie: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  cep: string | null
}

export interface ParsedXmlItem {
  code: string
  description: string
  ncm: string
  unit: string
  quantity: number
  costPrice: number
  totalPrice: number
  suggestedSalePrice: number
  matchedStockItemId?: string | null
  matchedStockItemName?: string | null
}

export interface ParsedXmlData {
  nfeKey: string
  nfeNumber: string
  nfeSeries: string
  issueDate: string | null
  totalAmount: number
  supplier: ParsedXmlSupplier
  items: ParsedXmlItem[]
}

// Helper para extrair conteúdo de tag XML via Regex
function getTagValue(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? match[1].trim() : ''
}

// Helper para ler XML de Nota Fiscal (NF-e Modelo 55)
export async function parseNfeXmlAction(xmlContent: string): Promise<ParsedXmlData> {
  const session = await getSession()

  // Extrair a Chave de Acesso (chNFe)
  let nfeKey = getTagValue(xmlContent, 'chNFe')
  if (!nfeKey) {
    const infNfeMatch = xmlContent.match(/infNFe\s+Id="NFe(\d{44})"/i)
    if (infNfeMatch) {
      nfeKey = infNfeMatch[1]
    }
  }

  if (!nfeKey) {
    const nNF = getTagValue(xmlContent, 'nNF') || '0'
    nfeKey = `TEMP_${Date.now()}_${nNF}`
  }

  const nfeNumber = getTagValue(xmlContent, 'nNF') || '1'
  const nfeSeries = getTagValue(xmlContent, 'serie') || '1'
  const issueDate = getTagValue(xmlContent, 'dhEmi') || getTagValue(xmlContent, 'dEmi') || null
  const totalAmount = parseFloat(getTagValue(xmlContent, 'vNF') || '0')

  // Extrair bloco do Emitente (<emit>)
  const emitMatch = xmlContent.match(/<emit[^>]*>([\s\S]*?)<\/emit>/i)
  const emitXml = emitMatch ? emitMatch[1] : ''

  const cnpj = getTagValue(emitXml, 'CNPJ') || getTagValue(emitXml, 'CPF')
  const supplierName = getTagValue(emitXml, 'xNome') || 'Fornecedor Desconhecido'
  const tradeName = getTagValue(emitXml, 'xFant') || supplierName
  const ie = getTagValue(emitXml, 'IE')
  
  // Endereço do Emitente
  const enderEmitMatch = emitXml.match(/<enderEmit[^>]*>([\s\S]*?)<\/enderEmit>/i)
  const enderXml = enderEmitMatch ? enderEmitMatch[1] : ''
  
  const street = getTagValue(enderXml, 'xLgr')
  const number = getTagValue(enderXml, 'nro')
  const b = getTagValue(enderXml, 'xBairro')
  const city = getTagValue(enderXml, 'xMun')
  const state = getTagValue(enderXml, 'UF')
  const cep = getTagValue(enderXml, 'CEP')
  const phone = getTagValue(enderXml, 'fone')

  const fullAddress = [street, number, b, city, state].filter(Boolean).join(', ')

  const supplier: ParsedXmlSupplier = {
    document: cnpj ? cnpj.replace(/\D/g, '') : '',
    name: supplierName,
    tradeName: tradeName,
    ie: ie || null,
    phone: phone || null,
    address: fullAddress || null,
    city: city || null,
    state: state || null,
    cep: cep || null
  }

  // Extrair itens (<det>)
  const detMatches = xmlContent.match(/<det[^>]*>([\s\S]*?)<\/det>/gi) || []
  const items: ParsedXmlItem[] = []

  const existingStock = await prisma.stockItem.findMany({
    where: { tenantId: session.tenantId }
  })

  for (const detXml of detMatches) {
    const prodMatch = detXml.match(/<prod[^>]*>([\s\S]*?)<\/prod>/i)
    const prodXml = prodMatch ? prodMatch[1] : detXml

    const code = getTagValue(prodXml, 'cProd')
    const description = getTagValue(prodXml, 'xProd')
    const ncm = getTagValue(prodXml, 'NCM') || '8708.29.99'
    const unit = (getTagValue(prodXml, 'uCom') || 'UN').toUpperCase()
    const quantity = Math.round(parseFloat(getTagValue(prodXml, 'qCom') || '1'))
    const costPrice = parseFloat(getTagValue(prodXml, 'vUnCom') || '0')
    const totalPrice = parseFloat(getTagValue(prodXml, 'vProd') || '0')

    const suggestedSalePrice = Math.round(costPrice * 1.6 * 100) / 100

    const matchedItem = existingStock.find(i => 
      i.code.toLowerCase() === code.toLowerCase() || 
      i.description.toLowerCase().trim() === description.toLowerCase().trim()
    )

    items.push({
      code,
      description,
      ncm,
      unit,
      quantity: quantity > 0 ? quantity : 1,
      costPrice: costPrice > 0 ? costPrice : (totalPrice / (quantity || 1)),
      totalPrice,
      suggestedSalePrice,
      matchedStockItemId: matchedItem?.id || null,
      matchedStockItemName: matchedItem?.description || null
    })
  }

  return {
    nfeKey,
    nfeNumber,
    nfeSeries,
    issueDate,
    totalAmount,
    supplier,
    items
  }
}

export interface ImportItemChoice {
  code: string
  description: string
  ncm: string
  unit: string
  quantity: number
  costPrice: number
  salePrice: number
  itemType: 'FIXO' | 'ROTATIVO'
  action: 'CREATE_NEW' | 'UPDATE_EXISTING'
  existingStockItemId?: string
}

export async function processStockEntryImport(data: {
  nfeKey: string
  nfeNumber: string
  nfeSeries: string
  issueDate: string | null
  totalAmount: number
  supplier: ParsedXmlSupplier
  items: ImportItemChoice[]
}) {
  const session = await getSession()

  // 1. Verificar se a nota fiscal já foi importada
  if (data.nfeKey && !data.nfeKey.startsWith('TEMP_')) {
    const existingEntry = await prisma.stockEntry.findUnique({
      where: {
        tenantId_nfeKey: {
          tenantId: session.tenantId,
          nfeKey: data.nfeKey
        }
      }
    })

    if (existingEntry) {
      throw new Error(`A Nota Fiscal Nº ${data.nfeNumber} (Chave: ${data.nfeKey}) já foi importada no estoque anteriormente!`)
    }
  }

  // 2. Buscar ou Cadastrar o Fornecedor pelo CNPJ
  let supplier = null
  if (data.supplier.document) {
    supplier = await prisma.supplier.findUnique({
      where: {
        tenantId_document: {
          tenantId: session.tenantId,
          document: data.supplier.document
        }
      }
    })
  }

  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        tenantId: session.tenantId,
        name: data.supplier.name || 'Fornecedor de Peças',
        tradeName: data.supplier.tradeName,
        document: data.supplier.document || `PF_${Date.now()}`,
        ie: data.supplier.ie,
        phone: data.supplier.phone,
        address: data.supplier.address,
        city: data.supplier.city,
        state: data.supplier.state,
        cep: data.supplier.cep
      }
    })
  }

  // 3. Registrar a Nota de Entrada (StockEntry)
  const stockEntry = await prisma.stockEntry.create({
    data: {
      tenantId: session.tenantId,
      supplierId: supplier.id,
      nfeKey: data.nfeKey,
      nfeNumber: data.nfeNumber,
      nfeSeries: data.nfeSeries || '1',
      issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
      totalAmount: data.totalAmount
    }
  })

  // 4. Processar cada Peça (Criar Nova ou Atualizar Existente)
  for (const item of data.items) {
    let stockItemId = item.existingStockItemId
    const targetType = item.itemType || 'FIXO'

    if (item.action === 'UPDATE_EXISTING' && stockItemId) {
      await prisma.stockItem.update({
        where: { id: stockItemId },
        data: {
          itemType: targetType,
          quantity: targetType === 'FIXO' ? { increment: item.quantity } : { increment: 0 },
          costPrice: item.costPrice,
          salePrice: item.salePrice > 0 ? item.salePrice : undefined,
          ncm: item.ncm || undefined,
          supplierId: supplier.id
        }
      })
    } else {
      let codeToUse = item.code || `SKU-${Date.now().toString().slice(-6)}`
      const existingCode = await prisma.stockItem.findUnique({
        where: { tenantId_code: { tenantId: session.tenantId, code: codeToUse } }
      })

      if (existingCode) {
        codeToUse = `${codeToUse}-${Math.floor(Math.random() * 1000)}`
      }

      const newStockItem = await prisma.stockItem.create({
        data: {
          tenantId: session.tenantId,
          supplierId: supplier.id,
          code: codeToUse,
          description: item.description,
          itemType: targetType,
          ncm: item.ncm || '8708.29.99',
          unit: item.unit || 'UN',
          costPrice: item.costPrice,
          salePrice: item.salePrice > 0 ? item.salePrice : item.costPrice * 1.5,
          quantity: targetType === 'FIXO' ? item.quantity : 0, // Se rotativo, saldo 0 pois sai no mesmo dia
          minQuantity: targetType === 'FIXO' ? 2 : 0
        }
      })

      stockItemId = newStockItem.id
    }

    await prisma.stockEntryItem.create({
      data: {
        stockEntryId: stockEntry.id,
        stockItemId: stockItemId,
        supplierProductCode: item.code,
        description: item.description,
        ncm: item.ncm,
        unit: item.unit,
        quantity: item.quantity,
        costUnitPrice: item.costPrice,
        totalPrice: item.costPrice * item.quantity
      }
    })
  }

  revalidatePath('/stock')
  return { success: true, entryId: stockEntry.id, supplierName: supplier.name }
}

export async function getStockEntriesAction() {
  const session = await getSession()

  return prisma.stockEntry.findMany({
    where: { tenantId: session.tenantId },
    include: {
      supplier: true,
      items: {
        include: {
          stockItem: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// Helper para converter texto extraído de foto JPG ou digitação em ParsedXmlData
export async function parsePartsNoteTextAction(rawText: string): Promise<ParsedXmlData> {
  const session = await getSession()

  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    throw new Error('Nenhum texto foi identificado na nota. Tente enviar uma foto mais nítida ou digitar os itens.')
  }

  // 1. Identificar Fornecedor / Nome do Estabelecimento (Linhas iniciais sem números soltos)
  let supplierName = 'Fornecedor de Autopeças'
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i]
    if (
      !/total|subtotal|data|cnpj|telefone|cpf|recebimento|orcamento|pedido|item|qtd|valor/i.test(line) &&
      line.length >= 3 &&
      /[a-zA-Z]/.test(line)
    ) {
      supplierName = line.replace(/[^a-zA-Z0-9\s\&À-ú\.-]/g, '').trim()
      break
    }
  }

  // CNPJ se presente
  const cnpjMatch = rawText.match(/\d{2}\.?\d{3}\.?\d{3}\/\d{4}-?\d{2}/)
  const document = cnpjMatch ? cnpjMatch[0].replace(/\D/g, '') : ''

  // Número da Nota / Recibo / Pedido
  const numberMatch = rawText.match(/(?:nota|pedido|orcamento|cupom|nº|no|num|n°)\s*:?\s*(\d+)/i)
  const nfeNumber = numberMatch ? numberMatch[1] : `${Math.floor(Date.now() / 1000).toString().slice(-5)}`

  // Buscar estoque existente para correspondência automática de peças
  const existingStock = await prisma.stockItem.findMany({
    where: { tenantId: session.tenantId }
  })

  // Extração inteligente de itens por linha
  const items: ParsedXmlItem[] = []

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]

    // Ignorar linhas de cabeçalho / rodapé conhecidas
    if (/total|subtotal|valor\s+total|forma\s+de\s+pagamento|obrigado|vendedor|atendente|emitido/i.test(line)) {
      continue
    }

    // Tentar extrair preço e quantidade da linha
    const priceMatches = [...line.matchAll(/(?:R\$\s*)?(\d{1,5}[\.,]\d{2})/gi)]

    if (priceMatches.length > 0) {
      const rawPrices = priceMatches.map(m => {
        let p = m[1].replace(',', '.')
        return parseFloat(p)
      }).filter(p => !isNaN(p) && p > 0)

      if (rawPrices.length === 0) continue

      let quantity = 1
      const qtyMatch = line.match(/(?:qtd|qnt|quant|x)\s*:?\s*(\d+)/i) || line.match(/(\d+)\s*(?:un|pc|pça|litro|lt|cx|jg)/i)
      if (qtyMatch) {
        quantity = parseInt(qtyMatch[1], 10) || 1
      }

      let costPrice = rawPrices[0]
      let totalPrice = rawPrices.length > 1 ? rawPrices[rawPrices.length - 1] : costPrice * quantity

      if (rawPrices.length === 1 && quantity > 1 && costPrice > 100) {
        totalPrice = costPrice
        costPrice = Math.round((totalPrice / quantity) * 100) / 100
      }

      let description = line
        .replace(/(?:R\$\s*)?(\d{1,5}[\.,]\d{2})/gi, '')
        .replace(/(?:qtd|qnt|quant|x|un|pc|pça|litro|lt|cx|jg)\s*:?\s*\d+/gi, '')
        .replace(/^\d+[\s\.\-]+/, '')
        .replace(/[^a-zA-Z0-9\s\&À-ú\.\/-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (description.length < 3) {
        description = `Peça / Item ${items.length + 1}`
      }

      const code = `NOTE-${Date.now().toString().slice(-4)}-${items.length + 1}`
      const suggestedSalePrice = Math.round(costPrice * 1.6 * 100) / 100

      const matchedItem = existingStock.find(i =>
        i.description.toLowerCase().includes(description.toLowerCase()) ||
        description.toLowerCase().includes(i.description.toLowerCase())
      )

      items.push({
        code,
        description,
        ncm: '8708.29.99',
        unit: 'UN',
        quantity: Math.max(1, quantity),
        costPrice: Math.max(0.01, costPrice),
        totalPrice: Math.max(0.01, totalPrice),
        suggestedSalePrice,
        matchedStockItemId: matchedItem?.id || null,
        matchedStockItemName: matchedItem?.description || null
      })
    }
  }

  if (items.length === 0) {
    items.push({
      code: `NOTE-${Date.now().toString().slice(-4)}-1`,
      description: lines[0] || 'Peça da Nota',
      ncm: '8708.29.99',
      unit: 'UN',
      quantity: 1,
      costPrice: 50.00,
      totalPrice: 50.00,
      suggestedSalePrice: 80.00,
      matchedStockItemId: null,
      matchedStockItemName: null
    })
  }

  const totalAmount = items.reduce((acc, i) => acc + i.totalPrice, 0)

  return {
    nfeKey: `FOTO_${Date.now()}_${nfeNumber}`,
    nfeNumber,
    nfeSeries: 'FOTO',
    issueDate: new Date().toISOString().split('T')[0],
    totalAmount,
    supplier: {
      document: document,
      name: supplierName,
      tradeName: supplierName,
      ie: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      cep: null
    },
    items
  }
}

export async function parsePartsNoteImageAction(base64Data: string): Promise<ParsedXmlData> {
  try {
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('por')

    const recognizePromise = worker.recognize(base64Data)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('A leitura da foto demorou muito. Tente enviar uma foto menor ou utilize a opção de colar texto.')), 15000)
    )

    const ret = await Promise.race([recognizePromise, timeoutPromise])
    await worker.terminate()
    return await parsePartsNoteTextAction(ret.data.text)
  } catch (err: any) {
    throw new Error(err.message || 'Não foi possível ler o texto da foto da nota. Verifique a nitidez da imagem ou utilize a opção de colar texto.')
  }
}

