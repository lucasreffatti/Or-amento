'use client'

import { useRouter } from 'next/navigation'

export function ChecklistRow({ checklist }: { checklist: any }) {
  const router = useRouter()

  return (
    <tr 
      onClick={() => router.push(`/checklists/${checklist.id}`)}
      className="hover:bg-neutral-50/80 transition-colors group cursor-pointer"
    >
      <td className="px-5 py-3.5 font-mono text-neutral-500 text-xs">#{checklist.id.substring(0,6)}</td>
      <td className="px-5 py-3.5 text-neutral-900 font-medium">
        {checklist.vehicle.plate} <span className="text-neutral-400 text-xs font-normal">({checklist.vehicle.model})</span>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-neutral-400 rounded-full" 
              style={{ width: `${checklist.fuelLevel}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-neutral-500">{checklist.fuelLevel}%</span>
        </div>
      </td>
      <td className="px-5 py-3.5 text-neutral-400 font-mono text-[11px] text-right">
        {new Date(checklist.createdAt).toLocaleDateString('pt-BR')}
      </td>
    </tr>
  )
}
