import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Plus, CheckCircle2, Search } from 'lucide-react'
import { ChecklistRow } from '@/components/ChecklistRow'

export default async function ChecklistsPage() {
  const session = await getSession()
  const checklists = await prisma.checklist.findMany({
    where: { tenantId: session.tenantId },
    include: { vehicle: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-300">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/60 shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Checklists</h1>
          <p className="text-sm text-neutral-500 mt-1">Registros de inspeção veicular de entrada.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Buscar por placa..." 
              className="pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all w-full sm:w-64 shadow-sm"
            />
          </div>
          <Link 
            href="/checklists/new" 
            className="bg-neutral-900 text-white px-4 py-2.5 text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm flex items-center justify-center gap-2 min-h-[44px] shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Checklist
          </Link>
        </div>
      </header>

      <div className="flex-1 border border-neutral-200 bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
        {checklists.length === 0 ? (
          <div className="my-auto py-12 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center mb-3 border border-neutral-200 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-neutral-400" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900">Nenhum checklist</h3>
            <p className="text-sm text-neutral-500 mt-1 max-w-sm">
              Não há checklists de entrada registrados. Você pode criar checklists para formalizar o estado do veículo na recepção.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden flex-1">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead className="bg-neutral-50/50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-neutral-500 text-[11px] uppercase tracking-wider whitespace-nowrap">ID</th>
                  <th className="px-5 py-3 font-semibold text-neutral-500 text-[11px] uppercase tracking-wider whitespace-nowrap">Veículo</th>
                  <th className="px-5 py-3 font-semibold text-neutral-500 text-[11px] uppercase tracking-wider whitespace-nowrap">Nível Combustível</th>
                  <th className="px-5 py-3 font-semibold text-neutral-500 text-[11px] uppercase tracking-wider text-right whitespace-nowrap">Data Inspeção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {checklists.map((c) => (
                  <ChecklistRow key={c.id} checklist={c} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
