import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { AutoPrint } from '@/components/AutoPrint'
import type { Metadata } from 'next'

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params
  const session = await getSession()
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id, tenantId: session.tenantId },
    include: { customer: true }
  })

  if (!invoice) return { title: 'NotaFiscal' }
  const docNum = invoice.number ? invoice.number.toString().padStart(6, '0') : 'RASCUNHO'
  const cleanCustomerName = invoice.customer.name.replace(/[^a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]/g, '').trim().replace(/\s+/g, '_')
  return {
    title: `NotaFiscal_NF_${docNum}_${cleanCustomerName}`
  }
}

export default async function PrintInvoicePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const session = await getSession()

  const invoice = await prisma.invoice.findUnique({
    where: {
      id: params.id,
      tenantId: session.tenantId
    },
    include: {
      tenant: true,
      customer: true,
      budget: {
        include: { vehicle: true }
      },
      items: {
        orderBy: { id: 'asc' }
      }
    }
  })

  if (!invoice) {
    notFound()
  }

  const parts = invoice.items.filter(i => i.type === 'PART')
  const services = invoice.items.filter(i => i.type === 'SERVICE' || i.type !== 'PART')

  return (
    <div className="bg-white text-black min-h-screen font-sans p-8 print:p-0 text-sm relative">
      <AutoPrint />

      {/* Container A4 */}
      <div className="max-w-[210mm] mx-auto bg-white print:max-w-none print:shadow-none print:w-full print:m-0 print:scale-[0.92] print:origin-top relative overflow-visible">
        
        {/* TOPO: BANNER DANFE / SEFAZ */}
        <div className="border-2 border-black p-3 mb-4 flex justify-between items-center gap-4 bg-gray-50">
          <div className="flex-1">
            <h1 className="font-bold text-lg uppercase tracking-tight text-black">DANFE - Documento Auxiliar da Nota Fiscal</h1>
            <p className="text-xs font-semibold text-gray-700">0 - ENTRADA | 1 - SAÍDA [ 1 ]</p>
            <p className="text-xs text-gray-600">Nº {invoice.number ? invoice.number.toString().padStart(6, '0') : 'RASCUNHO'} | SÉRIE {invoice.series || 1}</p>
          </div>
          <div className="text-right border-l-2 border-black pl-4">
            <span className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded border ${
              invoice.status === 'AUTHORIZED' ? 'bg-black text-white border-black' : 'bg-gray-200 text-black border-black'
            }`}>
              {invoice.status === 'AUTHORIZED' ? 'NFe AUTORIZADA SEFAZ' : 'EMISSÃO EM RASCUNHO'}
            </span>
          </div>
        </div>

        {/* EMISSOR (OFICINA) */}
        <div className="border border-black mb-4">
          <div className="bg-gray-100 border-b border-black px-2 py-1 font-bold text-xs uppercase tracking-wider">
            1. Emitente / Prestador dos Serviços e Peças
          </div>
          <div className="p-3 grid grid-cols-2 gap-4 text-xs">
            <div>
              <h2 className="font-bold text-sm uppercase">{invoice.tenant.name || 'Auto Elétrica Sérgio Car'}</h2>
              <p className="text-gray-700 mt-0.5">{invoice.tenant.address || 'Rua Jacob Weingatner, 4198 - Centro - CEP 88131-400 - Palhoça/SC'}</p>
              <p className="text-gray-700 font-semibold">Telefone: {invoice.tenant.phone || '(48) 99172-7541'}</p>
            </div>
            <div className="space-y-1 font-mono text-xs">
              <p><span className="font-bold">CNPJ:</span> {invoice.tenant.document || '22.980.022/0001-06'}</p>
              <p><span className="font-bold">Inscrição Estadual (IE):</span> {invoice.tenant.ie || '123.456.789'}</p>
              <p><span className="font-bold">Inscrição Municipal (IM):</span> {invoice.tenant.im || '987654'}</p>
              <p><span className="font-bold">Regime Tributário:</span> {invoice.tenant.taxRegime || 'SIMPLES NACIONAL'}</p>
            </div>
          </div>
        </div>

        {/* CHAVE DE ACESSO E PROTOCOLO (SEFAZ) */}
        <div className="border border-black mb-4 p-2 bg-gray-50">
          <div className="text-[10px] uppercase font-bold text-gray-700">Chave de Acesso da NF-e (SEFAZ)</div>
          <div className="font-mono text-xs font-bold text-black tracking-widest my-1 p-1.5 border border-black bg-white">
            {invoice.accessKey || '42260822980022000106550010000001011000000000'}
          </div>
          {invoice.protocol && (
            <div className="text-xs font-mono text-gray-800">
              Protocolo de Autorização de Uso: <span className="font-bold">{invoice.protocol}</span> - Data: {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}
            </div>
          )}
        </div>

        {/* DESTINATÁRIO (CLIENTE E VEÍCULO) */}
        <div className="border border-black mb-4">
          <div className="bg-gray-100 border-b border-black px-2 py-1 font-bold text-xs uppercase tracking-wider">
            2. Destinatário / Tomador dos Serviços
          </div>
          <div className="p-3 grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <p><span className="font-bold">Nome / Razão Social:</span> {invoice.customer.name}</p>
              <p><span className="font-bold">CPF / CNPJ:</span> {invoice.customer.document || 'Não informado'}</p>
              <p><span className="font-bold">Telefone:</span> {invoice.customer.phone}</p>
              {invoice.customer.email && <p><span className="font-bold">E-mail:</span> {invoice.customer.email}</p>}
            </div>
            <div className="space-y-1">
              {invoice.budget?.vehicle ? (
                <>
                  <p><span className="font-bold">Veículo Atendido:</span> {invoice.budget.vehicle.brand} {invoice.budget.vehicle.model}</p>
                  <p><span className="font-bold">Placa:</span> <span className="font-mono uppercase font-bold">{invoice.budget.vehicle.plate}</span></p>
                  <p><span className="font-bold">Ano/Combustível:</span> {invoice.budget.vehicle.year} - {invoice.budget.vehicle.engineType}</p>
                </>
              ) : (
                <p><span className="font-bold">Modalidade:</span> Venda de Balcão / Venda Direta</p>
              )}
              <p><span className="font-bold">Data de Emissão:</span> {new Date(invoice.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* TABELA DE PRODUTOS E SERVIÇOS */}
        <div className="mb-4">
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 border-b border-black text-left">
                <th colSpan={6} className="p-1.5 uppercase tracking-wider border-black font-bold">
                  3. Discriminação dos Produtos (Peças) e Serviços
                </th>
              </tr>
              <tr className="border-b border-black bg-white text-center font-bold">
                <th className="p-1.5 border-r border-black text-left">Tipo</th>
                <th className="p-1.5 border-r border-black text-left">Descrição do Item</th>
                <th className="p-1.5 border-r border-black">NCM / Cód. Serv.</th>
                <th className="p-1.5 border-r border-black w-16">Qtd</th>
                <th className="p-1.5 border-r border-black w-24 text-right">V. Unit (R$)</th>
                <th className="p-1.5 w-28 text-right">V. Total (R$)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="p-1.5 border-r border-black font-bold text-[10px]">
                    {item.type === 'PART' ? 'PEÇA (NF-e)' : 'SERVIÇO (NFS-e)'}
                  </td>
                  <td className="p-1.5 border-r border-black">{item.description}</td>
                  <td className="p-1.5 border-r border-black text-center font-mono">{item.ncm || item.serviceCode || '-'}</td>
                  <td className="p-1.5 border-r border-black text-center font-mono">{item.quantity} {item.unit}</td>
                  <td className="p-1.5 border-r border-black text-right font-mono">{item.unitPrice.toFixed(2)}</td>
                  <td className="p-1.5 text-right font-mono font-bold">{(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTAIS E CÁLCULO DO IMPOSTO */}
        <div className="border-2 border-black p-3 mb-6 bg-gray-50 grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <p><span className="font-bold">Total em Serviços (Mão de Obra):</span> <span className="font-mono">R$ {invoice.laborTotal.toFixed(2)}</span></p>
            <p><span className="font-bold">Total em Peças / Mercadorias:</span> <span className="font-mono">R$ {invoice.partsTotal.toFixed(2)}</span></p>
            <p className="text-gray-700 italic text-[11px] pt-1">
              Valor aproximado dos tributos federais, estaduais e municipais: <span className="font-bold font-mono">R$ {invoice.taxTotal.toFixed(2)}</span> (Conforme Lei 12.741/2012 - IBPT/Simples Nacional).
            </p>
          </div>
          <div className="text-right border-l border-black pl-4 flex flex-col justify-center">
            <span className="text-xs uppercase font-bold text-gray-700">VALOR TOTAL DA NOTA FISCAL</span>
            <p className="text-2xl font-bold font-mono text-black">R$ {invoice.finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* DADOS COMPLEMENTARES / OBSERVAÇÕES */}
        <div className="border border-black p-3 text-[10px] leading-relaxed mb-8 bg-white">
          <span className="font-bold uppercase block mb-1">Informações Complementares de Interesse do Contribuinte</span>
          <p>
            Documento emitido por ME ou EPP optante pelo Simples Nacional. Não gera direito a crédito fiscal de IPI.<br />
            Baixa de estoque efetuada automaticamente em tempo real.<br />
            Sistema de Gestão SaaS da Oficina Auto Elétrica Sérgio Car - SC.
          </p>
        </div>

        {/* CANHOTO DE RECEBIMENTO */}
        <div className="border-t-2 border-dashed border-black pt-4 mt-6">
          <div className="border border-black p-3 text-xs grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1">
              <p className="font-bold">RECEBEMOS DE {invoice.tenant.name || 'AUTO ELÉTRICA SÉRGIO CAR'} OS PRODUTOS/SERVIÇOS CONSTANTES DA NF-E INDICADA AO LADO.</p>
              <p>DATA DE RECEBIMENTO: ___/___/______ | IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR: ___________________________________</p>
            </div>
            <div className="text-right border-l border-black pl-3 font-mono">
              <p className="font-bold">NF-e / DANFE</p>
              <p>Nº {invoice.number ? invoice.number.toString().padStart(6, '0') : 'RASCUNHO'}</p>
              <p>SÉRIE {invoice.series || 1}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
