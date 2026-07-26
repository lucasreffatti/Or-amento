import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Plus, FileText, Search, Clock, CheckCircle2, XCircle, Send } from 'lucide-react'
import { DeleteButton } from '@/components/DeleteButton'
import { deleteBudget } from '@/app/actions/delete'

export default async function BudgetsPage(props: { searchParams: Promise<{ status?: string, type?: string }> }) {
 const searchParams = await props.searchParams
 const session = await getSession()
 
 const statusFilter = searchParams.status
 const typeFilter = searchParams.type || 'INTERNAL'

 const whereClause: any = { 
 tenantId: session.tenantId,
 serviceType: typeFilter
 }
 
 if (statusFilter === 'EXPIRED') {
 whereClause.validUntil = { lt: new Date() }
 whereClause.status = { not: 'APPROVED' }
 } else if (statusFilter) {
 whereClause.status = statusFilter
 }

 const budgets = await prisma.budget.findMany({
 where: whereClause,
 include: { customer: true, vehicle: true },
 orderBy: { createdAt: 'desc' }
 })

 const tabs = [
 { label: 'Todos', value: '', icon: null },
 { label: 'Rascunhos', value: 'DRAFT', icon: <FileText className="w-3.5 h-3.5" /> },
 { label: 'Enviados', value: 'SENT', icon: <Send className="w-3.5 h-3.5" /> },
 { label: 'Aprovados', value: 'APPROVED', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
 { label: 'Recusados', value: 'REJECTED', icon: <XCircle className="w-3.5 h-3.5" /> },
 { label: 'Vencidos', value: 'EXPIRED', icon: <Clock className="w-3.5 h-3.5" /> },
 ]

 return (
 <div className="space-y-8 animate-in fade-in duration-500 pb-12">
 <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-[#222222]/60">
 <div>
 <div className="flex items-center gap-2 mb-2">
 <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
 <FileText className="w-3 h-3" /> Comercial
 </span>
 </div>
 <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 tracking-tight">Orçamentos</h1>
 <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1">Gerencie propostas e aprovações de clientes.</p>
 </div>
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
 <div className="relative w-full sm:w-auto">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
 <input 
 type="text" 
 placeholder="Buscar orçamento..." 
 className="pl-9 pr-4 py-2 bg-white dark:bg-[#111111] border border-neutral-200 dark:border-[#222222] rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all w-full sm:w-64 shadow-sm"
 />
 </div>
 <Link 
 href="/budgets/new" 
 className="bg-neutral-900 text-white px-4 py-2 text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2 h-[38px] shrink-0"
 >
 <Plus className="w-4 h-4" /> Novo Orçamento
 </Link>
 </div>
 </header>

 {/* Main Mode Toggle: Na Oficina vs Balcão */}
 <div className="flex gap-2">
 <Link 
 href={`/budgets?type=INTERNAL${statusFilter ? `&status=${statusFilter}` : ''}`}
 className={`px-5 py-2 text-[13px] font-medium rounded-md transition-colors ${
 typeFilter === 'INTERNAL' 
 ? 'bg-neutral-900 text-white shadow-sm' 
 : 'bg-white dark:bg-[#111111] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:bg-black/50 border border-neutral-200 dark:border-[#222222]'
 }`}
 >
 Na Oficina (Requer Vistoria)
 </Link>
 <Link 
 href={`/budgets?type=EXTERNAL${statusFilter ? `&status=${statusFilter}` : ''}`}
 className={`px-5 py-2 text-[13px] font-medium rounded-md transition-colors ${
 typeFilter === 'EXTERNAL' 
 ? 'bg-neutral-900 text-white shadow-sm' 
 : 'bg-white dark:bg-[#111111] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:bg-black/50 border border-neutral-200 dark:border-[#222222]'
 }`}
 >
 Orçamentos de Balcão (Avulso)
 </Link>
 </div>

 {/* Tabs */}
 <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide border-b border-neutral-200 dark:border-[#222222]/60 mt-4">
 {tabs.map(tab => {
 const isActive = (statusFilter || '') === tab.value
 return (
 <Link 
 key={tab.label}
 href={`/budgets?type=${typeFilter}${tab.value ? `&status=${tab.value}` : ''}`}
 className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-t-lg transition-colors border-b-2 ${
 isActive 
 ? 'border-neutral-900 text-neutral-900 dark:text-neutral-50 bg-neutral-50 dark:bg-black/50/50' 
 : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:bg-black/50/50'
 }`}
 >
 {tab.icon}
 {tab.label}
 </Link>
 )
 })}
 </div>

 <div className="border border-neutral-200 dark:border-[#222222]/80 bg-white dark:bg-[#111111] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
 {budgets.length === 0 ? (
 <div className="p-16 flex flex-col items-center justify-center text-center bg-neutral-50 dark:bg-black/50/30">
 <div className="w-12 h-12 bg-white dark:bg-[#111111] rounded-xl flex items-center justify-center mb-4 border border-neutral-200 dark:border-[#222222] shadow-sm">
 <FileText className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
 </div>
 <h3 className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">Nenhum orçamento</h3>
 <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1.5 max-w-sm leading-relaxed">
 {statusFilter ? 'Nenhum orçamento encontrado com este status.' : 'Nenhum orçamento foi gerado ainda.'}
 </p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-neutral-200/80 text-left text-sm">
 <thead className="bg-white dark:bg-[#111111]">
 <tr>
 <th className="px-6 py-4 font-semibold text-neutral-500 dark:text-neutral-400 text-[11px] uppercase tracking-widest border-b border-neutral-100 dark:border-[#222222]/50 whitespace-nowrap">Status</th>
 <th className="px-6 py-4 font-semibold text-neutral-500 dark:text-neutral-400 text-[11px] uppercase tracking-widest border-b border-neutral-100 dark:border-[#222222]/50 whitespace-nowrap">Cliente/Veículo</th>
 <th className="px-6 py-4 font-semibold text-neutral-500 dark:text-neutral-400 text-[11px] uppercase tracking-widest border-b border-neutral-100 dark:border-[#222222]/50 whitespace-nowrap">Valor Final</th>
 <th className="px-6 py-4 font-semibold text-neutral-500 dark:text-neutral-400 text-[11px] uppercase tracking-widest border-b border-neutral-100 dark:border-[#222222]/50 text-right whitespace-nowrap">Validade</th>
 <th className="px-6 py-4 font-semibold text-neutral-500 dark:text-neutral-400 text-[11px] uppercase tracking-widest border-b border-neutral-100 dark:border-[#222222]/50 text-right whitespace-nowrap">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-neutral-100 bg-white dark:bg-[#111111]">
 {budgets.map((b) => {
 const isExpired = new Date(b.validUntil) < new Date() && b.status !== 'APPROVED';
 const displayStatus = isExpired ? 'VENCIDO' : b.status;
 
 return (
 <tr key={b.id} className="hover:bg-neutral-50 dark:bg-black/50/80 transition-colors group">
 <td className="px-6 py-4 whitespace-nowrap">
 <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-medium shadow-sm ${
 displayStatus === 'DRAFT' ? 'bg-neutral-50 dark:bg-black/50 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-[#222222]/80' :
 displayStatus === 'SENT' ? 'bg-blue-50 text-blue-700 border border-blue-200/80' :
 displayStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' :
 displayStatus === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200/80' :
 'bg-amber-50 text-amber-700 border border-amber-200/80' // Vencido
 }`}>
 {displayStatus === 'DRAFT' ? 'RASCUNHO' : 
 displayStatus === 'SENT' ? 'ENVIADO' : 
 displayStatus === 'APPROVED' ? 'APROVADO' : 
 displayStatus === 'REJECTED' ? 'RECUSADO' : 
 'VENCIDO'}
 </span>
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="font-medium text-neutral-900 dark:text-neutral-50 text-[13px]">{b.customer.name}</div>
 <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">{b.vehicle.plate} • {b.vehicle.brand}</div>
 </td>
 <td className="px-6 py-4 font-mono font-medium text-neutral-900 dark:text-neutral-50 text-[13px] whitespace-nowrap">
 R$ {b.finalTotal.toFixed(2)}
 </td>
 <td className={`px-6 py-4 font-mono text-[12px] text-right whitespace-nowrap ${isExpired ? 'text-amber-600 font-semibold' : 'text-neutral-400 dark:text-neutral-500'}`}>
 {new Date(b.validUntil).toLocaleDateString('pt-BR')}
 </td>
 <td className="px-6 py-4 text-right flex items-center justify-end gap-2 whitespace-nowrap">
 <Link 
 href={`/budgets/${b.id}`} 
 className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
 >
 Abrir
 </Link>
 <DeleteButton 
 id={b.id} 
 action={deleteBudget} 
 entityName="este orçamento" 
 className="opacity-100 md:opacity-0 md:group-hover:opacity-100" 
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

