import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Sparkles } from 'lucide-react'

export default async function NewCustomerPage() {
 const session = await getSession()

 async function createCustomer(formData: FormData) {
 'use server'
 const name = formData.get('name') as string
 const email = formData.get('email') as string
 const phone = formData.get('phone') as string
 const document = formData.get('document') as string
 
 const tenant = await prisma.tenant.findFirst()
 
 if (tenant) {
 await prisma.customer.create({
 data: {
 name, email, phone, document,
 tenantId: tenant.id
 }
 })
 }
 
 revalidatePath('/customers')
 redirect('/customers')
 }

 return (
 <div className="space-y-10 animate-in fade-in duration-500 max-w-3xl mx-auto pb-12">
 <header className="flex items-center gap-4 pb-6 border-b border-neutral-200 ">
 <Link 
 href="/customers" 
 className="w-8 h-8 flex items-center justify-center rounded-md border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50 transition-colors text-neutral-600 "
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

 <div className="bg-white border border-neutral-200 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-4 md:p-8">
 <div className="flex items-center gap-4 mb-8 pb-6 border-b border-neutral-100 ">
 <div className="w-12 h-12 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-center shadow-sm">
 <User className="w-5 h-5 text-neutral-400 " />
 </div>
 <div>
 <h2 className="text-[14px] font-semibold text-neutral-900 ">Informações Pessoais</h2>
 <p className="text-[13px] text-neutral-500 mt-0.5">Dados de contato e identificação</p>
 </div>
 </div>

 <form action={createCustomer} className="space-y-6">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label htmlFor="name" className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 ">Nome Completo *</label>
 <input 
 type="text" 
 id="name" 
 name="name" 
 required
 placeholder="Ex: João Silva"
 className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-500/5 transition-all placeholder:text-neutral-400 "
 />
 </div>
 
 <div className="space-y-2">
 <label htmlFor="document" className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 ">CPF/CNPJ</label>
 <input 
 type="text" 
 id="document" 
 name="document" 
 placeholder="000.000.000-00"
 className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-500/5 transition-all placeholder:text-neutral-400 font-mono"
 />
 </div>
 
 <div className="space-y-2">
 <label htmlFor="phone" className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 ">Telefone *</label>
 <input 
 type="text" 
 id="phone" 
 name="phone" 
 required
 placeholder="(00) 00000-0000"
 className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-500/5 transition-all placeholder:text-neutral-400 font-mono"
 />
 </div>
 
 <div className="space-y-2">
 <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 ">E-mail</label>
 <input 
 type="email" 
 id="email" 
 name="email" 
 placeholder="joao@exemplo.com"
 className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-500/5 transition-all placeholder:text-neutral-400 "
 />
 </div>
 </div>

 <div className="pt-8 mt-8 border-t border-neutral-100 flex justify-end gap-3">
 <Link 
 href="/customers" 
 className="px-5 py-2.5 text-[13px] font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm"
 >
 Cancelar
 </Link>
 <button 
 type="submit"
 className="px-5 py-2.5 text-[13px] font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.08)]"
 >
 Salvar Cliente
 </button>
 </div>
 </form>
 </div>
 </div>
 )
}
