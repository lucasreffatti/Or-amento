import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react'

export default async function NewBudgetPage({ searchParams }: { searchParams: Promise<{ vehicleId?: string; customerId?: string; checklistId?: string }> }) {
  const session = await getSession()
  const params = await searchParams
  
  if (!session?.tenantId) {
    redirect('/login')
  }

  // Customers and vehicles for current tenant
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
    const actionSession = await getSession()
    if (!actionSession?.tenantId) {
      redirect('/login')
    }

    const customerId = (formData.get('customerId') as string)?.trim()
    const vehicleId = (formData.get('vehicleId') as string)?.trim()
    const serviceType = (formData.get('serviceType') as string) || 'INTERNAL'
    let rawChecklistId = (formData.get('checklistId') as string)?.trim() || null

    if (!customerId || !vehicleId) {
      redirect('/budgets/new')
    }

    // 1. Verifica se a cliente e veículo pertencem ao tenant do usuário
    const customerExists = await prisma.customer.findFirst({ where: { id: customerId, tenantId: actionSession.tenantId } })
    const vehicleExists = await prisma.vehicle.findFirst({ where: { id: vehicleId, tenantId: actionSession.tenantId } })
    if (!customerExists || !vehicleExists) {
      redirect('/budgets/new')
    }

    let validChecklistId: string | null = null
    let initialStatus = 'DRAFT'

    // 2. Tenta validar se a checklist informada não está associada a nenhum outro orçamento
    if (rawChecklistId) {
      const existingChk = await prisma.checklist.findFirst({
        where: { id: rawChecklistId, tenantId: actionSession.tenantId },
        include: { budget: true }
      })
      if (existingChk && !existingChk.budget) {
        validChecklistId = existingChk.id
        if (existingChk.status === 'RECUSADO') {
          initialStatus = 'REJECTED'
        }
      }
    }

    // 3. Se não veio checklist desassociada via param, procura última vistoria do veículo que esteja livre
    if (!validChecklistId && vehicleId) {
      const availableChecklist = await prisma.checklist.findFirst({
        where: { 
          vehicleId, 
          tenantId: actionSession.tenantId,
          budget: { is: null }
        },
        orderBy: { createdAt: 'desc' }
      })
      if (availableChecklist) {
        validChecklistId = availableChecklist.id
        if (availableChecklist.status === 'RECUSADO') {
          initialStatus = 'REJECTED'
        }
      }
    }

    let createdId: string | null = null

    try {
      const newBudget = await prisma.budget.create({
        data: {
          tenantId: actionSession.tenantId,
          customerId,
          vehicleId,
          serviceType,
          checklistId: validChecklistId,
          status: initialStatus,
          totalLabor: 0,
          totalParts: 0,
          discount: 0,
          finalTotal: 0,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        }
      })
      createdId = newBudget.id
    } catch (error) {
      console.error('[Action Error - createBudget with checklistId]:', error)
      
      // Fallback: se houver qualquer erro de constraint na vistoria, cria o orçamento sem o vínculo da vistoria
      try {
        const fallbackBudget = await prisma.budget.create({
          data: {
            tenantId: actionSession.tenantId,
            customerId,
            vehicleId,
            serviceType,
            status: 'DRAFT',
            totalLabor: 0,
            totalParts: 0,
            discount: 0,
            finalTotal: 0,
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          }
        })
        createdId = fallbackBudget.id
      } catch (fallbackError) {
        console.error('[Action Critical Error - createBudget fallback]:', fallbackError)
        redirect('/budgets')
      }
    }

    revalidatePath('/budgets')
    
    if (createdId) {
      redirect(`/budgets/${createdId}`)
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
          <div className="py-8 text-center bg-neutral-50 border border-neutral-100 rounded-md space-y-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-sm text-neutral-700 font-semibold">Faltam cadastros base</p>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Para criar um orçamento, você precisa ter pelo menos 1 cliente e 1 veículo cadastrados no sistema.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              {customers.length === 0 && (
                <Link href="/customers/new" className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors">
                  + Cadastrar Cliente
                </Link>
              )}
              {vehicles.length === 0 && (
                <Link href="/vehicles/new" className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors">
                  + Cadastrar Veículo
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
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="serviceType" className="text-[13px] font-medium text-neutral-700">Tipo de Orçamento *</label>
                <select 
                  id="serviceType" 
                  name="serviceType" 
                  required
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all text-neutral-900"
                >
                  <option value="INTERNAL">Serviço Interno (Veículo na Oficina)</option>
                  <option value="EXTERNAL">Orçamento de Balcão (Apenas Cotação / Venda)</option>
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
                Criar Rascunho de Orçamento
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
