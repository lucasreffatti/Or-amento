import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Plus, FileText, Search, Sparkles } from 'lucide-react'

export default async function BudgetsPage() {
  const session = await getSession()
  const budgets = await prisma.budget.findMany({
    where: { tenantId: session.tenantId },
    include: { customer: true, vehicle: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200/60">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
              <FileText className="w-3 h-3" /> Comercial
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Orçamentos</h1>
          <p className="text-[13px] text-neutral-500 mt-1">Gerencie propostas e aprovações de clientes.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Buscar orçamento..." 
              className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all w-64 shadow-sm"
            />
          </div>
          <Link 
            href="/budgets/new" 
            className="bg-neutral-900 text-white px-4 py-2 text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center gap-2 h-[38px]"
          >
            <Plus className="w-4 h-4" /> Novo Orçamento
          </Link>
        </div>
      </header>

      <div className="border border-neutral-200/80 bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        {budgets.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center bg-neutral-50/30">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 border border-neutral-200 shadow-sm">
              <FileText className="w-5 h-5 text-neutral-400" />
            </div>
            <h3 className="text-[14px] font-semibold text-neutral-900">Nenhum orçamento</h3>
            <p className="text-[13px] text-neutral-500 mt-1.5 max-w-sm leading-relaxed">
              Nenhum orçamento foi gerado ainda. Crie um novo orçamento associando um cliente e um veículo.
            </p>
            <Link 
              href="/budgets/new" 
              className="mt-6 bg-white border border-neutral-200 text-neutral-900 px-5 py-2.5 text-[13px] font-medium rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-neutral-400" /> Criar Orçamento
            </Link>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-neutral-200/80 text-left text-sm">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100">Status</th>
                <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100">Cliente/Veículo</th>
                <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100">Valor Final</th>
                <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 text-right">Validade</th>
                <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {budgets.map((b) => (
                <tr key={b.id} className="hover:bg-neutral-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-medium shadow-sm ${
                      b.status === 'DRAFT' ? 'bg-neutral-50 text-neutral-600 border border-neutral-200/80' :
                      b.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' :
                      'bg-amber-50 text-amber-700 border border-amber-200/80'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900 text-[13px]">{b.customer.name}</div>
                    <div className="text-[12px] text-neutral-500 mt-0.5">{b.vehicle.plate} • {b.vehicle.brand}</div>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-neutral-900 text-[13px]">
                    R$ {b.finalTotal.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-neutral-400 font-mono text-[12px] text-right">
                    {new Date(b.validUntil).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/budgets/${b.id}`} 
                      className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
