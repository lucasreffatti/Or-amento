import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, Sparkles, ClipboardCheck } from 'lucide-react'
import UnifiedReceptionForm from '@/components/UnifiedReceptionForm'

export default async function ReceptionPage() {
  const session = await getSession()

  const customers = await prisma.customer.findMany({
    where: { tenantId: session.tenantId },
    include: {
      vehicles: {
        select: {
          id: true,
          plate: true,
          brand: true,
          model: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/60">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50 transition-colors text-neutral-600 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Fluxo Rápido • Tudo na Mesma Tela
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Nova Recepção Veicular</h1>
            <p className="text-[13px] text-neutral-500 mt-0.5">Cadastre o Cliente, Veículo e Vistoria de Entrada de uma só vez.</p>
          </div>
        </div>
      </header>

      <UnifiedReceptionForm existingCustomers={customers} />
    </div>
  )
}
