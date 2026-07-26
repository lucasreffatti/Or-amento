import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Plus, Users, Search, Edit2, Sparkles } from 'lucide-react'
import { DeleteButton } from '@/components/DeleteButton'
import { deleteCustomer } from '@/app/actions/delete'

export default async function CustomersPage() {
  const session = await getSession()
  const customers = await prisma.customer.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200/60">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
              <Users className="w-3 h-3" /> Base
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Clientes</h1>
          <p className="text-[13px] text-neutral-500 mt-1">Gerencie a base de clientes da oficina.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-500/5 transition-all w-64 shadow-sm"
            />
          </div>
          <Link 
            href="/customers/new" 
            className="bg-neutral-900 text-white px-4 py-2 text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center gap-2 h-[38px]"
          >
            <Plus className="w-4 h-4" /> Novo Cliente
          </Link>
        </div>
      </header>

      <div className="border border-neutral-200/80 bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center bg-neutral-50/30">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 border border-neutral-200 shadow-sm">
              <Users className="w-5 h-5 text-neutral-400" />
            </div>
            <h3 className="text-[14px] font-semibold text-neutral-900">Nenhum cliente</h3>
            <p className="text-[13px] text-neutral-500 mt-1.5 max-w-sm leading-relaxed">
              Você ainda não tem clientes cadastrados. Adicione o primeiro cliente para começar a gerar orçamentos.
            </p>
            <Link 
              href="/customers/new" 
              className="mt-6 bg-white border border-neutral-200 text-neutral-900 px-5 py-2.5 text-[13px] font-medium rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-neutral-400" /> Cadastrar Cliente
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200/80 text-left text-sm">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Nome</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Telefone</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Documento</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Cadastrado em</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors group">
                    <td className="px-6 py-4 font-medium text-neutral-900 text-[13px] whitespace-nowrap">
                      <Link href={`/customers/${c.id}`} className="hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 font-mono text-[13px] whitespace-nowrap">{c.phone}</td>
                    <td className="px-6 py-4 text-neutral-500 font-mono text-[13px] whitespace-nowrap">{c.document || '-'}</td>
                    <td className="px-6 py-4 text-neutral-400 font-mono text-[12px] whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2 whitespace-nowrap">
                      <Link 
                        href={`/customers/${c.id}/edit`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <DeleteButton 
                        id={c.id} 
                        action={deleteCustomer} 
                        entityName="este cliente" 
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100" 
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
