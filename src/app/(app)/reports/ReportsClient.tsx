'use client'

import { useState, useTransition } from 'react'
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Printer, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Package, 
  Users, 
  ClipboardCheck, 
  Receipt,
  Filter,
  RefreshCw
} from 'lucide-react'
import { getReportData, ReportFilterInput } from '@/app/actions/report'

interface ReportsClientProps {
  initialData: any
}

export default function ReportsClient({ initialData }: ReportsClientProps) {
  const [period, setPeriod] = useState<ReportFilterInput['period']>('month')
  const [category, setCategory] = useState<ReportFilterInput['category']>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')

  const [reportData, setReportData] = useState<any>(initialData)
  const [isPending, startTransition] = useTransition()

  // Recarregar relatório com novos filtros
  const handleApplyFilter = (
    newPeriod: ReportFilterInput['period'] = period,
    newCategory: ReportFilterInput['category'] = category
  ) => {
    startTransition(async () => {
      const res = await getReportData({
        period: newPeriod,
        category: newCategory,
        startDate: newPeriod === 'custom' ? startDate : undefined,
        endDate: newPeriod === 'custom' ? endDate : undefined,
      })

      if (res.success && res.data) {
        setReportData(res.data)
      }
    })
  }

  const onPeriodChange = (p: ReportFilterInput['period']) => {
    setPeriod(p)
    if (p !== 'custom') {
      handleApplyFilter(p, category)
    }
  }

  const onCategoryChange = (c: ReportFilterInput['category']) => {
    setCategory(c)
    handleApplyFilter(period, c)
  }

  // Exportar para CSV
  const handleExportCSV = () => {
    if (!reportData) return

    const { summary, budgets, invoices, checklists, stockItems, customers } = reportData

    let csvContent = '\uFEFF' // BOM para UTF-8 no Excel

    if (category === 'all' || category === 'budgets') {
      csvContent += '=== RELATORIO DE ORCAMENTOS ===\n'
      csvContent += 'Data;Cliente;Veiculo;Placa;Status;Total (R$)\n'
      budgets.forEach((b: any) => {
        csvContent += `${new Date(b.createdAt).toLocaleDateString('pt-BR')};"${b.customer.name}";"${b.vehicle.brand} ${b.vehicle.model}";"${b.vehicle.plate}";"${b.status}";"${b.finalTotal.toFixed(2)}"\n`
      })
      csvContent += '\n'
    }

    if (category === 'all' || category === 'invoices') {
      csvContent += '=== RELATORIO DE NOTAS FISCAIS ===\n'
      csvContent += 'Data;Numero;Serie;Cliente;Status;Total (R$)\n'
      invoices.forEach((i: any) => {
        csvContent += `${new Date(i.createdAt).toLocaleDateString('pt-BR')};"${i.number || 'Pendente'}";"${i.series}";"${i.customer.name}";"${i.status}";"${i.finalTotal.toFixed(2)}"\n`
      })
      csvContent += '\n'
    }

    if (category === 'all' || category === 'checklists') {
      csvContent += '=== RELATORIO DE CHECKLISTS ===\n'
      csvContent += 'Data;Cliente;Veiculo;Placa;Combustivel\n'
      checklists.forEach((c: any) => {
        csvContent += `${new Date(c.createdAt).toLocaleDateString('pt-BR')};"${c.customer.name}";"${c.vehicle.model}";"${c.vehicle.plate}";"${c.fuelLevel || 'N/I'}"\n`
      })
      csvContent += '\n'
    }

    if (category === 'stock') {
      csvContent += '=== RELATORIO DE ESTOQUE ===\n'
      csvContent += 'Codigo;Descricao;Tipo;Preco Venda (R$);Quantidade;Total (R$)\n'
      stockItems.forEach((s: any) => {
        csvContent += `"${s.code || ''}";"${s.description}";"${s.itemType}";"${s.salePrice.toFixed(2)}";"${s.quantity}";"${(s.quantity * s.salePrice).toFixed(2)}"\n`
      })
      csvContent += '\n'
    }

    if (category === 'customers') {
      csvContent += '=== RELATORIO DE CLIENTES ===\n'
      csvContent += 'Data Cadastro;Nome;Telefone;Documento;Qtd Veiculos\n'
      customers.forEach((cust: any) => {
        csvContent += `${new Date(cust.createdAt).toLocaleDateString('pt-BR')};"${cust.name}";"${cust.phone}";"${cust.document || ''}";"${cust.vehicles.length}"\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Relatorio_SergioCar_${category}_${period}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Abrir página de impressão / PDF
  const handleOpenPrintView = () => {
    let url = `/print/reports?period=${period}&category=${category}`
    if (period === 'custom' && startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`
    }
    window.open(url, '_blank')
  }

  const { summary, budgets, invoices, checklists, stockItems, customers } = reportData || {}

  // Filtragem local de busca
  const filteredBudgets = (budgets || []).filter((b: any) => 
    b.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Gestão & Relatórios
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Central de Relatórios Gerenciais</h1>
          <p className="text-[13px] text-neutral-500 mt-1">
            Gere resumos executivos, acompanhe o faturamento e exporte relatórios em PDF ou Excel.
          </p>
        </div>

        {/* Botões Principais de Exportação */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 min-h-[44px] rounded-lg shadow-sm transition-all duration-200 w-full sm:w-auto"
          >
            <FileSpreadsheet className="w-4 h-4" /> Exportar Excel/CSV
          </button>
          <button
            onClick={handleOpenPrintView}
            className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold px-4 py-2.5 min-h-[44px] rounded-lg shadow-sm transition-all duration-200 w-full sm:w-auto"
          >
            <Printer className="w-4 h-4 text-indigo-400" /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Painel de Filtros de Período e Categorias */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Seletor de Período */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1 mr-2">
              <Calendar className="w-3.5 h-3.5" /> Período:
            </span>
            {[
              { label: 'Hoje', value: 'today' },
              { label: 'Este Mês', value: 'month' },
              { label: 'Este Ano', value: 'year' },
              { label: 'Personalizado', value: 'custom' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => onPeriodChange(p.value as any)}
                className={`text-xs font-semibold px-3 py-2 min-h-[44px] sm:min-h-[36px] flex items-center justify-center rounded-md transition-all ${
                  period === p.value
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Seleção de Período Personalizado */}
          {period === 'custom' && (
            <div className="flex items-center gap-2 bg-neutral-50 p-2 rounded-lg border border-neutral-200">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs border border-neutral-300 rounded px-2 py-1 outline-none bg-white"
              />
              <span className="text-xs text-neutral-400">até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs border border-neutral-300 rounded px-2 py-1 outline-none bg-white"
              />
              <button
                onClick={() => handleApplyFilter('custom', category)}
                className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-indigo-500 transition-colors"
              >
                Filtrar
              </button>
            </div>
          )}
        </div>

        {/* Abas de Categorias */}
        <div className="flex items-center gap-2 border-t border-neutral-100 pt-4 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'all', label: 'Visão Geral Executiva', icon: BarChart3 },
            { id: 'budgets', label: 'Orçamentos', icon: FileText },
            { id: 'invoices', label: 'Notas Fiscais', icon: Receipt },
            { id: 'checklists', label: 'Checklists', icon: ClipboardCheck },
            { id: 'stock', label: 'Estoque & Peças', icon: Package },
            { id: 'customers', label: 'Clientes & Frota', icon: Users },
          ].map((cat) => {
            const Icon = cat.icon
            const isSelected = category === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id as any)}
                className={`flex items-center gap-2 px-3 py-2 min-h-[44px] sm:min-h-[36px] rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-neutral-400'}`} />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid de Cards KPIs */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-sm">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Faturamento Aprovado
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-emerald-600">
                R$ {summary.totalApprovedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded">
                {summary.approvedCount} Aprovados
              </span>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-sm">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Ticket Médio por Serviço
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-neutral-900">
                R$ {summary.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">Médio</span>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-sm">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Orçamentos Criados
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-neutral-900">
                {summary.totalBudgets}
              </span>
              <span className="text-[11px] text-amber-600 bg-amber-50 font-semibold px-2 py-0.5 rounded">
                {summary.pendingCount} Em Aberto
              </span>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-5 rounded-xl shadow-sm">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Inspeções & Checklists
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-neutral-900">
                {summary.totalChecklists}
              </span>
              <span className="text-[11px] text-indigo-600 bg-indigo-50 font-semibold px-2 py-0.5 rounded">
                Realizados
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabela Interativa de Registros */}
      <div className="bg-white border border-neutral-200/80 rounded-xl shadow-sm overflow-hidden">
        
        {/* Barra de Busca de Registros */}
        <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-neutral-900">
              Registros do Período ({category === 'all' || category === 'budgets' ? filteredBudgets.length : (budgets || []).length})
            </h2>
            {isPending && <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente, placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs outline-none focus:border-neutral-400 transition-all"
            />
          </div>
        </div>

        {/* Conteúdo da Tabela */}
        <div className="overflow-x-auto">
          {filteredBudgets.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-400">
              Nenhum registro encontrado para este filtro ou busca.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Veículo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredBudgets.map((b: any) => (
                  <tr key={b.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-neutral-600">
                      {new Date(b.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      {b.customer.name}
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {b.vehicle.brand} {b.vehicle.model} <span className="font-mono text-neutral-400">({b.vehicle.plate})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        b.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        b.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {b.status === 'APPROVED' ? 'Aprovado' : b.status === 'REJECTED' ? 'Recusado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                      R$ {b.finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  )
}
