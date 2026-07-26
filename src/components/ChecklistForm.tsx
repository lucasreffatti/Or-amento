'use client'

import { useState } from 'react'
import { createChecklist } from '@/app/actions/checklist'
import Link from 'next/link'

type Customer = { id: string, name: string, phone: string }
type Vehicle = { id: string, plate: string, brand: string, model: string }

export default function ChecklistForm({ 
  customers, 
  vehicles,
  budgetId 
}: { 
  customers: Customer[], 
  vehicles: Vehicle[],
  budgetId?: string 
}) {
  const [fuelLevel, setFuelLevel] = useState(50)
  
  const checklistItemsTemplate = [
    'Lataria e Pintura',
    'Pneus e Rodas',
    'Faróis e Lanternas',
    'Vidros e Espelhos',
    'Níveis de Óleo e Água',
    'Luzes do Painel',
    'Estepe, Macaco e Chave de Roda',
    'Documento e Manual',
    'Pertences Pessoais'
  ]

  const [itemsStatus, setItemsStatus] = useState<Record<string, string>>(
    checklistItemsTemplate.reduce((acc, item) => ({ ...acc, [item]: 'OK' }), {})
  )

  const handleStatusChange = (item: string, status: string) => {
    setItemsStatus(prev => ({ ...prev, [item]: status }))
  }

  return (
    <form action={createChecklist} className="space-y-8">
      {budgetId && <input type="hidden" name="budgetId" value={budgetId} />}
      <input type="hidden" name="itemsStatus" value={JSON.stringify(itemsStatus)} />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="customerId" className="text-[13px] font-medium text-neutral-700">Cliente *</label>
          <select 
            id="customerId" 
            name="customerId" 
            required
            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all text-neutral-900"
          >
            <option value="">Selecione um cliente...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-1.5">
          <label htmlFor="vehicleId" className="text-[13px] font-medium text-neutral-700">Veículo *</label>
          <select 
            id="vehicleId" 
            name="vehicleId" 
            required
            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all text-neutral-900"
          >
            <option value="">Selecione um veículo...</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.plate} ({v.brand} {v.model})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-neutral-100">
        <div className="flex justify-between items-center">
          <label className="text-[13px] font-medium text-neutral-700">Nível de Combustível</label>
          <span className="text-[12px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-sm">{fuelLevel}%</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-neutral-400">Vazio</span>
          <input 
            type="range" 
            name="fuelLevel"
            min="0" 
            max="100" 
            step="5"
            value={fuelLevel}
            onChange={(e) => setFuelLevel(Number(e.target.value))}
            className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
          />
          <span className="text-xs text-neutral-400">Cheio</span>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-neutral-100">
        <label className="text-[13px] font-medium text-neutral-700 block">Itens da Vistoria</label>
        
        <div className="bg-neutral-50/50 border border-neutral-200 rounded-md overflow-hidden">
          {checklistItemsTemplate.map((item, idx) => (
            <div key={item} className={`flex items-center justify-between p-3 ${idx !== 0 ? 'border-t border-neutral-100' : ''}`}>
              <span className="text-[13px] text-neutral-800 font-medium">{item}</span>
              <div className="flex bg-white border border-neutral-200 rounded-md overflow-hidden shadow-sm">
                {(['OK', 'AVARIA', 'N/A'] as const).map(status => {
                  const isActive = itemsStatus[item] === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(item, status)}
                      className={`px-3 py-1 text-[11px] font-bold transition-colors border-r last:border-r-0 border-neutral-100 ${
                        isActive 
                          ? status === 'OK' ? 'bg-emerald-500 text-white' : status === 'AVARIA' ? 'bg-red-500 text-white' : 'bg-neutral-600 text-white'
                          : 'bg-white text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      {status}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-neutral-100 flex justify-end gap-3">
        <Link 
          href={budgetId ? `/budgets/${budgetId}` : "/checklists"} 
          className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
        >
          Cancelar
        </Link>
        <button 
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition-colors shadow-sm"
        >
          Concluir Vistoria
        </button>
      </div>
    </form>
  )
}
