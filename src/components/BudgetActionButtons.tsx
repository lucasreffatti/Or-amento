'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateBudgetStatus } from '@/app/actions/budget'
import { createInvoiceFromBudget } from '@/app/actions/invoice'
import { CheckCircle2, XCircle, Send, Receipt, Loader2 } from 'lucide-react'

export default function BudgetActionButtons({ 
  budgetId, 
  displayStatus, 
  serviceType, 
  hasChecklist, 
  isChecklistRejected 
}: { 
  budgetId: string, 
  displayStatus: string, 
  serviceType: string, 
  hasChecklist: boolean, 
  isChecklistRejected: boolean 
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleAction = (actionFn: () => Promise<{ success: boolean, message: string, data?: any }>) => {
    startTransition(async () => {
      const res = await actionFn()
      if (res.success) {
        if (res.data?.redirectUrl) {
          router.push(res.data.redirectUrl)
        } else {
          router.refresh() // Recarrega a página para refletir status
        }
      } else {
        alert(res.message) // Idealmente trocar por um toast.
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      {displayStatus === 'DRAFT' && (
        <button 
          onClick={() => handleAction(() => updateBudgetStatus(budgetId, 'SENT'))}
          disabled={isPending}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviar
        </button>
      )}

      {displayStatus === 'SENT' && (
        <>
          {serviceType === 'INTERNAL' && !hasChecklist ? (
            <div className="bg-white border border-neutral-200 text-neutral-400 px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm flex items-center gap-1.5 cursor-not-allowed">
              <CheckCircle2 className="w-4 h-4" /> Aprovar (Requer Vistoria)
            </div>
          ) : isChecklistRejected ? (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm flex items-center gap-1.5 cursor-not-allowed">
              <XCircle className="w-4 h-4 text-red-600" /> Aprovação Bloqueada (Vistoria Reprovada)
            </div>
          ) : (
            <button 
              onClick={() => handleAction(() => updateBudgetStatus(budgetId, 'APPROVED'))}
              disabled={isPending}
              className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Aprovar
            </button>
          )}
          <button 
            onClick={() => handleAction(() => updateBudgetStatus(budgetId, 'REJECTED'))}
            disabled={isPending}
            className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm hover:bg-red-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Recusar
          </button>
        </>
      )}

      {(displayStatus === 'APPROVED' || displayStatus === 'REJECTED' || displayStatus === 'EXPIRED') && (
        <button 
          onClick={() => handleAction(() => updateBudgetStatus(budgetId, 'DRAFT'))}
          disabled={isPending}
          className="bg-white border border-neutral-200 text-neutral-600 px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm hover:bg-neutral-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />} Reabrir
        </button>
      )}

      {displayStatus === 'APPROVED' && (
        <button 
          onClick={() => handleAction(() => createInvoiceFromBudget(budgetId, 'COMBINED'))}
          disabled={isPending}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />} Emitir Nota Fiscal
        </button>
      )}
    </div>
  )
}
