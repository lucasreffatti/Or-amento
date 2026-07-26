import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, CheckSquare } from 'lucide-react'
import ChecklistForm from '@/components/ChecklistForm'

export default async function NewChecklistPage(props: { searchParams: Promise<{ budgetId?: string }> }) {
 const session = await getSession()
 const searchParams = await props.searchParams
 const prefillBudgetId = searchParams.budgetId

 const customers = await prisma.customer.findMany({
 where: { tenantId: session.tenantId },
 orderBy: { name: 'asc' }
 })
 
 const vehicles = await prisma.vehicle.findMany({
 where: { tenantId: session.tenantId },
 orderBy: { plate: 'asc' }
 })

 return (
 <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl">
 <header className="flex items-center gap-4 pb-4 border-b border-neutral-100 ">
 <Link 
 href={prefillBudgetId ? `/budgets/${prefillBudgetId}` : "/checklists"} 
 className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-500 "
 >
 <ArrowLeft className="w-4 h-4" />
 </Link>
 <div>
 <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Vistoria de Entrada</h1>
 <p className="text-sm text-neutral-500 mt-1">Registre o estado do veículo ao chegar na oficina.</p>
 </div>
 </header>

 <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6">
 <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-100 ">
 <div className="w-10 h-10 bg-neutral-50 rounded-full border border-neutral-200 flex items-center justify-center">
 <CheckSquare className="w-5 h-5 text-neutral-400 " />
 </div>
 <div>
 <h2 className="text-sm font-medium text-neutral-900 ">Checklist</h2>
 <p className="text-xs text-neutral-500 ">Marque as condições gerais do veículo</p>
 </div>
 </div>

 {customers.length === 0 || vehicles.length === 0 ? (
 <div className="py-8 text-center bg-neutral-50 border border-neutral-100 rounded-md">
 <p className="text-sm text-neutral-600 font-medium">Faltam cadastros base</p>
 <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
 Para criar um checklist, cadastre clientes e veículos.
 </p>
 </div>
 ) : (
 <ChecklistForm 
 customers={customers} 
 vehicles={vehicles} 
 budgetId={prefillBudgetId} 
 />
 )}
 </div>
 </div>
 )
}
