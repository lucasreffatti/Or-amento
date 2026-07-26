import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Plus, Car, Search, Sparkles } from 'lucide-react'

export default async function VehiclesPage() {
  const session = await getSession()
  const vehicles = await prisma.vehicle.findMany({
    where: { tenantId: session.tenantId },
    include: { customer: true }
  })

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200/60">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
              <Car className="w-3 h-3" /> Frota
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Veículos</h1>
          <p className="text-[13px] text-neutral-500 mt-1">Gerencie a frota de veículos atendida na oficina.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Buscar placa..." 
              className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all w-64 shadow-sm"
            />
          </div>
          <Link 
            href="/vehicles/new"
            className="bg-neutral-900 text-white px-4 py-2 text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center gap-2 h-[38px]"
          >
            <Plus className="w-4 h-4" /> Novo Veículo
          </Link>
        </div>
      </header>

      <div className="border border-neutral-200/80 bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        {vehicles.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center bg-neutral-50/30">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 border border-neutral-200 shadow-sm">
              <Car className="w-5 h-5 text-neutral-400" />
            </div>
            <h3 className="text-[14px] font-semibold text-neutral-900">Nenhum veículo</h3>
            <p className="text-[13px] text-neutral-500 mt-1.5 max-w-sm leading-relaxed">
              Você ainda não tem veículos cadastrados. Os veículos são normalmente cadastrados junto ao perfil do cliente.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-neutral-200/80 text-left text-sm">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100">Placa</th>
                <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100">Modelo / Marca</th>
                <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100">Proprietário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-neutral-50/80 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <span className="font-mono text-neutral-900 font-bold tracking-widest text-[13px] bg-neutral-100 border border-neutral-200/80 px-2.5 py-1 rounded-md shadow-sm">
                      {v.plate}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-900 font-medium text-[13px]">
                    {v.brand} {v.model} <span className="text-neutral-400 text-xs font-normal ml-1">({v.year})</span>
                  </td>
                  <td className="px-6 py-4 text-neutral-500 text-[13px]">{v.customer?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
