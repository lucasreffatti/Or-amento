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

  // Normalizar correções comuns de OCR (ex: R$ 1O,OO -> R$ 10,00)
  const normalizedText = rawText
    .replace(/(?<=\d)[OOo](?=\d)/g, '0')
    .replace(/(?<=\b[R\$]?\s*\d+)[\.,][OOo]{2}\b/gi, ',00')

  const lines = normalizedText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 2)

  if (lines.length === 0) {
    throw new Error('Nenhum texto foi identificado na foto. Certifique-se de que a foto está bem iluminada e focado na nota.')
  }

  // 1. Identificar Fornecedor / Nome do Estabelecimento (Linhas iniciais)
  let supplierName = 'Fornecedor de Autopeças'
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i]
    if (
      !/total|subtotal|data|cnpj|telefone|cpf|recebimento|orcamento|pedido|item|qtd|valor|pagamento/i.test(line) &&
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

  const items: ParsedXmlItem[] = []

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]

    // Ignorar linhas de rodapé/resumo gerais
    if (/^(total|subtotal|valor total|forma de pagamento|obrigado|vendedor|atendente|emitido|via do cliente|troco|recebido)/i.test(line)) {
      continue
    }

    // Extrair todos os números e valores em potencial na linha
    // Procura formatos: R$ 150,00 | 150,00 | 150.00 | 150 | R$ 150
    const moneyMatches = [...line.matchAll(/(?:R\$\s*)?(\d{1,6}(?:[\.,]\d{1,2})?)/gi)]
    
    // Filtra valores que fazem sentido como preço
    const numbersFound = moneyMatches
      .map(m => parseFloat(m[1].replace(',', '.')))
      .filter(n => !isNaN(n) && n > 0)

    // Se a linha tiver pelo menos 1 palavra significativa
    const textOnly = line.replace(/(?:R\$\s*)?\d+(?:[\.,]\d+)?/gi, '').trim()
    const hasWord = /[a-zA-ZÀ-ú]{3,}/.test(textOnly)

    if (hasWord || numbersFound.length > 0) {
      let quantity = 1

      // Buscar padrões de quantidade: "2x", "2 un", "2 pç", "Qtd: 2", ou número solto no início
      const qtyMatch = line.match(/(?:qtd|qnt|quant|x)\s*:?\s*(\d+)/i) ||
                       line.match(/(\d+)\s*(?:un|pc|pça|litro|lt|cx|jg|jogo|par|m|kit)/i) ||
                       line.match(/^(\d+)\s+[a-zA-Z]/)

      if (qtyMatch) {
        const parsedQty = parseInt(qtyMatch[1], 10)
        if (parsedQty > 0 && parsedQty < 1000) {
          quantity = parsedQty
        }
      }

      let costPrice = 0
      let totalPrice = 0

      if (numbersFound.length >= 2) {
        // Se houver múltiplos números, o último costuma ser o valor total e o primeiro o preço unitário
        costPrice = numbersFound[0]
        totalPrice = numbersFound[numbersFound.length - 1]
      } else if (numbersFound.length === 1) {
        costPrice = numbersFound[0]
        totalPrice = Math.round(costPrice * quantity * 100) / 100
      }

      // Se o preço total for menor que o unitário, corrigir
      if (totalPrice < costPrice) {
        totalPrice = costPrice * quantity
      }

      // Limpar a descrição removendo termos numéricos e ruídos
      let description = line
        .replace(/(?:R\$\s*)?\d+(?:[\.,]\d+)?/gi, '')
        .replace(/(?:qtd|qnt|quant|x|un|pc|pça|litro|lt|cx|jg|jogo|par|kit)\s*:?\s*\d*/gi, '')
        .replace(/^\d+[\s\.\-]+/, '')
        .replace(/[^a-zA-Z0-9\s\&À-ú\.\/-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (description.length < 2) {
        description = textOnly.length >= 2 ? textOnly : `Peça / Item ${items.length + 1}`
      }

      // Ignorar palavras como "TOTAL", "SUBTOTAL", "CNPJ", "DATA" se viraram descrição isolada
      if (/^(total|subtotal|cnpj|cpf|data|telefone|endereco|rua|avenida|bairro|cidade|uf|cep)$/i.test(description)) {
        continue
      }

      const code = `NOTE-${Date.now().toString().slice(-4)}-${items.length + 1}`
      const suggestedSalePrice = Math.round(costPrice * 1.6 * 100) / 100

      // Match com peças existentes do estoque
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
        costPrice: Math.max(0, costPrice),
        totalPrice: Math.max(0, totalPrice),
        suggestedSalePrice,
        matchedStockItemId: matchedItem?.id || null,
        matchedStockItemName: matchedItem?.description || null
      })
    }
  }

  // Garantir pelo menos 1 linha para o usuário preencher se OCR for fraco
  if (items.length === 0) {
    items.push({
      code: `NOTE-${Date.now().toString().slice(-4)}-1`,
      description: lines[0] ? lines[0].slice(0, 40) : 'Peça da Nota',
      ncm: '8708.29.99',
      unit: 'UN',
      quantity: 1,
      costPrice: 0.00,
      totalPrice: 0.00,
      suggestedSalePrice: 0.00,
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

export async function parsePartsNoteImageAction(base64Data: string, customApiKey?: string): Promise<ParsedXmlData> {
  const apiKey =
    customApiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY

  if (apiKey) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      // Remover prefixo data:image/...;base64, se houver
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '')
      const mimeType = base64Data.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg'

      const prompt = `Analise esta foto de nota fiscal, recibo ou cupom de peças de veículos/autopeças.
Extraia todos os dados disponíveis e retorne estritamente um JSON no seguinte formato, sem texto antes ou depois:

{
  "supplierName": "Nome da empresa/fornecedor ou Fornecedor de Autopeças",
  "nfeNumber": "Número da nota/pedido/cupom se houver",
  "cnpj": "CNPJ se houver",
  "items": [
    {
      "code": "Código do produto se houver ou Peça 1",
      "description": "Descrição clara da peça ou serviço",
      "quantity": 1,
      "costPrice": 150.00,
      "unit": "UN"
    }
  ]
}`

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: cleanBase64,
            mimeType
          }
        }
      ])

      const responseText = result.response.text().trim()
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        const parsedJson = JSON.parse(jsonMatch[0])
        const session = await getSession()
        const existingStock = await prisma.stockItem.findMany({
          where: { tenantId: session.tenantId }
        })

        const rawItems = Array.isArray(parsedJson.items) ? parsedJson.items : []
        const items: ParsedXmlItem[] = rawItems.map((item: any, idx: number) => {
          const qty = Number(item.quantity) || 1
          const cost = Number(item.costPrice) || 0
          const desc = String(item.description || `Peça ${idx + 1}`).trim()

          const matchedItem = existingStock.find(i =>
            i.description.toLowerCase().includes(desc.toLowerCase()) ||
            desc.toLowerCase().includes(i.description.toLowerCase())
          )

          return {
            code: item.code || `NOTE-${Date.now().toString().slice(-4)}-${idx + 1}`,
            description: desc,
            ncm: '8708.29.99',
            unit: String(item.unit || 'UN').toUpperCase(),
            quantity: Math.max(1, qty),
            costPrice: Math.max(0, cost),
            totalPrice: Math.round(Math.max(0, cost) * Math.max(1, qty) * 100) / 100,
            suggestedSalePrice: Math.round(cost * 1.6 * 100) / 100,
            matchedStockItemId: matchedItem?.id || null,
            matchedStockItemName: matchedItem?.description || null
          }
        })

        if (items.length > 0) {
          const totalAmount = items.reduce((acc, i) => acc + i.totalPrice, 0)
          return {
            nfeKey: `GEMINI_${Date.now()}`,
            nfeNumber: String(parsedJson.nfeNumber || Math.floor(Date.now() / 1000).toString().slice(-5)),
            nfeSeries: 'GEMINI',
            issueDate: new Date().toISOString().split('T')[0],
            totalAmount,
            supplier: {
              document: String(parsedJson.cnpj || '').replace(/\D/g, ''),
              name: String(parsedJson.supplierName || 'Fornecedor de Autopeças'),
              tradeName: String(parsedJson.supplierName || 'Fornecedor de Autopeças'),
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
      }
    } catch (geminiError) {
      console.warn('Gemini Vision OCR falhou, recorrendo ao Tesseract local:', geminiError)
    }
  }

  // Fallback Tesseract Local
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

