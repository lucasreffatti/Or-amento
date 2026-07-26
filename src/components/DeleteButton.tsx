'use client'

import { Trash2 } from 'lucide-react'
import { useTransition } from 'react'

export function DeleteButton({
 id,
 action,
 entityName = "este item",
 className = ""
}: {
 id: string
 action: (id: string) => Promise<void>
 entityName?: string
 className?: string
}) {
 const [isPending, startTransition] = useTransition()

 const handleDelete = (e: React.MouseEvent) => {
 e.stopPropagation() // Evita clicar na linha
 e.preventDefault()
 
 if (window.confirm(`Tem certeza que deseja excluir ${entityName}? Esta ação apagará todos os dados vinculados a ele e não pode ser desfeita.`)) {
 startTransition(async () => {
 await action(id)
 })
 }
 }

 return (
 <button
 type="button"
 onClick={handleDelete}
 disabled={isPending}
 title="Excluir"
 className={`flex items-center gap-1.5 p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 ${className}`}
 >
 <Trash2 className="w-4 h-4" />
 {className.includes('px-') && <span>Excluir</span>}
 </button>
 )
}
