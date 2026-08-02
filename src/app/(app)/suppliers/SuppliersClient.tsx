'use client'

import { useState } from 'react'
import { Plus, Search, Building2, Phone, Mail, MapPin, Edit2, Trash2, FileText, ShoppingCart, RefreshCw, X } from 'lucide-react'
import { createSupplier, updateSupplier, deleteSupplier } from '@/app/actions/supplier'

interface SupplierItem {
  id: string
  name: string
  tradeName: string | null
  document: string
  ie: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  stockEntries: Array<{ id: string; totalAmount: number; issueDate: Date | null }>
  _count: { stockItems: number; stockEntries: number }
}

function formatCnpj(doc: string) {
  const clean = doc.replace(/\D/g, '')
  if (clean.length === 14) {
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }
  return doc
}

export default function SuppliersClient({ initialSuppliers }: { initialSuppliers: SupplierItem[] }) {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(initialSuppliers)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null)
  const [loading, setLoading] = useState(false)

  const filteredSuppliers = initialSuppliers.filter(s => {
    const term = search.toLowerCase()
    return s.name.toLowerCase().includes(term) ||
           (s.tradeName && s.tradeName.toLowerCase().includes(term)) ||
           s.document.includes(term) ||
           (s.city && s.city.toLowerCase().includes(term))
  })

  // Métricas
  const totalSuppliers = initialSuppliers.length
  const totalImportedEntries = initialSuppliers.reduce((acc, s) => acc + s._count.stockEntries, 0)
  const totalPurchasesAmount = initialSuppliers.reduce((acc, s) => {
    return acc + s.stockEntries.reduce((sum, e) => sum + e.totalAmount, 0)
  }, 0)

  const handleOpenCreate = () => {
    setEditingSupplier(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (supplier: SupplierItem) => {
    setEditingSupplier(supplier)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o fornecedor "${name}"?`)) {
      await deleteSupplier(id)
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Gestão de Fornecedores & Autopeças</h1>
          <p className="text-sm text-neutral-500 mt-1">Cadastro de distribuidores de peças, CNPJ, histórico de compras e XMLs.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-neutral-900 text-white px-4 py-2 text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Fornecedor</span>
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total de Fornecedores</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totalSuppliers}</div>
          <p className="text-xs text-neutral-500">Distribuidores e autopeças cadastrados</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Notas de Compra Importadas</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{totalImportedEntries}</div>
          <p className="text-xs text-neutral-500">XMLs de NF-e importados no estoque</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Volume de Compras</span>
            <ShoppingCart className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">
            R$ {totalPurchasesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-neutral-500">Total investido em compras com fornecedores</p>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por Razão Social, CNPJ ou Cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all"
          />
        </div>
        <span className="text-xs text-neutral-500 hidden sm:inline">Exibindo {filteredSuppliers.length} fornecedores</span>
      </div>

      {/* Tabela de Fornecedores */}
      <div className="border border-neutral-200 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-700">
            <thead className="bg-neutral-50/80 text-neutral-500 font-semibold text-[11px] uppercase tracking-wider border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">CNPJ</th>
                <th className="px-4 py-3">Razão Social / Fantasia</th>
                <th className="px-4 py-3">Inscrição Estadual</th>
                <th className="px-4 py-3">Contato & Cidade</th>
                <th className="px-4 py-3 text-center">Compras Importadas</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-400 text-sm">
                    Nenhum fornecedor encontrado. Eles são cadastrados automaticamente ao importar o XML da nota de peça!
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs text-neutral-900 font-semibold">
                      {formatCnpj(supplier.document)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-neutral-900">{supplier.name}</div>
                      {supplier.tradeName && supplier.tradeName !== supplier.name && (
                        <div className="text-xs text-neutral-500">{supplier.tradeName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-neutral-600">
                      {supplier.ie || 'Isento / Não informado'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-neutral-600 space-y-0.5">
                      {supplier.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {(supplier.city || supplier.state) && (
                        <div className="flex items-center gap-1.5 text-neutral-500">
                          <MapPin className="w-3 h-3 text-neutral-400" />
                          <span>{supplier.city ? `${supplier.city}/${supplier.state || ''}` : supplier.state}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {supplier._count.stockEntries} nota(s)
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(supplier)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                          title="Editar Fornecedor"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id, supplier.name)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 rounded transition-colors"
                          title="Excluir Fornecedor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro / Edição Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6 text-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h2 className="text-base font-bold text-neutral-900">
                {editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Fornecedor Manualmente'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              action={async (formData) => {
                setLoading(true)
                try {
                  if (editingSupplier) {
                    await updateSupplier(editingSupplier.id, formData)
                  } else {
                    await createSupplier(formData)
                  }
                  setIsModalOpen(false)
                  window.location.reload()
                } catch (err: any) {
                  alert(err.message || 'Erro ao salvar fornecedor.')
                } finally {
                  setLoading(false)
                }
              }}
              className="space-y-4 text-sm"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">CNPJ *</label>
                  <input
                    type="text"
                    name="document"
                    required
                    defaultValue={editingSupplier?.document || ''}
                    placeholder="Ex: 00.000.000/0001-00"
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm font-mono focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Inscrição Estadual (IE)</label>
                  <input
                    type="text"
                    name="ie"
                    defaultValue={editingSupplier?.ie || ''}
                    placeholder="Ex: 123456789"
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm font-mono focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Razão Social *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingSupplier?.name || ''}
                  placeholder="Ex: Distribuidora de Autopeças Brasil LTDA"
                  className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  name="tradeName"
                  defaultValue={editingSupplier?.tradeName || ''}
                  placeholder="Ex: Autopeças Brasil"
                  className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingSupplier?.phone || ''}
                    placeholder="Ex: (48) 99999-8888"
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">E-mail</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingSupplier?.email || ''}
                    placeholder="vendas@autopecas.com.br"
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Cidade</label>
                  <input
                    type="text"
                    name="city"
                    defaultValue={editingSupplier?.city || ''}
                    placeholder="Ex: São Paulo"
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm focus:border-neutral-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">UF (Estado)</label>
                  <input
                    type="text"
                    name="state"
                    maxLength={2}
                    defaultValue={editingSupplier?.state || ''}
                    placeholder="SP"
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 text-sm uppercase font-mono focus:border-neutral-400 outline-none"
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
                  {loading ? 'Salvando...' : editingSupplier ? 'Atualizar Fornecedor' : 'Salvar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
