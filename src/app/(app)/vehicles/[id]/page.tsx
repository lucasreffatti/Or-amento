import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FileText, ClipboardCheck, ArrowLeft, User } from 'lucide-react'

export default async function VehicleProfilePage(props: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const params = await props.params

  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id: params.id,
      tenantId: session.tenantId,
    },
    include: {
      customer: true,
      budgets: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      checklists: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!vehicle) notFound()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/vehicles"
            className="p-2 -ml-2 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">{vehicle.brand} {vehicle.model}</h1>
              <span className="font-mono text-neutral-700 font-bold tracking-widest text-[13px] bg-white border border-neutral-200 px-2 py-1 rounded-md shadow-sm">
                {vehicle.plate}
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              Ano: {vehicle.year}
            </p>
          </div>
        </div>
        <Link
          href={`/vehicles/new`}
          className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-sm font-medium rounded-md hover:bg-neutral-50 transition-colors"
        >
          Novo Veículo
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href={`/customers/${vehicle.customerId}`} className="col-span-1 md:col-span-3 bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors group flex items-start gap-4">
          <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 group-hover:text-neutral-900 group-hover:bg-neutral-200 transition-colors">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-1">Proprietário</span>
            <span className="text-base font-medium text-neutral-900 group-hover:underline">{vehicle.customer.name}</span>
            <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500 font-mono">
              <span>{vehicle.customer.phone}</span>
              {vehicle.customer.document && <span>{vehicle.customer.document}</span>}
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* VISTORIAS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="w-5 h-5 text-neutral-400" />
            <h2 className="text-lg font-semibold text-neutral-900">Histórico de Vistorias</h2>
          </div>
          {vehicle.checklists.length === 0 ? (
            <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-8 text-center text-sm text-neutral-500">
              Nenhuma vistoria registrada para este veículo.
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
              {vehicle.checklists.map((chk) => (
                <Link key={chk.id} href={`/checklists/${chk.id}`} className="block p-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-neutral-900">Vistoria {chk.id.substring(0,6).toUpperCase()}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                      chk.status === 'APROVADO' ? 'bg-emerald-50 text-emerald-600' :
                      chk.status === 'RECUSADO' ? 'bg-red-50 text-red-600' :
                      'bg-yellow-50 text-yellow-600'
                    }`}>
                      {chk.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500 font-mono">{new Date(chk.createdAt).toLocaleDateString('pt-BR')}</span>
                    <span className="text-neutral-400">{new Date(chk.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ORÇAMENTOS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-neutral-400" />
            <h2 className="text-lg font-semibold text-neutral-900">Histórico de Orçamentos</h2>
          </div>
          {vehicle.budgets.length === 0 ? (
            <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-8 text-center text-sm text-neutral-500">
              Nenhum orçamento gerado para este veículo.
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
              {vehicle.budgets.map((b) => (
                <Link key={b.id} href={`/budgets/${b.id}`} className="block p-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-neutral-900">Orçamento {b.id.substring(0,6).toUpperCase()}</span>
                    <span className="text-sm font-mono font-medium text-neutral-900">R$ {b.finalTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                      b.status === 'APPROVED' ? 'text-emerald-600' :
                      b.status === 'REJECTED' ? 'text-red-600' :
                      b.status === 'DRAFT' ? 'text-neutral-400' :
                      'text-blue-600'
                    }`}>
                      {b.status}
                    </span>
                    <span className="text-neutral-400 font-mono">{new Date(b.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
