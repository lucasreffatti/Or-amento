'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createCustomer, updateCustomer } from '@/app/actions/customer'
import { AlertCircle, Loader2, User } from 'lucide-react'

export default function CustomerForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = initialData 
        ? await updateCustomer(initialData.id, formData)
        : await createCustomer(formData)

      if (res.success) {
        if (res.data?.redirectUrl) {
          router.push(res.data.redirectUrl)
        }
      } else {
        setError(res.message)
      }
    })
  }

  return (
    <div className="bg-white border border-neutral-200/80 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-neutral-100">
        <div className="w-12 h-12 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-center shadow-sm">
          <User className="w-5 h-5 text-neutral-400" />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-neutral-900">Informações Pessoais</h2>
          <p className="text-[13px] text-neutral-500 mt-0.5">Dados de contato e identificação</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">Nome Completo *</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              required
              defaultValue={initialData?.name ?? ''}
              disabled={isPending}
              placeholder="Ex: João Silva"
              className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-500/5 transition-all placeholder:text-neutral-400 disabled:opacity-50"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="document" className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">CPF/CNPJ</label>
            <input 
              type="text" 
              id="document" 
              name="document"
              defaultValue={initialData?.document ?? ''}
              disabled={isPending}
              placeholder="000.000.000-00"
              className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-500/5 transition-all placeholder:text-neutral-400 font-mono disabled:opacity-50"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="phone" className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">Telefone *</label>
            <input 
              type="text" 
              id="phone" 
              name="phone" 
              required
              defaultValue={initialData?.phone ?? ''}
              disabled={isPending}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-500/5 transition-all placeholder:text-neutral-400 font-mono disabled:opacity-50"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">E-mail</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              defaultValue={initialData?.email ?? ''}
              disabled={isPending}
              placeholder="joao@exemplo.com"
              className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-500/5 transition-all placeholder:text-neutral-400 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-neutral-100 flex justify-end gap-3">
          <Link 
            href={initialData ? `/customers/${initialData.id}` : "/customers"} 
            className="px-5 py-2.5 text-[13px] font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm"
          >
            Cancelar
          </Link>
          <button 
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 text-[13px] font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.08)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              initialData ? "Salvar Alterações" : "Salvar Cliente"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
