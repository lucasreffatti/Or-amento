'use client'

import { useState } from 'react'
import { UploadCloud, FileCode2, CheckCircle2, AlertCircle, Building2, PackageCheck, RefreshCw, X, Percent, Layers, RotateCw, Package, Camera, FileText, Plus, Trash2 } from 'lucide-react'
import { parseNfeXmlAction, processStockEntryImport, parsePartsNoteImageAction, parsePartsNoteTextAction, ParsedXmlData, ImportItemChoice } from '@/app/actions/stockEntry'

interface ImportXmlModalProps {
  isOpen: boolean
  onClose: () => void
  existingStockItems: Array<{ id: string; code: string; description: string; quantity: number }>
  onSuccess: () => void
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

const preprocessImageForOCR = (file: File): Promise<string | File> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(file)

        const maxDim = Math.max(img.width, img.height)
        const scale = maxDim < 1200 ? 1.8 : 1.2
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = imageData.data
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
          const contrast = 1.4
          const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
          let newGray = factor * (gray - 128) + 128
          newGray = Math.max(0, Math.min(255, newGray))

          d[i] = newGray
          d[i + 1] = newGray
          d[i + 2] = newGray
        }
        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => resolve(file)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

export function ImportXmlModal({ isOpen, onClose, existingStockItems, onSuccess }: ImportXmlModalProps) {
  const [step, setStep] = useState<'UPLOAD' | 'REVIEW'>('UPLOAD')
  const [uploadMode, setUploadMode] = useState<'FILE' | 'TEXT'>('FILE')
  const [pastedText, setPastedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ParsedXmlData | null>(null)
  const [itemChoices, setItemChoices] = useState<ImportItemChoice[]>([])
  const [defaultMargin, setDefaultMargin] = useState<number>(60)
  const [globalType, setGlobalType] = useState<'FIXO' | 'ROTATIVO'>('FIXO')

  if (!isOpen) return null

  const handleFilesUpload = async (inputFiles: File[] | FileList | File) => {
    const files = Array.isArray(inputFiles)
      ? inputFiles
      : inputFiles instanceof FileList
        ? Array.from(inputFiles)
        : [inputFiles]

    if (files.length === 0) return

    const xmlFile = files.find(f => f.name.toLowerCase().endsWith('.xml'))
    const isXml = !!xmlFile

    setError(null)
    setLoading(true)

    try {
      let parsed: ParsedXmlData | null = null

      if (isXml && xmlFile) {
        setStatusMessage('📄 Lendo arquivo XML...')
        const xmlText = await xmlFile.text()
        parsed = await parseNfeXmlAction(xmlText)
      } else {
        const photoCount = files.length
        setStatusMessage(
          photoCount > 1
            ? `🧠 Analisando ${photoCount} fotos juntas com IA de Visão Computacional (Gemini)...`
            : '🧠 Analisando foto com IA de Visão Computacional (Gemini)...'
        )

        const base64List = await Promise.all(files.map(f => fileToBase64(f)))

        try {
          const storedApiKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || undefined : undefined
          parsed = await parsePartsNoteImageAction(base64List, storedApiKey)
        } catch (serverErr) {
          console.warn('Server Vision OCR notice:', serverErr)
        }

        // Se o servidor Gemini não retornou ou falhou, usar OCR local com pré-processamento para cada foto
        if (!parsed || !parsed.items || parsed.items.length === 0) {
          let combinedText = ''
          for (let i = 0; i < files.length; i++) {
            const file = files[i]
            setStatusMessage(`📷 Otimizando nitidez da foto ${i + 1} de ${files.length}...`)
            const processedImage = await preprocessImageForOCR(file)

            setStatusMessage(`📷 Lendo foto ${i + 1} de ${files.length}...`)
            try {
              const { recognize } = await import('tesseract.js')
              const result = await recognize(processedImage, 'por+eng')
              combinedText += '\n' + result.data.text
            } catch (ocrErr: any) {
              console.warn('Client OCR notice:', ocrErr)
            }
          }

          if (combinedText.trim()) {
            setPastedText(combinedText)
            setStatusMessage('⚡ Extraindo peças, fornecedor e valores das fotos...')
            parsed = await parsePartsNoteTextAction(combinedText)
          }
        }
      }

      if (!parsed || !parsed.items || parsed.items.length === 0) {
        throw new Error('Nenhum item/peça foi encontrado no(s) arquivo(s). Você pode colar o texto ou adicionar os itens manualmente.')
      }

      setParsedData(parsed)

      const initialChoices: ImportItemChoice[] = parsed.items.map(item => {
        const calculatedSalePrice = Math.round(item.costPrice * (1 + defaultMargin / 100) * 100) / 100
        return {
          code: item.code,
          description: item.description,
          ncm: item.ncm,
          unit: item.unit,
          quantity: item.quantity,
          costPrice: item.costPrice,
          salePrice: calculatedSalePrice,
          itemType: globalType,
          action: item.matchedStockItemId ? 'UPDATE_EXISTING' : 'CREATE_NEW',
          existingStockItemId: item.matchedStockItemId || undefined
        }
      })

      setItemChoices(initialChoices)
      setStep('REVIEW')
    } catch (err: any) {
      setError(err.message || 'Erro ao ler arquivo da Nota Fiscal/Recibo.')
    } finally {
      setLoading(false)
      setStatusMessage(null)
    }
  }

  const handleTextSubmit = async () => {
    if (!pastedText.trim()) {
      setError('Por favor, cole ou digite as peças e valores da nota.')
      return
    }

    setError(null)
    setLoading(true)
    setStatusMessage('⚡ Convertendo texto da nota em estoque...')

    try {
      const parsed = await parsePartsNoteTextAction(pastedText)
      setParsedData(parsed)

      const initialChoices: ImportItemChoice[] = parsed.items.map(item => {
        const calculatedSalePrice = Math.round(item.costPrice * (1 + defaultMargin / 100) * 100) / 100
        return {
          code: item.code,
          description: item.description,
          ncm: item.ncm,
          unit: item.unit,
          quantity: item.quantity,
          costPrice: item.costPrice,
          salePrice: calculatedSalePrice,
          itemType: globalType,
          action: item.matchedStockItemId ? 'UPDATE_EXISTING' : 'CREATE_NEW',
          existingStockItemId: item.matchedStockItemId || undefined
        }
      })

      setItemChoices(initialChoices)
      setStep('REVIEW')
    } catch (err: any) {
      setError(err.message || 'Erro ao processar texto da nota.')
    } finally {
      setLoading(false)
      setStatusMessage(null)
    }
  }

  const handleGlobalMarginChange = (newMargin: number) => {
    setDefaultMargin(newMargin)
    if (parsedData && itemChoices.length > 0) {
      setItemChoices(prev =>
        prev.map(item => ({
          ...item,
          salePrice: Math.round(item.costPrice * (1 + newMargin / 100) * 100) / 100
        }))
      )
    }
  }

  const handleGlobalTypeChange = (type: 'FIXO' | 'ROTATIVO') => {
    setGlobalType(type)
    setItemChoices(prev => prev.map(item => ({ ...item, itemType: type })))
  }

  const handleItemTypeChange = (index: number, type: 'FIXO' | 'ROTATIVO') => {
    setItemChoices(prev => {
      const next = [...prev]
      next[index] = { ...next[index], itemType: type }
      return next
    })
  }

  const handleActionChange = (index: number, action: 'CREATE_NEW' | 'UPDATE_EXISTING', stockItemId?: string) => {
    setItemChoices(prev => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        action,
        existingStockItemId: stockItemId ?? (action === 'UPDATE_EXISTING' ? existingStockItems[0]?.id : undefined)
      }
      return next
    })
  }

  const handleItemFieldChange = (index: number, field: keyof ImportItemChoice, value: any) => {
    setItemChoices(prev => {
      const next = [...prev]
      const updatedItem = { ...next[index], [field]: value }
      if (field === 'costPrice') {
        const cost = parseFloat(value) || 0
        updatedItem.salePrice = Math.round(cost * (1 + defaultMargin / 100) * 100) / 100
      }
      next[index] = updatedItem
      return next
    })
  }

  const handleAddItemManually = () => {
    const nextCode = `PECA-${Date.now().toString().slice(-4)}-${itemChoices.length + 1}`
    const newItem: ImportItemChoice = {
      code: nextCode,
      description: 'Nova Peça de Autopeças',
      ncm: '8708.29.99',
      unit: 'UN',
      quantity: 1,
      costPrice: 50.00,
      salePrice: Math.round(50.00 * (1 + defaultMargin / 100) * 100) / 100,
      itemType: globalType,
      action: 'CREATE_NEW'
    }
    setItemChoices(prev => [...prev, newItem])
  }

  const handleRemoveItem = (index: number) => {
    setItemChoices(prev => prev.filter((_, i) => i !== index))
  }

  const handleConfirmImport = async () => {
    if (!parsedData) return
    if (itemChoices.length === 0) {
      setError('Adicione pelo menos uma peça para confirmar a entrada no estoque.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await processStockEntryImport({
        nfeKey: parsedData.nfeKey,
        nfeNumber: parsedData.nfeNumber,
        nfeSeries: parsedData.nfeSeries,
        issueDate: parsedData.issueDate,
        totalAmount: itemChoices.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0),
        supplier: parsedData.supplier,
        items: itemChoices
      })

      alert(`Entrada de Estoque realizada com sucesso!\nFornecedor '${parsedData.supplier.name}' registrado e ${itemChoices.length} peças cadastradas.`)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erro ao processar importação da nota de compra.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl space-y-4 p-6 text-neutral-900 max-h-[92vh] overflow-y-auto">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Importador de Nota de Peças (Foto ou XML)</h2>
              <p className="text-xs text-neutral-500">Envie qualquer Foto (JPG/PNG/WEBP), PDF, arquivo XML ou Cole o Texto da Nota.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {statusMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800 text-xs flex items-center justify-center gap-2 font-semibold animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* PASSO 1: UPLOAD DO ARQUIVO OU TEXTO */}
        {step === 'UPLOAD' && (
          <div className="space-y-5">
            {/* Seletor de Modo: Arquivo / Foto vs Colar Texto */}
            <div className="flex border-b border-neutral-200 space-x-4">
              <button
                type="button"
                onClick={() => setUploadMode('FILE')}
                className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  uploadMode === 'FILE'
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Camera className="w-4 h-4 text-blue-600" />
                <span>📷 Foto da Nota (Qualquer Imagem/PDF) ou 📄 XML</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('TEXT')}
                className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  uploadMode === 'TEXT'
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>📝 Colar / Digitar Texto da Nota</span>
              </button>
            </div>

            {uploadMode === 'FILE' ? (
              <div className="py-4 text-center space-y-6">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFilesUpload(e.dataTransfer.files)
                    }
                  }}
                  className="border-2 border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50/50 hover:bg-neutral-50 rounded-2xl p-10 cursor-pointer transition-all flex flex-col items-center justify-center group"
                >
                  <input
                    type="file"
                    accept="image/*,.xml,.pdf"
                    multiple
                    className="hidden"
                    id="file-input"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFilesUpload(e.target.files)
                      }
                    }}
                  />
                  <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center">
                    <div className="w-14 h-14 bg-white rounded-full border border-neutral-200 shadow-sm flex items-center justify-center mb-4 text-neutral-500 group-hover:scale-110 transition-transform">
                      <Camera className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-neutral-900 text-sm">
                      Arraste ou selecione 1 ou mais Fotos da Nota (JPG, PNG, WEBP), PDF ou XML
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-md">
                      💡 <strong>Dica:</strong> Se a nota for longa e você tirou 2 ou mais fotos (ex: topo e continuação), selecione todas juntas! A IA analisará todas em conjunto.
                    </p>
                    <span className="mt-4 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-2">
                      <UploadCloud className="w-4 h-4" />
                      <span>Selecionar 1 ou mais Foto(s) / Arquivo</span>
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-neutral-700">
                  Cole abaixo o texto copiado da Nota de Peça, Pedido de Distribuidora ou WhatsApp:
                </label>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Exemplo:\nAUTO PECAS SILVA\n01 CORREIA DENTADA CONTI GOL  R$ 85,00\n02 FILTRO DE OLEO PH6017  R$ 35,00`}
                  className="w-full bg-white border border-neutral-200 rounded-xl p-3 text-xs font-mono text-neutral-900 focus:border-neutral-400 outline-none"
                />
                <button
                  type="button"
                  onClick={handleTextSubmit}
                  disabled={loading}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Processar Texto da Nota</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 text-left text-xs bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-blue-900">
              <div className="space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-blue-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 1. Leitura Inteligente
                </p>
                <p className="text-neutral-600">Extrai código, descrição, quantidade e preços de custo da foto.</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-blue-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 2. Edição Sem Erros
                </p>
                <p className="text-neutral-600">Permite ajustar descrições e adicionar peças manuais antes de salvar.</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-blue-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 3. Margem e Destino
                </p>
                <p className="text-neutral-600">Aplica margem de lucro e separa peças de prateleira ou encomendas.</p>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 2: REVISÃO E CONCILIAÇÃO DOS ITENS */}
        {step === 'REVIEW' && parsedData && (
          <div className="space-y-5">
            {/* Bloco Fornecedor & Dados da Nota */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <input
                    type="text"
                    value={parsedData.supplier.name}
                    onChange={(e) => setParsedData({
                      ...parsedData,
                      supplier: { ...parsedData.supplier, name: e.target.value }
                    })}
                    className="font-bold text-neutral-900 text-sm bg-white border border-neutral-200 rounded px-2 py-0.5 w-full focus:outline-none"
                    placeholder="Nome do Fornecedor"
                  />
                </div>
                <p className="text-neutral-600 font-mono">
                  Documento: {parsedData.supplier.document || 'Não informado'}
                </p>
                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] uppercase">
                  Fornecedor Identificado ✓
                </span>
              </div>

              <div className="space-y-1 md:text-right font-mono border-t md:border-t-0 md:border-l border-neutral-200 pt-2 md:pt-0 md:pl-4">
                <p className="font-bold text-neutral-900 text-sm">
                  Nota/Recibo Nº {parsedData.nfeNumber}
                </p>
                <p className="text-emerald-700 font-bold text-sm pt-1">
                  Custo Total da Entrada: R$ {itemChoices.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Painel de Controles Globais (Margem + Tipo de Estoque) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Margem de Lucro */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-blue-900">
                  <Percent className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold">Margem de Lucro (%)</span>
                    <p className="text-neutral-500 text-[11px]">Recalcular preço de venda</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={defaultMargin}
                    onChange={(e) => handleGlobalMarginChange(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-white border border-blue-300 rounded px-2 py-1 text-right font-bold text-blue-900 focus:outline-none"
                  />
                  <span className="text-blue-900 font-bold">%</span>
                  <div className="flex gap-1 ml-1">
                    {[50, 60, 100].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleGlobalMarginChange(m)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          defaultMargin === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-neutral-700 border-neutral-300'
                        }`}
                      >
                        {m}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Classificação Global Fixo vs Rotativo */}
              <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-purple-900">
                  <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="font-bold">Tipo de Destino da Nota</span>
                    <p className="text-neutral-500 text-[11px]">Aplicar a todas as peças</p>
                  </div>
                </div>

                <div className="flex bg-white border border-purple-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => handleGlobalTypeChange('FIXO')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                      globalType === 'FIXO'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Package className="w-3 h-3" /> Fixo (Prateleira)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGlobalTypeChange('ROTATIVO')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                      globalType === 'ROTATIVO'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <RotateCw className="w-3 h-3" /> Rotativo (Encomenda)
                  </button>
                </div>
              </div>
            </div>

            {/* Tabela de Conciliação e Edição das Peças */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-bold text-neutral-500 tracking-wider">
                  Itens Detectados ({itemChoices.length} peças)
                </h3>
                <button
                  type="button"
                  onClick={handleAddItemManually}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Peça Manualmente</span>
                </button>
              </div>

              <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-neutral-700">
                    <thead className="bg-neutral-50/80 text-neutral-500 font-semibold uppercase border-b border-neutral-200">
                      <tr>
                        <th className="p-2.5">Descrição da Peça</th>
                        <th className="p-2.5 text-center">Tipo Estoque</th>
                        <th className="p-2.5 text-center">Qtd</th>
                        <th className="p-2.5 text-right">Custo Un. (R$)</th>
                        <th className="p-2.5 text-right">Venda Un. (R$)</th>
                        <th className="p-2.5">Ação de Entrada</th>
                        <th className="p-2.5 text-center">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 bg-white">
                      {itemChoices.map((item, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="p-2.5 min-w-[200px]">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemFieldChange(idx, 'description', e.target.value)}
                              className="font-semibold text-neutral-900 w-full bg-white border border-neutral-200 rounded px-2 py-1 text-xs focus:outline-none"
                            />
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">SKU: {item.code}</div>
                          </td>
                          <td className="p-2.5 text-center">
                            <select
                              value={item.itemType}
                              onChange={(e) => handleItemTypeChange(idx, e.target.value as any)}
                              className={`border rounded px-2 py-1 text-xs font-bold focus:outline-none ${
                                item.itemType === 'FIXO'
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : 'bg-purple-50 border-purple-300 text-purple-800'
                              }`}
                            >
                              <option value="FIXO">📦 Fixo (Prateleira)</option>
                              <option value="ROTATIVO">🔄 Rotativo (Encomenda)</option>
                            </select>
                          </td>
                          <td className="p-2.5 text-center font-bold font-mono">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemFieldChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                              className="w-14 border border-neutral-300 rounded px-1.5 py-1 text-center font-bold focus:outline-none"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            <input
                              type="number"
                              step="0.01"
                              value={item.costPrice}
                              onChange={(e) => handleItemFieldChange(idx, 'costPrice', e.target.value)}
                              className="w-20 border border-neutral-300 rounded px-2 py-1 text-right font-mono font-semibold text-neutral-800 focus:outline-none"
                            />
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.salePrice}
                              onChange={(e) => handleItemFieldChange(idx, 'salePrice', parseFloat(e.target.value) || 0)}
                              className="w-20 border border-neutral-300 rounded px-2 py-1 text-right font-mono font-bold text-emerald-700 focus:outline-none"
                            />
                          </td>
                          <td className="p-2.5 min-w-[180px]">
                            <div className="space-y-1">
                              <select
                                value={item.action}
                                onChange={(e) => handleActionChange(idx, e.target.value as any)}
                                className="w-full border border-neutral-300 rounded px-2 py-1 text-xs font-semibold text-neutral-800 focus:outline-none"
                              >
                                <option value="CREATE_NEW">✨ Cadastrar Nova Peça</option>
                                <option value="UPDATE_EXISTING">🔗 Incrementar Existente</option>
                              </select>

                              {item.action === 'UPDATE_EXISTING' && (
                                <select
                                  value={item.existingStockItemId || ''}
                                  onChange={(e) => handleActionChange(idx, 'UPDATE_EXISTING', e.target.value)}
                                  className="w-full border border-blue-300 bg-blue-50/50 rounded px-2 py-1 text-[11px] text-blue-900 focus:outline-none"
                                >
                                  <option value="" disabled>Selecione a peça no estoque...</option>
                                  {existingStockItems.map(stock => (
                                    <option key={stock.id} value={stock.id}>
                                      {stock.code} - {stock.description} (Saldo: {stock.quantity})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 rounded transition-colors"
                              title="Remover Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Rodapé e Botão de Confirmação */}
            <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setStep('UPLOAD')}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors"
              >
                ← Voltar / Carregar Outra Nota
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={loading}
                  className="px-5 py-2 text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processando Entrada...</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-4 h-4 text-emerald-400" />
                      <span>Confirmar Entrada no Estoque ({itemChoices.length} peças)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

