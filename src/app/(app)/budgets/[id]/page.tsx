import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Send, Edit, ExternalLink, AlertTriangle } from 'lucide-react'
import BudgetBuilder from '@/components/BudgetBuilder'
import { updateBudgetStatus } from '@/app/actions/budget'

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

  const isExpired = new Date(budget.validUntil) < new Date() && budget.status !== 'APPROVED';
  const displayStatus = isExpired ? 'EXPIRED' : budget.status;

  const markAsSent = updateBudgetStatus.bind(null, budget.id, 'SENT')
  const approve = updateBudgetStatus.bind(null, budget.id, 'APPROVED')
  const reject = updateBudgetStatus.bind(null, budget.id, 'REJECTED')
  const backToDraft = updateBudgetStatus.bind(null, budget.id, 'DRAFT')

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
            <h1 className="text-lg font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
              Orçamento <span className="text-neutral-400 font-mono text-[15px]">#{budget.id.substring(0,6).toUpperCase()}</span>
              {displayStatus === 'APPROVED' && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ml-2">
                  <CheckCircle2 className="w-3 h-3" /> Aprovado
                </span>
              )}
              {displayStatus === 'REJECTED' && (
                <span className="bg-red-50 text-red-700 border border-red-200/80 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ml-2">
                  <XCircle className="w-3 h-3" /> Recusado
                </span>
              )}
              {displayStatus === 'EXPIRED' && (
                <span className="bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ml-2">
                  Vencido
                </span>
              )}
            </h1>
            <p className="text-[13px] text-neutral-500 mt-0.5">
              {budget.serviceType === 'INTERNAL' ? 'Na Oficina' : 'Balcão'} • {budget.customer.name} - {budget.vehicle.plate} ({budget.vehicle.model})
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {displayStatus === 'DRAFT' && (
            <>
              <form action={markAsSent}>
                <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-1.5">
                  <Send className="w-4 h-4" /> Enviar
                </button>
              </form>
            </>
          )}

          {displayStatus === 'SENT' && (
            <>
              {budget.serviceType === 'INTERNAL' && !budget.checklistId ? (
                <div className="bg-white border border-neutral-200 text-neutral-400 px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm flex items-center gap-1.5 cursor-not-allowed">
                  <CheckCircle2 className="w-4 h-4" /> Aprovar (Requer Vistoria)
                </div>
              ) : (
                <form action={approve}>
                  <button type="submit" className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Aprovar
                  </button>
                </form>
              )}
              <form action={reject}>
                <button type="submit" className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm hover:bg-red-50 transition-colors flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Recusar
                </button>
              </form>
            </>
          )}

          {(displayStatus === 'APPROVED' || displayStatus === 'REJECTED' || displayStatus === 'EXPIRED') && (
            <form action={backToDraft}>
              <button type="submit" className="bg-white border border-neutral-200 text-neutral-600 px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm hover:bg-neutral-50 transition-colors">
                Reabrir
              </button>
            </form>
          )}

          <Link href={`/budgets/${budget.id}/edit`} className="bg-white border border-neutral-200 text-neutral-600 px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm hover:bg-neutral-50 transition-colors flex items-center gap-1.5">
            <Edit className="w-4 h-4" /> Editar Info
          </Link>

          <Link href={`/print/budgets/${budget.id}`} target="_blank" className="bg-neutral-900 text-white px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm hover:bg-neutral-800 transition-colors flex items-center gap-1.5 ml-2">
            <ExternalLink className="w-4 h-4" /> Imprimir
          </Link>
        </div>
      </header>

      {/* Exibe aviso se aprovado, impedindo edição via builder logic if needed, mas BudgetBuilder já deve estar cuidando ou o usuário tem o aviso */}
      {displayStatus === 'APPROVED' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-[13px] flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="font-bold">Este orçamento está Aprovado.</p>
            <p className="text-emerald-700/80 mt-0.5">Altere para rascunho se precisar modificar os itens.</p>
          </div>
        </div>
      )}

      {budget.serviceType === 'INTERNAL' && !budget.checklistId && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-lg flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-10 h-10 bg-amber-100/50 rounded-full flex items-center justify-center shrink-0">
             <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 text-sm">Vistoria de Entrada Pendente</h3>
            <p className="text-amber-800/80 mt-0.5 text-[13px] leading-relaxed">
              Orçamentos para veículos hospedados na oficina exigem um registro de vistoria antes da aprovação final.
            </p>
          </div>
          <Link 
            href={`/checklists/new?budgetId=${budget.id}&vehicleId=${budget.vehicleId}&customerId=${budget.customerId}`} 
            className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm shrink-0 flex items-center justify-center"
          >
            Realizar Vistoria
          </Link>
        </div>
      )}
      
      {budget.serviceType === 'INTERNAL' && budget.checklistId && (
        <div className="bg-indigo-50 border border-indigo-200/60 text-indigo-800 px-4 py-3 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          <div className="flex-1">
            <span className="text-[13px] font-medium">Vistoria de entrada registrada com sucesso.</span>
          </div>
          <Link href={`/checklists/${budget.checklistId}`} className="text-[12px] bg-white border border-indigo-100 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-50 transition-colors font-medium shadow-sm">
            Ver Documento
          </Link>
        </div>
      )}

      <BudgetBuilder budget={budget as any} />
    </div>
  )
}
