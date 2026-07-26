import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { updateBudgetInfo } from '@/app/actions/budget'

export default async function EditBudgetPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  
  const budget = await prisma.budget.findUnique({
    where: { 
      id: params.id,
      tenantId: session.tenantId 
    },
    include: {
      customer: true,
      vehicle: true
    }
  })
  
  if (!budget) {
    notFound()
  }

  async function handleSave(formData: FormData) {
    'use server'
    await updateBudgetInfo(budget!.id, formData)
    redirect(`/budgets/${budget!.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
      <header className="flex items-center gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800/60 mb-8">
        <Link 
          href={`/budgets/${budget.id}`} 
          className="w-8 h-8 flex items-center justify-center rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:bg-neutral-50 dark:bg-neutral-950/50 transition-colors text-neutral-600 dark:text-neutral-400"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 tracking-tight">Editar Orçamento</h1>
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1">Alterar informações de validade e desconto.</p>
        </div>
      </header>

      <form action={handleSave} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-xl shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6 p-4 bg-neutral-50 dark:bg-neutral-950/50/50 rounded-lg border border-neutral-100 dark:border-neutral-800/50">
          <div>
            <span className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Cliente</span>
            <span className="text-[13px] text-neutral-900 dark:text-neutral-50 font-medium">{budget.customer.name}</span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Veículo</span>
            <span className="text-[13px] text-neutral-900 dark:text-neutral-50 font-medium">{budget.vehicle.brand} {budget.vehicle.model} - <span className="font-mono uppercase">{budget.vehicle.plate}</span></span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-neutral-700 dark:text-neutral-300">Data de Validade</label>
            <input 
              required 
              type="date" 
              name="validUntil" 
              defaultValue={new Date(budget.validUntil).toISOString().split('T')[0]} 
              className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md text-[13px] text-neutral-900 dark:text-neutral-50 outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-neutral-700 dark:text-neutral-300">Desconto (R$)</label>
            <input 
              type="number" 
              name="discount" 
              step="0.01" 
              min="0"
              defaultValue={budget.discount}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md text-[13px] text-neutral-900 dark:text-neutral-50 outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all font-mono"
            />
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">O total final será recalculado com base no desconto.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/50 flex justify-end">
          <button 
            type="submit" 
            className="bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 px-5 py-2.5 rounded-lg text-[13px] font-medium shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:bg-neutral-800 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  )
}
