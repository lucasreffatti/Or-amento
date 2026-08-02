'use client'

import { useState } from 'react'
import { Plus, Search, AlertTriangle, Package, DollarSign, ArrowUpRight, ArrowDownRight, Edit2, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react'
import { createStockItem, updateStockItem, deleteStockItem, adjustStockQuantity } from '@/app/actions/stock'

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
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100 tracking-tight">Gestão de Estoque & Peças Fiscais</h1>
          <p className="text-sm text-neutral-400">Controle de saldo em tempo real, NCM fiscal para NF-e e alerta de repostagem.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Peça</span>
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total de Itens</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalProducts}</div>
          <p className="text-xs text-neutral-500">Cadastrados com NCM e SKU</p>
        </div>

        <div className={`bg-neutral-900 border rounded-xl p-4 space-y-2 ${lowStockCount > 0 ? 'border-amber-500/40 bg-amber-950/10' : 'border-neutral-800'}`}>
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Estoque Crítico</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-400' : 'text-neutral-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-amber-400' : 'text-white'}`}>{lowStockCount}</div>
          <p className="text-xs text-neutral-500">Peças com saldo ≤ estoque mínimo</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Valor Investido</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            R$ {totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-neutral-500">Custo total dos produtos guardados</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Faturamento Potencial</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300">
            R$ {totalPotentialRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-neutral-500">Valor estimado na venda do estoque</p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por descrição, SKU ou NCM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-2 ${
            showLowStockOnly
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Filtrar Apenas Estoque Crítico</span>
        </button>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-950 text-neutral-400 font-medium text-xs uppercase tracking-wider border-b border-neutral-800">
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
            <tbody className="divide-y divide-neutral-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    Nenhuma peça encontrada no estoque.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLowStock = item.quantity <= item.minQuantity
                  return (
                    <tr key={item.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs text-neutral-400 font-semibold">{item.code}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-neutral-200">{item.description}</div>
                        <div className="text-[11px] text-neutral-500">Unidade: {item.unit}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-blue-400">{item.ncm || '8708.29.99'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleQuickAdjust(item.id, -1)}
                            className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center font-bold text-xs"
                            title="Remover 1 unidade"
                          >
                            -
                          </button>
                          <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${
                            isLowStock
                              ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40'
                              : 'bg-neutral-800 text-white'
                          }`}>
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            onClick={() => handleQuickAdjust(item.id, 1)}
                            className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center font-bold text-xs"
                            title="Adicionar 1 unidade"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-neutral-400">
                        R$ {item.costPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-emerald-400">
                        R$ {item.salePrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 rounded transition-colors"
                            title="Editar Peça"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
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

      {/* Modal de Cadastro / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-lg font-bold text-white">
                {editingItem ? 'Editar Peça / Produto' : 'Cadastrar Nova Peça no Estoque'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-500 hover:text-white"
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
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Código / SKU *</label>
                  <input
                    type="text"
                    name="code"
                    required
                    defaultValue={editingItem?.code || ''}
                    placeholder="Ex: BAT-60AH"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">NCM (Fiscal NF-e)</label>
                  <input
                    type="text"
                    name="ncm"
                    defaultValue={editingItem?.ncm || '8708.29.99'}
                    placeholder="Ex: 8708.29.99"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Descrição do Produto *</label>
                <input
                  type="text"
                  name="description"
                  required
                  defaultValue={editingItem?.description || ''}
                  placeholder="Ex: Bateria Moura 60Ah 12V (M60AD)"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Unidade</label>
                  <select
                    name="unit"
                    defaultValue={editingItem?.unit || 'UN'}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm"
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
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Saldo Atual</label>
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    defaultValue={editingItem?.quantity ?? 0}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    name="minQuantity"
                    min="0"
                    defaultValue={editingItem?.minQuantity ?? 2}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="costPrice"
                    defaultValue={editingItem?.costPrice ?? 0}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="salePrice"
                    required
                    defaultValue={editingItem?.salePrice ?? 0}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm font-semibold text-emerald-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-neutral-400 hover:text-white rounded-lg border border-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
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
