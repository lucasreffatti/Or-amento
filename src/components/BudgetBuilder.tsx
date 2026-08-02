'use client'

import { useOptimistic, startTransition, useRef } from 'react'
import { Plus, Trash2, CheckCircle2, XCircle, Clock, Send, FileText, Lock } from 'lucide-react'
import Link from 'next/link'
import { addBudgetItem, removeBudgetItem } from '@/app/(app)/budgets/[id]/actions'

type BudgetItem = {
  id: string
  type: string
  description: string
  quantity: number
  unitPrice: number
  budgetId: string
}

type Budget = {
  id: string
  totalLabor: number
  totalParts: number
  discount: number
  finalTotal: number
  status: string
  customer: { name: string, phone: string }
  vehicle: { brand: string, model: string }
  items: BudgetItem[]
}

export default function BudgetBuilder({ budget }: { budget: Budget }) {
  const formRef = useRef<HTMLFormElement>(null)

  const [optimisticItems, modifyOptimisticItems] = useOptimistic(
    budget.items,
    (state, action: { type: 'add' | 'delete', item: BudgetItem }) => {
      if (action.type === 'delete') {
        return state.filter(i => i.id !== action.item.id)
      }
      return [...state, action.item]
    }
  )

  const parts = optimisticItems.filter(i => i.type === 'PART')
  const labor = optimisticItems.filter(i => i.type === 'LABOR')

  const totalLabor = labor.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
  const totalParts = parts.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
  const finalTotal = totalLabor + totalParts - budget.discount

  async function handleAdd(formData: FormData) {
    const newItem = {
      id: `temp-${Date.now()}`,
      type: formData.get('type') as string,
      description: formData.get('description') as string,
      quantity: Number(formData.get('quantity')),
      unitPrice: Number(formData.get('unitPrice')),
      budgetId: budget.id
    }
    
    // Reset the form immediately for better UX
    formRef.current?.reset()
    // Focus back on description for rapid entry (optional, but good UX)
    const descInput = formRef.current?.querySelector('input[name="description"]') as HTMLInputElement
    if (descInput) descInput.focus()

    startTransition(() => {
      modifyOptimisticItems({ type: 'add', item: newItem })
    })
    
    await addBudgetItem(formData)
  }

  const isRejected = budget.status === 'REJECTED'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Lado Esquerdo: Itens */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Tabela de Mão de Obra */}
        <section className="bg-white border border-neutral-200/80 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
            <h2 className="text-[13px] font-semibold text-neutral-900 tracking-tight">Mão de Obra (Serviços)</h2>
            <span className="text-[11px] font-medium text-neutral-500 font-mono bg-neutral-100/80 px-2 py-0.5 rounded-sm">R$ {totalLabor.toFixed(2)}</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-100 text-left text-sm">
              <thead className="bg-white">
                <tr>
                  <th className="px-5 py-2 font-medium text-neutral-400 text-[10px] uppercase tracking-wider whitespace-nowrap">Descrição</th>
                  <th className="px-5 py-2 font-medium text-neutral-400 text-[10px] uppercase tracking-wider w-20 text-right whitespace-nowrap">Qtd</th>
                  <th className="px-5 py-2 font-medium text-neutral-400 text-[10px] uppercase tracking-wider w-32 text-right whitespace-nowrap">Preço Unit.</th>
                  <th className="px-5 py-2 font-medium text-neutral-400 text-[10px] uppercase tracking-wider w-32 text-right whitespace-nowrap">Total</th>
                  <th className="px-5 py-2 font-medium text-neutral-400 text-[10px] uppercase tracking-wider w-16 text-right whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 bg-white">
                {labor.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-neutral-400 italic">Nenhum serviço adicionado.</td></tr>
                ) : (
                  labor.map(item => (
                    <tr key={item.id} className={`group hover:bg-neutral-50/50 transition-colors ${item.id.startsWith('temp') ? 'animate-pulse opacity-70' : ''}`}>
                      <td className="px-5 py-2.5 text-neutral-800 text-[13px] whitespace-nowrap">{item.description}</td>
                      <td className="px-5 py-2.5 text-neutral-500 text-right font-mono text-[11px] whitespace-nowrap">{item.quantity}</td>
                      <td className="px-5 py-2.5 text-neutral-500 text-right font-mono text-[11px] whitespace-nowrap">R$ {item.unitPrice.toFixed(2)}</td>
                      <td className="px-5 py-2.5 text-neutral-900 font-medium text-right font-mono text-[11px] whitespace-nowrap">R$ {(item.quantity * item.unitPrice).toFixed(2)}</td>
                      <td className="px-5 py-2.5 text-right whitespace-nowrap">
                        <button 
                          onClick={() => {
                            startTransition(() => {
                              modifyOptimisticItems({ type: 'delete', item })
                            })
                            removeBudgetItem(item.id, budget.id)
                          }}
                          disabled={item.id.startsWith('temp')}
                          className="text-neutral-300 hover:text-red-500 transition-colors p-1 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tabela de Peças */}
        <section className="bg-white border border-neutral-200/80 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
            <h2 className="text-[13px] font-semibold text-neutral-900 tracking-tight">Peças e Produtos</h2>
            <span className="text-[11px] font-medium text-neutral-500 font-mono bg-neutral-100/80 px-2 py-0.5 rounded-sm">R$ {totalParts.toFixed(2)}</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-100 text-left text-sm">
              <thead className="bg-white">
                <tr>
                  <th className="px-5 py-2 font-medium text-neutral-400 text-[10px] uppercase tracking-wider whitespace-nowrap">Descrição</th>
                  <th className="px-5 py-2 font-medium text-neutral-400 text-[10px] uppercase tracking-wider w-20 text-right whitespace-nowrap">Qtd</th>
                  <th className="px-5 py-2 font-medium text-neutral-400 text-[10px] uppercase tracking-wider w-32 text-right whitespace-nowrap">Preço Unit.</th>
                  <th className="px-5 py-2 font-medium text-neutral-400 text-[10px] uppercase tracking-wider w-32 text-right whitespace-nowrap">Total</th>
                  <th className="px-5 py-2 font-medium text-neutral-400 text-[10px] uppercase tracking-wider w-16 text-right whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 bg-white">
                {parts.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-neutral-400 italic">Nenhuma peça adicionada.</td></tr>
                ) : (
                  parts.map(item => (
                    <tr key={item.id} className={`group hover:bg-neutral-50/50 transition-colors ${item.id.startsWith('temp') ? 'animate-pulse opacity-70' : ''}`}>
                      <td className="px-5 py-2.5 text-neutral-800 text-[13px] whitespace-nowrap">{item.description}</td>
                      <td className="px-5 py-2.5 text-neutral-500 text-right font-mono text-[11px] whitespace-nowrap">{item.quantity}</td>
                      <td className="px-5 py-2.5 text-neutral-500 text-right font-mono text-[11px] whitespace-nowrap">R$ {item.unitPrice.toFixed(2)}</td>
                      <td className="px-5 py-2.5 text-neutral-900 font-medium text-right font-mono text-[11px] whitespace-nowrap">R$ {(item.quantity * item.unitPrice).toFixed(2)}</td>
                      <td className="px-5 py-2.5 text-right whitespace-nowrap">
                        <button 
                          onClick={() => {
                            startTransition(() => {
                              modifyOptimisticItems({ type: 'delete', item })
                            })
                            removeBudgetItem(item.id, budget.id)
                          }}
                          disabled={item.id.startsWith('temp')}
                          className="text-neutral-300 hover:text-red-500 transition-colors p-1 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Adicionar Novo Item */}
        <section className="bg-white border border-neutral-200/80 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5">
          <h2 className="text-[13px] font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            Adicionar Item
            <span className="px-1.5 py-0.5 rounded-sm bg-neutral-100 text-neutral-500 text-[9px] uppercase tracking-wider font-mono">Instant</span>
          </h2>
          <form ref={formRef} action={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <input type="hidden" name="budgetId" value={budget.id} />
            
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Tipo</label>
              <select name="type" className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-[13px] text-neutral-900 outline-none focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all">
                <option value="LABOR">Mão de Obra</option>
                <option value="PART">Peça / Produto</option>
              </select>
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Descrição</label>
              <input required type="text" name="description" placeholder="Ex: Troca de óleo" className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-[13px] text-neutral-900 outline-none focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all placeholder:text-neutral-400" />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Qtd</label>
              <input required type="number" name="quantity" defaultValue={1} min={1} className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-[13px] text-neutral-900 outline-none focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all font-mono" />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Preço Unit.</label>
              <input required type="number" name="unitPrice" step="0.01" min="0" placeholder="0.00" className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-[13px] text-neutral-900 outline-none focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all font-mono" />
            </div>

            <div className="md:col-span-1">
              <button type="submit" className="w-full h-[36px] bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors shadow-sm flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Lado Direito: Resumo */}
      <div className="lg:col-span-1">
        <div className="bg-[#0A0A0A] border border-neutral-800 rounded-xl shadow-xl p-6 text-white sticky top-6">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
            <h2 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Resumo Financeiro</h2>
            
            {/* Status Badge ao Vivo */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              budget.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              budget.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              budget.status === 'SENT' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
              'bg-neutral-800 text-neutral-300 border border-neutral-700'
            }`}>
              {budget.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              {budget.status === 'REJECTED' && <XCircle className="w-3 h-3 text-red-400" />}
              {budget.status === 'SENT' && <Send className="w-3 h-3 text-blue-400" />}
              {budget.status === 'DRAFT' && <FileText className="w-3 h-3 text-neutral-400" />}
              {budget.status === 'APPROVED' ? 'Aprovado' :
               budget.status === 'REJECTED' ? 'Recusado' :
               budget.status === 'SENT' ? 'Enviado' : 'Rascunho'}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-neutral-400">Subtotal Serviços</span>
              <span className="font-mono text-neutral-100">R$ {totalLabor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-neutral-400">Subtotal Peças</span>
              <span className="font-mono text-neutral-100">R$ {totalParts.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-neutral-500">Descontos</span>
              <span className="font-mono text-neutral-400">- R$ {budget.discount.toFixed(2)}</span>
            </div>
            
            <div className="pt-5 mt-5 border-t border-neutral-800">
              <div className="flex justify-between items-end">
                <span className="text-xs font-medium text-neutral-400">Total Líquido</span>
                <span className="text-2xl font-mono font-medium text-white tracking-tight">R$ {finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 space-y-2.5">
            {isRejected ? (
              <button 
                type="button"
                disabled 
                title="Orçamento recusado não pode ser impresso ou baixado em PDF"
                className="w-full bg-neutral-800 text-neutral-500 py-2.5 rounded-lg text-[12px] font-semibold cursor-not-allowed flex items-center justify-center gap-2 border border-neutral-700/60 opacity-60"
              >
                <Lock className="w-3.5 h-3.5 text-neutral-500" /> PDF Bloqueado (Recusado)
              </button>
            ) : (
              <Link 
                href={`/print/budgets/${budget.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white text-black py-2.5 rounded-lg text-[13px] font-semibold hover:bg-neutral-200 transition-colors flex items-center justify-center shadow-sm"
              >
                Gerar PDF Comercial
              </Link>
            )}
            
            {(() => {
              const phoneDigits = budget.customer.phone.replace(/\D/g, '');
              const formattedPhone = phoneDigits.startsWith('55') ? phoneDigits : (phoneDigits.length >= 10 ? `55${phoneDigits}` : phoneDigits);
              const message = `Olá ${budget.customer.name}, o orçamento do seu veículo ${budget.vehicle.brand} ${budget.vehicle.model} já está pronto! O valor total ficou em R$ ${finalTotal.toFixed(2)}.\n\nSegue o arquivo PDF em anexo.`;
              const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
              
              return (
                <a 
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#25D366]/20 transition-colors flex items-center justify-center"
                >
                  Enviar via WhatsApp
                </a>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
