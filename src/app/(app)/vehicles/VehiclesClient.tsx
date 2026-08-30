'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Car, Search, Edit2, User, FileText, CheckSquare, Shield, Trash2 } from 'lucide-react'
import { DeleteButton } from '@/components/DeleteButton'
import { deleteVehicle, deleteVehiclesBulk } from '@/app/actions/delete'

interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number | string | null
  engineType: string | null
  mileage: number | null
  customer: {
    id: string
    name: string
    phone: string
  }
  budgets?: any[]
  checklists?: any[]
}

export default function VehiclesClient({ initialVehicles }: { initialVehicles: Vehicle[] }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFuel, setFilterFuel] = useState<string>('ALL')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Métricas
  const totalVehicles = vehicles.length
  const withChecklists = vehicles.filter(v => (v.checklists?.length || 0) > 0).length
  const withBudgets = vehicles.filter(v => (v.budgets?.length || 0) > 0).length
  const flexVehicles = vehicles.filter(v => v.engineType === 'FLEX').length

  // Filtragem
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch =
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.customer.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (filterFuel !== 'ALL' && v.engineType !== filterFuel) return false
    return true
  })

  const handleToggleSelectAll = () => {
    const currentIds = filteredVehicles.map(v => v.id)
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
    if (!confirm(`ATENÇÃO: Excluir ${selectedIds.length} veículo(s) também apagará seus orçamentos e vistorias vinculadas.\n\nDeseja continuar com a exclusão em massa?`)) return

    setIsBulkDeleting(true)
    try {
      const res = await deleteVehiclesBulk(selectedIds)
      if (res.success) {
        setVehicles(prev => prev.filter(v => !selectedIds.includes(v.id)))
        setSelectedIds([])
      } else {
        alert(res.message || 'Erro ao excluir veículos em massa')
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir veículos em massa')
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
              <Car className="w-3 h-3" /> Gestão de Frota
            </span>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Veículos</h1>
          <p className="text-sm text-neutral-500 mt-1">Frota atendida pela oficina com especificações e histórico de orçamentos.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Link
            href="/vehicles/new"
            className="bg-neutral-900 text-white px-4 py-2.5 text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Veículo
          </Link>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total na Frota</span>
            <Car className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totalVehicles}</div>
          <p className="text-xs text-neutral-500">Veículos cadastrados na oficina</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Com Vistorias</span>
            <CheckSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{withChecklists}</div>
          <p className="text-xs text-neutral-500">Possuem vistorias de entrada</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Com Orçamentos</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{withBudgets}</div>
          <p className="text-xs text-neutral-500">Com ordens de serviço ativas</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">Frota Flex</span>
            <Shield className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{flexVehicles}</div>
          <p className="text-xs text-neutral-500">Veículos com motorização Flex</p>
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
          {['ALL', 'FLEX', 'GASOLINA', 'DIESEL', 'ELETRICO'].map((fuel) => (
            <button
              key={fuel}
              onClick={() => setFilterFuel(fuel)}
              className={`px-3 py-2 min-h-[44px] text-xs font-medium rounded-lg transition-all ${
                filterFuel === fuel
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {fuel === 'ALL' ? 'Todos' : fuel}
            </button>
          ))}
        </div>
      </div>

      {/* BARRA FLUTUANTE DE AÇÕES EM MASSA */}
      {selectedIds.length > 0 && (
        <div className="bg-neutral-900 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-lg border border-neutral-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="bg-neutral-800 text-neutral-200 px-3 py-1 rounded-md text-xs font-mono font-bold">
              {selectedIds.length} {selectedIds.length === 1 ? 'veículo selecionado' : 'veículos selecionados'}
            </span>
            <span className="text-xs text-neutral-400 hidden sm:inline">Exclusão em cascata (orçamentos e vistorias inclusos)</span>
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
              {isBulkDeleting ? 'Excluindo...' : `Excluir ${selectedIds.length} Selecionado(s)`}
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Veículos */}
      <div className="border border-neutral-200 bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredVehicles.length === 0 ? (
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center bg-neutral-50/30">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 border border-neutral-200 shadow-sm">
              <Car className="w-5 h-5 text-neutral-400" />
            </div>
            <h3 className="text-[14px] font-semibold text-neutral-900">Nenhum veículo encontrado</h3>
            <p className="text-[13px] text-neutral-500 mt-1 max-w-sm leading-relaxed">
              {searchTerm ? 'Nenhum resultado corresponde à sua busca.' : 'Você ainda não tem veículos cadastrados.'}
            </p>
            <Link
              href="/vehicles/new"
              className="mt-5 bg-white border border-neutral-200 text-neutral-900 px-5 py-2.5 min-h-[44px] text-[13px] font-medium rounded-lg hover:bg-neutral-50 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-neutral-400" /> Cadastrar Primeiro Veículo
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
                      checked={filteredVehicles.length > 0 && filteredVehicles.every(v => selectedIds.includes(v.id))}
                      onChange={handleToggleSelectAll}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 w-4 h-4 cursor-pointer"
                      title="Selecionar Todos"
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Placa</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Marca / Modelo</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Proprietário</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Ano / Motor</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 whitespace-nowrap">Km Atual</th>
                  <th className="px-6 py-4 font-semibold text-neutral-500 text-[11px] uppercase tracking-widest border-b border-neutral-100 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {filteredVehicles.map((v) => {
                  const isSelected = selectedIds.includes(v.id)
                  return (
                    <tr key={v.id} className={`hover:bg-neutral-50/80 transition-colors group ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                      <td className="px-4 py-4 text-center w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(v.id)}
                          className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-neutral-900 text-[13px] whitespace-nowrap">
                        <span className="bg-neutral-100 text-neutral-800 border border-neutral-200 px-2.5 py-1 rounded-md">
                          {v.plate}
                        </span>
                      </td>
                    <td className="px-6 py-4 text-neutral-900 font-medium text-[13px] whitespace-nowrap">
                      {v.brand} {v.model}
                    </td>
                    <td className="px-6 py-4 text-neutral-600 text-[13px] whitespace-nowrap">
                      <Link href={`/customers/${v.customer.id}`} className="hover:underline flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-neutral-400" /> {v.customer.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 text-[13px] whitespace-nowrap">
                      {v.year || '-'} • <span className="text-xs font-semibold text-neutral-700">{v.engineType || 'FLEX'}</span>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 font-mono text-[13px] whitespace-nowrap">
                      {v.mileage ? `${v.mileage.toLocaleString('pt-BR')} km` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2 whitespace-nowrap">
                      <Link
                        href={`/vehicles/${v.id}`}
                        className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <DeleteButton
                        id={v.id}
                        action={deleteVehicle}
                        entityName="este veículo"
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
