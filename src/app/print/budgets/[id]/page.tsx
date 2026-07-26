import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { AutoPrint } from '@/components/AutoPrint'

export default async function PrintLegalBudgetPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  
  const budget = await prisma.budget.findUnique({
    where: { 
      id: params.id,
      tenantId: session.tenantId 
    },
    include: {
      tenant: true,
      customer: true,
      vehicle: true,
      items: {
        orderBy: { id: 'asc' }
      }
    }
  })
  
  if (!budget) {
    notFound()
  }

  const parts = budget.items.filter(i => i.type === 'PART')
  const labor = budget.items.filter(i => i.type === 'LABOR')

  const isExpired = new Date(budget.validUntil) < new Date() && budget.status !== 'APPROVED';
  const showGiantStamp = budget.status === 'REJECTED' || isExpired || budget.status === 'DRAFT' || budget.status === 'SENT';

  let stampText = '';
  let stampColor = '';
  
  if (budget.status === 'REJECTED') {
    stampText = 'RECUSADO';
    stampColor = 'border-red-600 text-red-600';
  } else if (isExpired) {
    stampText = 'VENCIDO';
    stampColor = 'border-amber-600 text-amber-600';
  } else if (budget.status === 'DRAFT' || budget.status === 'SENT') {
    stampText = 'PENDENTE';
    stampColor = 'border-blue-600 text-blue-600';
  }

  return (
    <div className="bg-white text-black min-h-screen font-sans p-8 print:p-0 text-sm relative">
      <AutoPrint />
      
      {/* Container A4 format */}
      <div className="max-w-[210mm] mx-auto bg-white print:max-w-none print:shadow-none print:w-full print:m-0 relative overflow-hidden">
        
        {/* GIANT STAMP */}
        {showGiantStamp && (
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.15]">
            <div className={`border-[12px] ${stampColor} rounded-3xl p-8`} style={{ transform: 'rotate(-30deg)' }}>
              <h2 className={`font-black text-[120px] uppercase tracking-[0.2em] leading-none ${stampColor}`}>
                {stampText}
              </h2>
            </div>
          </div>
        )}
        
        {/* CABEÇALHO DO DOCUMENTO */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4 relative z-10">
          <div className="flex-1">
            <h1 className="text-2xl font-bold uppercase tracking-tight">{budget.tenant.name}</h1>
            <div className="text-xs mt-1 space-y-0.5 text-black">
              {budget.tenant.document && <p>CNPJ: {budget.tenant.document}</p>}
              {budget.tenant.address && <p>Endereço: {budget.tenant.address}</p>}
              {budget.tenant.phone && <p>Telefone: {budget.tenant.phone}</p>}
            </div>
          </div>
          <div className="w-[300px] border border-black p-3 text-center bg-gray-50">
            <h2 className="font-bold text-lg uppercase leading-tight mb-2">Orçamento de Serviços</h2>
            <div className="text-xs text-left grid grid-cols-2 gap-1 font-medium">
              <span>Nº do Doc:</span> <span className="font-mono text-right">{budget.id.substring(0, 8).toUpperCase()}</span>
              <span>Emissão:</span> <span className="font-mono text-right">{new Date(budget.createdAt).toLocaleDateString('pt-BR')}</span>
              <span>Validade:</span> <span className="font-mono text-right">{new Date(budget.validUntil).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* DADOS DO CLIENTE E VEÍCULO */}
        <div className="border border-black mb-6 relative z-10">
          <div className="bg-gray-100 border-b border-black px-2 py-1 font-bold text-xs uppercase tracking-wider">
            Identificação do Consumidor e Veículo
          </div>
          <div className="p-2 grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <p><span className="font-bold">Cliente:</span> {budget.customer.name}</p>
              <p><span className="font-bold">CPF/CNPJ:</span> {budget.customer.document || 'Não informado'}</p>
              <p><span className="font-bold">Telefone:</span> {budget.customer.phone}</p>
              {budget.customer.email && <p><span className="font-bold">E-mail:</span> {budget.customer.email}</p>}
            </div>
            <div className="space-y-1">
              <p><span className="font-bold">Veículo:</span> {budget.vehicle.brand} {budget.vehicle.model}</p>
              <p><span className="font-bold">Placa:</span> <span className="font-mono uppercase">{budget.vehicle.plate}</span></p>
              <p><span className="font-bold">Ano/Motor:</span> {budget.vehicle.year} - {budget.vehicle.engineType}</p>
              {budget.vehicle.mileage && <p><span className="font-bold">Quilometragem:</span> {budget.vehicle.mileage.toLocaleString('pt-BR')} km</p>}
            </div>
          </div>
        </div>

        {/* DISCRIMINAÇÃO DOS SERVIÇOS (MÃO DE OBRA) */}
        <div className="mb-4 relative z-10">
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 border-b border-black text-left">
                <th colSpan={4} className="p-1.5 uppercase tracking-wider border-black">1. Discriminação da Mão de Obra (Serviços)</th>
              </tr>
              <tr className="border-b border-black bg-white">
                <th className="p-1.5 border-r border-black w-auto">Descrição do Serviço</th>
                <th className="p-1.5 border-r border-black w-16 text-center">Qtd</th>
                <th className="p-1.5 border-r border-black w-28 text-right">V. Unitário (R$)</th>
                <th className="p-1.5 w-28 text-right">V. Total (R$)</th>
              </tr>
            </thead>
            <tbody>
              {labor.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-2 text-center italic text-gray-500">Nenhum serviço registrado.</td>
                </tr>
              ) : (
                labor.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-300">
                    <td className="p-1.5 border-r border-black">{item.description}</td>
                    <td className="p-1.5 border-r border-black text-center font-mono">{item.quantity}</td>
                    <td className="p-1.5 border-r border-black text-right font-mono">{item.unitPrice.toFixed(2)}</td>
                    <td className="p-1.5 text-right font-mono">{(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-black">
                <td colSpan={3} className="p-1.5 border-r border-black text-right font-bold uppercase text-[11px]">Subtotal Mão de Obra</td>
                <td className="p-1.5 text-right font-bold font-mono">{budget.totalLabor.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* DISCRIMINAÇÃO DOS MATERIAIS (PEÇAS) */}
        <div className="mb-6 relative z-10">
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 border-b border-black text-left">
                <th colSpan={4} className="p-1.5 uppercase tracking-wider border-black">2. Discriminação dos Materiais e Peças</th>
              </tr>
              <tr className="border-b border-black bg-white">
                <th className="p-1.5 border-r border-black w-auto">Descrição da Peça</th>
                <th className="p-1.5 border-r border-black w-16 text-center">Qtd</th>
                <th className="p-1.5 border-r border-black w-28 text-right">V. Unitário (R$)</th>
                <th className="p-1.5 w-28 text-right">V. Total (R$)</th>
              </tr>
            </thead>
            <tbody>
              {parts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-2 text-center italic text-gray-500">Nenhuma peça registrada.</td>
                </tr>
              ) : (
                parts.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-300">
                    <td className="p-1.5 border-r border-black">{item.description}</td>
                    <td className="p-1.5 border-r border-black text-center font-mono">{item.quantity}</td>
                    <td className="p-1.5 border-r border-black text-right font-mono">{item.unitPrice.toFixed(2)}</td>
                    <td className="p-1.5 text-right font-mono">{(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-black">
                <td colSpan={3} className="p-1.5 border-r border-black text-right font-bold uppercase text-[11px]">Subtotal Peças</td>
                <td className="p-1.5 text-right font-bold font-mono">{budget.totalParts.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* TOTAIS FINANCEIROS */}
        <div className="flex justify-end mb-8 relative z-10">
          <table className="w-64 text-sm border-collapse border-2 border-black bg-white">
            <tbody>
              {budget.discount > 0 && (
                <tr className="border-b border-black">
                  <td className="p-2 font-bold uppercase text-xs">Descontos</td>
                  <td className="p-2 text-right font-mono text-red-600">- {budget.discount.toFixed(2)}</td>
                </tr>
              )}
              <tr className="bg-gray-100">
                <td className="p-2 font-bold uppercase">Total Final (R$)</td>
                <td className="p-2 text-right font-bold font-mono text-lg">{budget.finalTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TERMOS LEGAIS E GARANTIA (ART 40 CDC) */}
        <div className="border border-black p-3 text-[10px] leading-relaxed mb-12 text-justify relative z-10 bg-white">
          <p className="font-bold uppercase text-[11px] mb-1">Termos e Condições (Conforme Art. 40 do Código de Defesa do Consumidor - Lei 8.078/90)</p>
          <p>
            1. O presente orçamento tem validade até a data indicada no cabeçalho. Após este prazo, os valores de peças e mão de obra estão sujeitos a reajustes.<br />
            2. Fica expressamente informado que o valor acima é uma estimativa baseada na avaliação prévia visual. Desmontagens adicionais podem revelar a necessidade de serviços ou peças extras, os quais serão comunicados e exigirão nova aprovação (Art. 40, § 2º).<br />
            3. A garantia legal para os serviços prestados é de 90 (noventa) dias, conforme o Artigo 26, inciso II, do CDC.<br />
            4. As peças substituídas poderão ser retiradas pelo consumidor no momento da entrega do veículo, salvo aquelas que envolvam troca à base de troca ou descarte ecológico obrigatório.
          </p>
          <div className="mt-3 pt-2 border-t border-gray-300 flex items-center">
            <span className="font-bold mr-2 uppercase text-[11px]">Condições de Pagamento Acordadas:</span>
            <span className="flex-1 border-b border-black inline-block ml-1"></span>
          </div>
        </div>

        {/* ASSINATURAS */}
        <div className="grid grid-cols-2 gap-16 mt-8 pt-8 relative z-10">
          
          <div className="text-center text-xs relative">
            {/* CARIMBO AUTOMÁTICO SE APROVADO */}
            {budget.status === 'APPROVED' && (
              <div className="absolute top-1/2 left-1/2 z-20 pointer-events-none opacity-80" style={{ transform: 'translate(-50%, -60%) rotate(-15deg)' }}>
                <div className="border-4 border-red-600 rounded-lg p-2 text-red-600 inline-block bg-white/70 backdrop-blur-[2px]">
                  <div className="border-2 border-red-600 rounded p-4 text-center shadow-sm">
                    <h3 className="font-black text-2xl uppercase tracking-widest leading-none mb-1">Aprovado</h3>
                    <p className="font-bold text-[10px] uppercase tracking-wider">{budget.tenant.name}</p>
                    <p className="font-mono text-[10px] font-bold mt-1 border-t border-red-600 pt-1">
                      {new Date(budget.updatedAt).toLocaleDateString('pt-BR')} {new Date(budget.updatedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="border-b border-black mb-1 w-full mt-2"></div>
            <p className="font-bold uppercase">{budget.tenant.name}</p>
            <p className="text-gray-600">Assinatura da Oficina / Técnico Responsável</p>
            <p className="text-gray-400 mt-2">___/___/______</p>
          </div>
          <div className="text-center text-xs relative">
            <div className="border-b border-black mb-1 w-full mt-2"></div>
            <p className="font-bold uppercase">{budget.customer.name}</p>
            <p className="text-gray-600">De Acordo / Autorização de Execução</p>
            <p className="text-gray-400 mt-2">___/___/______</p>
          </div>
        </div>
        
      </div>
    </div>
  )
}
