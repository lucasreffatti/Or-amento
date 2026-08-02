'use client'

import { useState } from 'react'
import { Receipt, FileText, Send, CheckCircle2, XCircle, AlertCircle, Eye, Printer, ShieldCheck, Settings, RefreshCw, Key, Building2 } from 'lucide-react'
import { transmitInvoice, cancelInvoice } from '@/app/actions/invoice'
import Link from 'next/link'

interface InvoiceItem {
  id: string
  type: string
  description: string
  ncm: string | null
  serviceCode: string | null
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Invoice {
  id: string
  type: string
  status: string
  number: number | null
  series: number | null
  accessKey: string | null
  protocol: string | null
  pdfUrl: string | null
  xmlUrl: string | null
  errorMessage: string | null
  laborTotal: number
  partsTotal: number
  taxTotal: number
  finalTotal: number
  issuedAt: Date | null
  createdAt: Date
  customer: {
    name: string
    document: string | null
    email: string | null
    phone: string
  }
  budget: {
    id: string
    vehicle: {
      plate: string
      brand: string
      model: string
    }
  } | null
  items: InvoiceItem[]
}

export default function InvoicesClient({ initialInvoices, tenant }: { initialInvoices: Invoice[], tenant: any }) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancellingInvoiceId, setCancellingInvoiceId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')

  const filteredInvoices = initialInvoices.filter(inv => {
    if (statusFilter === 'ALL') return true
    return inv.status === statusFilter
  })

  // Indicadores
  const totalIssued = initialInvoices.filter(i => i.status === 'AUTHORIZED').length
  const totalPending = initialInvoices.filter(i => i.status === 'DRAFT' || i.status === 'PENDING').length
  const totalTax = initialInvoices
    .filter(i => i.status === 'AUTHORIZED')
    .reduce((acc, item) => acc + item.taxTotal, 0)
  
  const isApiConfigured = Boolean(tenant?.nfeApiToken)
  const environmentLabel = tenant?.nfeEnvironment === 'PRODUCTION' ? 'PRODUÇÃO (SEFAZ)' : 'HOMOLOGAÇÃO (TESTES)'

  const handleTransmit = async (id: string) => {
    if (confirm('Deseja autorizar e transmitir esta Nota Fiscal? O estoque de peças vinculadas será baixado automaticamente em tempo real.')) {
      setLoading(true)
      try {
        await transmitInvoice(id)
        alert('Nota Fiscal Autorizada com sucesso! Chave de Acesso emitida e Estoque atualizado em tempo real.')
      } catch (err: any) {
        alert(err.message || 'Erro ao transmitir nota fiscal')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cancellingInvoiceId) return
    setLoading(true)
    try {
      await cancelInvoice(cancellingInvoiceId, cancelReason)
      setIsCancelModalOpen(false)
      setCancelReason('')
      setCancellingInvoiceId(null)
      alert('Nota Fiscal cancelada com sucesso! O estoque foi estornado.')
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar nota fiscal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-100 tracking-tight">Central de Notas Fiscais Eletrônicas</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
              tenant?.nfeEnvironment === 'PRODUCTION'
                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
            }`}>
              {environmentLabel}
            </span>
          </div>
          <p className="text-sm text-neutral-400">Emissão de NFS-e (Serviços) e NF-e (Peças), controle fiscal e integração em tempo real.</p>
        </div>

        <Link
          href="/settings"
          className="inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Settings className="w-4 h-4 text-neutral-400" />
          <span>Configurações Fiscais</span>
        </Link>
      </div>

      {/* Cards de Status e Informações Fiscais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Notas Autorizadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{totalIssued}</div>
          <p className="text-xs text-neutral-500">Transmitidas com Chave de 44 dígitos</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Pendentes / Rascunho</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">{totalPending}</div>
          <p className="text-xs text-neutral-500">Prontas para emissão e transmissão</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Impostos Estimados</span>
            <Receipt className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-300">
            R$ {totalTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-neutral-500">Simples Nacional (~6,5% apurado)</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Status da API Fiscal</span>
            <ShieldCheck className={`w-4 h-4 ${isApiConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            {isApiConfigured ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Conectada (Pronta)
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Modo Simulação (Pronta)
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500">
            {isApiConfigured ? 'Token de API ativo' : 'Pronto para integrar Token'}
          </p>
        </div>
      </div>

      {/* Filtro por Status */}
      <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-2 overflow-x-auto">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            statusFilter === 'ALL' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Todas ({initialInvoices.length})
        </button>
        <button
          onClick={() => setStatusFilter('AUTHORIZED')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            statusFilter === 'AUTHORIZED' ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Autorizadas ({initialInvoices.filter(i => i.status === 'AUTHORIZED').length})
        </button>
        <button
          onClick={() => setStatusFilter('DRAFT')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            statusFilter === 'DRAFT' ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Rascunho ({initialInvoices.filter(i => i.status === 'DRAFT').length})
        </button>
        <button
          onClick={() => setStatusFilter('CANCELLED')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            statusFilter === 'CANCELLED' ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Canceladas ({initialInvoices.filter(i => i.status === 'CANCELLED').length})
        </button>
      </div>

      {/* Tabela de Notas Fiscais */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-950 text-neutral-400 font-medium text-xs uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="px-4 py-3">Nº / Série</th>
                <th className="px-4 py-3">Cliente / Destinatário</th>
                <th className="px-4 py-3">Veículo</th>
                <th className="px-4 py-3">Tipo de Nota</th>
                <th className="px-4 py-3 text-right">Valor Total</th>
                <th className="px-4 py-3 text-center">Status Fiscal</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    Nenhuma Nota Fiscal encontrada neste filtro.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  return (
                    <tr key={inv.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs">
                        <div className="font-bold text-white">
                          {inv.number ? `Nº ${inv.number.toString().padStart(6, '0')}` : 'RASCUNHO'}
                        </div>
                        <div className="text-[11px] text-neutral-500">Série {inv.series || 1}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-neutral-200">{inv.customer.name}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">
                          {inv.customer.document || 'Sem CPF/CNPJ'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {inv.budget?.vehicle ? (
                          <div>
                            <div className="font-mono text-xs text-blue-400 font-bold">{inv.budget.vehicle.plate}</div>
                            <div className="text-[11px] text-neutral-500">{inv.budget.vehicle.brand} {inv.budget.vehicle.model}</div>
                          </div>
                        ) : (
                          <span className="text-neutral-500 text-xs">Venda Avulsa</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {inv.type === 'NFSE_SERVICE' ? 'NFS-e (Serviço)' : inv.type === 'NFE_PARTS' ? 'NF-e (Peças)' : 'NFS-e + NF-e (Mista)'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400">
                        R$ {inv.finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {inv.status === 'AUTHORIZED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>AUTORIZADA</span>
                          </span>
                        )}
                        {inv.status === 'DRAFT' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>RASCUNHO</span>
                          </span>
                        )}
                        {inv.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>CANCELADA</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {inv.status === 'DRAFT' && (
                            <button
                              onClick={() => handleTransmit(inv.id)}
                              disabled={loading}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                              title="Transmitir para Autorização SEFAZ"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Emitir NF</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-medium inline-flex items-center gap-1 border border-neutral-700 transition-colors"
                            title="Visualizar Espelho / DANFE"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span>Ver Nota</span>
                          </button>

                          <a
                            href={`/print/invoices/${inv.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1 border border-neutral-700 transition-colors"
                            title="Abrir e Imprimir PDF da Nota Fiscal"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Imprimir PDF</span>
                          </a>

                          {inv.status === 'AUTHORIZED' && (
                            <button
                              onClick={() => {
                                setCancellingInvoiceId(inv.id)
                                setIsCancelModalOpen(true)
                              }}
                              className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                              title="Cancelar Nota Fiscal"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Espelho / DANFE Visualizer */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">
                  Espelho da Nota Fiscal - {selectedInvoice.number ? `Nº ${selectedInvoice.number.toString().padStart(6, '0')}` : 'Rascunho'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-neutral-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Cabeçalho da Nota */}
            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-base">{tenant?.name || 'Auto Elétrica Sérgio Car'}</h3>
                  <p className="text-xs text-neutral-400">CNPJ: {tenant?.document || '22.980.022/0001-06'} | IE: {tenant?.ie || '123.456.789'}</p>
                  <p className="text-xs text-neutral-400">{tenant?.address}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono bg-neutral-800 text-neutral-300 px-2 py-1 rounded">
                    SÉRIE: {selectedInvoice.series || 1}
                  </span>
                </div>
              </div>

              {selectedInvoice.accessKey ? (
                <div className="border-t border-neutral-800 pt-2 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block">Chave de Acesso (SEFAZ)</span>
                  <p className="text-xs font-mono text-emerald-400 break-all bg-black/50 p-2 rounded border border-neutral-800">
                    {selectedInvoice.accessKey}
                  </p>
                  {selectedInvoice.protocol && (
                    <p className="text-[11px] text-neutral-400 font-mono">
                      Protocolo de Autorização: <span className="text-white font-bold">{selectedInvoice.protocol}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="border-t border-neutral-800 pt-2 text-xs text-amber-400 font-medium">
                  ⚠️ NOTA EM RASCUNHO (Aguardando transmissão para gerar Chave SEFAZ de 44 dígitos)
                </div>
              )}
            </div>

            {/* Destinatário */}
            <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Destinatário / Cliente</span>
              <p className="text-sm font-bold text-white">{selectedInvoice.customer.name}</p>
              <p className="text-xs text-neutral-400">CPF/CNPJ: {selectedInvoice.customer.document || 'Não informado'} | Tel: {selectedInvoice.customer.phone}</p>
            </div>

            {/* Itens discriminados */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase font-bold text-neutral-400 tracking-wider">Produtos e Serviços Discriminados</h4>
              <div className="border border-neutral-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left text-neutral-300">
                  <thead className="bg-neutral-950 text-neutral-400 font-medium uppercase border-b border-neutral-800">
                    <tr>
                      <th className="p-2">Tipo</th>
                      <th className="p-2">Descrição</th>
                      <th className="p-2">NCM / Serv.</th>
                      <th className="p-2 text-center">Qtd</th>
                      <th className="p-2 text-right">V. Unit</th>
                      <th className="p-2 text-right">V. Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {selectedInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2 font-bold text-[10px]">
                          {item.type === 'PART' ? <span className="text-blue-400">PEÇA</span> : <span className="text-emerald-400">SERVIÇO</span>}
                        </td>
                        <td className="p-2">{item.description}</td>
                        <td className="p-2 font-mono text-neutral-400">{item.ncm || item.serviceCode || '-'}</td>
                        <td className="p-2 text-center">{item.quantity} {item.unit}</td>
                        <td className="p-2 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                        <td className="p-2 text-right font-bold text-white">R$ {item.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totais */}
            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex justify-between items-center text-sm">
              <div className="space-y-0.5">
                <p className="text-xs text-neutral-400">Total Peças: <span className="text-white font-mono">R$ {selectedInvoice.partsTotal.toFixed(2)}</span></p>
                <p className="text-xs text-neutral-400">Total Mão de Obra: <span className="text-white font-mono">R$ {selectedInvoice.laborTotal.toFixed(2)}</span></p>
                <p className="text-xs text-neutral-400">Imposto Aproximado (~6.5%): <span className="text-blue-400 font-mono">R$ {selectedInvoice.taxTotal.toFixed(2)}</span></p>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-500 uppercase font-semibold">Valor Total da Nota</span>
                <p className="text-xl font-bold text-emerald-400 font-mono">
                  R$ {selectedInvoice.finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <a
                href={`/print/invoices/${selectedInvoice.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / PDF (DANFE A4)</span>
              </a>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white rounded-lg border border-neutral-800"
              >
                Fechar Espelho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span>Cancelar Nota Fiscal Eletrônica</span>
              </h3>
              <button onClick={() => setIsCancelModalOpen(false)} className="text-neutral-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Justificativa de Cancelamento (mínimo 15 caracteres) *
                </label>
                <textarea
                  required
                  minLength={15}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Erro no preenchimento do valor do serviço acordado com o cliente."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500 h-28"
                />
              </div>

              <p className="text-xs text-neutral-500">
                ⚠️ O cancelamento estornará automaticamente a quantidade de peças baixadas no estoque.
              </p>

              <div className="flex justify-end gap-3 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 text-sm text-neutral-400 hover:text-white rounded-lg border border-neutral-800"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading || cancelReason.length < 15}
                  className="px-5 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
