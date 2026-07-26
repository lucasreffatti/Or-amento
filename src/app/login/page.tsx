import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import Link from 'next/link'
import { ShieldAlert, LogIn, KeyRound } from 'lucide-react'

export default function LoginPage() {
 async function handleLogin(formData: FormData) {
 'use server'
 const username = formData.get('username') as string
 const password = formData.get('password') as string

 if (!username || !password) {
 return // In a real app we'd return an error state, here we keep it simple for MVP
 }

 const user = await prisma.user.findUnique({
 where: { username }
 })

 if (!user) {
 // Don't reveal user doesn't exist to prevent enumeration
 return
 }

 const passwordMatch = await bcrypt.compare(password, user.password)
 
 if (!passwordMatch) {
 return
 }

 // Passwords match, create session
 const sessionPayload = {
 userId: user.id,
 tenantId: user.tenantId,
 role: user.role,
 username: user.username,
 }

 const session = await encrypt(sessionPayload)

 const cookieStore = await cookies()
 cookieStore.set('saas_session', session, {
 httpOnly: true,
 secure: process.env.NODE_ENV === 'production',
 sameSite: 'lax',
 path: '/',
 maxAge: 60 * 60 * 24 // 24 hours
 })

 redirect('/')
 }

 return (
 <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 selection:bg-black selection:text-white ">
 <div className="max-w-md w-full bg-white dark:bg-[#111111] border border-neutral-200 dark:border-[#222222] rounded-2xl shadow-xl overflow-hidden">
 
 <div className="bg-black text-white p-8 text-center flex flex-col items-center justify-center border-b border-neutral-800">
 <div className="w-16 h-16 bg-white dark:bg-[#111111]/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
 <ShieldAlert className="w-8 h-8 text-white " />
 </div>
 <h1 className="text-2xl font-black tracking-tight">Acesso Restrito</h1>
 <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-2 font-mono tracking-wider uppercase">Portal da Oficina</p>
 </div>

 <form action={handleLogin} className="p-8 space-y-6">
 
 <div className="space-y-2">
 <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest block">Usuário</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <UserIcon className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
 </div>
 <input 
 type="text" 
 name="username"
 required
 placeholder="Ex: sergiocar"
 className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-black/50 border border-neutral-200 dark:border-[#222222] rounded-lg text-sm font-mono focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-neutral-900 dark:text-neutral-50"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest block">Senha</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <KeyRound className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
 </div>
 <input 
 type="password" 
 name="password"
 required
 placeholder="••••••••"
 className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-black/50 border border-neutral-200 dark:border-[#222222] rounded-lg text-sm font-mono focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-neutral-900 dark:text-neutral-50"
 />
 </div>
 </div>

 <button 
 type="submit" 
 className="w-full bg-black text-white font-semibold text-sm px-4 py-3.5 rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 mt-4"
 >
 <LogIn className="w-4 h-4" />
 Entrar no Sistema
 </button>

 <div className="pt-6 mt-6 border-t border-neutral-100 dark:border-[#222222]/50 text-center">
 <p className="text-sm text-neutral-500 dark:text-neutral-400">
 Não possui uma conta?{' '}
 <Link href="/register" className="text-black font-semibold hover:underline">
 Registre-se com código de acesso
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
