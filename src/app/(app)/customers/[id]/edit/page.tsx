import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'

export default async function EditCustomerPage(props: { params: Promise<{ id: string }> }) {
 const params = await props.params;
 const session = await getSession()

 const customer = await prisma.customer.findUnique({
 where: { 
 id: params.id,
 tenantId: session.tenantId
 }
 })

 if (!customer) {
 notFound()
 }

 async function updateCustomer(formData: FormData) {
 'use server'
 const name = formData.get('name') as string
 const email = formData.get('email') as string
 const phone = formData.get('phone') as string
 const document = formData.get('document') as string
 
 const session = await getSession()
 
 await prisma.customer.update({
 where: { 
 id: params.id,
 tenantId: session.tenantId
 },
 data: {
 name, email, phone, document,
 }
 })
 
 revalidatePath('/customers')
 redirect('/customers')
 }

 return (
 <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
 <header className="flex items-center gap-4 pb-4 border-b border-neutral-100 ">
 <Link 
 href="/customers" 
 className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-500 "
 >
 <ArrowLeft className="w-4 h-4" />
 </Link>
 <div>
 <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Editar Cliente</h1>
 <p className="text-sm text-neutral-500 mt-1">Atualize os dados cadastrais do cliente.</p>
 </div>
 </header>

 <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6">
 <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-100 ">
 <div className="w-10 h-10 bg-neutral-50 rounded-full border border-neutral-200 flex items-center justify-center">
 <User className="w-5 h-5 text-neutral-400 " />
 </div>
 <div>
 <h2 className="text-sm font-medium text-neutral-900 ">Informações Pessoais</h2>
 <p className="text-xs text-neutral-500 ">Dados de contato e identificação</p>
 </div>
 </div>

 <form action={updateCustomer} className="space-y-5">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
 <div className="space-y-1.5">
 <label htmlFor="name" className="text-[13px] font-medium text-neutral-700 ">Nome Completo *</label>
 <input 
 type="text" 
 id="name" 
 name="name" 
 required
 defaultValue={customer.name}
 placeholder="Ex: João Silva"
 className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all placeholder:text-neutral-400 "
 />
 </div>
 
 <div className="space-y-1.5">
 <label htmlFor="document" className="text-[13px] font-medium text-neutral-700 ">CPF/CNPJ</label>
 <input 
 type="text" 
 id="document" 
 name="document" 
 defaultValue={customer.document || ''}
 placeholder="000.000.000-00"
 className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all placeholder:text-neutral-400 font-mono"
 />
 </div>
 
 <div className="space-y-1.5">
 <label htmlFor="phone" className="text-[13px] font-medium text-neutral-700 ">Telefone *</label>
 <input 
 type="text" 
 id="phone" 
 name="phone" 
 required
 defaultValue={customer.phone}
 placeholder="(00) 00000-0000"
 className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all placeholder:text-neutral-400 font-mono"
 />
 </div>
 
 <div className="space-y-1.5">
 <label htmlFor="email" className="text-[13px] font-medium text-neutral-700 ">E-mail</label>
 <input 
 type="email" 
 id="email" 
 name="email" 
 defaultValue={customer.email || ''}
 placeholder="joao@exemplo.com"
 className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all placeholder:text-neutral-400 "
 />
 </div>
 </div>

 <div className="pt-6 mt-6 border-t border-neutral-100 flex justify-end gap-3">
 <Link 
 href="/customers" 
 className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
 >
 Cancelar
 </Link>
 <button 
 type="submit"
 className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition-colors shadow-sm"
 >
 Salvar Alterações
 </button>
 </div>
 </form>
 </div>
 </div>
 )
}
