'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { 
  UserPlus, 
  Car, 
  ClipboardCheck, 
  Search, 
  Check, 
  AlertTriangle, 
  XCircle, 
  Fuel, 
  FileText, 
  Loader2, 
  CheckCircle2,
  Sparkles,
  ArrowRight,
  UserCheck
} from 'lucide-react'
import { createUnifiedReception } from '@/app/actions/unifiedReception'
import ImageUploader from '@/components/ImageUploader'
import VehicleDamageMapper3D, { DamagePin } from '@/components/VehicleDamageMapper3D'

interface CustomerOption {
  id: string
  name: string
  phone: string
  document?: string | null
  vehicles?: { id: string; plate: string; brand: string; model: string }[]
}

interface UnifiedReceptionFormProps {
  existingCustomers: CustomerOption[]
}

const CHECKLIST_ITEMS = [
  { id: 'farois', name: 'Faróis e Lanternas' },
  { id: 'buzina', name: 'Buzina e Alarme' },
  { id: 'limpadores', name: 'Limpador de Para-brisa' },
  { id: 'oleo', name: 'Nível do Óleo do Motor' },
  { id: 'freios', name: 'Fluido de Freio' },
  { id: 'bateria', name: 'Estado da Bateria' },
  { id: 'pneus', name: 'Calibragem e Pneus' },
  { id: 'extintor', name: 'Extintor / Kit Emergência' },
  { id: 'lataria', name: 'Pintura e Lataria (Arranhões)' },
  { id: 'vidros', name: 'Vidros e Retrovisores' },
]

export default function UnifiedReceptionForm({ existingCustomers }: UnifiedReceptionFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Cliente State
  const [customerMode, setCustomerMode] = useState<'NEW' | 'EXISTING'>('NEW')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [customerSearch, setCustomerSearch] = useState('')

  // Veículo State
  const [vehicleMode, setVehicleMode] = useState<'NEW' | 'EXISTING'>('NEW')
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')

  // Checklist State
  const [fuelLevel, setFuelLevel] = useState<number>(50)
  const [reportedIssue, setReportedIssue] = useState<string>('')
  const [additionalInfo, setAdditionalInfo] = useState<string>('')
  const [obd2Codes, setObd2Codes] = useState<string>('')

  const [images, setImages] = useState<string[]>([])
  const [damagePins, setDamagePins] = useState<DamagePin[]>([])

  // Status de cada item: 'OK' | 'WARNING' | 'BAD'
  const [itemsStatus, setItemsStatus] = useState<Record<string, 'OK' | 'WARNING' | 'BAD'>>(() => {
    const initial: Record<string, 'OK' | 'WARNING' | 'BAD'> = {}
    CHECKLIST_ITEMS.forEach(item => {
      initial[item.id] = 'OK'
    })
    return initial
  })

  // Filtragem de clientes
  const filteredCustomers = existingCustomers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch) ||
    (c.document && c.document.includes(customerSearch))
  )

  const selectedCustomerObj = existingCustomers.find(c => c.id === selectedCustomerId)
  const customerVehicles = selectedCustomerObj?.vehicles || []

  function handleItemStatusChange(itemId: string, status: 'OK' | 'WARNING' | 'BAD') {
    setItemsStatus(prev => ({ ...prev, [itemId]: status }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMsg(null)

    const formData = new FormData(e.currentTarget)
    formData.set('customerMode', customerMode)
    if (customerMode === 'EXISTING') {
      formData.set('customerId', selectedCustomerId)
    }

    formData.set('vehicleMode', vehicleMode)
    if (vehicleMode === 'EXISTING') {
      formData.set('vehicleId', selectedVehicleId)
    }

    formData.set('fuelLevel', fuelLevel.toString())
    formData.set('itemsStatus', JSON.stringify(itemsStatus))
    formData.set('imagesUrls', JSON.stringify(images))
    formData.set('damagePins', JSON.stringify(damagePins))

    startTransition(async () => {
      const res = await createUnifiedReception(formData)

      if (res.success && res.data) {
        setSuccessMsg('Recepção e Vistoria registradas com sucesso!')
        setTimeout(() => {
          router.push(`/checklists/${res.data?.checklistId}`)
          router.refresh()
        }, 800)
      } else {
        setErrorMessage(res.message || 'Erro ao registrar recepção.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-center gap-3 animate-in fade-in">
          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="font-semibold">Erro ao salvar a recepção</p>
            <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold">{successMsg}</p>
            <p className="text-xs text-emerald-700 mt-0.5">Redirecionando para a vistoria completa...</p>
          </div>
        </div>
      )}

      {/* 1. SEÇÃO DO CLIENTE */}
      <section className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Proprietário / Cliente</h2>
              <p className="text-xs text-neutral-500">Selecione um cliente cadastrado ou cadastre um novo na hora.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setCustomerMode('NEW')
                setSelectedCustomerId('')
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                customerMode === 'NEW' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 inline mr-1" /> Novo Cliente
            </button>
            <button
              type="button"
              onClick={() => setCustomerMode('EXISTING')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                customerMode === 'EXISTING' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 inline mr-1" /> Cliente Existente
            </button>
          </div>
        </div>

        {customerMode === 'EXISTING' ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar cliente por nome, telefone ou CPF..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:border-neutral-400 focus:bg-white"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-xl divide-y divide-neutral-100 bg-neutral-50/50">
              {filteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500">
                  Nenhum cliente encontrado com a busca.
                </div>
              ) : (
                filteredCustomers.map(c => (
                  <label
                    key={c.id}
                    className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-white transition-colors ${
                      selectedCustomerId === c.id ? 'bg-indigo-50/60 border-l-4 border-indigo-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="customerRadio"
                        checked={selectedCustomerId === c.id}
                        onChange={() => {
                          setSelectedCustomerId(c.id)
                          // Ajusta o modo de veículo para 'EXISTING' se ele tiver veículos
                          if (c.vehicles && c.vehicles.length > 0) {
                            setVehicleMode('EXISTING')
                            setSelectedVehicleId(c.vehicles[0].id)
                          } else {
                            setVehicleMode('NEW')
                            setSelectedVehicleId('')
                          }
                        }}
                        className="text-black focus:ring-black"
                      />
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{c.name}</p>
                        <p className="text-xs text-neutral-500 font-mono">Tel: {c.phone} {c.document ? `• CPF: ${c.document}` : ''}</p>
                      </div>
                    </div>
                    {c.vehicles && c.vehicles.length > 0 && (
                      <span className="text-[11px] bg-neutral-200/80 text-neutral-700 font-medium px-2 py-0.5 rounded">
                        {c.vehicles.length} veículo(s)
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                Nome do Cliente *
              </label>
              <input
                type="text"
                name="customerName"
                required={customerMode === 'NEW'}
                placeholder="Ex: João da Silva"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                Telefone / WhatsApp *
              </label>
              <input
                type="text"
                name="customerPhone"
                required={customerMode === 'NEW'}
                placeholder="(48) 99999-9999"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-mono focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                CPF / CNPJ
              </label>
              <input
                type="text"
                name="customerDocument"
                placeholder="Opcional"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-mono focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
              />
            </div>
          </div>
        )}
      </section>

      {/* 2. SEÇÃO DO VEÍCULO */}
      <section className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Veículo em Atendimento</h2>
              <p className="text-xs text-neutral-500">Cadastre a placa e dados do automóvel recebido.</p>
            </div>
          </div>

          {customerMode === 'EXISTING' && customerVehicles.length > 0 && (
            <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setVehicleMode('EXISTING')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  vehicleMode === 'EXISTING' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Car className="w-3.5 h-3.5 inline mr-1" /> Veículo da Garagem
              </button>
              <button
                type="button"
                onClick={() => {
                  setVehicleMode('NEW')
                  setSelectedVehicleId('')
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  vehicleMode === 'NEW' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                + Outro Veículo
              </button>
            </div>
          )}
        </div>

        {vehicleMode === 'EXISTING' && customerVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customerVehicles.map(v => (
              <label
                key={v.id}
                className={`p-4 border rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                  selectedVehicleId === v.id ? 'border-black bg-neutral-50 shadow-sm' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="vehicleRadio"
                    checked={selectedVehicleId === v.id}
                    onChange={() => setSelectedVehicleId(v.id)}
                    className="text-black focus:ring-black"
                  />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{v.brand} {v.model}</p>
                    <p className="text-xs font-mono text-neutral-500">Placa: {v.plate}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                Placa do Veículo *
              </label>
              <input
                type="text"
                name="vehiclePlate"
                required={vehicleMode === 'NEW'}
                placeholder="ABC-1D23"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-mono uppercase focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                Marca / Fabricante *
              </label>
              <input
                type="text"
                name="vehicleBrand"
                required={vehicleMode === 'NEW'}
                placeholder="Ex: Chevrolet"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                Modelo *
              </label>
              <input
                type="text"
                name="vehicleModel"
                required={vehicleMode === 'NEW'}
                placeholder="Ex: Onix 1.0"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                Ano de Fabricação
              </label>
              <input
                type="number"
                name="vehicleYear"
                placeholder="Ex: 2022"
                defaultValue={new Date().getFullYear()}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-mono focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
              />
            </div>
          </div>
        )}
      </section>

      {/* 3. SEÇÃO DA VISTORIA / CHECKLIST */}
      <section className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            3
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Vistoria & Checklist de Entrada</h2>
            <p className="text-xs text-neutral-500">Inspeção rápida de itens e registro do estado do automóvel.</p>
          </div>
        </div>

        {/* Nível de Combustível */}
        <div className="space-y-3 bg-neutral-50/70 p-4 rounded-xl border border-neutral-200/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
              <Fuel className="w-4 h-4 text-amber-500" /> Nível do Tanque de Combustível
            </span>
            <span className="text-sm font-mono font-bold text-neutral-900">{fuelLevel}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="25"
            value={fuelLevel}
            onChange={(e) => setFuelLevel(parseInt(e.target.value, 10))}
            className="w-full accent-black cursor-pointer h-2 bg-neutral-200 rounded-lg"
          />
          <div className="flex justify-between text-[11px] font-mono text-neutral-400">
            <span>Vazio (0%)</span>
            <span>1/4</span>
            <span>Meio (50%)</span>
            <span>3/4</span>
            <span>Cheio (100%)</span>
          </div>
        </div>

        {/* Itens do Checklist */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
            Inspeção de Itens Básicos
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CHECKLIST_ITEMS.map((item) => {
              const currentStatus = itemsStatus[item.id] || 'OK'
              return (
                <div key={item.id} className="bg-neutral-50 border border-neutral-200/80 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-800">{item.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleItemStatusChange(item.id, 'OK')}
                      title="Item OK / Normal"
                      className={`p-1.5 rounded-lg transition-colors ${
                        currentStatus === 'OK' ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleItemStatusChange(item.id, 'WARNING')}
                      title="Atenção / Pequena Avaria"
                      className={`p-1.5 rounded-lg transition-colors ${
                        currentStatus === 'WARNING' ? 'bg-amber-500 text-white shadow-sm' : 'text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleItemStatusChange(item.id, 'BAD')}
                      title="Danificado / Ruim"
                      className={`p-1.5 rounded-lg transition-colors ${
                        currentStatus === 'BAD' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* MAPEIADOR 3D / MULTI-ÂNGULO DE AVARIAS */}
        <VehicleDamageMapper3D
          pins={damagePins}
          onChange={setDamagePins}
          vehicleModel={customerVehicles.find(v => v.id === selectedVehicleId)?.model || 'Veículo'}
        />

        {/* Queixa / Motivo da Visita */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
              Queixa / Relato do Cliente
            </label>
            <textarea
              name="reportedIssue"
              rows={3}
              value={reportedIssue}
              onChange={(e) => setReportedIssue(e.target.value)}
              placeholder="Ex: Barulho na suspensão dianteira ao passar em lombadas..."
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
              Observações da Recepção
            </label>
            <textarea
              name="additionalInfo"
              rows={3}
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Ex: Arranhão no pára-choque traseiro esquerdo..."
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
            />
          </div>
        </div>

        {/* Anexo de Fotos */}
        <div className="pt-4 border-t border-neutral-100">
          <ImageUploader images={images} onChange={setImages} maxImages={10} />
        </div>
      </section>

      {/* BOTÃO FINAL DE SUBMISSÃO */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto bg-black text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Registrando Entrada...
            </>
          ) : (
            <>
              <ClipboardCheck className="w-4 h-4 text-emerald-400" /> Salvar Recepção & Abrir Vistoria Completa
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>
    </form>
  )
}
