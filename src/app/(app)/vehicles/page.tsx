import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Plus, Car, Search, Sparkles } from 'lucide-react'
import { DeleteButton } from '@/components/DeleteButton'
import { deleteVehicle } from '@/app/actions/delete'

export default async function VehiclesPage() {
  const session = await getSession()
  const vehicles = await prisma.vehicle.findMany({
    where: { tenantId: session.tenantId },
    include: { customer: true }
  })

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-4">
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Buscar placa ou cliente..." 
              className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all w-full sm:w-64 shadow-sm"
            />
          </div>
          <Link 
            href="/vehicles/new" 
            className="bg-neutral-900 text-white px-4 py-2 text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2 h-[38px] shrink-0"
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200/80 text-left text-sm">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Placa</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Modelo / Marca</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Proprietário</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-neutral-50/80 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/vehicles/${v.id}`} className="hover:opacity-80">
                        <span className="font-mono text-neutral-900 font-bold tracking-widest text-[13px] bg-neutral-100 border border-neutral-200/80 px-2.5 py-1 rounded-md shadow-sm">
                          {v.plate}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-neutral-900 font-medium text-[13px] whitespace-nowrap">
                      {v.brand} {v.model} <span className="text-neutral-400 text-xs font-normal ml-1">({v.year})</span>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 text-[13px] whitespace-nowrap">
                      {v.customer && (
                        <Link href={`/customers/${v.customer.id}`} className="hover:underline hover:text-neutral-900 transition-colors">
                          {v.customer.name}
                        </Link>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <DeleteButton 
                        id={v.id} 
                        action={deleteVehicle} 
                        entityName="este veículo" 
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 inline-flex" 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
