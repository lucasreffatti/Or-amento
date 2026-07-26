import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BudgetBuilder from '@/components/BudgetBuilder'
import { headers } from 'next/headers'

export default async function BudgetDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  
  const budget = await prisma.budget.findUnique({
    where: { 
      id: params.id,
      tenantId: session.tenantId 
    },
    include: {
      customer: true,
      vehicle: true,
      items: {
        orderBy: { id: 'asc' }
      }
    }
  })
  
  if (!budget) {
    notFound()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/60">
        <div className="flex items-center gap-4">
          <Link 
            href="/budgets" 
            className="w-8 h-8 flex items-center justify-center rounded-md border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50 transition-colors text-neutral-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">Orçamento <span className="text-neutral-400 font-mono text-[15px]">#{budget.id.substring(0,6).toUpperCase()}</span></h1>
            <p className="text-[13px] text-neutral-500 mt-0.5">{budget.customer.name} - {budget.vehicle.plate} ({budget.vehicle.model})</p>
          </div>
        </div>
        
        <form className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mr-1">Status</span>
          <select 
            name="status"
            defaultValue={budget.status}
            disabled
            className="px-3 py-1.5 bg-white border border-neutral-200 rounded-md text-[13px] outline-none font-medium text-neutral-700 shadow-sm"
          >
            <option value="DRAFT">Rascunho</option>
            <option value="SENT">Enviado</option>
            <option value="APPROVED">Aprovado</option>
            <option value="REJECTED">Rejeitado</option>
          </select>
        </form>
      </header>

      <BudgetBuilder budget={budget as any} />
    </div>
  )
}
