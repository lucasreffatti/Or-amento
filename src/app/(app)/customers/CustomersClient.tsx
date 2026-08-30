'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Users, Search, Edit2, Car, FileText, Calendar, CheckCircle2, Sparkles, Trash2 } from 'lucide-react'
import { DeleteButton } from '@/components/DeleteButton'
import { deleteCustomer, deleteCustomersBulk } from '@/app/actions/delete'

interface Customer {
  id: string
  name: string
  phone: string
  document: string | null
  email: string | null
  createdAt: Date
  vehicles?: any[]
  budgets?: any[]
  checklists?: any[]
}

export default function CustomersClient({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'WITH_VEHICLES' | 'WITH_BUDGETS'>('ALL')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Métricas
  const totalCustomers = customers.length
  const withVehicles = customers.filter(c => (c.vehicles?.length || 0) > 0).length
  const withBudgets = customers.filter(c => (c.budgets?.length || 0) > 0).length
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const newThisMonth = customers.filter(c => new Date(c.createdAt) >= thirtyDaysAgo).length

  // Filtragem
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.document && c.document.includes(searchTerm)) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!matchesSearch) return false

    if (filterType === 'WITH_VEHICLES') return (c.vehicles?.length || 0) > 0
    if (filterType === 'WITH_BUDGETS') return (c.budgets?.length || 0) > 0
    return true
  })

  const handleToggleSelectAll = () => {
    const currentIds = filteredCustomers.map(c => c.id)
    const allSelected = currentIds.every(id => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])))
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`ATENÇÃO: Excluir ${selectedIds.length} cliente(s) também apagará seus veículos, orçamentos e vistorias vinculadas.\n\nDeseja continuar com a exclusão em massa?`)) return

    setIsBulkDeleting(true)
    try {
      const res = await deleteCustomersBulk(selectedIds)
      if (res.success) {
        setCustomers(prev => prev.filter(c => !selectedIds.includes(c.id)))
        setSelectedIds([])
      } else {
        alert(res.message || 'Erro ao excluir clientes em massa')
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir clientes em massa')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
              <Users className="w-3 h-3" /> Base de Clientes
            </span>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Gestão de Clientes</h1>
          <p className="text-sm text-neutral-500 mt-1">Cadastro unificado de proprietários, veículos e histórico comercial.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Link
            href="/reception"
            className="bg-black text-white px-4 py-2.5 text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto shrink-0"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" /> Nova Recepção (Tudo na Mesma Tela)
          </Link>
          <Link
            href="/customers/new"
            className="bg-white border border-neutral-200 text-neutral-800 px-4 py-2.5 text-[13px] font-medium rounded-lg hover:bg-neutral-50 transition-colors shadow-sm flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" /> Apenas Cliente
          </Link>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total de Clientes</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totalCustomers}</div>
          <p className="text-xs text-neutral-500">Cadastrados na base da oficina</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Com Veículos</span>
            <Car className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{withVehicles}</div>
          <p className="text-xs text-neutral-500">Possuem veículo vinculado</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Com Orçamentos</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{withBudgets}</div>
          <p className="text-xs text-neutral-500">Histórico de serviços gerado</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Novos este Mês</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{newThisMonth}</div>
          <p className="text-xs text-neutral-500">Cadastrados nos últimos 30 dias</p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-neutral-200 p-3 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, telefone ou CPF..."
            className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-2 min-h-[44px] text-xs font-medium rounded-lg transition-all ${
              filterType === 'ALL'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Todos ({totalCustomers})
          </button>
          <button
            onClick={() => setFilterType('WITH_VEHICLES')}
            className={`px-3 py-2 min-h-[44px] text-xs font-medium rounded-lg transition-all ${
              filterType === 'WITH_VEHICLES'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Com Veículo ({withVehicles})
          </button>
          <button
            onClick={() => setFilterType('WITH_BUDGETS')}
            className={`px-3 py-2 min-h-[44px] text-xs font-medium rounded-lg transition-all ${
              filterType === 'WITH_BUDGETS'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Com Orçamentos ({withBudgets})
          </button>
        </div>
      </div>

      {/* BARRA FLUTUANTE DE AÇÕES EM MASSA */}
      {selectedIds.length > 0 && (
        <div className="bg-neutral-900 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-lg border border-neutral-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="bg-neutral-800 text-neutral-200 px-3 py-1 rounded-md text-xs font-mono font-bold">
              {selectedIds.length} {selectedIds.length === 1 ? 'cliente selecionado' : 'clientes selecionados'}
            </span>
            <span className="text-xs text-neutral-400 hidden sm:inline">Exclusão em cascata (veículos e orçamentos inclusos)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
            >
              Limpar Seleção
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 min-h-[36px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isBulkDeleting ? 'Excluindo...' : `Excluir ${selectedIds.length} Selecionado(s)`}
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Clientes */}
      <div className="border border-neutral-200 bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center bg-neutral-50/30">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 border border-neutral-200 shadow-sm">
              <Users className="w-5 h-5 text-neutral-400" />
            </div>
            <h3 className="text-[14px] font-semibold text-neutral-900">Nenhum cliente encontrado</h3>
            <p className="text-[13px] text-neutral-500 mt-1 max-w-sm leading-relaxed">
              {searchTerm ? 'Nenhum resultado corresponde à sua busca.' : 'Você ainda não tem clientes cadastrados.'}
            </p>
            <Link
              href="/customers/new"
              className="mt-5 bg-white border border-neutral-200 text-neutral-900 px-5 py-2.5 min-h-[44px] text-[13px] font-medium rounded-lg hover:bg-neutral-50 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-neutral-400" /> Cadastrar Primeiro Cliente
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <table className="min-w-full divide-y divide-neutral-200/80 text-left text-sm">
              <thead className="bg-neutral-50/50">
                <tr>
                  <th className="px-4 py-4 w-10 text-center border-b border-neutral-100">
                    <input
                      type="checkbox"
                      checked={filteredCustomers.length > 0 && filteredCustomers.every(c => selectedIds.includes(c.id))}
                      onChange={handleToggleSelectAll}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 w-4 h-4 cursor-pointer"
                      title="Selecionar Todos"
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Nome</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Telefone</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Documento</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Veículos</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Data Cadastro</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {filteredCustomers.map((c) => {
                  const isSelected = selectedIds.includes(c.id)
                  return (
                    <tr key={c.id} className={`hover:bg-neutral-50/80 transition-colors group ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                      <td className="px-4 py-4 text-center w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(c.id)}
                          className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-neutral-900 text-[13px] whitespace-nowrap">
                        <Link href={`/customers/${c.id}`} className="hover:underline hover:text-black">
                          {c.name}
                        </Link>
                      </td>
                    <td className="px-6 py-4 text-neutral-600 font-mono text-[13px] whitespace-nowrap">{c.phone}</td>
                    <td className="px-6 py-4 text-neutral-500 font-mono text-[13px] whitespace-nowrap">{c.document || '-'}</td>
                    <td className="px-6 py-4 text-neutral-600 text-[13px] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 font-medium text-xs px-2.5 py-1 rounded-md">
                        <Car className="w-3 h-3 text-neutral-500" /> {c.vehicles?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-400 font-mono text-[12px] whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2 whitespace-nowrap">
                      <Link
                        href={`/customers/${c.id}/edit`}
                        className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <DeleteButton
                        id={c.id}
                        action={deleteCustomer}
                        entityName="este cliente"
                        className="opacity-100"
                      />
                    </td>
                  </tr>
                )
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
