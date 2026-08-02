'use client'

import { useState } from 'react'
import { Plus, Search, AlertTriangle, Package, DollarSign, ArrowUpRight, Edit2, Trash2, ShieldAlert, FileCode2 } from 'lucide-react'
import { createStockItem, updateStockItem, deleteStockItem, adjustStockQuantity } from '@/app/actions/stock'
import { ImportXmlModal } from '@/components/ImportXmlModal'

interface StockItem {
  id: string
  code: string
  description: string
  ncm: string | null
  cest: string | null
  unit: string
  costPrice: number
  salePrice: number
  quantity: number
  minQuantity: number
}

export default function StockClient({ initialItems }: { initialItems: StockItem[] }) {
  const [items, setItems] = useState<StockItem[]>(initialItems)
  const [search, setSearch] = useState('')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  const [loading, setLoading] = useState(false)

  const filteredItems = initialItems.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(search.toLowerCase()) ||
                          item.code.toLowerCase().includes(search.toLowerCase()) ||
                          (item.ncm && item.ncm.includes(search))
    const matchesLowStock = showLowStockOnly ? item.quantity <= item.minQuantity : true
    return matchesSearch && matchesLowStock
  })

  // Indicadores
  const totalProducts = initialItems.length
  const lowStockCount = initialItems.filter(i => i.quantity <= i.minQuantity).length
  const totalInvestment = initialItems.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0)
  const totalPotentialRevenue = initialItems.reduce((acc, item) => acc + (item.salePrice * item.quantity), 0)

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
    }
  }

  const handleQuickAdjust = async (id: string, delta: number) => {
    await adjustStockQuantity(id, delta)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Gestão de Estoque & Peças Fiscais</h1>
          <p className="text-sm text-neutral-500 mt-1">Controle de saldo em tempo real, NCM fiscal para NF-e e alerta de reposição.</p>
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
            <span className="text-xs font-medium uppercase tracking-wider">Total de Itens</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totalProducts}</div>
          <p className="text-xs text-neutral-500">Cadastrados com NCM e SKU</p>
        </div>

        <div className={`bg-white border rounded-xl p-4 shadow-sm space-y-2 ${lowStockCount > 0 ? 'border-amber-300 bg-amber-50/30' : 'border-neutral-200'}`}>
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Estoque Crítico</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-600' : 'text-neutral-400'}`} />
          </div>
          <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-amber-600' : 'text-neutral-900'}`}>{lowStockCount}</div>
          <p className="text-xs text-neutral-500">Peças com saldo ≤ estoque mínimo</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Valor Investido</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            R$ {totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-neutral-500">Custo total dos produtos guardados</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Faturamento Potencial</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">
            R$ {totalPotentialRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-neutral-500">Valor estimado na venda do estoque</p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-neutral-200 rounded-xl p-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por descrição, SKU ou NCM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all"
          />
        </div>

        <button
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-2 ${
            showLowStockOnly
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Filtrar Apenas Estoque Crítico</span>
        </button>
      </div>

      {/* Tabela de Produtos */}
      <div className="border border-neutral-200 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-700">
            <thead className="bg-neutral-50/80 text-neutral-500 font-semibold text-[11px] uppercase tracking-wider border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">SKU / Código</th>
                <th className="px-4 py-3">Descrição da Peça</th>
                <th className="px-4 py-3">NCM (Fiscal)</th>
                <th className="px-4 py-3 text-center">Saldo</th>
                <th className="px-4 py-3 text-right">Custo Un.</th>
                <th className="px-4 py-3 text-right">Venda Un.</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-400 text-sm">
                    Nenhuma peça encontrada no estoque.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLowStock = item.quantity <= item.minQuantity
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs text-neutral-600 font-semibold">{item.code}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-neutral-900">{item.description}</div>
                        <div className="text-[11px] text-neutral-500">Unidade: {item.unit}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-blue-600 font-medium">{item.ncm || '8708.29.99'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleQuickAdjust(item.id, -1)}
                            className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-xs border border-neutral-200 transition-colors"
                            title="Remover 1 unidade"
                          >
                            -
                          </button>
                          <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${
                            isLowStock
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-neutral-100 text-neutral-900 border border-neutral-200'
                          }`}>
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            onClick={() => handleQuickAdjust(item.id, 1)}
                            className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-xs border border-neutral-200 transition-colors"
                            title="Adicionar 1 unidade"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-neutral-500">
                        R$ {item.costPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600">
                        R$ {item.salePrice.toFixed(2)}
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

      {/* Modal de Importação de XML */}
      <ImportXmlModal
        isOpen={isXmlModalOpen}
        onClose={() => setIsXmlModalOpen(false)}
        existingStockItems={items}
        onSuccess={() => {
          window.location.reload()
        }}
      />

      {/* Modal de Cadastro / Edição Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6 text-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h2 className="text-base font-bold text-neutral-900">
                {editingItem ? 'Editar Peça / Produto' : 'Cadastrar Nova Peça no Estoque'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                setLoading(true)
                try {
                  if (editingItem) {
                    await updateStockItem(editingItem.id, formData)
                  } else {
                    await createStockItem(formData)
                  }
                  setIsModalOpen(false)
                } catch (err: any) {
                  alert(err.message || 'Erro ao salvar peça')
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
                    placeholder="Ex: BAT-60AH"
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">NCM (Fiscal NF-e)</label>
                  <input
                    type="text"
                    name="ncm"
                    defaultValue={editingItem?.ncm || '8708.29.99'}
                    placeholder="Ex: 8708.29.99"
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm font-mono focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Descrição do Produto *</label>
                <input
                  type="text"
                  name="description"
                  required
                  defaultValue={editingItem?.description || ''}
                  placeholder="Ex: Bateria Moura 60Ah 12V (M60AD)"
                  className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Unidade</label>
                  <select
                    name="unit"
                    defaultValue={editingItem?.unit || 'UN'}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:border-neutral-400 outline-none"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="PÇ">PÇ (Peça)</option>
                    <option value="LT">LT (Litro)</option>
                    <option value="KG">KG (Quilo)</option>
                    <option value="JG">JG (Jogo)</option>
                    <option value="CX">CX (Caixa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Saldo Atual</label>
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    defaultValue={editingItem?.quantity ?? 0}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    name="minQuantity"
                    min="0"
                    defaultValue={editingItem?.minQuantity ?? 2}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="costPrice"
                    defaultValue={editingItem?.costPrice ?? 0}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:border-neutral-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="salePrice"
                    required
                    defaultValue={editingItem?.salePrice ?? 0}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm font-semibold text-emerald-600 focus:border-neutral-400 outline-none"
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
                  {loading ? 'Salvando...' : editingItem ? 'Atualizar Peça' : 'Salvar no Estoque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
