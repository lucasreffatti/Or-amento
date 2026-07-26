import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Plus, CheckCircle2, Search } from 'lucide-react'

export default async function ChecklistsPage() {
  const session = await getSession()
  const checklists = await prisma.checklist.findMany({
    where: { tenantId: session.tenantId },
    include: { vehicle: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Checklists</h1>
          <p className="text-sm text-neutral-500 mt-1">Registros de inspeção veicular de entrada.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Buscar checklist..." 
              className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 transition-colors w-64"
            />
          </div>
          <button 
            className="bg-neutral-900 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-neutral-800 transition-colors shadow-sm flex items-center gap-2 opacity-50 cursor-not-allowed"
            title="Em breve"
          >
            <Plus className="w-4 h-4" /> Novo Checklist
          </button>
        </div>
      </header>

      <div className="border border-neutral-200 bg-white rounded-lg shadow-sm overflow-hidden">
        {checklists.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mb-4 border border-neutral-100">
              <CheckCircle2 className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900">Nenhum checklist</h3>
            <p className="text-sm text-neutral-500 mt-1 max-w-sm">
              Não há checklists de entrada registrados. Você pode criar checklists para formalizar o estado do veículo na recepção.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
            <thead className="bg-neutral-50/50">
              <tr>
                <th className="px-5 py-3 font-semibold text-neutral-500 text-[11px] uppercase tracking-wider">ID</th>
                <th className="px-5 py-3 font-semibold text-neutral-500 text-[11px] uppercase tracking-wider">Veículo</th>
                <th className="px-5 py-3 font-semibold text-neutral-500 text-[11px] uppercase tracking-wider">Nível Combustível</th>
                <th className="px-5 py-3 font-semibold text-neutral-500 text-[11px] uppercase tracking-wider text-right">Data Inspeção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {checklists.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors group cursor-pointer">
                  <td className="px-5 py-3.5 font-mono text-neutral-500 text-xs">#{c.id.substring(0,6)}</td>
                  <td className="px-5 py-3.5 text-neutral-900 font-medium">
                    {c.vehicle.plate} <span className="text-neutral-400 text-xs font-normal">({c.vehicle.model})</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-neutral-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-neutral-400 rounded-full" 
                          style={{ width: `${c.fuelLevel}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-neutral-500">{c.fuelLevel}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-400 font-mono text-[11px] text-right">
                    {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
