'use client'

import { useState } from 'react'
import { 
  Car, 
  RotateCw, 
  Plus, 
  X, 
  AlertCircle, 
  Check, 
  Eye, 
  Trash2, 
  Paintbrush, 
  Sparkles,
  Layers
} from 'lucide-react'

export interface DamagePin {
  id: string
  x: number // porcentagem 0-100 na vista ativa
  y: number // porcentagem 0-100 na vista ativa
  view: 'FRONT' | 'LEFT' | 'BACK' | 'RIGHT' | 'TOP'
  type: 'RISCO' | 'AMASSADO' | 'TRINCA' | 'QUEBRADO' | 'PINTURA'
  severity: 'LEVE' | 'MEDIO' | 'GRAVE'
  note?: string
}

interface VehicleDamageMapper3DProps {
  pins: DamagePin[]
  onChange?: (pins: DamagePin[]) => void
  vehicleModel?: string
  initialColor?: string
  readOnly?: boolean
}

// Cores populares de veículos
const VEHICLE_COLORS = [
  { name: 'Branco', hex: '#f8fafc', textDark: true },
  { name: 'Prata', hex: '#cbd5e1', textDark: true },
  { name: 'Cinza', hex: '#64748b', textDark: false },
  { name: 'Preto', hex: '#1e293b', textDark: false },
  { name: 'Vermelho', hex: '#dc2626', textDark: false },
  { name: 'Azul', hex: '#2563eb', textDark: false },
  { name: 'Amarelo', hex: '#eab308', textDark: true },
  { name: 'Verde', hex: '#15803d', textDark: false },
]

const DAMAGE_TYPES = [
  { id: 'RISCO', label: 'Risco / Arranhão', color: 'bg-red-500 text-white border-red-300', dot: '#ef4444' },
  { id: 'AMASSADO', label: 'Amassado', color: 'bg-amber-500 text-white border-amber-300', dot: '#f59e0b' },
  { id: 'TRINCA', label: 'Trincado / Vidro', color: 'bg-yellow-500 text-black border-yellow-300', dot: '#eab308' },
  { id: 'QUEBRADO', label: 'Peça Quebrada / Faltando', color: 'bg-purple-600 text-white border-purple-300', dot: '#9333ea' },
  { id: 'PINTURA', label: 'Pintura / Mancha', color: 'bg-blue-600 text-white border-blue-300', dot: '#2563eb' },
]

const SEVERITIES = [
  { id: 'LEVE', label: 'Leve', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'MEDIO', label: 'Médio', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'GRAVE', label: 'Grave', color: 'bg-red-100 text-red-800 border-red-300' },
]

export default function VehicleDamageMapper3D({
  pins = [],
  onChange,
  vehicleModel = 'Veículo',
  initialColor = '#cbd5e1',
  readOnly = false
}: VehicleDamageMapper3DProps) {
  const [activeView, setActiveView] = useState<'LEFT' | 'FRONT' | 'RIGHT' | 'BACK' | 'TOP'>('LEFT')
  const [carColor, setCarColor] = useState(initialColor)
  const [bodyType, setBodyType] = useState<'SEDAN' | 'HATCH' | 'SUV' | 'PICKUP'>('SEDAN')
  
  // Estado de criação de Pin
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null)
  const [pinType, setPinType] = useState<'RISCO' | 'AMASSADO' | 'TRINCA' | 'QUEBRADO' | 'PINTURA'>('RISCO')
  const [pinSeverity, setPinSeverity] = useState<'LEVE' | 'MEDIO' | 'GRAVE'>('LEVE')
  const [pinNote, setPinNote] = useState('')
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)

  // Filtrar pins da visão ativa
  const activePins = pins.filter(p => p.view === activeView)

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (readOnly) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    
    setPendingPin({ x, y })
    setSelectedPinId(null)
  }

  function handleAddPin() {
    if (!pendingPin || !onChange) return
    const newPin: DamagePin = {
      id: Date.now().toString(),
      x: pendingPin.x,
      y: pendingPin.y,
      view: activeView,
      type: pinType,
      severity: pinSeverity,
      note: pinNote.trim() || undefined
    }

    onChange([...pins, newPin])
    setPendingPin(null)
    setPinNote('')
  }

  function handleRemovePin(id: string) {
    if (readOnly || !onChange) return
    onChange(pins.filter(p => p.id !== id))
    if (selectedPinId === id) setSelectedPinId(null)
  }

  const selectedPin = pins.find(p => p.id === selectedPinId)

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-5 shadow-sm">
      {/* CABEÇALHO DO MAPEIADOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Mapeador 3D de Avarias (Gêmeo Digital)
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {readOnly 
              ? 'Visualização interna de imperfeições mapeadas no veículo.' 
              : 'Clique na lataria para marcar avarias, riscos ou amassados.'}
          </p>
        </div>

        {/* SELETOR DE COR DA LATARIA */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-neutral-50 p-1.5 rounded-xl border border-neutral-200">
          <Paintbrush className="w-3.5 h-3.5 text-neutral-500 ml-1" />
          <span className="text-[11px] font-semibold text-neutral-600 mr-1">Cor:</span>
          <div className="flex items-center gap-1">
            {VEHICLE_COLORS.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={() => setCarColor(c.hex)}
                className={`w-5 h-5 rounded-full border transition-all ${
                  carColor === c.hex ? 'ring-2 ring-black scale-110 shadow-sm' : 'border-neutral-300 hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* SELEÇÃO DE PERSPECTIVA E CARROCERIA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* BOTÕES DE VISTA */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'LEFT', label: 'Lat. Esquerda' },
            { id: 'FRONT', label: 'Frente' },
            { id: 'RIGHT', label: 'Lat. Direita' },
            { id: 'BACK', label: 'Traseira' },
            { id: 'TOP', label: 'Teto / Superior' }
          ].map(v => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setActiveView(v.id as any)
                setPendingPin(null)
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                activeView === v.id
                  ? 'bg-white text-black shadow-sm font-bold'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              {v.label} ({pins.filter(p => p.view === v.id).length})
            </button>
          ))}
        </div>

        {/* TIPO DE CARROCERIA */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium">
          <Layers className="w-3.5 h-3.5 text-neutral-400" />
          <span>Modelo:</span>
          <select
            value={bodyType}
            onChange={(e) => setBodyType(e.target.value as any)}
            className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-800 outline-none"
          >
            <option value="SEDAN">Sedan</option>
            <option value="HATCH">Hatchback</option>
            <option value="SUV">SUV / Crossover</option>
            <option value="PICKUP">Picape</option>
          </select>
        </div>
      </div>

      {/* PAINEL CANVAS DO CARRO 3D / MULTI-ÂNGULO */}
      <div className="relative w-full aspect-[2/1] sm:aspect-[2.5/1] bg-neutral-900 rounded-2xl overflow-hidden shadow-inner border border-neutral-800 flex items-center justify-center p-4">
        {/* Fundo de Grid Técnico */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* ILUSTRAÇÃO SVG VETORIAL DO VEÍCULO DINÂMICO */}
        <div 
          className="relative w-full h-full flex items-center justify-center cursor-crosshair group"
          onClick={handleCanvasClick}
        >
          <svg
            viewBox="0 0 800 350"
            className="w-full h-full max-h-full drop-shadow-2xl transition-transform duration-500 select-none"
          >
            <defs>
              {/* Gradiente dinâmico de cor da tinta metálica */}
              <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={carColor} stopOpacity="1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
              </linearGradient>
              <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {/* RENDERIZAÇÃO DA SILHUETA POR VISÃO */}
            {activeView === 'LEFT' && (
              <g id="leftView">
                {/* Sombra de chassi */}
                <ellipse cx="400" cy="285" rx="340" ry="25" fill="#000000" opacity="0.6" filter="blur(6px)" />
                {/* Corpo do carro */}
                <path
                  d={bodyType === 'SUV' 
                    ? "M 100 240 Q 110 180 180 170 C 240 160 320 100 460 95 C 600 90 680 140 720 180 Q 730 240 700 250 L 100 250 Z" 
                    : bodyType === 'PICKUP' 
                    ? "M 100 240 Q 110 180 180 170 C 240 160 320 100 460 100 L 460 180 L 710 180 Q 730 240 700 250 L 100 250 Z" 
                    : "M 90 240 Q 100 190 170 175 C 220 165 300 110 440 105 C 570 100 640 150 710 190 Q 725 240 690 250 L 90 250 Z"
                  }
                  fill="url(#bodyGradient)"
                  stroke="#ffffff"
                  strokeOpacity="0.3"
                  strokeWidth="3"
                />
                {/* Vidros Lateral */}
                <path
                  d="M 240 165 C 290 120 420 115 450 115 L 450 165 Z M 465 115 C 530 115 600 140 630 165 L 465 165 Z"
                  fill="url(#glassGradient)"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {/* Rodas */}
                <circle cx="210" cy="250" r="45" fill="#1e293b" stroke="#64748b" strokeWidth="6" />
                <circle cx="210" cy="250" r="22" fill="#94a3b8" />
                <circle cx="590" cy="250" r="45" fill="#1e293b" stroke="#64748b" strokeWidth="6" />
                <circle cx="590" cy="250" r="22" fill="#94a3b8" />
                {/* Farol Dianteiro / Traseiro */}
                <path d="M 85 200 Q 95 190 110 205 Z" fill="#ef4444" opacity="0.9" />
                <path d="M 705 200 Q 695 190 680 205 Z" fill="#fef08a" opacity="0.9" />
              </g>
            )}

            {activeView === 'RIGHT' && (
              <g id="rightView" transform="scale(-1, 1) translate(-800, 0)">
                <ellipse cx="400" cy="285" rx="340" ry="25" fill="#000000" opacity="0.6" filter="blur(6px)" />
                <path
                  d="M 90 240 Q 100 190 170 175 C 220 165 300 110 440 105 C 570 100 640 150 710 190 Q 725 240 690 250 L 90 250 Z"
                  fill="url(#bodyGradient)"
                  stroke="#ffffff"
                  strokeOpacity="0.3"
                  strokeWidth="3"
                />
                <path
                  d="M 240 165 C 290 120 420 115 450 115 L 450 165 Z M 465 115 C 530 115 600 140 630 165 L 465 165 Z"
                  fill="url(#glassGradient)"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <circle cx="210" cy="250" r="45" fill="#1e293b" stroke="#64748b" strokeWidth="6" />
                <circle cx="210" cy="250" r="22" fill="#94a3b8" />
                <circle cx="590" cy="250" r="45" fill="#1e293b" stroke="#64748b" strokeWidth="6" />
                <circle cx="590" cy="250" r="22" fill="#94a3b8" />
              </g>
            )}

            {activeView === 'FRONT' && (
              <g id="frontView">
                <ellipse cx="400" cy="275" rx="220" ry="20" fill="#000000" opacity="0.6" filter="blur(6px)" />
                <path
                  d="M 220 250 C 210 180 250 120 400 110 C 550 120 590 180 580 250 Z"
                  fill="url(#bodyGradient)"
                  stroke="#ffffff"
                  strokeWidth="3"
                />
                {/* Pára-brisa */}
                <path
                  d="M 270 165 C 310 135 490 135 530 165 Z"
                  fill="url(#glassGradient)"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {/* Faróis */}
                <polygon points="230,200 280,195 270,225 235,220" fill="#fef08a" />
                <polygon points="570,200 520,195 530,225 565,220" fill="#fef08a" />
                {/* Grade */}
                <rect x="320" y="200" width="160" height="35" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              </g>
            )}

            {activeView === 'BACK' && (
              <g id="backView">
                <ellipse cx="400" cy="275" rx="220" ry="20" fill="#000000" opacity="0.6" filter="blur(6px)" />
                <path
                  d="M 220 250 C 210 180 250 120 400 110 C 550 120 590 180 580 250 Z"
                  fill="url(#bodyGradient)"
                  stroke="#ffffff"
                  strokeWidth="3"
                />
                <path
                  d="M 270 165 C 310 135 490 135 530 165 Z"
                  fill="url(#glassGradient)"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {/* Lanternas Traseiras */}
                <polygon points="230,200 280,195 270,225 235,220" fill="#ef4444" />
                <polygon points="570,200 520,195 530,225 565,220" fill="#ef4444" />
                {/* Placa */}
                <rect x="350" y="210" width="100" height="25" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
              </g>
            )}

            {activeView === 'TOP' && (
              <g id="topView">
                <rect x="250" y="50" width="300" height="240" rx="60" fill="url(#bodyGradient)" stroke="#ffffff" strokeWidth="3" />
                {/* Teto e vidros */}
                <rect x="280" y="90" width="240" height="70" rx="10" fill="url(#glassGradient)" stroke="#ffffff" strokeWidth="1.5" />
                <rect x="280" y="190" width="240" height="60" rx="10" fill="url(#glassGradient)" stroke="#ffffff" strokeWidth="1.5" />
              </g>
            )}
          </svg>

          {/* RENDERIZAÇÃO DOS PINS EXISTENTES COM CONTRASTE NEON */}
          {activePins.map((pin, i) => {
            const damageMeta = DAMAGE_TYPES.find(d => d.id === pin.type)
            return (
              <div
                key={pin.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPinId(pin.id)
                }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group/pin"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              >
                <div className="relative flex items-center justify-center">
                  {/* Anel Pulsante Neon para se destacar em qualquer cor */}
                  <span className="absolute w-8 h-8 rounded-full bg-red-500/40 animate-ping" />
                  <div 
                    className="w-7 h-7 rounded-full text-white font-mono font-bold text-xs flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-black transform hover:scale-125 transition-transform"
                    style={{ backgroundColor: damageMeta?.dot || '#ef4444' }}
                  >
                    #{i + 1}
                  </div>
                </div>

                {/* Tooltip ao passar o mouse */}
                <div className="absolute left-1/2 bottom-full mb-2 transform -translate-x-1/2 opacity-0 group-hover/pin:opacity-100 transition-opacity bg-neutral-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-xl border border-neutral-700">
                  {damageMeta?.label} ({pin.severity})
                </div>
              </div>
            )
          })}

          {/* PENDING PIN ANIMADO */}
          {pendingPin && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
              style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-yellow-400/50 animate-bounce border-2 border-white flex items-center justify-center text-black font-bold text-xs">
                +
              </div>
            </div>
          )}
        </div>

        {/* MARCA D'ÁGUA TÉCNICA */}
        <div className="absolute bottom-2 left-3 text-[10px] font-mono text-neutral-500 pointer-events-none">
          GÊMEO DIGITAL • {vehicleModel.toUpperCase()} • VISTA {activeView}
        </div>
      </div>

      {/* POPUP MODAL PARA DEFINIR NOVO PIN DE AVARIA */}
      {pendingPin && !readOnly && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
            <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" /> Marcar Nova Imperfeição / Dano (Vista {activeView})
            </h4>
            <button 
              type="button" 
              onClick={() => setPendingPin(null)} 
              className="text-neutral-400 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* TIPO DE DANO */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">Tipo de Avaria *</label>
              <div className="grid grid-cols-1 gap-1.5">
                {DAMAGE_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPinType(t.id as any)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left flex items-center justify-between transition-all ${
                      pinType === t.id ? 'bg-black text-white border-black shadow-sm' : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.dot }} />
                      {t.label}
                    </span>
                    {pinType === t.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* SEVERIDADE E DETALHES */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Gravidade</label>
                <div className="flex gap-2">
                  {SEVERITIES.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPinSeverity(s.id as any)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        pinSeverity === s.id ? s.color + ' ring-2 ring-black' : 'bg-white text-neutral-600 border-neutral-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Observação / Detalhe (opcional)</label>
                <input
                  type="text"
                  value={pinNote}
                  onChange={(e) => setPinNote(e.target.value)}
                  placeholder="Ex: Risco profundo na porta traseira..."
                  className="w-full p-2.5 bg-white border border-neutral-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingPin(null)}
                  className="flex-1 py-2 text-xs font-semibold text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddPin}
                  className="flex-1 py-2 text-xs font-bold text-white bg-black rounded-lg hover:bg-neutral-800 shadow-md flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Confirmar Pin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LISTA E RESUMO DOS PINS REGISTRADOS */}
      {pins.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Avarias Mapeadas ({pins.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pins.map((p, idx) => {
              const dMeta = DAMAGE_TYPES.find(d => d.id === p.type)
              return (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    selectedPinId === p.id ? 'border-black bg-neutral-50 shadow-xs' : 'border-neutral-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-6 h-6 rounded-full text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0 shadow-xs"
                      style={{ backgroundColor: dMeta?.dot || '#ef4444' }}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-neutral-900 block">{dMeta?.label}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Vista: {p.view} • Gravidade: {p.severity}
                        {p.note ? ` • ${p.note}` : ''}
                      </span>
                    </div>
                  </div>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemovePin(p.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Excluir Avaria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
