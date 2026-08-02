'use client'

import { useState } from 'react'
import { UploadCloud, FileCode2, CheckCircle2, AlertCircle, Building2, PackageCheck, RefreshCw, X, Percent, Layers, RotateCw, Package } from 'lucide-react'
import { parseNfeXmlAction, processStockEntryImport, ParsedXmlData, ImportItemChoice } from '@/app/actions/stockEntry'

interface ImportXmlModalProps {
  isOpen: boolean
  onClose: () => void
  existingStockItems: Array<{ id: string; code: string; description: string; quantity: number }>
  onSuccess: () => void
}

export function ImportXmlModal({ isOpen, onClose, existingStockItems, onSuccess }: ImportXmlModalProps) {
  const [step, setStep] = useState<'UPLOAD' | 'REVIEW'>('UPLOAD')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ParsedXmlData | null>(null)
  const [itemChoices, setItemChoices] = useState<ImportItemChoice[]>([])
  const [defaultMargin, setDefaultMargin] = useState<number>(60)
  const [globalType, setGlobalType] = useState<'FIXO' | 'ROTATIVO'>('FIXO')

  if (!isOpen) return null

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.xml')) {
      setError('Por favor, selecione um arquivo válido no formato XML (.xml).')
      return
    }

    setError(null)
    setLoading(true)

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const xmlText = e.target?.result as string
        const parsed = await parseNfeXmlAction(xmlText)

        if (!parsed.items || parsed.items.length === 0) {
          throw new Error('Nenhum item/peça foi encontrado dentro deste XML de Nota Fiscal.')
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
        setError(err.message || 'Erro ao ler arquivo XML da Nota Fiscal.')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
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

  const handleSalePriceChange = (index: number, salePrice: number) => {
    setItemChoices(prev => {
      const next = [...prev]
      next[index] = { ...next[index], salePrice }
      return next
    })
  }

  const handleConfirmImport = async () => {
    if (!parsedData) return
    setLoading(true)
    setError(null)

    try {
      await processStockEntryImport({
        nfeKey: parsedData.nfeKey,
        nfeNumber: parsedData.nfeNumber,
        nfeSeries: parsedData.nfeSeries,
        issueDate: parsedData.issueDate,
        totalAmount: parsedData.totalAmount,
        supplier: parsedData.supplier,
        items: itemChoices
      })

      alert(`Nota Fiscal Nº ${parsedData.nfeNumber} importada com sucesso!\nFornecedor '${parsedData.supplier.name}' registrado e estoque atualizado.`)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erro ao processar importação da nota fiscal.')
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
              <h2 className="text-base font-bold text-neutral-900">Importador de XML NF-e de Compra</h2>
              <p className="text-xs text-neutral-500">Entrada de peças, conciliação Fixo/Rotativo e cadastro de fornecedor.</p>
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

        {/* PASSO 1: UPLOAD DO XML */}
        {step === 'UPLOAD' && (
          <div className="py-8 text-center space-y-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0])
                }
              }}
              className="border-2 border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50/50 hover:bg-neutral-50 rounded-2xl p-10 cursor-pointer transition-all flex flex-col items-center justify-center group"
            >
              <input
                type="file"
                accept=".xml"
                className="hidden"
                id="xml-file-input"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0])
                  }
                }}
              />
              <label htmlFor="xml-file-input" className="cursor-pointer flex flex-col items-center">
                <div className="w-14 h-14 bg-white rounded-full border border-neutral-200 shadow-sm flex items-center justify-center mb-4 text-neutral-500 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 text-sm">Arraste e solte o arquivo XML da Distribuidora aqui</h3>
                <p className="text-xs text-neutral-500 mt-1">ou clique para selecionar o arquivo `.xml` do seu computador</p>
                <span className="mt-4 px-3 py-1 bg-white border border-neutral-200 rounded-md text-xs font-semibold text-neutral-700 shadow-sm">
                  Selecionar arquivo XML
                </span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-4 text-left text-xs bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-blue-900">
              <div className="space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-blue-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 1. Fornecedor Automático
                </p>
                <p className="text-neutral-600">Cadastra CNPJ, Razão Social e cidade do distribuidor de autopeças.</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-blue-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 2. Fixo vs Rotativo
                </p>
                <p className="text-neutral-600">Separe peças de prateleira das encomendadas direto para o cliente.</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-blue-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 3. Margem Ajustável
                </p>
                <p className="text-neutral-600">Aplica a margem de lucro (%) desejada sobre os custos das peças.</p>
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
                  <span className="font-bold text-neutral-900 text-sm">{parsedData.supplier.name}</span>
                </div>
                <p className="text-neutral-600 font-mono">CNPJ: {parsedData.supplier.document || 'Não informado'} | IE: {parsedData.supplier.ie || '-'}</p>
                <p className="text-neutral-500">{parsedData.supplier.address || `${parsedData.supplier.city}/${parsedData.supplier.state}`}</p>
                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] uppercase">
                  Fornecedor Identificado ✓
                </span>
              </div>

              <div className="space-y-1 md:text-right font-mono border-t md:border-t-0 md:border-l border-neutral-200 pt-2 md:pt-0 md:pl-4">
                <p className="font-bold text-neutral-900 text-sm">Nota Fiscal Nº {parsedData.nfeNumber} (Série {parsedData.nfeSeries})</p>
                <p className="text-neutral-500 text-[11px] break-all">Chave: {parsedData.nfeKey}</p>
                <p className="text-emerald-700 font-bold text-sm pt-1">
                  Valor Total no XML: R$ {parsedData.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

            {/* Tabela de Conciliação das Peças */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-bold text-neutral-500 tracking-wider">
                  Itens Identificados no XML ({parsedData.items.length} peças)
                </h3>
                <span className="text-xs text-neutral-500">Defina individualmente se a peça vai para prateleira (Fixo) ou encomenda (Rotativo):</span>
              </div>

              <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-neutral-700">
                    <thead className="bg-neutral-50/80 text-neutral-500 font-semibold uppercase border-b border-neutral-200">
                      <tr>
                        <th className="p-2.5">SKU / Descrição</th>
                        <th className="p-2.5 text-center">Tipo Estoque</th>
                        <th className="p-2.5 text-center">Qtd</th>
                        <th className="p-2.5 text-right">Custo Un.</th>
                        <th className="p-2.5 text-right">Venda Un.</th>
                        <th className="p-2.5">Ação de Entrada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 bg-white">
                      {itemChoices.map((item, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="p-2.5">
                            <div className="font-bold text-neutral-900 font-mono text-[11px]">{item.code}</div>
                            <div className="font-semibold text-neutral-800">{item.description}</div>
                            <div className="text-[10px] text-neutral-400 font-mono">NCM: {item.ncm}</div>
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
                            <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded">
                              +{item.quantity} {item.unit}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono text-neutral-600">
                            R$ {item.costPrice.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.salePrice}
                              onChange={(e) => handleSalePriceChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-24 border border-neutral-300 rounded px-2 py-1 text-right font-mono font-bold text-emerald-700 focus:outline-none focus:border-neutral-500"
                            />
                          </td>
                          <td className="p-2.5">
                            <div className="space-y-1">
                              <select
                                value={item.action}
                                onChange={(e) => handleActionChange(idx, e.target.value as any)}
                                className="w-full border border-neutral-300 rounded px-2 py-1 text-xs font-semibold text-neutral-800 focus:outline-none"
                              >
                                <option value="CREATE_NEW">✨ Cadastrar como Nova Peça</option>
                                <option value="UPDATE_EXISTING">🔗 Incrementar Peça Existente</option>
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
                                      {stock.code} - {stock.description} (Saldo atual: {stock.quantity})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
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
                ← Selecionar outro XML
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
                      <span>Processando Importação...</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-4 h-4 text-emerald-400" />
                      <span>Confirmar Entrada no Estoque</span>
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
