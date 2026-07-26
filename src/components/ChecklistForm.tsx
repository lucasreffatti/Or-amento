'use client'

import { useState } from 'react'
import { createChecklist, updateChecklist } from '@/app/actions/checklist'
import Link from 'next/link'

type Customer = { id: string, name: string, phone: string }
type Vehicle = { id: string, plate: string, brand: string, model: string }

export default function ChecklistForm({ 
  customers, 
  vehicles,
  budgetId,
  initialData
}: { 
  customers: Customer[], 
  vehicles: Vehicle[],
  budgetId?: string,
  initialData?: any
}) {
  const [fuelLevel, setFuelLevel] = useState(initialData?.fuelLevel ?? 50)
  
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

  let defaultStatus: Record<string, string> = {}
  if (initialData?.itemsStatus) {
    try {
      defaultStatus = JSON.parse(initialData.itemsStatus)
    } catch(e) {}
  } else {
    defaultStatus = checklistItemsTemplate.reduce((acc, item) => ({ ...acc, [item]: 'OK' }), {})
  }

  const [itemsStatus, setItemsStatus] = useState<Record<string, string>>(defaultStatus)

  const handleStatusChange = (item: string, status: string) => {
    setItemsStatus(prev => ({ ...prev, [item]: status }))
  }

  const formAction = initialData 
    ? updateChecklist.bind(null, initialData.id) 
    : createChecklist

  // Calculando rotação do ponteiro (0% = -90deg, 100% = 90deg)
  const needleRotation = (fuelLevel / 100) * 180 - 90

  return (
    <form action={formAction} className="space-y-8">
      {budgetId && <input type="hidden" name="budgetId" value={budgetId} />}
      <input type="hidden" name="itemsStatus" value={JSON.stringify(itemsStatus)} />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="customerId" className="text-[13px] font-medium text-neutral-700">Cliente *</label>
          <select 
            id="customerId" 
            name="customerId" 
            required
            defaultValue={initialData?.customerId ?? ""}
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
            defaultValue={initialData?.vehicleId ?? ""}
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
        <div className="flex justify-between items-center mb-2">
          <label className="text-[13px] font-medium text-neutral-700">Painel de Combustível</label>
          <span className="text-[12px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-sm">{fuelLevel}%</span>
        </div>
        
        {/* DASHBOARD FUEL GAUGE */}
        <div className="flex flex-col items-center bg-neutral-50/50 p-6 rounded-lg border border-neutral-200 shadow-inner">
          <div className="relative w-48 h-24 overflow-hidden flex justify-center">
            {/* Fundo do medidor */}
            <svg viewBox="0 0 200 100" className="w-full h-full drop-shadow-sm">
              <path 
                d="M 20 90 A 70 70 0 0 1 180 90" 
                fill="none" 
                stroke="#e5e5e5" 
                strokeWidth="20" 
                strokeLinecap="round" 
              />
              {/* Parte preenchida dependendo do nível */}
              <path 
                d="M 20 90 A 70 70 0 0 1 180 90" 
                fill="none" 
                stroke={fuelLevel < 20 ? '#ef4444' : fuelLevel < 40 ? '#f59e0b' : '#22c55e'} 
                strokeWidth="20" 
                strokeLinecap="round" 
                strokeDasharray="219.91" 
                strokeDashoffset={219.91 - (219.91 * (fuelLevel / 100))}
                className="transition-all duration-500 ease-out"
              />
              
              {/* Marcações */}
              <text x="30" y="85" fontSize="12" fill="#737373" fontWeight="bold" fontFamily="monospace">E</text>
              <text x="92" y="35" fontSize="12" fill="#737373" fontWeight="bold" fontFamily="monospace">1/2</text>
              <text x="160" y="85" fontSize="12" fill="#737373" fontWeight="bold" fontFamily="monospace">F</text>
            </svg>

            {/* Ponteiro */}
            <div 
              className="absolute bottom-0 w-2 h-16 bg-neutral-800 rounded-t-full origin-bottom shadow-md transition-transform duration-500 ease-out z-10 flex items-start justify-center"
              style={{ transform: `rotate(${needleRotation}deg)` }}
            >
              {/* Eixo central */}
              <div className="absolute -bottom-2 w-6 h-6 bg-neutral-900 rounded-full border-4 border-neutral-100 shadow-sm" />
              {/* Ponta laranja do ponteiro */}
              <div className="w-full h-4 bg-orange-500 rounded-t-full" />
            </div>
          </div>
          
          <input 
            type="range" 
            name="fuelLevel"
            min="0" 
            max="100" 
            step="5"
            value={fuelLevel}
            onChange={(e) => setFuelLevel(Number(e.target.value))}
            className="w-full max-w-[200px] h-2 mt-8 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900 shadow-sm"
          />
          <p className="text-[10px] text-neutral-400 mt-2 uppercase tracking-widest font-semibold">Arraste para ajustar o nível</p>
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
          href={budgetId ? `/budgets/${budgetId}` : (initialData ? `/checklists/${initialData.id}` : "/checklists")} 
          className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
        >
          Cancelar
        </Link>
        <button 
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition-colors shadow-sm"
        >
          {initialData ? "Salvar Alterações" : "Concluir Vistoria"}
        </button>
      </div>
    </form>
  )
}
