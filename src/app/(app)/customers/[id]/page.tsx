import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Car, FileText, ClipboardCheck, ArrowLeft } from 'lucide-react'

export default async function CustomerProfilePage(props: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const params = await props.params

  const customer = await prisma.customer.findUnique({
    where: {
      id: params.id,
      tenantId: session.tenantId,
    },
    include: {
      vehicles: true,
      budgets: {
        include: {
          vehicle: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      checklists: {
        include: {
          vehicle: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!customer) notFound()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/customers"
            className="p-2 -ml-2 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">{customer.name}</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Cadastrado em {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <Link
          href={`/customers/${customer.id}/edit`}
          className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-sm font-medium rounded-md hover:bg-neutral-50 transition-colors"
        >
          Editar Cadastro
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-1 md:col-span-3 bg-white border border-neutral-200 rounded-xl p-6 flex flex-wrap gap-x-12 gap-y-4">
          <div>
            <span className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-1">Telefone</span>
            <span className="text-sm font-mono text-neutral-900">{customer.phone}</span>
          </div>
          {customer.document && (
            <div>
              <span className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-1">Documento</span>
              <span className="text-sm font-mono text-neutral-900">{customer.document}</span>
            </div>
          )}
          {customer.email && (
            <div>
              <span className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-1">E-mail</span>
              <span className="text-sm text-neutral-900">{customer.email}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* VEÍCULOS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-5 h-5 text-neutral-400" />
            <h2 className="text-lg font-semibold text-neutral-900">Garagem</h2>
          </div>
          {customer.vehicles.length === 0 ? (
            <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-8 text-center text-sm text-neutral-500">
              Nenhum veículo cadastrado para este cliente.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customer.vehicles.map((v) => (
                <Link key={v.id} href={`/vehicles/${v.id}`} className="block group">
                  <div className="bg-white border border-neutral-200 rounded-xl p-5 hover:border-neutral-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-base font-semibold text-neutral-900 group-hover:text-black">{v.brand} {v.model}</span>
                      <span className="text-xs font-mono bg-neutral-100 px-2 py-1 rounded text-neutral-600">{v.year}</span>
                    </div>
                    <span className="text-sm font-mono text-neutral-500 tracking-wider">{v.plate}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ORÇAMENTOS E VISTORIAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ORÇAMENTOS */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-neutral-400" />
              <h2 className="text-lg font-semibold text-neutral-900">Orçamentos</h2>
            </div>
            {customer.budgets.length === 0 ? (
              <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-8 text-center text-sm text-neutral-500">
                Nenhum orçamento gerado.
              </div>
            ) : (
              <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
                {customer.budgets.map((b) => (
                  <Link key={b.id} href={`/budgets/${b.id}`} className="block p-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-neutral-900">Orçamento {b.id.substring(0,6).toUpperCase()}</span>
                      <span className="text-sm font-mono font-medium text-neutral-900">R$ {b.finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500">{b.vehicle.brand} {b.vehicle.model} • {b.vehicle.plate}</span>
                      <span className="text-neutral-400 font-mono">{new Date(b.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* VISTORIAS */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="w-5 h-5 text-neutral-400" />
              <h2 className="text-lg font-semibold text-neutral-900">Vistorias</h2>
            </div>
            {customer.checklists.length === 0 ? (
              <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-8 text-center text-sm text-neutral-500">
                Nenhuma vistoria registrada.
              </div>
            ) : (
              <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
                {customer.checklists.map((chk) => (
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
                      <span className="text-neutral-500">{chk.vehicle.brand} {chk.vehicle.model} • {chk.vehicle.plate}</span>
                      <span className="text-neutral-400 font-mono">{new Date(chk.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  )
}
