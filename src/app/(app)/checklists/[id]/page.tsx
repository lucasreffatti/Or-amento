import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, FileText, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react'

export default async function ChecklistViewPage(props: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const params = await props.params
  
  const checklist = await prisma.checklist.findUnique({
    where: { 
      id: params.id,
      tenantId: session.tenantId
    },
    include: {
      customer: true,
      vehicle: true,
      budget: true
    }
  })

  if (!checklist) notFound()

  let itemsStatus: Record<string, string> = {}
  try {
    itemsStatus = JSON.parse(checklist.itemsStatus as string)
  } catch (e) {}

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12 max-w-4xl">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link 
              href="/checklists" 
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="bg-neutral-100 text-neutral-600 border border-neutral-200 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
              Checklist #{checklist.id.substring(0,6)}
            </span>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Vistoria de {checklist.vehicle.plate}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Realizada em {new Date(checklist.createdAt).toLocaleDateString('pt-BR')} às {new Date(checklist.createdAt).toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-2">
          {checklist.budget ? (
            <Link 
              href={`/budgets/${checklist.budget.id}`}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[13px] font-medium hover:bg-indigo-100 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Ver Orçamento
            </Link>
          ) : (
            <Link 
              href={`/budgets/new?vehicleId=${checklist.vehicleId}&customerId=${checklist.customerId}`}
              className="px-4 py-2 bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-md text-[13px] font-medium hover:bg-neutral-100 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Criar Orçamento
            </Link>
          )}
          <Link 
            href={`/print/checklists/${checklist.id}`}
            target="_blank"
            className="px-4 py-2 bg-neutral-900 text-white rounded-md text-[13px] font-medium hover:bg-neutral-800 transition-colors shadow-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Imprimir Vistoria
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-neutral-200 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden p-5">
            <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-4">Dados Básicos</h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-[11px] text-neutral-400 block mb-0.5">Cliente</span>
                <span className="text-[13px] font-medium text-neutral-900">{checklist.customer.name}</span>
                <span className="text-[12px] text-neutral-500 block">{checklist.customer.phone}</span>
              </div>
              
              <div>
                <span className="text-[11px] text-neutral-400 block mb-0.5">Veículo</span>
                <span className="text-[13px] font-medium text-neutral-900">{checklist.vehicle.brand} {checklist.vehicle.model}</span>
                <span className="text-[12px] font-mono text-neutral-500 block">{checklist.vehicle.plate} • {checklist.vehicle.year}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden p-5">
            <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-4">Combustível</h3>
            <div className="flex flex-col items-center">
              <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden mb-2 border border-neutral-200/50">
                <div 
                  className="h-full bg-neutral-800 rounded-full" 
                  style={{ width: `${checklist.fuelLevel}%` }}
                />
              </div>
              <div className="w-full flex justify-between text-[10px] font-medium text-neutral-400 font-mono">
                <span>E</span>
                <span>1/2</span>
                <span>F</span>
              </div>
              <div className="mt-3 text-2xl font-semibold text-neutral-900 font-mono tracking-tight">
                {checklist.fuelLevel}%
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white border border-neutral-200 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-neutral-100 bg-neutral-50/50">
              <h2 className="text-[13px] font-semibold text-neutral-900 tracking-tight">Status de Itens</h2>
            </div>
            
            <table className="min-w-full divide-y divide-neutral-100 text-left text-sm">
              <tbody className="divide-y divide-neutral-50 bg-white">
                {Object.entries(itemsStatus).map(([item, status]) => (
                  <tr key={item} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-neutral-800 text-[13px] font-medium">{item}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide shadow-sm ${
                        status === 'OK' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        status === 'AVARIA' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-neutral-100 text-neutral-600 border border-neutral-200'
                      }`}>
                        {status === 'OK' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {status === 'AVARIA' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {status === 'N/A' && <HelpCircle className="w-3.5 h-3.5" />}
                        {status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
