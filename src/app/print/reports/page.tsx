import { getReportData, ReportFilterInput } from '@/app/actions/report'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

interface SearchParams {
  period?: string
  startDate?: string
  endDate?: string
  category?: string
}

export default async function PrintReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const params = await searchParams
  const filter: ReportFilterInput = {
    period: (params.period as any) || 'month',
    startDate: params.startDate,
    endDate: params.endDate,
    category: (params.category as any) || 'all',
  }

  const response = await getReportData(filter)

  if (!response.success || !response.data) {
    return (
      <div className="p-8 text-center text-red-600">
        Erro ao carregar os dados para impressão do relatório.
      </div>
    )
  }

  const { tenant, summary, budgets, invoices, checklists, stockItems, customers, periodInfo } = response.data

  const startDateFormatted = new Date(periodInfo.startDate).toLocaleDateString('pt-BR')
  const endDateFormatted = new Date(periodInfo.endDate).toLocaleDateString('pt-BR')

  const categoryTitles: Record<string, string> = {
    all: 'Relatório Executivo Consolidado',
    budgets: 'Relatório Detalhado de Orçamentos',
    invoices: 'Relatório de Emitidas e Notas Fiscais',
    checklists: 'Relatório de Inspekções e Checklists',
    stock: 'Relatório de Estoque e Peças',
    customers: 'Relatório de Clientes e Cadastros',
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 p-4 sm:p-8 font-sans">
      {/* Botões de Ação na Tela (Ocultos na Impressão) */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden bg-neutral-900 text-white p-4 rounded-xl shadow-lg">
        <div>
          <h1 className="text-sm font-semibold">Modo de Impressão do Relatório</h1>
          <p className="text-xs text-neutral-400">Clique no botão ao lado para salvar como PDF ou imprimir.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-md cursor-pointer"
          >
            🖨️ Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Documento A4 Formatado */}
      <div className="max-w-[210mm] mx-auto bg-white print:max-w-none print:w-full border border-neutral-200 print:border-none p-6 space-y-6">
        
        {/* Cabeçalho Oficial */}
        <div className="border-b border-neutral-300 pb-4 text-center">
          <div className="w-full flex justify-center mb-3">
            <img 
              src="/sergiocar-header.png" 
              alt="Auto Elétrica Sérgio Car" 
              className="max-h-24 object-contain"
            />
          </div>
          <h2 className="text-lg font-bold uppercase tracking-tight text-neutral-900">
            {categoryTitles[filter.category || 'all']}
          </h2>
          <p className="text-xs text-neutral-500 font-mono mt-1">
            Período: <strong>{startDateFormatted}</strong> até <strong>{endDateFormatted}</strong> • Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Resumo Consolidado de KPIs */}
        <div className="grid grid-cols-4 gap-3 bg-neutral-50 p-4 rounded-lg border border-neutral-200 text-xs">
          <div>
            <span className="text-neutral-500 block uppercase font-mono text-[10px]">Faturamento Aprovado</span>
            <strong className="text-sm text-emerald-700 font-mono">
              R$ {summary.totalApprovedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div>
            <span className="text-neutral-500 block uppercase font-mono text-[10px]">Orçamentos Criados</span>
            <strong className="text-sm text-neutral-900 font-mono">
              {summary.totalBudgets} ({summary.approvedCount} aprobados)
            </strong>
          </div>
          <div>
            <span className="text-neutral-500 block uppercase font-mono text-[10px]">Total Checklists</span>
            <strong className="text-sm text-neutral-900 font-mono">{summary.totalChecklists}</strong>
          </div>
          <div>
            <span className="text-neutral-500 block uppercase font-mono text-[10px]">Ticket Médio</span>
            <strong className="text-sm text-indigo-700 font-mono">
              R$ {summary.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* Tabela por Categoria Selecionada */}

        {/* 1. Orçamentos */}
        {(filter.category === 'all' || filter.category === 'budgets') && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 border-b border-neutral-200 pb-1">
              Listagem de Orçamentos ({budgets.length})
            </h3>
            {budgets.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">Nenhum orçamento no período.</p>
            ) : (
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-neutral-300 bg-neutral-100 font-semibold text-neutral-700">
                    <th className="py-1.5 px-2">Data</th>
                    <th className="py-1.5 px-2">Cliente</th>
                    <th className="py-1.5 px-2">Veículo</th>
                    <th className="py-1.5 px-2">Status</th>
                    <th className="py-1.5 px-2 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {budgets.map((b) => (
                    <tr key={b.id}>
                      <td className="py-1.5 px-2 font-mono">{new Date(b.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="py-1.5 px-2 font-medium">{b.customer.name}</td>
                      <td className="py-1.5 px-2">{b.vehicle.brand} {b.vehicle.model} ({b.vehicle.plate})</td>
                      <td className="py-1.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          b.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status === 'APPROVED' ? 'APROVADO' : b.status === 'REJECTED' ? 'RECUSADO' : 'PENDENTE'}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold">
                        R$ {b.finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 2. Notas Fiscais */}
        {(filter.category === 'all' || filter.category === 'invoices') && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 border-b border-neutral-200 pb-1">
              Notas Fiscais Emitidas ({invoices.length})
            </h3>
            {invoices.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">Nenhuma nota fiscal emitida no período.</p>
            ) : (
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-neutral-300 bg-neutral-100 font-semibold text-neutral-700">
                    <th className="py-1.5 px-2">Data</th>
                    <th className="py-1.5 px-2">Número / Série</th>
                    <th className="py-1.5 px-2">Cliente</th>
                    <th className="py-1.5 px-2">Status</th>
                    <th className="py-1.5 px-2 text-right">Valor Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-1.5 px-2 font-mono">{new Date(inv.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="py-1.5 px-2 font-mono">Nº {inv.number || 'Pendente'} (Série {inv.series})</td>
                      <td className="py-1.5 px-2">{inv.customer.name}</td>
                      <td className="py-1.5 px-2 font-bold">{inv.status}</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold">
                        R$ {inv.finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 3. Checklists */}
        {(filter.category === 'all' || filter.category === 'checklists') && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 border-b border-neutral-200 pb-1">
              Checklists Realizados ({checklists.length})
            </h3>
            {checklists.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">Nenhum checklist registrado no período.</p>
            ) : (
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-neutral-300 bg-neutral-100 font-semibold text-neutral-700">
                    <th className="py-1.5 px-2">Data</th>
                    <th className="py-1.5 px-2">Cliente</th>
                    <th className="py-1.5 px-2">Veículo</th>
                    <th className="py-1.5 px-2">Nível de Combustível</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {checklists.map((c) => (
                    <tr key={c.id}>
                      <td className="py-1.5 px-2 font-mono">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="py-1.5 px-2 font-medium">{c.customer.name}</td>
                      <td className="py-1.5 px-2">{c.vehicle.model} ({c.vehicle.plate})</td>
                      <td className="py-1.5 px-2 font-mono">{c.fuelLevel || 'N/I'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 4. Estoque & Peças */}
        {(filter.category === 'stock') && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 border-b border-neutral-200 pb-1">
              Estoque de Peças e Insumos ({stockItems.length})
            </h3>
            {stockItems.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">Nenhum item em estoque.</p>
            ) : (
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-neutral-300 bg-neutral-100 font-semibold text-neutral-700">
                    <th className="py-1.5 px-2">Código</th>
                    <th className="py-1.5 px-2">Descrição</th>
                    <th className="py-1.5 px-2">Tipo</th>
                    <th className="py-1.5 px-2">Qtd</th>
                    <th className="py-1.5 px-2 text-right">Preço Venda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {stockItems.map((s) => (
                    <tr key={s.id}>
                      <td className="py-1.5 px-2 font-mono">{s.code || '-'}</td>
                      <td className="py-1.5 px-2 font-medium">{s.description}</td>
                      <td className="py-1.5 px-2">{s.itemType}</td>
                      <td className="py-1.5 px-2 font-bold font-mono">{s.quantity} {s.unit}</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold">
                        R$ {s.salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 5. Clientes */}
        {(filter.category === 'customers') && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 border-b border-neutral-200 pb-1">
              Clientes Cadastrados no Período ({customers.length})
            </h3>
            {customers.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">Nenhum cliente cadastrado no período.</p>
            ) : (
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-neutral-300 bg-neutral-100 font-semibold text-neutral-700">
                    <th className="py-1.5 px-2">Cadastro</th>
                    <th className="py-1.5 px-2">Nome</th>
                    <th className="py-1.5 px-2">Telefone</th>
                    <th className="py-1.5 px-2">CPF / CNPJ</th>
                    <th className="py-1.5 px-2">Veículos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {customers.map((cust) => (
                    <tr key={cust.id}>
                      <td className="py-1.5 px-2 font-mono">{new Date(cust.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="py-1.5 px-2 font-medium">{cust.name}</td>
                      <td className="py-1.5 px-2 font-mono">{cust.phone}</td>
                      <td className="py-1.5 px-2 font-mono">{cust.document || '-'}</td>
                      <td className="py-1.5 px-2 font-mono">{cust.vehicles.length} veículo(s)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Rodapé e Assinaturas */}
        <div className="pt-10 border-t border-neutral-200 text-center space-y-4">
          <div className="flex justify-around items-end pt-8">
            <div className="text-center w-64 border-t border-neutral-400 pt-1">
              <p className="text-[11px] font-semibold text-neutral-800">Auto Elétrica Sérgio Car</p>
              <p className="text-[9px] text-neutral-500">Responsável Operacional</p>
            </div>
          </div>
          <p className="text-[10px] text-neutral-400 font-mono">
            Relatório gerado automaticamente pelo Sistema de Gestão Sérgio Car.
          </p>
        </div>

      </div>
    </div>
  )
}
