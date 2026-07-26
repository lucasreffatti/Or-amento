import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import Link from 'next/link'
import { ShieldAlert, UserPlus, KeyRound, Lock, Tag } from 'lucide-react'

export default function RegisterPage() {
 async function handleRegister(formData: FormData) {
 'use server'
 const name = formData.get('name') as string
 const username = formData.get('username') as string
 const password = formData.get('password') as string
 const accessCode = formData.get('accessCode') as string

 if (!name || !username || !password || !accessCode) {
 return
 }

 // Validação estrita do código no servidor (Nunca vai pro frontend)
 const SECRET_ACCESS_CODE = 'Lucas15032003.'
 
 if (accessCode !== SECRET_ACCESS_CODE) {
 // Simplesmente retorna, sem vazamento de stacktrace ou dicas
 return
 }

 // Verifica se username já existe
 const existing = await prisma.user.findUnique({
 where: { username }
 })

 if (existing) {
 return
 }

 // Assumindo que a oficina principal é a tenant-1 (Para o MVP)
 const tenantId = 'tenant-1'

 const passwordHash = await bcrypt.hash(password, 12)

 await prisma.user.create({
 data: {
 name,
 username,
 password: passwordHash,
 role: 'USER',
 tenantId
 }
 })

 redirect('/login')
 }

 return (
 <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 selection:bg-black selection:text-white ">
 <div className="max-w-md w-full bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden">
 
 <div className="bg-black text-white p-8 text-center flex flex-col items-center justify-center border-b border-neutral-800">
 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
 <UserPlus className="w-8 h-8 text-white " />
 </div>
 <h1 className="text-2xl font-black tracking-tight">Novo Acesso</h1>
 <p className="text-neutral-400 text-sm mt-2 font-mono tracking-wider uppercase">Requer Código de Autorização</p>
 </div>

 <form action={handleRegister} className="p-8 space-y-5">
 
 <div className="space-y-1.5">
 <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block">Nome Completo</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Tag className="h-4 w-4 text-neutral-400 " />
 </div>
 <input 
 type="text" 
 name="name"
 required
 placeholder="Seu nome"
 className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-neutral-900 "
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block">Usuário de Acesso</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <UserIcon className="h-4 w-4 text-neutral-400 " />
 </div>
 <input 
 type="text" 
 name="username"
 required
 placeholder="Ex: joaomecanico"
 className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-neutral-900 "
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block">Senha</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <KeyRound className="h-4 w-4 text-neutral-400 " />
 </div>
 <input 
 type="password" 
 name="password"
 required
 placeholder="••••••••"
 className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-neutral-900 "
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-[11px] font-bold text-red-500 uppercase tracking-widest block flex items-center gap-1">
 <Lock className="w-3 h-3" />
 Código de Acesso
 </label>
 <div className="relative">
 <input 
 type="password" 
 name="accessCode"
 required
 placeholder="Código fornecido pelo administrador"
 className="w-full px-4 py-3 bg-red-50/50 border border-red-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-red-900 placeholder:text-red-300"
 />
 </div>
 </div>

 <button 
 type="submit" 
 className="w-full bg-black text-white font-semibold text-sm px-4 py-3.5 rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 mt-4"
 >
 <ShieldAlert className="w-4 h-4" />
 Validar e Criar Conta
 </button>

 <div className="pt-6 mt-6 border-t border-neutral-100 text-center">
 <p className="text-sm text-neutral-500 ">
 Já tem cadastro?{' '}
 <Link href="/login" className="text-black font-semibold hover:underline">
 Voltar para o Login
 </Link>
 </p>
 </div>
 </form>
 </div>
 </div>
 )
}

function UserIcon(props: any) {
 return (
 <svg
 {...props}
 xmlns="http://www.w3.org/2000/svg"
 width="24"
 height="24"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 >
 <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
 <circle cx="12" cy="7" r="4" />
 </svg>
 )
}
