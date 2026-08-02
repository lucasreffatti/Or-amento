'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Car, ClipboardCheck, FileText, Settings, LogOut, Command, Menu, X, Monitor, Package, Receipt, Building2 } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { useScale } from '@/components/ScaleProvider'

export default function Sidebar({ user }: { user?: { username: string, role: string } }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { openWidget } = useScale()

  const menus = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/customers', icon: Users },
    { name: 'Veículos', href: '/vehicles', icon: Car },
    { name: 'Checklists', href: '/checklists', icon: ClipboardCheck },
    { name: 'Orçamentos', href: '/budgets', icon: FileText },
    { name: 'Estoque', href: '/stock', icon: Package },
    { name: 'Fornecedores', href: '/suppliers', icon: Building2 },
    { name: 'Notas Fiscais', href: '/invoices', icon: Receipt },
  ]

  return (
    <>
      {/* TopBar (Mobile Only) */}
      <div className="md:hidden flex items-center justify-between bg-[#0A0A0A] text-white p-4 border-b border-neutral-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
            <Command className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
          </div>
          <span className="text-[13px] font-semibold tracking-tight">Sérgio Car</span>
        </Link>
        <button onClick={() => setIsOpen(true)} className="p-1 hover:bg-neutral-800 rounded">
          <Menu className="w-5 h-5 text-neutral-300" />
        </button>
      </div>

      {/* Overlay for Mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-[#0A0A0A] text-neutral-300 flex flex-col h-full border-r border-neutral-800 transform transition-all duration-300 ease-in-out
        w-[260px] md:w-[72px]
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 md:p-0 md:py-6 flex items-center justify-between md:justify-center">
          <Link href="/" className="flex items-center gap-3 md:justify-center">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)] shrink-0">
              <Command className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="text-[14px] font-semibold tracking-tight text-white md:hidden">Sérgio Car</span>
          </Link>
          <button className="md:hidden p-1 text-neutral-400 hover:text-white" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-2 md:hidden">
          <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">
            Operação
          </span>
        </div>

        <nav className="flex-1 px-3 md:px-2 md:mt-4 space-y-1 overflow-y-auto mt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {menus.map((menu) => {
            const isActive = pathname === menu.href
            const Icon = menu.icon
            return (
              <Link
                key={menu.name}
                href={menu.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 md:justify-center px-3 md:px-0 py-2.5 md:py-3 text-[13px] font-medium rounded-lg transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-neutral-800/80 text-white shadow-sm ring-1 ring-neutral-700/50' 
                    : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="md:hidden">{menu.name}</span>
                
                {/* Tooltip no Desktop sem corte por overflow */}
                <span className="hidden md:block fixed left-[80px] bg-neutral-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-2xl border border-neutral-700/80 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-150 z-[100]">
                  {menu.name}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 md:p-2 border-t border-neutral-800 space-y-4 md:space-y-2 flex flex-col items-center">
          <button 
            onClick={openWidget}
            className="w-full flex items-center justify-center p-2 text-neutral-400 hover:bg-neutral-800/50 hover:text-white rounded-lg transition-colors group relative"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden md:block fixed left-[80px] bg-neutral-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-2xl border border-neutral-700/80 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-150 z-[100]">
              Escalar Tela
            </span>
          </button>

          <Link 
            href="/settings"
            className={`w-full flex items-center justify-center p-2 text-neutral-400 hover:bg-neutral-800/50 hover:text-white rounded-lg transition-colors group relative ${
              pathname === '/settings' ? 'bg-neutral-800 text-white' : ''
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:block fixed left-[80px] bg-neutral-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-2xl border border-neutral-700/80 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-150 z-[100]">
              Configurações
            </span>
          </Link>

          <form action={logout} className="w-full">
            <button 
              type="submit"
              className="w-full flex items-center justify-center p-2 text-neutral-400 hover:bg-neutral-800/50 hover:text-red-400 rounded-lg transition-colors group relative"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:block fixed left-[80px] bg-neutral-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-2xl border border-neutral-700/80 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-150 z-[100]">
                Sair
              </span>
            </button>
          </form>
        </div>
      </aside>

      {/* Spacer para reservar 72px no fluxo flex do layout desktop e evitar que o conteúdo fique sob a sidebar */}
      <div className="hidden md:block w-[72px] shrink-0 h-full" aria-hidden="true" />
    </>
  )
}
