import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, CheckSquare } from 'lucide-react'
import ChecklistForm from '@/components/ChecklistForm'
import { notFound } from 'next/navigation'

export default async function EditChecklistPage(props: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const params = await props.params

  const checklist = await prisma.checklist.findUnique({
    where: { 
      id: params.id,
      tenantId: session.tenantId 
    }
  })

  if (!checklist) notFound()

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
      <header className="flex items-center gap-4 pb-4 border-b border-neutral-100">
        <Link 
          href={`/checklists/${checklist.id}`} 
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-500"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Editar Vistoria</h1>
          <p className="text-sm text-neutral-500 mt-1">Modifique o estado do veículo ou detalhes da inspeção.</p>
        </div>
      </header>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-100">
          <div className="w-10 h-10 bg-neutral-50 rounded-full border border-neutral-200 flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-neutral-400" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-neutral-900">Checklist #{checklist.id.substring(0,6)}</h2>
            <p className="text-xs text-neutral-500">Altere as condições marcadas</p>
          </div>
        </div>

        <ChecklistForm 
          customers={customers} 
          vehicles={vehicles} 
          initialData={checklist}
        />
      </div>
    </div>
  )
}
