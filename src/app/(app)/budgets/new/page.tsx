import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export default async function NewBudgetPage({ searchParams }: { searchParams: Promise<{ vehicleId?: string; customerId?: string; checklistId?: string }> }) {
  const session = await getSession()
  const params = await searchParams
  
  // We need customers and vehicles to create a budget
  const customers = await prisma.customer.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: 'asc' }
  })
  
  const vehicles = await prisma.vehicle.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { plate: 'asc' }
  })

  async function createBudget(formData: FormData) {
    'use server'
    const customerId = formData.get('customerId') as string
    const vehicleId = formData.get('vehicleId') as string
    const serviceType = formData.get('serviceType') as string
    let checklistId = (formData.get('checklistId') as string) || null
    
    const tenant = await prisma.tenant.findFirst()
    
    let newBudgetId = ''
    
    if (tenant) {
      // Se checklistId não veio no form, tenta encontrar checklist ativo para este veículo
      if (!checklistId && vehicleId) {
        const matchingChecklist = await prisma.checklist.findFirst({
          where: { vehicleId, tenantId: session.tenantId },
          orderBy: { createdAt: 'desc' }
        })
        if (matchingChecklist) {
          checklistId = matchingChecklist.id
        }
      }

      // Se a vistoria selecionada ou do veículo estiver RECUSADA, cria o orçamento já com status REJECTED
      let initialStatus = 'DRAFT'
      if (checklistId) {
        const chk = await prisma.checklist.findUnique({ where: { id: checklistId } })
        if (chk?.status === 'RECUSADO') {
          initialStatus = 'REJECTED'
        }
      }

      const newBudget = await prisma.budget.create({
        data: {
          customerId,
          vehicleId,
          serviceType,
          checklistId: checklistId || undefined,
          status: initialStatus,
          tenantId: tenant.id,
          totalLabor: 0,
          totalParts: 0,
          discount: 0,
          finalTotal: 0,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
      })
      newBudgetId = newBudget.id
    }
    
    revalidatePath('/budgets')
    
    if (newBudgetId) {
      redirect(`/budgets/${newBudgetId}`)
    } else {
      redirect('/budgets')
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 w-full">
      <header className="flex items-center gap-4 pb-4 border-b border-neutral-100">
        <Link 
          href="/budgets" 
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-500"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Novo Orçamento</h1>
          <p className="text-sm text-neutral-500 mt-1">Inicie um novo orçamento vinculando cliente e veículo.</p>
        </div>
      </header>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-100">
          <div className="w-10 h-10 bg-neutral-50 rounded-full border border-neutral-200 flex items-center justify-center">
            <FileText className="w-5 h-5 text-neutral-400" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-neutral-900">Vínculos Iniciais</h2>
            <p className="text-xs text-neutral-500">Selecione o cliente e o veículo correspondente</p>
          </div>
        </div>

        {customers.length === 0 || vehicles.length === 0 ? (
          <div className="py-8 text-center bg-neutral-50 border border-neutral-100 rounded-md">
            <p className="text-sm text-neutral-600 font-medium">Faltam cadastros base</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
              Para criar um orçamento, você precisa ter pelo menos 1 cliente e 1 veículo cadastrados no sistema.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              {customers.length === 0 && (
                <Link href="/customers/new" className="text-xs font-medium text-blue-600 hover:underline">
                  Cadastrar Cliente
                </Link>
              )}
              {vehicles.length === 0 && (
                <Link href="/vehicles" className="text-xs font-medium text-blue-600 hover:underline">
                  Cadastrar Veículo
                </Link>
              )}
            </div>
          </div>
        ) : (
          <form action={createBudget} className="space-y-5">
            {params.checklistId && (
              <input type="hidden" name="checklistId" value={params.checklistId} />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label htmlFor="serviceType" className="text-[13px] font-medium text-neutral-700">Tipo de Orçamento *</label>
                <select 
                  id="serviceType" 
                  name="serviceType" 
                  required
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all text-neutral-900"
                >
                  <option value="INTERNAL">Serviço Interno (Veículo na Oficina)</option>
                  <option value="EXTERNAL">Orçamento de Balcão (Apenas Cotação)</option>
                </select>
                <p className="text-[11px] text-neutral-500">Serviços internos exigem vistoria de entrada (Checklist) antes da aprovação.</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="customerId" className="text-[13px] font-medium text-neutral-700">Cliente *</label>
                <select 
                  id="customerId" 
                  name="customerId" 
                  required
                  defaultValue={params.customerId || ''}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all text-neutral-900"
                >
                  <option value="">Selecione um cliente...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="vehicleId" className="text-[13px] font-medium text-neutral-700">Veículo *</label>
                <select 
                  id="vehicleId" 
                  name="vehicleId" 
                  required
                  defaultValue={params.vehicleId || ''}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all text-neutral-900"
                >
                  <option value="">Selecione um veículo...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate} ({v.brand} {v.model})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-neutral-100 flex justify-end gap-3">
              <Link 
                href="/budgets" 
                className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
              >
                Cancelar
              </Link>
              <button 
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition-colors shadow-sm"
              >
                Criar Rascunho
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
