'use client'

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { 
  Sparkles, 
  RotateCw, 
  Plus, 
  X, 
  Check, 
  Trash2, 
  Paintbrush, 
  Car, 
  Info,
  Compass,
  Maximize2
} from 'lucide-react'

export interface DamagePin {
  id: string
  x: number // 3D Coordenada X
  y: number // 3D Coordenada Y
  z: number // 3D Coordenada Z
  type: 'RISCO' | 'AMASSADO' | 'TRINCA' | 'QUEBRADO' | 'PINTURA'
  severity: 'LEVE' | 'MEDIO' | 'GRAVE'
  note?: string
}

interface VehicleDamageMapper3DProps {
  pins: DamagePin[]
  onChange?: (pins: DamagePin[]) => void
  vehicleModel?: string
  vehicleBrand?: string
  initialColor?: string
  readOnly?: boolean
}

// CORES DE LATARIA
const VEHICLE_COLORS = [
  { name: 'Prata Metálico', hex: '#cbd5e1', metal: 0.8, rough: 0.2 },
  { name: 'Preto Ninja', hex: '#0f172a', metal: 0.9, rough: 0.1 },
  { name: 'Branco Pérola', hex: '#f8fafc', metal: 0.3, rough: 0.3 },
  { name: 'Vermelho Ruby', hex: '#dc2626', metal: 0.7, rough: 0.2 },
  { name: 'Azul Imperial', hex: '#1d4ed8', metal: 0.8, rough: 0.2 },
  { name: 'Cinza Nardo', hex: '#475569', metal: 0.6, rough: 0.3 },
  { name: 'Amarelo Giro', hex: '#eab308', metal: 0.5, rough: 0.2 },
]

const DAMAGE_TYPES = [
  { id: 'RISCO', label: 'Risco / Arranhão', color: '#ef4444' },
  { id: 'AMASSADO', label: 'Amassado', color: '#f59e0b' },
  { id: 'TRINCA', label: 'Trincado / Vidro', color: '#eab308' },
  { id: 'QUEBRADO', label: 'Peça Quebrada / Faltando', color: '#a855f7' },
  { id: 'PINTURA', label: 'Pintura / Mancha', color: '#3b82f6' },
]

const SEVERITIES = [
  { id: 'LEVE', label: 'Leve', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'MEDIO', label: 'Médio', color: 'bg-amber-100 text-amber-800' },
  { id: 'GRAVE', label: 'Grave', color: 'bg-red-100 text-red-800' },
]

// DETECTOR AUTOMÁTICO DE CATEGORIA POR NOME DO CARRO
function detectBodyCategory(model: string = '', brand: string = ''): 'SEDAN' | 'HATCH' | 'SUV' | 'PICKUP' | 'COUPE' {
  const text = `${brand} ${model}`.toLowerCase()
  
  if (/hatch|onix|gol|ka|kwid|mobi|polo|argo|hb20|fit|march|sandero|yaris|fox|up|golf|208|c3|clio|fiesta/i.test(text)) {
    return 'HATCH'
  }
  if (/suv|compass|renegade|hrv|hr-v|kicks|creta|tracker|duster|t-cross|nivus|taos|corolla cross|tiggo|fastback|pulse|tucson|sportage|ix35|rav4|bronco|territory|sw4|pajero/i.test(text)) {
    return 'SUV'
  }
  if (/picape|pickup|hilux|s10|toro|strada|saveiro|ranger|amarok|montana|oroch|f150|f-150|ram|l200|frontier|maverick/i.test(text)) {
    return 'PICKUP'
  }
  if (/coupe|mustang|camaro|porsche|audi tt|challenger|corvette|350z|supra/i.test(text)) {
    return 'COUPE'
  }
  return 'SEDAN' // Padrão
}

export default function VehicleDamageMapper3D({
  pins = [],
  onChange,
  vehicleModel = 'Veículo',
  vehicleBrand = '',
  initialColor = '#cbd5e1',
  readOnly = false
}: VehicleDamageMapper3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  
  // Detecta automaticamente o tipo de carroceria pelo modelo
  const detectedCategory = detectBodyCategory(vehicleModel, vehicleBrand)
  
  const [carColor, setCarColor] = useState(initialColor)
  const [bodyCategory, setBodyCategory] = useState<'SEDAN' | 'HATCH' | 'SUV' | 'PICKUP' | 'COUPE'>(detectedCategory)
  
  // Atualiza a categoria caso o modelo de veículo mude
  useEffect(() => {
    setBodyCategory(detectBodyCategory(vehicleModel, vehicleBrand))
  }, [vehicleModel, vehicleBrand])

  // Estado de inserção de Pin
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number; z: number } | null>(null)
  const [pinType, setPinType] = useState<'RISCO' | 'AMASSADO' | 'TRINCA' | 'QUEBRADO' | 'PINTURA'>('RISCO')
  const [pinSeverity, setPinSeverity] = useState<'LEVE' | 'MEDIO' | 'GRAVE'>('LEVE')
  const [pinNote, setPinNote] = useState('')
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)

  // Referências Three.js
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const carMeshGroupRef = useRef<THREE.Group | null>(null)
  const pinsGroupRef = useRef<THREE.Group | null>(null)

  // 1. INICIALIZAÇÃO DA CENA THREE.JS
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#090d16')
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(6, 3, 7)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    container.appendChild(renderer.domElement)

    // Orbit Controls (Movimento 360 Graus livre)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2 + 0.05 // Limite para não passar por baixo do chão
    controls.minDistance = 3
    controls.maxDistance = 12
    controlsRef.current = controls

    // ILUMINAÇÃO ESTÚDIO AUTOMOTIVO
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5)
    mainLight.position.set(5, 10, 7)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.0)
    fillLight.position.set(-5, 5, -5)
    scene.add(fillLight)

    const topLight = new THREE.DirectionalLight(0xffffff, 1.5)
    topLight.position.set(0, 10, 0)
    scene.add(topLight)

    // PISO REFLETIVO COM GRID TÉCNICO 3D
    const gridHelper = new THREE.GridHelper(20, 20, '#38bdf8', '#1e293b')
    gridHelper.position.y = -0.01
    scene.add(gridHelper)

    const shadowPlaneGeo = new THREE.PlaneGeometry(20, 20)
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.4 })
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat)
    shadowPlane.rotation.x = -Math.PI / 2
    shadowPlane.receiveShadow = true
    scene.add(shadowPlane)

    // Grupo do Carro
    const carGroup = new THREE.Group()
    scene.add(carGroup)
    carMeshGroupRef.current = carGroup

    // Grupo de Pins 3D
    const pinsGroup = new THREE.Group()
    scene.add(pinsGroup)
    pinsGroupRef.current = pinsGroup

    // Animation Loop
    let animationFrameId: number
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Resize Handler
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // 2. CONSTRUÇÃO DO MODELO 3D DE ACORDO COM A CATEGORIA E COR
  useEffect(() => {
    const carGroup = carMeshGroupRef.current
    if (!carGroup) return

    // Limpa malha anterior
    while (carGroup.children.length > 0) {
      const child = carGroup.children[0]
      carGroup.remove(child)
    }

    // Material da Lataria Metálica
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(carColor),
      metalness: 0.75,
      roughness: 0.2,
    })

    // Material de Vidro
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0284c7'),
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.6,
    })

    // Material de Pneus/Rodas
    const tireMaterial = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9 })
    const rimMaterial = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.9, roughness: 0.1 })
    const lightMaterial = new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#fef08a', emissiveIntensity: 0.8 })
    const tailLightMaterial = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.8 })

    // Geometrias baseadas na categoria
    let length = 4.2, height = 1.2, cabinLen = 2.2, cabinOffX = 0
    if (bodyCategory === 'HATCH') { length = 3.6; height = 1.3; cabinLen = 2.0; cabinOffX = 0.2 }
    if (bodyCategory === 'SUV') { length = 4.4; height = 1.5; cabinLen = 2.6; cabinOffX = 0 }
    if (bodyCategory === 'PICKUP') { length = 4.8; height = 1.4; cabinLen = 1.8; cabinOffX = -0.4 }
    if (bodyCategory === 'COUPE') { length = 4.3; height = 1.0; cabinLen = 1.9; cabinOffX = 0 }

    // Lataria Inferior / Base
    const baseGeo = new THREE.BoxGeometry(length, 0.7, 1.9)
    const baseMesh = new THREE.Mesh(baseGeo, bodyMaterial)
    baseMesh.position.y = 0.55
    baseMesh.castShadow = true
    baseMesh.receiveShadow = true
    carGroup.add(baseMesh)

    // Cabine / Teto (Arredondado)
    const cabinGeo = new THREE.BoxGeometry(cabinLen, height, 1.7)
    const cabinMesh = new THREE.Mesh(cabinGeo, bodyMaterial)
    cabinMesh.position.set(cabinOffX, 0.55 + height/2, 0)
    cabinMesh.castShadow = true
    carGroup.add(cabinMesh)

    // Vidros (Pára-brisa & Janelas)
    const windshieldGeo = new THREE.BoxGeometry(cabinLen * 0.9, height * 0.85, 1.72)
    const windshieldMesh = new THREE.Mesh(windshieldGeo, glassMaterial)
    windshieldMesh.position.set(cabinOffX, 0.55 + height/2, 0)
    carGroup.add(windshieldMesh)

    // Rodas (4 Rodas com Jantes)
    const wheelPositions = [
      { x: length/2 - 0.8, z: 1.0 },
      { x: length/2 - 0.8, z: -1.0 },
      { x: -length/2 + 0.8, z: 1.0 },
      { x: -length/2 + 0.8, z: -1.0 },
    ]

    wheelPositions.forEach((pos) => {
      const wheelGroup = new THREE.Group()
      wheelGroup.position.set(pos.x, 0.35, pos.z)

      const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 24)
      tireGeo.rotateX(Math.PI / 2)
      const tireMesh = new THREE.Mesh(tireGeo, tireMaterial)
      tireMesh.castShadow = true
      wheelGroup.add(tireMesh)

      const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.32, 16)
      rimGeo.rotateX(Math.PI / 2)
      const rimMesh = new THREE.Mesh(rimGeo, rimMaterial)
      wheelGroup.add(rimMesh)

      carGroup.add(wheelGroup)
    })

    // Faróis Dianteiros
    const head1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.4), lightMaterial)
    head1.position.set(length/2 + 0.01, 0.65, 0.6)
    const head2 = head1.clone()
    head2.position.set(length/2 + 0.01, 0.65, -0.6)
    carGroup.add(head1, head2)

    // Lanternas Traseiras
    const tail1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.4), tailLightMaterial)
    tail1.position.set(-length/2 - 0.01, 0.65, 0.6)
    const tail2 = tail1.clone()
    tail2.position.set(-length/2 - 0.01, 0.65, -0.6)
    carGroup.add(tail1, tail2)

  }, [bodyCategory, carColor])

  // 3. RENDERIZAÇÃO DOS PINS 3D NA CENA
  useEffect(() => {
    const pinsGroup = pinsGroupRef.current
    if (!pinsGroup) return

    // Limpa pins anteriores
    while (pinsGroup.children.length > 0) {
      pinsGroup.remove(pinsGroup.children[0])
    }

    pins.forEach((pin, idx) => {
      const pinMeta = DAMAGE_TYPES.find(d => d.id === pin.type)
      const pinColor = pinMeta ? pinMeta.color : '#ef4444'

      const pinSubGroup = new THREE.Group()
      pinSubGroup.position.set(pin.x, pin.y, pin.z)

      // Esfera 3D com brilho Neon
      const sphereGeo = new THREE.SphereGeometry(0.14, 16, 16)
      const sphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(pinColor),
        emissive: new THREE.Color(pinColor),
        emissiveIntensity: 0.6,
        roughness: 0.1,
      })
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat)
      pinSubGroup.add(sphereMesh)

      // Anel Pulsante
      const ringGeo = new THREE.RingGeometry(0.18, 0.24, 24)
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(pinColor),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.rotation.x = Math.PI / 2
      pinSubGroup.add(ringMesh)

      pinsGroup.add(pinSubGroup)
    })
  }, [pins])

  // 4. RAYCASTING: CLICAR NO CARRO 3D PARA PEGAR COORDENADAS (X, Y, Z)
  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (readOnly || !mountRef.current || !cameraRef.current || !carMeshGroupRef.current) return

    const rect = mountRef.current.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, cameraRef.current)

    const intersects = raycaster.intersectObjects(carMeshGroupRef.current.children, true)

    if (intersects.length > 0) {
      const point = intersects[0].point
      setPendingPoint({
        x: parseFloat(point.x.toFixed(2)),
        y: parseFloat(point.y.toFixed(2)),
        z: parseFloat(point.z.toFixed(2))
      })
      setSelectedPinId(null)
    }
  }

  // CONFIRMA CRIAÇÃO DO PIN 3D
  function handleAddPin() {
    if (!pendingPoint || !onChange) return

    const newPin: DamagePin = {
      id: Date.now().toString(),
      x: pendingPoint.x,
      y: pendingPoint.y,
      z: pendingPoint.z,
      type: pinType,
      severity: pinSeverity,
      note: pinNote.trim() || undefined
    }

    onChange([...pins, newPin])
    setPendingPoint(null)
    setPinNote('')
  }

  function handleRemovePin(id: string) {
    if (readOnly || !onChange) return
    onChange(pins.filter(p => p.id !== id))
    if (selectedPinId === id) setSelectedPinId(null)
  }

  // MUDAR CÂMERA DE FORMA SUAVE
  function setCameraAngle(angle: 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'TOP' | 'FREE') {
    const controls = controlsRef.current
    const camera = cameraRef.current
    if (!controls || !camera) return

    if (angle === 'FRONT') { camera.position.set(7, 2, 0) }
    if (angle === 'BACK') { camera.position.set(-7, 2, 0) }
    if (angle === 'LEFT') { camera.position.set(0, 2, 7) }
    if (angle === 'RIGHT') { camera.position.set(0, 2, -7) }
    if (angle === 'TOP') { camera.position.set(0, 8, 0.1) }
    if (angle === 'FREE') { camera.position.set(6, 3, 7) }
    controls.target.set(0, 0.7, 0)
    controls.update()
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-5 shadow-2xl text-white">
      {/* CABEÇALHO TÉCNICO 3D */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" /> WebGL 3D Realtime
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-widest">
              Detectado: {bodyCategory}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
            Gêmeo Digital 3D • {vehicleBrand} {vehicleModel}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {readOnly
              ? 'Arraste com o mouse para girar o veículo em 360° em qualquer direção.'
              : 'Clique em qualquer ponto da lataria 3D para marcar uma nova imperfeição.'}
          </p>
        </div>

        {/* CONTROLES DE COR DA LATARIA */}
        <div className="flex items-center gap-2 bg-neutral-800/80 p-2 rounded-2xl border border-neutral-700/60 self-start sm:self-auto">
          <Paintbrush className="w-4 h-4 text-neutral-400 ml-1" />
          <span className="text-xs font-semibold text-neutral-300">Pintura:</span>
          <div className="flex items-center gap-1.5">
            {VEHICLE_COLORS.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={() => setCarColor(c.hex)}
                className={`w-5 h-5 rounded-full border transition-all ${
                  carColor === c.hex ? 'ring-2 ring-blue-400 scale-125' : 'border-neutral-600 hover:scale-110'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CONTROLES DE ÂNGULO DE CÂMERA PRESET E CARROCERIA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-neutral-800/90 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto border border-neutral-700/50">
          <span className="text-[10px] font-mono font-bold text-neutral-400 px-2 uppercase tracking-widest flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-blue-400" /> Câmera 3D:
          </span>
          {[
            { id: 'FREE', label: '360° Livre' },
            { id: 'FRONT', label: 'Frente' },
            { id: 'BACK', label: 'Traseira' },
            { id: 'LEFT', label: 'Esq' },
            { id: 'RIGHT', label: 'Dir' },
            { id: 'TOP', label: 'Teto' },
          ].map(ang => (
            <button
              key={ang.id}
              type="button"
              onClick={() => setCameraAngle(ang.id as any)}
              className="px-3 py-1 text-xs font-bold rounded-xl transition-all bg-neutral-700/50 hover:bg-blue-600 text-neutral-200 hover:text-white"
            >
              {ang.label}
            </button>
          ))}
        </div>

        {/* ALTERNAR MODELO DE CARROCERIA MANUALMENTE */}
        <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
          <span>Corpo 3D:</span>
          <select
            value={bodyCategory}
            onChange={(e) => setBodyCategory(e.target.value as any)}
            className="bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-1 text-xs font-bold text-white outline-none focus:border-blue-500"
          >
            <option value="SEDAN">Sedan</option>
            <option value="HATCH">Hatchback</option>
            <option value="SUV">SUV / Crossover</option>
            <option value="PICKUP">Picape / Truck</option>
            <option value="COUPE">Cupê / Esportivo</option>
          </select>
        </div>
      </div>

      {/* ÁREA DO CANVAS 3D WEBGL */}
      <div 
        ref={mountRef}
        onClick={handleCanvasClick}
        className="relative w-full aspect-[2/1] sm:aspect-[2.4/1] bg-gradient-to-b from-neutral-950 via-neutral-900 to-slate-950 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-neutral-800 shadow-inner group"
      >
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 text-[11px] font-mono text-neutral-300 flex items-center gap-2 pointer-events-none">
          <RotateCw className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '8s' }} />
          Gire 360° • Zoom com a roda do mouse
        </div>

        {pendingPoint && (
          <div className="absolute top-3 right-3 bg-blue-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-400/50 shadow-lg animate-pulse">
            Ponto selecionado em 3D (X:{pendingPoint.x}, Y:{pendingPoint.y}, Z:{pendingPoint.z})
          </div>
        )}
      </div>

      {/* MODAL POPUP PARA CONFIRMAR PIN DE AVARIA */}
      {pendingPoint && !readOnly && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-400" /> Marcar Nova Avaria nas Coordenadas 3D
            </h4>
            <button 
              type="button" 
              onClick={() => setPendingPoint(null)} 
              className="text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Tipo de Avaria</label>
              <div className="grid grid-cols-1 gap-1.5">
                {DAMAGE_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPinType(t.id as any)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border text-left flex items-center justify-between transition-all ${
                      pinType === t.id ? 'bg-blue-600 text-white border-blue-400 shadow-md' : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-750'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.label}
                    </span>
                    {pinType === t.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Gravidade</label>
                <div className="flex gap-2">
                  {SEVERITIES.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPinSeverity(s.id as any)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        pinSeverity === s.id ? 'bg-white text-black border-white ring-2 ring-blue-500' : 'bg-neutral-900 text-neutral-400 border-neutral-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Observação / Detalhe</label>
                <input
                  type="text"
                  value={pinNote}
                  onChange={(e) => setPinNote(e.target.value)}
                  placeholder="Ex: Risco fundo de 10cm na lataria..."
                  className="w-full p-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingPoint(null)}
                  className="flex-1 py-2 text-xs font-bold text-neutral-300 bg-neutral-900 border border-neutral-700 rounded-xl hover:bg-neutral-750"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddPin}
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Salvar Pin 3D
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LISTAGEM DOS PINS 3D GRAVADOS */}
      {pins.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">
              Avarias 3D Registradas ({pins.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pins.map((p, idx) => {
              const dMeta = DAMAGE_TYPES.find(d => d.id === p.type)
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                    selectedPinId === p.id ? 'border-blue-500 bg-blue-950/40' : 'border-neutral-800 bg-neutral-900/90'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-6 h-6 rounded-full text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-md"
                      style={{ backgroundColor: dMeta?.color || '#ef4444' }}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white block">{dMeta?.label}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Gravidade: {p.severity} • (X:{p.x}, Y:{p.y}, Z:{p.z})
                        {p.note ? ` • ${p.note}` : ''}
                      </span>
                    </div>
                  </div>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemovePin(p.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors"
                      title="Remover Avaria"
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
