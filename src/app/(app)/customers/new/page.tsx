import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'
import CustomerForm from '@/components/CustomerForm'

export default async function NewCustomerPage() {
  await getSession() // Apenas para checar se logado

  return (
    <div className="space-y-10 animate-in fade-in duration-500 w-full pb-12">
      <header className="flex items-center gap-4 pb-6 border-b border-neutral-200/60">
        <Link 
          href="/customers" 
          className="w-8 h-8 flex items-center justify-center rounded-md border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50 transition-colors text-neutral-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
              <User className="w-3 h-3" /> Cadastro
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Novo Cliente</h1>
          <p className="text-[13px] text-neutral-500 mt-1">Adicione um novo cliente à base de dados.</p>
        </div>
      </header>

      <CustomerForm />
    </div>
  )
}

