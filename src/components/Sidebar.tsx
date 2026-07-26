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
 <div className="md:hidden flex items-center justify-between bg-white text-neutral-900 p-4 border-b border-neutral-200">
 <Link href="/" className="flex items-center gap-2">
 <div className="w-6 h-6 bg-neutral-900 rounded flex items-center justify-center">
 <Command className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
 </div>
 <span className="text-[13px] font-semibold tracking-tight">Sérgio Car</span>
 </Link>
 <button onClick={() => setIsOpen(true)} className="p-1 hover:bg-neutral-100 rounded">
 <Menu className="w-5 h-5 text-neutral-600" />
 </button>
 </div>

 {/* Overlay (Mobile Only) */}
 {isOpen && (
 <div 
 className="md:hidden fixed inset-0 bg-neutral-900/50 backdrop-blur-xs z-40 transition-opacity"
 onClick={() => setIsOpen(false)}
 />
 )}

 {/* Sidebar Navigation */}
 <aside className={`
 fixed md:static inset-y-0 left-0 z-50
 w-64 md:w-16 h-full bg-white text-neutral-900 border-r border-neutral-200
 flex flex-col justify-between transition-transform duration-200 ease-in-out
 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
 `}>
 {/* Header/Logo */}
 <div className="p-4 md:p-3 flex items-center justify-between md:justify-center border-b border-neutral-200">
 <Link href="/" className="flex items-center gap-2.5">
 <div className="w-7 h-7 bg-neutral-900 text-white rounded-lg flex items-center justify-center shrink-0 shadow-xs">
 <Command className="w-4 h-4" strokeWidth={2.5} />
 </div>
 <span className="text-sm font-semibold tracking-tight text-neutral-900 md:hidden">
 Sérgio Car
 </span>
 </Link>
 <button 
 onClick={() => setIsOpen(false)}
 className="md:hidden p-1 text-neutral-500 hover:text-neutral-900 rounded-md"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Main Navigation */}
 <nav className="flex-1 px-3 md:px-2 py-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
 {menus.map((item) => {
 const Icon = item.icon
 const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
 return (
 <Link
 key={item.href}
 href={item.href}
 onClick={() => setIsOpen(false)}
 className={`
 flex items-center gap-3 md:justify-center w-full px-3 md:px-0 py-2.5 md:py-3 text-[13px] font-medium rounded-lg transition-colors group relative
 ${isActive 
 ? 'bg-neutral-900 text-white shadow-xs font-semibold' 
 : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}
 `}
 >
 <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-600'}`} strokeWidth={2} />
 <span className="md:hidden">{item.name}</span>
 
 {/* Tooltip for collapsed Desktop mode */}
 <span className="hidden md:block absolute left-14 bg-neutral-900 text-white text-[11px] font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xs border border-neutral-800">
 {item.name}
 </span>
 </Link>
 )
 })}
 </nav>

 {/* Footer/Settings & Profile */}
 <div className="p-4 md:p-2 border-t border-neutral-200 space-y-4 md:space-y-2 flex flex-col items-center">
 <nav className="w-full">
 <Link 
 href="/settings" 
 title="Configurações"
 onClick={() => setIsOpen(false)} 
 className="flex items-center gap-3 md:justify-center w-full px-3 md:px-0 py-2.5 md:py-3 text-[13px] font-medium text-neutral-600 rounded-lg hover:bg-neutral-100 hover:text-neutral-900 transition-colors group relative"
 >
 <Settings className="w-4 h-4 shrink-0 text-neutral-400 group-hover:text-neutral-600 transition-colors" strokeWidth={2} />
 <span className="md:hidden">Configurações</span>
 
 <span className="hidden md:block absolute left-14 bg-neutral-900 text-white text-[11px] font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xs border border-neutral-800">
 Configurações
 </span>
 </Link>
 </nav>
 
 <div className="flex items-center space-x-3 md:space-x-0 md:justify-center w-full px-3 md:px-0 py-2 md:py-2 rounded-lg bg-neutral-50 md:bg-transparent border border-neutral-200 md:border-transparent group relative">
 <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-tr from-neutral-200 to-neutral-300 text-neutral-700 flex items-center justify-center text-[10px] font-bold shadow-inner uppercase cursor-help">
 {user?.username ? user.username.substring(0, 2) : 'US'}
 </div>
 
 <div className="flex-1 overflow-hidden md:hidden">
 <p className="text-[12px] font-medium text-neutral-900 truncate">{user?.username || 'Usuário'}</p>
 <p className="text-[10px] text-neutral-500 font-mono truncate">{user?.role || 'USER'}</p>
 </div>
 <form action={logout} className="md:hidden">
 <button type="submit" className="text-neutral-400 hover:text-red-500 transition-colors" title="Sair">
 <LogOut className="w-3.5 h-3.5" />
 </button>
 </form>

 <span className="hidden md:block absolute left-14 bg-neutral-900 text-white text-[11px] font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xs border border-neutral-800">
 {user?.username || 'Usuário'} ({user?.role || 'USER'})
 </span>
 </div>

 <form action={logout} className="hidden md:block w-full">
 <button 
 type="submit" 
 className="w-full flex justify-center p-2 text-neutral-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors group relative" 
 title="Sair"
 >
 <LogOut className="w-4 h-4 shrink-0" />
 <span className="hidden md:block absolute left-12 bg-neutral-900 text-white text-[11px] font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xs border border-neutral-800">
 Sair
 </span>
 </button>
 </form>
 </div>
 </aside>
 </>
 )
}
