import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { CheckSquare, Circle, X } from 'lucide-react'
import type { Metadata } from 'next'

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params
  const session = await getSession()
  const checklist = await prisma.checklist.findUnique({
    where: { id: params.id, tenantId: session.tenantId },
    include: { customer: true }
  })

  if (!checklist) return { title: 'Vistoria' }
  const code = checklist.id.substring(0, 8).toUpperCase()
  const cleanCustomerName = checklist.customer.name.replace(/[^a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]/g, '').trim().replace(/\s+/g, '_')
  return {
    title: `Vistoria_${code}_${cleanCustomerName}`
  }
}

export default async function PrintChecklistPage(props: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const params = await props.params
  
  const checklist = await prisma.checklist.findUnique({
    where: { 
      id: params.id,
      tenantId: session.tenantId
    },
    include: {
      customer: true,
      vehicle: true,
    }
  })

  if (!checklist) notFound()

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId }
  })

  let itemsStatus: Record<string, string> = {}
  try {
    itemsStatus = JSON.parse(checklist.itemsStatus as string)
  } catch (e) {}

  return (
    <div className="bg-white min-h-screen text-black font-sans print:p-0 p-4 sm:p-6 flex justify-center">
      <div className="w-[210mm] max-w-full bg-white print:shadow-none shadow-xl border border-neutral-200 print:border-none p-6 print:p-2 print:w-full print:max-w-none print:m-0 relative">
        
        {/* CABEÇALHO DA OFICINA COM LOGO SÉRGIOCAR E TÍTULO VISTORIA */}
        <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-4 gap-4">
          <div className="flex-1 max-w-[480px]">
            <img 
              src="/sergiocar-header.png" 
              alt="SÉRGIOCAR - Auto Elétrica e Mecânica" 
              className="w-full h-auto object-contain"
            />
          </div>
          
          <div className="text-right shrink-0">
            <h2 className="text-3xl font-black uppercase tracking-widest text-black leading-tight">VISTORIA</h2>
            <p className="text-xs font-mono text-neutral-600 font-bold">#{checklist.id.substring(0, 8).toUpperCase()}</p>
            <p className="text-xs text-neutral-500 mt-1">Data: {new Date(checklist.createdAt).toLocaleDateString('pt-BR')}</p>
            <p className="text-xs text-neutral-500">Hora: {new Date(checklist.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* DADOS CLIENTE E VEÍCULO */}
        <div className="grid grid-cols-2 gap-4 mb-4 border border-black p-3 bg-gray-50/50 rounded">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-1 border-b border-black/20 pb-0.5">Cliente</h3>
            <p className="font-bold text-sm text-black">{checklist.customer.name}</p>
            <p className="text-xs text-neutral-800">Telefone: {checklist.customer.phone}</p>
            {checklist.customer.document && <p className="text-xs text-neutral-800">CPF/CNPJ: {checklist.customer.document}</p>}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-1 border-b border-black/20 pb-0.5">Veículo</h3>
            <p className="font-bold text-sm text-black">{checklist.vehicle.brand} {checklist.vehicle.model}</p>
            <p className="text-xs text-neutral-800 font-mono">Placa: <span className="uppercase font-bold">{checklist.vehicle.plate}</span></p>
            <p className="text-xs text-neutral-800">Ano: {checklist.vehicle.year}</p>
          </div>
        </div>

        {/* MARCADOR DE COMBUSTÍVEL */}
        <div className="mb-4 p-3 border border-black rounded bg-gray-50/30">
          <div className="flex justify-between items-center mb-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">Nível de Combustível</h3>
            <span className="text-xs font-bold text-black font-mono">{checklist.fuelLevel}%</span>
          </div>
          <div className="flex flex-col items-center max-w-md mx-auto">
            <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden mb-1 border border-neutral-400">
              <div 
                className="h-full bg-black rounded-full print:bg-black" 
                style={{ width: `${checklist.fuelLevel}%`, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              />
            </div>
            <div className="w-full flex justify-between text-[10px] font-bold text-neutral-600 font-mono">
              <span>E (Vazio)</span>
              <span>1/2</span>
              <span>F (Cheio)</span>
            </div>
          </div>
        </div>

        {/* LISTA DE ITENS */}
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-2 border-b border-black pb-1">Inspeção Visual e Componentes</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {Object.entries(itemsStatus).map(([item, status]) => (
              <div key={item} className="flex justify-between items-center border-b border-neutral-200 pb-1 text-xs">
                <span className="font-medium text-black">{item}</span>
                <div className="flex gap-3">
                  <div className={`flex items-center gap-1 text-[11px] font-bold ${status === 'OK' ? 'text-black' : 'text-neutral-300'}`}>
                    <div className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center ${status === 'OK' ? 'border-black bg-black text-white' : 'border-neutral-300'}`}>
                      {status === 'OK' && <CheckSquare className="w-2.5 h-2.5" />}
                    </div>
                    OK
                  </div>
                  <div className={`flex items-center gap-1 text-[11px] font-bold ${status === 'AVARIA' ? 'text-black' : 'text-neutral-300'}`}>
                    <div className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center ${status === 'AVARIA' ? 'border-black bg-black text-white' : 'border-neutral-300'}`}>
                      {status === 'AVARIA' && <X className="w-2.5 h-2.5" />}
                    </div>
                    AVARIA
                  </div>
                  <div className={`flex items-center gap-1 text-[11px] font-bold ${status === 'N/A' ? 'text-black' : 'text-neutral-300'}`}>
                    <div className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center ${status === 'N/A' ? 'border-black bg-black text-white' : 'border-neutral-300'}`}>
                      {status === 'N/A' && <Circle className="w-2.5 h-2.5" />}
                    </div>
                    N/A
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* OBSERVAÇÕES E INFORMAÇÕES ADICIONAIS */}
        {(checklist.reportedIssue || checklist.obd2Codes || checklist.additionalInfo) && (
          <div className="mb-4 p-3 border border-black rounded text-xs bg-gray-50/20">
            <h3 className="font-bold uppercase tracking-wider text-black mb-2 border-b border-neutral-300 pb-0.5">
              Observações & Diagnóstico Inicial
            </h3>
            
            {checklist.reportedIssue && (
              <div className="mb-1.5">
                <span className="font-bold text-neutral-700">Defeito Relatado: </span>
                <span className="font-medium text-black">{checklist.reportedIssue}</span>
              </div>
            )}

            {checklist.obd2Codes && (
              <div className="mb-1.5">
                <span className="font-bold text-neutral-700">Códigos OBD2: </span>
                <span className="font-mono font-bold text-black">{checklist.obd2Codes}</span>
              </div>
            )}

            {checklist.additionalInfo && (
              <div>
                <span className="font-bold text-neutral-700 block mb-0.5">Informações Adicionais:</span>
                <p className="text-black whitespace-pre-wrap">{checklist.additionalInfo}</p>
              </div>
            )}
          </div>
        )}

        {/* ASSINATURAS */}
        <div className="mt-6 pt-4 border-t border-black grid grid-cols-2 gap-8 text-xs">
          <div className="text-center">
            <div className="border-b border-black mb-1 w-full mt-6"></div>
            <p className="font-bold uppercase">Assinatura do Cliente</p>
            <p className="text-[10px] text-neutral-600 mt-0.5">Declaro estar ciente e de acordo com o estado do veículo descrito acima.</p>
          </div>
          <div className="text-center">
            <div className="border-b border-black mb-1 w-full mt-6"></div>
            <p className="font-bold uppercase">Responsável da Oficina</p>
            <p className="text-[10px] text-neutral-600 mt-0.5">{tenant?.name}</p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-4 text-center text-[10px] text-neutral-500 font-mono border-t border-neutral-200 pt-2">
          Documento gerado em {new Date().toLocaleString('pt-BR')} • {tenant?.name} • ID: {checklist.id}
        </div>
      </div>
      
      {/* SCRIPT DE AUTO-PRINT RAPIDO */}
      <script dangerouslySetInnerHTML={{ __html: `
        if (document.readyState === 'complete') {
          requestAnimationFrame(function() { window.print(); });
        } else {
          window.addEventListener('load', function() {
            requestAnimationFrame(function() { window.print(); });
          });
        }
      `}} />
    </div>
  )
}
