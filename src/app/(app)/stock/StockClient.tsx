'use client'

import { useState } from 'react'
import { Plus, Search, AlertTriangle, Package, DollarSign, ArrowUpRight, Edit2, Trash2, ShieldAlert, FileCode2, RotateCw, FileText, ChevronDown, ChevronUp, Building2 } from 'lucide-react'
import { createStockItem, updateStockItem, deleteStockItem, adjustStockQuantity } from '@/app/actions/stock'
import { ImportXmlModal } from '@/components/ImportXmlModal'

interface StockItem {
  id: string
  code: string
  description: string
  itemType?: string
  ncm: string | null
  cest: string | null
  unit: string
  costPrice: number
  salePrice: number
  quantity: number
  minQuantity: number
}

interface StockEntryItem {
  id: string
  nfeNumber: string
  nfeKey: string
  issueDate: Date | null
  totalAmount: number
  createdAt: Date
  supplier: {
    name: string
    document: string
  }
  items: Array<{
    id: string
    supplierProductCode: string
    description: string
    unit: string
    quantity: number
    costUnitPrice: number
    totalPrice: number
  }>
}

export default function StockClient({
  initialItems,
  initialEntries = []
}: {
  initialItems: StockItem[]
  initialEntries?: StockEntryItem[]
}) {
  const [activeTab, setActiveTab] = useState<'FIXO' | 'ROTATIVO' | 'ENTRIES'>('FIXO')
  const [items, setItems] = useState<StockItem[]>(initialItems)
  const [entries, setEntries] = useState<StockEntryItem[]>(initialEntries)
  const [search, setSearch] = useState('')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)

  // Filtrar itens por aba ativa (FIXO vs ROTATIVO)
  const tabItems = initialItems.filter(item => {
    const isRotative = item.itemType === 'ROTATIVO'
    return activeTab === 'ROTATIVO' ? isRotative : !isRotative
  })

  const filteredItems = tabItems.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(search.toLowerCase()) ||
                          item.code.toLowerCase().includes(search.toLowerCase()) ||
                          (item.ncm && item.ncm.includes(search))
    const matchesLowStock = showLowStockOnly ? item.quantity <= item.minQuantity : true
    return matchesSearch && matchesLowStock
  })

  // Filtrar entradas de notas
  const filteredEntries = entries.filter(entry => {
    const term = search.toLowerCase()
    return entry.nfeNumber.includes(term) ||
           entry.supplier.name.toLowerCase().includes(term) ||
           entry.supplier.document.includes(term) ||
           entry.nfeKey.includes(term)
  })

  // Indicadores (Estoque Fixo)
  const fixedItems = initialItems.filter(i => i.itemType !== 'ROTATIVO')
  const rotativeItems = initialItems.filter(i => i.itemType === 'ROTATIVO')

  const totalFixedProducts = fixedItems.length
  const totalRotativeProducts = rotativeItems.length
  const lowStockCount = fixedItems.filter(i => i.quantity <= i.minQuantity).length
  const totalInvestment = fixedItems.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0)
  const totalPotentialRevenue = fixedItems.reduce((acc, item) => acc + (item.salePrice * item.quantity), 0)

  const handleOpenCreate = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: StockItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta peça do estoque?')) {
      await deleteStockItem(id)
      window.location.reload()
    }
  }

  const handleQuickAdjust = async (id: string, delta: number) => {
    await adjustStockQuantity(id, delta)
    window.location.reload()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Gestão de Estoque & Compras Fiscais</h1>
          <p className="text-sm text-neutral-500 mt-1">Separação de estoque permanente (prateleira) e rotativo (encomenda por serviço).</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsXmlModalOpen(true)}
            className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 px-3.5 py-2 text-[13px] font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
            title="Importar XML da Distribuidora para dar entrada de estoque e cadastrar fornecedor"
          >
            <FileCode2 className="w-4 h-4 text-blue-600" />
            <span>Importar Nota de Compra (XML)</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="bg-neutral-900 text-white px-4 py-2 text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Peça</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Estoque Prateleira</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totalFixedProducts} itens</div>
          <p className="text-xs text-neutral-500">Produtos guardados na oficina</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Estoque Rotativo</span>
            <RotateCw className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{totalRotativeProducts} encomendas</div>
          <p className="text-xs text-neutral-500">Peças compradas direto para serviço</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Valor Investido (Fixo)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            R$ {totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-neutral-500">Custo total dos produtos guardados</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Estoque Crítico</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-600' : 'text-neutral-400'}`} />
          </div>
          <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-amber-600' : 'text-neutral-900'}`}>{lowStockCount}</div>
          <p className="text-xs text-neutral-500">Peças com saldo ≤ estoque mínimo</p>
        </div>
      </div>

      {/* Navegação por Abas Principais */}
      <div className="flex border-b border-neutral-200 space-x-2">
        <button
          onClick={() => setActiveTab('FIXO')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'FIXO'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Package className="w-4 h-4 text-blue-600" />
          <span>📦 Estoque Fixo (Prateleira)</span>
          <span className="ml-1 bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5 rounded-full font-bold">
            {totalFixedProducts}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ROTATIVO')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'ROTATIVO'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <RotateCw className="w-4 h-4 text-purple-600" />
          <span>🔄 Peças Rotativas (Encomendas)</span>
          <span className="ml-1 bg-purple-50 text-purple-700 border border-purple-100 text-xs px-2 py-0.5 rounded-full font-bold">
            {totalRotativeProducts}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ENTRIES')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'ENTRIES'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>📜 Histórico de Notas de Entrada (NF-e)</span>
          <span className="ml-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs px-2 py-0.5 rounded-full font-bold">
            {entries.length}
          </span>
        </button>
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-neutral-200 rounded-xl p-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'ENTRIES'
                ? "Buscar por Nº da Nota, Fornecedor ou Chave..."
                : "Buscar por descrição, SKU ou NCM..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all"
          />
        </div>

        {activeTab !== 'ENTRIES' && (
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              showLowStockOnly
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Apenas estoque baixo</span>
          </button>
        )}
      </div>

      {/* CONTEÚDO DAS ABAS FIXO E ROTATIVO */}
      {(activeTab === 'FIXO' || activeTab === 'ROTATIVO') && (
        <div className="border border-neutral-200 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-700">
              <thead className="bg-neutral-50/80 text-neutral-500 font-semibold text-[11px] uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3">Código (SKU)</th>
                  <th className="px-4 py-3">Descrição da Peça</th>
                  <th className="px-4 py-3">NCM Fiscal</th>
                  <th className="px-4 py-3 text-right">Preço Custo</th>
                  <th className="px-4 py-3 text-right">Preço Venda</th>
                  <th className="px-4 py-3 text-center">Saldo em Estoque</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-neutral-400 text-sm">
                      {activeTab === 'ROTATIVO'
                        ? 'Nenhuma peça rotativa (encomenda) cadastrada no momento.'
                        : 'Nenhuma peça encontrada no estoque de prateleira.'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLowStock = item.itemType !== 'ROTATIVO' && item.quantity <= item.minQuantity
                    return (
                      <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-neutral-900">
                          {item.code}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-neutral-900">
                          <div className="flex items-center gap-2">
                            <span>{item.description}</span>
                            {item.itemType === 'ROTATIVO' && (
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 font-bold rounded text-[10px]">
                                Rotativo / Encomenda
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-neutral-500">
                          {item.ncm || '8708.29.99'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-neutral-600">
                          R$ {item.costPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                          R$ {item.salePrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                              isLowStock 
                                ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                : item.itemType === 'ROTATIVO'
                                  ? 'bg-neutral-100 text-neutral-700 border-neutral-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {item.quantity} {item.unit}
                            </span>
                            
                            {/* Botões de ajuste rápido (+ / -) */}
                            <div className="flex items-center border border-neutral-200 rounded overflow-hidden">
                              <button
                                onClick={() => handleQuickAdjust(item.id, -1)}
                                className="px-1.5 py-0.5 text-neutral-500 hover:bg-neutral-100 font-bold text-xs"
                                title="Reduzir 1 unidade"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleQuickAdjust(item.id, 1)}
                                className="px-1.5 py-0.5 text-neutral-500 hover:bg-neutral-100 font-bold text-xs border-l border-neutral-200"
                                title="Adicionar 1 unidade"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                              title="Editar Peça"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 rounded transition-colors"
                              title="Excluir Peça"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA HISTÓRICO DE NOTAS FISCAIS DE ENTRADA */}
      {activeTab === 'ENTRIES' && (
        <div className="space-y-4">
          <div className="border border-neutral-200 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-700">
                <thead className="bg-neutral-50/80 text-neutral-500 font-semibold text-[11px] uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3">Nota Fiscal</th>
                    <th className="px-4 py-3">Fornecedor / Distribuidor</th>
                    <th className="px-4 py-3">Data Emissão</th>
                    <th className="px-4 py-3 text-right">Valor Total XML</th>
                    <th className="px-4 py-3 text-center">Peças na Nota</th>
                    <th className="px-4 py-3 text-center">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-neutral-400 text-sm">
                        Nenhuma Nota Fiscal de entrada importada ainda. Importe um arquivo `.xml` para visualizar!
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => {
                      const isExpanded = expandedEntryId === entry.id
                      return (
                        <tr key={entry.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="px-4 py-3.5 font-mono text-xs font-bold text-neutral-900">
                            NF-e Nº {entry.nfeNumber}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-neutral-900">{entry.supplier.name}</div>
                            <div className="text-xs text-neutral-500 font-mono">CNPJ: {entry.supplier.document}</div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-neutral-600 font-mono">
                            {entry.issueDate ? new Date(entry.issueDate).toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                            R$ {entry.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono text-xs">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 font-bold rounded">
                              {entry.items.length} itens
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                              className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-xs font-semibold flex items-center gap-1 mx-auto transition-colors"
                            >
                              <span>{isExpanded ? 'Ocultar' : 'Ver Peças'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Painel Expandido com Itens da Nota */}
          {expandedEntryId && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3 animate-in fade-in">
              {(() => {
                const entry = entries.find(e => e.id === expandedEntryId)
                if (!entry) return null
                return (
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                      <h4 className="text-xs uppercase font-bold text-neutral-600 tracking-wider">
                        Itens Importados da NF-e Nº {entry.nfeNumber} ({entry.supplier.name})
                      </h4>
                      <span className="text-xs font-mono text-neutral-500">Chave: {entry.nfeKey}</span>
                    </div>

                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs text-neutral-700 bg-white border border-neutral-200 rounded-lg overflow-hidden">
                        <thead className="bg-neutral-100 text-neutral-600 font-semibold uppercase">
                          <tr>
                            <th className="p-2">SKU</th>
                            <th className="p-2">Descrição</th>
                            <th className="p-2 text-center">Qtd</th>
                            <th className="p-2 text-right">Custo Un.</th>
                            <th className="p-2 text-right">Total Item</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {entry.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="p-2 font-mono font-bold">{item.supplierProductCode}</td>
                              <td className="p-2 font-semibold text-neutral-900">{item.description}</td>
                              <td className="p-2 text-center font-mono">{item.quantity} {item.unit}</td>
                              <td className="p-2 text-right font-mono">R$ {item.costUnitPrice.toFixed(2)}</td>
                              <td className="p-2 text-right font-mono font-bold text-emerald-700">R$ {item.totalPrice.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* Modal de Importação XML */}
      <ImportXmlModal
        isOpen={isXmlModalOpen}
        onClose={() => setIsXmlModalOpen(false)}
        existingStockItems={initialItems}
        onSuccess={() => window.location.reload()}
      />

      {/* Modal de Cadastro / Edição Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6 text-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h2 className="text-base font-bold text-neutral-900">
                {editingItem ? 'Editar Peça' : 'Cadastrar Peça Manualmente'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <span className="text-lg">×</span>
              </button>
            </div>

            <form
              action={async (formData) => {
                setLoading(true)
                try {
                  const action = editingItem 
                    ? updateStockItem.bind(null, editingItem.id)
                    : createStockItem;
                  
                  const result = await action(formData)
                  if (!result.success) {
                    alert(result.message)
                  } else {
                    setIsModalOpen(false)
                    window.location.reload()
                  }
                } catch (err: any) {
                  alert(err.message || 'Erro ao salvar peça.')
                } finally {
                  setLoading(false)
                }
              }}
              className="space-y-4 text-sm"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Código / SKU *</label>
                  <input
                    type="text"
                    name="code"
                    required
                    defaultValue={editingItem?.code || ''}
                    placeholder="Ex: FILT-1002"
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm font-mono focus:border-neutral-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Tipo de Estoque</label>
                  <select
                    name="itemType"
                    defaultValue={editingItem?.itemType || 'FIXO'}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm font-semibold outline-none"
                  >
                    <option value="FIXO">📦 Estoque Fixo (Prateleira)</option>
                    <option value="ROTATIVO">🔄 Peça Rotativa (Encomenda)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Descrição da Peça *</label>
                <input
                  type="text"
                  name="description"
                  required
                  defaultValue={editingItem?.description || ''}
                  placeholder="Ex: Filtro de Óleo Motul Hf138"
                  className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:border-neutral-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">NCM Fiscal</label>
                  <input
                    type="text"
                    name="ncm"
                    defaultValue={editingItem?.ncm || '8708.29.99'}
                    placeholder="Ex: 8708.29.99"
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Unidade de Medida</label>
                  <select
                    name="unit"
                    defaultValue={editingItem?.unit || 'UN'}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm outline-none"
                  >
                    <option value="UN">UN - Unidade</option>
                    <option value="PÇ">PÇ - Peça</option>
                    <option value="LT">LT - Litro</option>
                    <option value="KG">KG - Quilo</option>
                    <option value="CX">CX - Caixa</option>
                    <option value="JG">JG - Jogo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Preço Custo (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="costPrice"
                    required
                    defaultValue={editingItem?.costPrice || 0}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Preço Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="salePrice"
                    required
                    defaultValue={editingItem?.salePrice || 0}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm font-mono font-bold text-emerald-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Quantidade em Estoque</label>
                  <input
                    type="number"
                    name="quantity"
                    defaultValue={editingItem?.quantity || 0}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Estoque Mínimo (Alerta)</label>
                  <input
                    type="number"
                    name="minQuantity"
                    defaultValue={editingItem?.minQuantity || 2}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : editingItem ? 'Atualizar Peça' : 'Salvar Peça'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
