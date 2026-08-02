'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FileText, Search, Clock, CheckCircle2, XCircle, Send, DollarSign, Edit2, Eye, ShieldAlert } from 'lucide-react'
import { DeleteButton } from '@/components/DeleteButton'
import { deleteBudget } from '@/app/actions/delete'

interface Budget {
  id: string
  code?: string | null
  status: string
  serviceType: string
  totalAmount?: any
  validUntil: Date | null
  createdAt: Date
  customer: {
    id: string
    name: string
    phone: string
  }
  vehicle?: {
    id: string
    plate: string
    brand: string
    model: string
  } | null
  checklist?: {
    id: string
  } | null
}

export default function BudgetsClient({ initialBudgets }: { initialBudgets: Budget[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Métricas gerais
  const totalCount = initialBudgets.length
  const approvedBudgets = initialBudgets.filter(b => b.status === 'APPROVED')
  const approvedCount = approvedBudgets.length
  const approvedTotalSum = approvedBudgets.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0)
  const pendingCount = initialBudgets.filter(b => b.status === 'DRAFT' || b.status === 'SENT').length

  // Filtragem
  const filteredBudgets = initialBudgets.filter(b => {
    // Tipo de serviço (Na oficina vs Balcão)
    if (b.serviceType !== typeFilter) return false

    // Busca textual
    const matchesSearch =
      (b.code && b.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.id && b.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      b.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.vehicle && b.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.vehicle && b.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!matchesSearch) return false

    // Status
    if (statusFilter === 'EXPIRED') {
      const isExpired = b.validUntil && new Date(b.validUntil) < new Date() && b.status !== 'APPROVED'
      return isExpired
    }
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false

    return true
  })

  const tabs = [
    { label: 'Todos', value: 'ALL', icon: null },
    { label: 'Rascunhos', value: 'DRAFT', icon: <FileText className="w-3.5 h-3.5" /> },
    { label: 'Enviados', value: 'SENT', icon: <Send className="w-3.5 h-3.5" /> },
    { label: 'Aprovados', value: 'APPROVED', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { label: 'Recusados', value: 'REJECTED', icon: <XCircle className="w-3.5 h-3.5" /> },
    { label: 'Vencidos', value: 'EXPIRED', icon: <Clock className="w-3.5 h-3.5" /> },
  ]

  const getStatusBadge = (status: string, validUntil: Date | null) => {
    const isExpired = validUntil && new Date(validUntil) < new Date() && status !== 'APPROVED'
    
    if (isExpired) {
      return (
        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit">
          <Clock className="w-3.5 h-3.5 text-amber-500" /> Vencido
        </span>
      )
    }

    switch (status) {
      case 'DRAFT':
        return (
          <span className="bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit">
            <FileText className="w-3.5 h-3.5 text-neutral-400" /> Rascunho
          </span>
        )
      case 'SENT':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit">
            <Send className="w-3.5 h-3.5 text-blue-500" /> Enviado
          </span>
        )
      case 'APPROVED':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Aprovado
          </span>
        )
      case 'REJECTED':
        return (
          <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit">
            <XCircle className="w-3.5 h-3.5 text-red-500" /> Recusado
          </span>
        )
      default:
        return <span className="text-xs text-neutral-500">{status}</span>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
              <FileText className="w-3 h-3" /> Gestão Comercial
            </span>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Orçamentos & Ordens de Serviço</h1>
          <p className="text-sm text-neutral-500 mt-1">Crie propostas comerciais, orçamentos de balcão e acompanhe aprovações.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Link
            href="/budgets/new"
            className="bg-neutral-900 text-white px-4 py-2.5 text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Orçamento
          </Link>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Registrado</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totalCount}</div>
          <p className="text-xs text-neutral-500">Orçamentos no sistema</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Aprovados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{approvedCount}</div>
          <p className="text-xs text-neutral-500">Propostas aprovadas por clientes</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Em Negociação / Pendente</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          <p className="text-xs text-neutral-500">Rascunhos e propostas enviadas</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Valor Aprovado</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            R$ {approvedTotalSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-neutral-500">Faturamento em serviços aprovados</p>
        </div>
      </div>

      {/* Alternador de Modo: Na Oficina vs Balcão */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setTypeFilter('INTERNAL')}
          className={`flex-1 py-3 px-4 rounded-xl border text-left transition-all ${
            typeFilter === 'INTERNAL'
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
              : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <div className="font-semibold text-sm">Na Oficina (Requer Vistoria)</div>
          <div className={`text-xs mt-0.5 ${typeFilter === 'INTERNAL' ? 'text-neutral-300' : 'text-neutral-500'}`}>
            Serviços vinculados a veículos em atendimento
          </div>
        </button>

        <button
          onClick={() => setTypeFilter('EXTERNAL')}
          className={`flex-1 py-3 px-4 rounded-xl border text-left transition-all ${
            typeFilter === 'EXTERNAL'
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
              : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <div className="font-semibold text-sm">Orçamentos de Balcão (Avulso)</div>
          <div className={`text-xs mt-0.5 ${typeFilter === 'EXTERNAL' ? 'text-neutral-300' : 'text-neutral-500'}`}>
            Venda direta de peças ou orçamentos sem vistoria
          </div>
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-neutral-200 p-3 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, cliente ou placa..."
            className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1 sm:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-2 min-h-[44px] text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                statusFilter === tab.value
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Orçamentos */}
      <div className="border border-neutral-200 bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredBudgets.length === 0 ? (
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center bg-neutral-50/30">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 border border-neutral-200 shadow-sm">
              <FileText className="w-5 h-5 text-neutral-400" />
            </div>
            <h3 className="text-[14px] font-semibold text-neutral-900">Nenhum orçamento encontrado</h3>
            <p className="text-[13px] text-neutral-500 mt-1 max-w-sm leading-relaxed">
              {searchTerm ? 'Nenhum resultado corresponde à sua busca.' : 'Não há orçamentos registrados para esta categoria.'}
            </p>
            <Link
              href="/budgets/new"
              className="mt-5 bg-white border border-neutral-200 text-neutral-900 px-5 py-2.5 min-h-[44px] text-[13px] font-medium rounded-lg hover:bg-neutral-50 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-neutral-400" /> Criar Novo Orçamento
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <table className="min-w-full divide-y divide-neutral-200/80 text-left text-sm">
              <thead className="bg-neutral-50/50">
                <tr>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Código / Cliente</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Veículo</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Valor Total</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Data / Validade</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {filteredBudgets.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/80 transition-colors group">
                    <td className="px-6 py-4 font-medium text-neutral-900 text-[13px] whitespace-nowrap">
                      <Link href={`/budgets/${b.id}`} className="hover:underline flex flex-col">
                        <span className="font-mono text-xs text-indigo-600 font-bold">#{b.code || b.id.slice(0, 8)}</span>
                        <span className="font-semibold text-neutral-900">{b.customer.name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 text-[13px] whitespace-nowrap">
                      {b.vehicle ? (
                        <div className="flex items-center gap-1.5">
                          <span className="bg-neutral-100 text-neutral-800 border border-neutral-200 px-2 py-0.5 rounded font-mono font-bold text-xs">
                            {b.vehicle.plate}
                          </span>
                          <span className="text-neutral-500 text-xs">{b.vehicle.model}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-xs italic">Venda de Balcão</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(b.status, b.validUntil)}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-neutral-900 text-[13px] whitespace-nowrap">
                      R$ {Number(b.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-neutral-400 font-mono text-[12px] whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2 whitespace-nowrap">
                      <Link
                        href={`/budgets/${b.id}`}
                        className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                        title="Ver Orçamento"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/budgets/${b.id}/edit`}
                        className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <DeleteButton
                        id={b.id}
                        action={deleteBudget}
                        entityName="este orçamento"
                        className="opacity-100"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
