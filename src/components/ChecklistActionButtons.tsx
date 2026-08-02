'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateChecklistStatus } from '@/app/actions/checklist'
import { CheckCircle2, XCircle, ArrowLeft, Loader2 } from 'lucide-react'

export default function ChecklistActionButtons({ 
  checklistId, 
  status 
}: { 
  checklistId: string, 
  status: string 
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
          router.refresh()
        }
      } else {
        alert(res.message) // Idealmente trocar por toast
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      {status === 'PENDENTE' ? (
        <>
          <button 
            onClick={() => handleAction(() => updateChecklistStatus(checklistId, 'APROVADO'))}
            disabled={isPending}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[13px] font-medium hover:bg-emerald-100 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Aprovar
          </button>
          
          <button 
            onClick={() => handleAction(() => updateChecklistStatus(checklistId, 'RECUSADO'))}
            disabled={isPending}
            className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-md text-[13px] font-medium hover:bg-red-100 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Recusar
          </button>
        </>
      ) : (
        <button 
          onClick={() => handleAction(() => updateChecklistStatus(checklistId, 'PENDENTE'))}
          disabled={isPending}
          className="px-3 py-1.5 bg-white text-neutral-700 border border-neutral-200 rounded-md text-[13px] font-medium hover:bg-neutral-50 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeft className="w-4 h-4" />} Reabrir
        </button>
      )}
    </div>
  )
}
