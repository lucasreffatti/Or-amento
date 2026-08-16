'use client'

import { useState, useTransition, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, LogIn, KeyRound, User, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { loginAction } from '@/app/actions/auth'

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await loginAction(formData)
      if (res.success) {
        router.push('/')
        router.refresh()
      } else {
        setErrorMessage(res.error || 'Erro ao realizar login.')
      }
    })
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 selection:bg-black selection:text-white">
      <div className="max-w-md w-full bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden">
        
        <div className="bg-black text-white p-8 text-center flex flex-col items-center justify-center border-b border-neutral-800">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Acesso Restrito</h1>
          <p className="text-neutral-400 text-sm mt-2 font-mono tracking-wider uppercase">Portal da Oficina</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          
          {registered && !errorMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-3 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Conta cadastrada com sucesso!</p>
                <p className="text-xs text-emerald-700 mt-0.5">Faça login com seu usuário e senha criados.</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Falha na autenticação</p>
                <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block">Usuário</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-neutral-400" />
              </div>
              <input 
                type="text" 
                name="username"
                required
                disabled={isPending}
                placeholder="Ex: sergiocar"
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-neutral-900 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-4 w-4 text-neutral-400" />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password"
                required
                disabled={isPending}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-neutral-900 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-black text-white font-semibold text-sm px-4 py-3.5 rounded-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.99]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Entrando no Sistema...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Entrar no Sistema
              </>
            )}
          </button>

          <div className="pt-6 mt-6 border-t border-neutral-100 text-center">
            <p className="text-sm text-neutral-500">
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-neutral-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  )
}
