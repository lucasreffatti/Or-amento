'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Car, ClipboardCheck, FileText, Settings, LogOut, Command } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()

  const menus = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/customers', icon: Users },
    { name: 'Veículos', href: '/vehicles', icon: Car },
    { name: 'Checklists', href: '/checklists', icon: ClipboardCheck },
    { name: 'Orçamentos', href: '/budgets', icon: FileText },
  ]

  return (
    <aside className="w-[260px] bg-[#0A0A0A] text-neutral-300 flex flex-col h-full shrink-0 border-r border-neutral-800">
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)]">
            <Command className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="text-[14px] font-semibold tracking-tight text-white">OficinaSaaS</span>
        </Link>
        <span className="font-mono text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded uppercase tracking-widest border border-neutral-700">
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
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-neutral-400 rounded-lg hover:bg-neutral-800/50 hover:text-neutral-200 transition-colors">
            <Settings className="w-4 h-4 text-neutral-500" strokeWidth={2} />
            Configurações
          </Link>
        </nav>
        
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-neutral-800/30 border border-neutral-800/50">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-neutral-700 to-neutral-500 text-white flex items-center justify-center text-[10px] font-bold shadow-inner">
            AD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[12px] font-medium text-neutral-200 truncate">Admin Mock</p>
            <p className="text-[10px] text-neutral-500 font-mono truncate">admin@oficina.com</p>
          </div>
          <button className="text-neutral-500 hover:text-neutral-300 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}

