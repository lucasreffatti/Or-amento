'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Car, ClipboardCheck, FileText, Settings, LogOut, Command, Menu, X } from 'lucide-react'
import { logout } from '@/app/actions/auth'

export default function Sidebar({ user }: { user?: { username: string, role: string } }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

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
        fixed inset-y-0 left-0 z-50 w-[260px] bg-[#0A0A0A] text-neutral-300 flex flex-col h-full border-r border-neutral-800 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)]">
              <Command className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="text-[14px] font-semibold tracking-tight text-white">Sérgio Car</span>
          </Link>
          <button className="md:hidden p-1 text-neutral-400 hover:text-white" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </button>
          <span className="hidden md:inline-block font-mono text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded uppercase tracking-widest border border-neutral-700">
            PRO
          </span>
        </div>

        <div className="px-5 py-2">
          <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">
            Operação
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto mt-2">
          {menus.map((menu) => {
            const isActive = pathname === menu.href
            const Icon = menu.icon
            return (
              <Link
                key={menu.name}
                href={menu.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-neutral-800/80 text-white shadow-sm ring-1 ring-neutral-700/50' 
                    : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} strokeWidth={isActive ? 2.5 : 2} />
                {menu.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-neutral-800 space-y-4">
          <nav className="space-y-0.5">
            <Link href="/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-neutral-400 rounded-lg hover:bg-neutral-800/50 hover:text-neutral-200 transition-colors">
              <Settings className="w-4 h-4 text-neutral-500" strokeWidth={2} />
              Configurações
            </Link>
          </nav>
          
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-neutral-800/30 border border-neutral-800/50">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-neutral-700 to-neutral-500 text-white flex items-center justify-center text-[10px] font-bold shadow-inner uppercase">
              {user?.username ? user.username.substring(0, 2) : 'US'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[12px] font-medium text-neutral-200 truncate">{user?.username || 'Usuário'}</p>
              <p className="text-[10px] text-neutral-500 font-mono truncate">{user?.role || 'USER'}</p>
            </div>
            <form action={logout}>
              <button type="submit" className="text-neutral-500 hover:text-neutral-300 transition-colors" title="Sair">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  )
}
