import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { CheckSquare, Circle, X } from 'lucide-react'

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
    <div className="bg-white min-h-screen text-black font-sans print:p-0 p-8 flex justify-center">
      <div className="w-[210mm] min-h-[297mm] bg-white print:shadow-none shadow-xl border border-neutral-200 print:border-none p-10 print:scale-[0.88] print:origin-top relative">
        
        {/* CABEÇALHO DA OFICINA */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-neutral-900 text-white rounded-lg flex items-center justify-center font-bold text-2xl tracking-tighter">
              {tenant?.name?.substring(0, 2).toUpperCase() || 'OF'}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-black uppercase">{tenant?.name || 'OFICINA NÃO CONFIGURADA'}</h1>
              <p className="text-sm font-medium text-neutral-600">CNPJ: {tenant?.document || '00.000.000/0000-00'}</p>
              <p className="text-sm text-neutral-600">{tenant?.address || 'Endereço não configurado'}</p>
              <p className="text-sm text-neutral-600">{tenant?.phone || 'Telefone não configurado'}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black uppercase tracking-widest text-black">VISTORIA</h2>
            <p className="text-sm font-mono text-neutral-500 font-medium">#{checklist.id.substring(0, 8).toUpperCase()}</p>
            <p className="text-sm text-neutral-500 mt-2">Data: {new Date(checklist.createdAt).toLocaleDateString('pt-BR')}</p>
            <p className="text-sm text-neutral-500">Hora: {new Date(checklist.createdAt).toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>

        {/* DADOS CLIENTE E VEÍCULO */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 border-b border-neutral-200 pb-1">Cliente</h3>
            <p className="font-bold text-lg text-black">{checklist.customer.name}</p>
            <p className="text-sm text-neutral-700">{checklist.customer.phone}</p>
            {checklist.customer.document && <p className="text-sm text-neutral-700">CPF/CNPJ: {checklist.customer.document}</p>}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 border-b border-neutral-200 pb-1">Veículo</h3>
            <p className="font-bold text-lg text-black">{checklist.vehicle.brand} {checklist.vehicle.model}</p>
            <p className="text-sm text-neutral-700 font-mono">Placa: {checklist.vehicle.plate}</p>
            <p className="text-sm text-neutral-700">Ano: {checklist.vehicle.year}</p>
          </div>
        </div>

        {/* MARCADOR DE COMBUSTÍVEL */}
        <div className="mb-8 p-4 border border-neutral-300 rounded-lg bg-neutral-50/50 print:bg-transparent">
          <h3 className="text-sm font-bold uppercase tracking-widest text-black mb-4">Nível de Combustível</h3>
          <div className="flex flex-col items-center max-w-sm mx-auto">
            <div className="w-full h-4 bg-neutral-200 rounded-full overflow-hidden mb-2 border border-neutral-300">
              <div 
                className="h-full bg-black rounded-full print:bg-black" 
                style={{ width: `${checklist.fuelLevel}%`, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              />
            </div>
            <div className="w-full flex justify-between text-xs font-bold text-neutral-500 font-mono">
              <span>E (Vazio)</span>
              <span>1/2</span>
              <span>F (Cheio)</span>
            </div>
            <div className="mt-2 text-xl font-bold text-black font-mono tracking-tight">
              {checklist.fuelLevel}%
            </div>
          </div>
        </div>

        {/* LISTA DE ITENS */}
        <div className="mb-12">
          <h3 className="text-sm font-bold uppercase tracking-widest text-black mb-4 border-b border-neutral-300 pb-2">Inspeção Visual e Componentes</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {Object.entries(itemsStatus).map(([item, status]) => (
              <div key={item} className="flex justify-between items-center border-b border-neutral-200 pb-2 border-dashed">
                <span className="text-sm font-medium text-black">{item}</span>
                <div className="flex gap-4">
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${status === 'OK' ? 'text-black' : 'text-neutral-300'}`}>
                    <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${status === 'OK' ? 'border-black bg-black text-white' : 'border-neutral-300'}`}>
                      {status === 'OK' && <CheckSquare className="w-3 h-3" />}
                    </div>
                    OK
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${status === 'AVARIA' ? 'text-black' : 'text-neutral-300'}`}>
                    <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${status === 'AVARIA' ? 'border-black bg-black text-white' : 'border-neutral-300'}`}>
                      {status === 'AVARIA' && <X className="w-3 h-3" />}
                    </div>
                    AVARIA
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${status === 'N/A' ? 'text-black' : 'text-neutral-300'}`}>
                    <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${status === 'N/A' ? 'border-black bg-black text-white' : 'border-neutral-300'}`}>
                      {status === 'N/A' && <Circle className="w-3 h-3" />}
                    </div>
                    N/A
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ASSINATURAS */}
        <div className="mt-16 pt-8 border-t border-neutral-300 grid grid-cols-2 gap-12">
          <div className="text-center">
            <div className="h-20 border-b border-black mb-2 relative">
            </div>
            <p className="font-bold text-sm uppercase">Assinatura do Cliente</p>
            <p className="text-xs text-neutral-500 mt-1">Declaro estar ciente e de acordo com o estado do veículo descrito acima no momento da entrega à oficina.</p>
          </div>
          <div className="text-center relative">
            {/* CARIMBO AUTOMÁTICO DE ASSINATURA */}
            {checklist.status === 'APROVADO' && (
              <div className="absolute top-0 left-1/2 z-20 pointer-events-none opacity-80" style={{ transform: 'translate(-50%, -20%) rotate(-15deg)' }}>
                <div className="border-4 border-emerald-600 rounded-lg p-2 text-emerald-600 inline-block bg-white/70 backdrop-blur-[2px]">
                  <div className="border-2 border-emerald-600 rounded p-4 text-center shadow-sm">
                    <h3 className="font-black text-2xl uppercase tracking-widest leading-none mb-1">Aprovado</h3>
                    <p className="font-bold text-[10px] uppercase tracking-wider">{tenant?.name}</p>
                    <p className="font-mono text-[10px] font-bold mt-1 border-t border-emerald-600 pt-1">
                      {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {checklist.status === 'RECUSADO' && (
              <div className="absolute top-0 left-1/2 z-20 pointer-events-none opacity-80" style={{ transform: 'translate(-50%, -20%) rotate(-15deg)' }}>
                <div className="border-4 border-red-600 rounded-lg p-2 text-red-600 inline-block bg-white/70 backdrop-blur-[2px]">
                  <div className="border-2 border-red-600 rounded p-4 text-center shadow-sm">
                    <h3 className="font-black text-2xl uppercase tracking-widest leading-none mb-1">Recusado</h3>
                    <p className="font-bold text-[10px] uppercase tracking-wider">{tenant?.name}</p>
                    <p className="font-mono text-[10px] font-bold mt-1 border-t border-red-600 pt-1">
                      {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="h-20 border-b border-black mb-2 relative">
            </div>
            <p className="font-bold text-sm uppercase">Responsável da Oficina</p>
            <p className="text-xs text-neutral-500 mt-1">{tenant?.name}</p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="absolute bottom-10 left-10 right-10 text-center text-[10px] text-neutral-400 font-mono border-t border-neutral-200 pt-4">
          Documento gerado em {new Date().toLocaleString('pt-BR')} • {tenant?.name} • ID: {checklist.id}
        </div>
      </div>
      
      {/* SCRIPT DE AUTO-PRINT */}
      <script dangerouslySetInnerHTML={{ __html: `
        window.onload = function() {
          setTimeout(() => {
            window.print();
          }, 500);
        }
      `}} />
    </div>
  )
}
