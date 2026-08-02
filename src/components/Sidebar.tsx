'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Car, ClipboardCheck, FileText, Settings, LogOut, Command, Menu, X, Monitor } from 'lucide-react'
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
                title={menu.name}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 md:justify-center px-3 md:px-0 py-2.5 md:py-3 text-[13px] font-medium rounded-lg transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-neutral-800/80 text-white shadow-sm ring-1 ring-neutral-700/50' 
                    : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="md:hidden">{menu.name}</span>
                
                {/* Tooltip on Desktop */}
                <span className="hidden md:block absolute left-14 bg-neutral-800 text-white text-[11px] font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                  {menu.name}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 md:p-2 border-t border-neutral-800 space-y-4 md:space-y-2 flex flex-col items-center">
          <nav className="w-full space-y-1">
            <button 
              type="button"
              onClick={() => { openWidget(); setIsOpen(false); }}
              title="Ajustar Densidade da Tela"
              className="flex items-center gap-3 md:justify-center w-full px-3 md:px-0 py-2.5 md:py-3 text-[13px] font-medium text-neutral-400 rounded-lg hover:bg-neutral-800/50 hover:text-neutral-200 transition-colors group relative"
            >
              <Monitor className="w-4 h-4 shrink-0 text-indigo-400 group-hover:text-indigo-300" strokeWidth={2} />
              <span className="md:hidden">Densidade da Tela</span>
              
              <span className="hidden md:block absolute left-14 bg-neutral-800 text-white text-[11px] font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                Densidade da Tela
              </span>
            </button>

            <Link 
              href="/settings" 
              title="Configurações"
              onClick={() => setIsOpen(false)} 
              className="flex items-center gap-3 md:justify-center w-full px-3 md:px-0 py-2.5 md:py-3 text-[13px] font-medium text-neutral-400 rounded-lg hover:bg-neutral-800/50 hover:text-neutral-200 transition-colors group relative"
            >
              <Settings className="w-4 h-4 shrink-0 text-neutral-500 group-hover:text-neutral-300" strokeWidth={2} />
              <span className="md:hidden">Configurações</span>
              
              <span className="hidden md:block absolute left-14 bg-neutral-800 text-white text-[11px] font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                Configurações
              </span>
            </Link>
          </nav>

          
          <div className="flex items-center space-x-3 md:space-x-0 md:justify-center w-full px-3 md:px-0 py-2 md:py-2 rounded-lg bg-neutral-800/30 md:bg-transparent border border-neutral-800/50 md:border-transparent group relative">
            <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-tr from-neutral-700 to-neutral-500 text-white flex items-center justify-center text-[10px] font-bold shadow-inner uppercase cursor-help">
              {user?.username ? user.username.substring(0, 2) : 'US'}
            </div>
            
            <div className="flex-1 overflow-hidden md:hidden">
              <p className="text-[12px] font-medium text-neutral-200 truncate">{user?.username || 'Usuário'}</p>
              <p className="text-[10px] text-neutral-500 font-mono truncate">{user?.role || 'USER'}</p>
            </div>
            <form action={logout} className="md:hidden">
              <button type="submit" className="text-neutral-500 hover:text-neutral-300 transition-colors" title="Sair">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </form>

            <span className="hidden md:block absolute left-14 bg-neutral-800 text-white text-[11px] font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
              {user?.username || 'Usuário'} ({user?.role || 'USER'})
            </span>
          </div>

          <form action={logout} className="hidden md:block w-full">
            <button 
              type="submit" 
              className="w-full flex justify-center p-2 text-neutral-500 hover:bg-neutral-800/50 hover:text-red-400 rounded-lg transition-colors group relative" 
              title="Sair"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden md:block absolute left-12 bg-neutral-800 text-white text-[11px] font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                Sair
              </span>
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
