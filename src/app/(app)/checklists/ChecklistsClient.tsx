'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, CheckSquare, Search, Eye, Edit2, Car, User, CheckCircle2, Clock, AlertTriangle, Trash2 } from 'lucide-react'
import { DeleteButton } from '@/components/DeleteButton'
import { deleteChecklist, deleteChecklistsBulk } from '@/app/actions/delete'

interface Checklist {
  id: string
  fuelLevel: number
  itemsStatus: string
  notes?: string | null
  createdAt: Date
  customer: {
    id: string
    name: string
    phone: string
  }
  vehicle: {
    id: string
    plate: string
    brand: string
    model: string
  }
}

export default function ChecklistsClient({ initialChecklists }: { initialChecklists: Checklist[] }) {
  const [checklists, setChecklists] = useState<Checklist[]>(initialChecklists)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFuel, setFilterFuel] = useState<'ALL' | 'LOW_FUEL' | 'HIGH_FUEL'>('ALL')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Métricas
  const totalChecklists = checklists.length
  const today = new Date().toDateString()
  const todayCount = checklists.filter(c => new Date(c.createdAt).toDateString() === today).length
  const lowFuelCount = checklists.filter(c => c.fuelLevel <= 25).length
  const fullFuelCount = checklists.filter(c => c.fuelLevel >= 75).length

  // Filtragem
  const filteredChecklists = checklists.filter(c => {
    const matchesSearch =
      c.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (filterFuel === 'LOW_FUEL') return c.fuelLevel <= 25
    if (filterFuel === 'HIGH_FUEL') return c.fuelLevel >= 75
    return true
  })

  const handleToggleSelectAll = () => {
    const currentIds = filteredChecklists.map(c => c.id)
    const allSelected = currentIds.every(id => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])))
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.length} vistoria(s) selecionada(s)?`)) return

    setIsBulkDeleting(true)
    try {
      const res = await deleteChecklistsBulk(selectedIds)
      if (res.success) {
        setChecklists(prev => prev.filter(c => !selectedIds.includes(c.id)))
        setSelectedIds([])
      } else {
        alert(res.message || 'Erro ao excluir vistorias em massa')
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir vistorias em massa')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
              <CheckSquare className="w-3 h-3" /> Recepção & Vistoria
            </span>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Vistorias de Entrada (Checklists)</h1>
          <p className="text-sm text-neutral-500 mt-1">Inspeção de lataria, nível de combustível e avarias no momento da recepção.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Link
            href="/checklists/new"
            className="bg-neutral-900 text-white px-4 py-2.5 text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" /> Nova Vistoria
          </Link>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total de Vistorias</span>
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totalChecklists}</div>
          <p className="text-xs text-neutral-500">Checklists de entrada realizados</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Realizados Hoje</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{todayCount}</div>
          <p className="text-xs text-neutral-500">Veículos vistoriados hoje</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Combustível Baixo</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{lowFuelCount}</div>
          <p className="text-xs text-neutral-500">Chegaram com até 25% tanques</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Tanque Cheio</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{fullFuelCount}</div>
          <p className="text-xs text-neutral-500">Chegaram com mais de 75%</p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-neutral-200 p-3 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por placa, modelo ou cliente..."
            className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] outline-none focus:border-neutral-400 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1 sm:pb-0">
          <button
            onClick={() => setFilterFuel('ALL')}
            className={`px-3 py-2 min-h-[44px] text-xs font-medium rounded-lg transition-all ${
              filterFuel === 'ALL'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Todos ({totalChecklists})
          </button>
          <button
            onClick={() => setFilterFuel('LOW_FUEL')}
            className={`px-3 py-2 min-h-[44px] text-xs font-medium rounded-lg transition-all ${
              filterFuel === 'LOW_FUEL'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Reserva/Baixo ({lowFuelCount})
          </button>
          <button
            onClick={() => setFilterFuel('HIGH_FUEL')}
            className={`px-3 py-2 min-h-[44px] text-xs font-medium rounded-lg transition-all ${
              filterFuel === 'HIGH_FUEL'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Tanque Cheio ({fullFuelCount})
          </button>
        </div>
      </div>

      {/* BARRA FLUTUANTE DE AÇÕES EM MASSA */}
      {selectedIds.length > 0 && (
        <div className="bg-neutral-900 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-lg border border-neutral-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="bg-neutral-800 text-neutral-200 px-3 py-1 rounded-md text-xs font-mono font-bold">
              {selectedIds.length} {selectedIds.length === 1 ? 'vistoria selecionada' : 'vistorias selecionadas'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
            >
              Limpar Seleção
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 min-h-[36px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isBulkDeleting ? 'Excluindo...' : `Excluir ${selectedIds.length} Selecionada(s)`}
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Checklists */}
      <div className="border border-neutral-200 bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredChecklists.length === 0 ? (
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center bg-neutral-50/30">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 border border-neutral-200 shadow-sm">
              <CheckSquare className="w-5 h-5 text-neutral-400" />
            </div>
            <h3 className="text-[14px] font-semibold text-neutral-900">Nenhum checklist encontrado</h3>
            <p className="text-[13px] text-neutral-500 mt-1 max-w-sm leading-relaxed">
              {searchTerm ? 'Nenhum resultado corresponde à sua busca.' : 'Você ainda não tem vistorias cadastradas.'}
            </p>
            <Link
              href="/checklists/new"
              className="mt-5 bg-white border border-neutral-200 text-neutral-900 px-5 py-2.5 min-h-[44px] text-[13px] font-medium rounded-lg hover:bg-neutral-50 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-neutral-400" /> Nova Vistoria
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <table className="min-w-full divide-y divide-neutral-200/80 text-left text-sm">
              <thead className="bg-neutral-50/50">
                <tr>
                  <th className="px-4 py-4 w-10 text-center border-b border-neutral-100">
                    <input
                      type="checkbox"
                      checked={filteredChecklists.length > 0 && filteredChecklists.every(c => selectedIds.includes(c.id))}
                      onChange={handleToggleSelectAll}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 w-4 h-4 cursor-pointer"
                      title="Selecionar Todos"
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Veículo</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Proprietário</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Combustível</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Data / Hora</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {filteredChecklists.map((c) => {
                  const isSelected = selectedIds.includes(c.id)
                  return (
                    <tr key={c.id} className={`hover:bg-neutral-50/80 transition-colors group ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                      <td className="px-4 py-4 text-center w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(c.id)}
                          className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-neutral-900 text-[13px] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="bg-neutral-100 text-neutral-800 border border-neutral-200 px-2 py-0.5 rounded font-mono font-bold text-xs">
                          {c.vehicle.plate}
                        </span>
                        <span className="text-neutral-600 text-xs">{c.vehicle.brand} {c.vehicle.model}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 text-[13px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-neutral-400" /> {c.customer.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 text-[13px] whitespace-nowrap">
                      <div className="w-32 bg-neutral-100 h-2.5 rounded-full overflow-hidden flex items-center">
                        <div
                          className={`h-full rounded-full ${
                            c.fuelLevel <= 25 ? 'bg-amber-500' : c.fuelLevel >= 75 ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${c.fuelLevel}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400 mt-1 block">{c.fuelLevel}% no tanque</span>
                    </td>
                    <td className="px-6 py-4 text-neutral-400 font-mono text-[12px] whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')} às {new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2 whitespace-nowrap">
                      <Link
                        href={`/checklists/${c.id}`}
                        className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                        title="Ver Vistoria"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/checklists/${c.id}/edit`}
                        className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <DeleteButton
                        id={c.id}
                        action={deleteChecklist}
                        entityName="este checklist"
                        className="opacity-100"
                      />
                    </td>
                  </tr>
                )
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
