import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  Car, 
  FileText, 
  ClipboardCheck, 
  ArrowLeft, 
  Phone, 
  Mail, 
  FileCheck, 
  Plus, 
  MessageSquare, 
  Edit2, 
  DollarSign, 
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react'

export default async function CustomerProfilePage(props: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const params = await props.params

  const customer = await prisma.customer.findUnique({
    where: {
      id: params.id,
      tenantId: session.tenantId,
    },
    include: {
      vehicles: {
        orderBy: {
          plate: 'asc',
        },
      },
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

  // Calcular métricas
  const totalApproved = customer.budgets
    .filter((b) => b.status === 'APPROVED')
    .reduce((acc, b) => acc + b.finalTotal, 0)

  // Limpar telefone para link do WhatsApp
  const whatsappDigits = customer.phone.replace(/\D/g, '')
  const whatsappUrl = `https://wa.me/55${whatsappDigits}?text=Ol%C3%A1%20${encodeURIComponent(customer.name)}%2C%20tudo%20bem%3F%20Falando%20da%20Auto%20El%C3%A9trica%20S%C3%A9rgio%20Car.`

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* NAVEGAÇÃO E AÇÕES RÁPIDAS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200/60">
        <div className="flex items-center gap-4">
          <Link 
            href="/customers"
            className="w-10 h-10 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Ficha 360° do Cliente
              </span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{customer.name}</h1>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Cadastrado em {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO RÁPIDA NA CABEÇA DA FICHA */}
        <div className="flex flex-wrap items-center gap-2">
          {whatsappDigits && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5 min-h-[40px]"
            >
              <MessageSquare className="w-4 h-4 fill-white" /> WhatsApp
            </a>
          )}
          <Link
            href="/reception"
            className="bg-black text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-1.5 min-h-[40px]"
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-400" /> Nova Vistoria
          </Link>
          <Link
            href={`/vehicles/new?customerId=${customer.id}`}
            className="bg-white border border-neutral-200 text-neutral-800 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition-all shadow-sm flex items-center gap-1.5 min-h-[40px]"
          >
            <Plus className="w-4 h-4 text-neutral-500" /> + Veículo
          </Link>
          <Link
            href={`/customers/${customer.id}/edit`}
            className="bg-white border border-neutral-200 text-neutral-600 px-3 py-2 rounded-xl text-xs font-medium hover:bg-neutral-50 transition-all min-h-[40px] flex items-center justify-center"
          >
            <Edit2 className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS E DADOS DE CONTATO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block">Telefone</span>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-mono font-semibold text-neutral-900">{customer.phone}</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block">Documento (CPF/CNPJ)</span>
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-mono font-semibold text-neutral-900">{customer.document || 'Não informado'}</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block">Garagem de Veículos</span>
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-purple-600" />
            <span className="text-lg font-bold text-neutral-900">{customer.vehicles.length} veículo(s)</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block">Total Investido (Serviços)</span>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span className="text-lg font-bold text-emerald-600 font-mono">
              R$ {totalApproved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE GARAGEM DO CLIENTE */}
      <section className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Garagem do Cliente</h2>
              <p className="text-xs text-neutral-500">Veículos vinculados a este proprietário.</p>
            </div>
          </div>

          <Link
            href={`/vehicles/new?customerId=${customer.id}`}
            className="text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Veículo
          </Link>
        </div>

        {customer.vehicles.length === 0 ? (
          <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-8 text-center text-sm text-neutral-500">
            Nenhum veículo cadastrado para este cliente.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customer.vehicles.map((v) => (
              <div 
                key={v.id} 
                className="bg-neutral-50/60 border border-neutral-200/80 rounded-xl p-5 hover:border-neutral-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-base font-semibold text-neutral-900">{v.brand} {v.model}</span>
                    <span className="text-xs font-mono bg-white border border-neutral-200 px-2 py-0.5 rounded text-neutral-700 font-bold">{v.year}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono bg-neutral-900 text-white font-bold px-2 py-0.5 rounded tracking-widest">{v.plate}</span>
                    <span className="text-xs text-neutral-500">{v.engineType}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-neutral-200/50">
                  <Link
                    href={`/reception`}
                    className="flex-1 text-center bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-800 text-[11px] font-semibold py-2 rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" /> Vistoriar
                  </Link>
                  <Link
                    href={`/budgets/new?customerId=${customer.id}&vehicleId=${v.id}`}
                    className="flex-1 text-center bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-800 text-[11px] font-semibold py-2 rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" /> Orçamento
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* HISTÓRICO DE VISTORIAS E ORÇAMENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* VISTORIAS E CHECKLISTS */}
        <section className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Histórico de Vistorias</h2>
            </div>
            <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
              {customer.checklists.length}
            </span>
          </div>

          {customer.checklists.length === 0 ? (
            <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-8 text-center text-xs text-neutral-500">
              Nenhuma vistoria registrada para este cliente.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {customer.checklists.map((chk) => (
                <div key={chk.id} className="py-3.5 flex items-center justify-between hover:bg-neutral-50/60 p-2 rounded-lg transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900">Vistoria #{chk.id.substring(0,6).toUpperCase()}</span>
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        chk.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-800' :
                        chk.status === 'RECUSADO' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {chk.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {chk.vehicle.brand} {chk.vehicle.model} ({chk.vehicle.plate}) • Tanque {chk.fuelLevel}%
                    </p>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      {new Date(chk.createdAt).toLocaleDateString('pt-BR')} às {new Date(chk.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <Link
                    href={`/checklists/${chk.id}`}
                    className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-200/60 rounded-lg transition-colors"
                    title="Visualizar Vistoria"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ORÇAMENTOS E SERVIÇOS */}
        <section className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Histórico de Orçamentos</h2>
            </div>
            <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
              {customer.budgets.length}
            </span>
          </div>

          {customer.budgets.length === 0 ? (
            <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-8 text-center text-xs text-neutral-500">
              Nenhum orçamento gerado para este cliente.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {customer.budgets.map((b) => (
                <div key={b.id} className="py-3.5 flex items-center justify-between hover:bg-neutral-50/60 p-2 rounded-lg transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900">Orçamento #{b.id.substring(0,6).toUpperCase()}</span>
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        b.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        b.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Veículo: {b.vehicle.brand} {b.vehicle.model} ({b.vehicle.plate})
                    </p>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      {new Date(b.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-neutral-900">
                      R$ {b.finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <Link
                      href={`/budgets/${b.id}`}
                      className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-200/60 rounded-lg transition-colors"
                      title="Abrir Orçamento"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
