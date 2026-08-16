'use client'

import React, { useEffect, useRef, useState } from 'react'
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
  Compass,
  Zap
} from 'lucide-react'

export interface DamagePin {
  id: string
  x: number
  y: number
  z: number
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

// PALETA DE CORES AUTOMOTIVAS METÁLICAS
const VEHICLE_COLORS = [
  { name: 'Prata Metálico', hex: '#cbd5e1' },
  { name: 'Preto Ninja', hex: '#0f172a' },
  { name: 'Branco Pérola', hex: '#f8fafc' },
  { name: 'Vermelho Ruby', hex: '#dc2626' },
  { name: 'Azul Imperial', hex: '#1d4ed8' },
  { name: 'Cinza Nardo', hex: '#475569' },
  { name: 'Amarelo Giro', hex: '#eab308' },
]

const DAMAGE_TYPES = [
  { id: 'RISCO', label: 'Risco / Arranhão', color: '#ef4444' },
  { id: 'AMASSADO', label: 'Amassado', color: '#f59e0b' },
  { id: 'TRINCA', label: 'Trincado / Vidro', color: '#eab308' },
  { id: 'QUEBRADO', label: 'Peça Quebrada / Faltando', color: '#a855f7' },
  { id: 'PINTURA', label: 'Pintura / Mancha', color: '#3b82f6' },
]

const SEVERITIES = [
  { id: 'LEVE', label: 'Leve' },
  { id: 'MEDIO', label: 'Médio' },
  { id: 'GRAVE', label: 'Grave' },
]

// DETECTOR AUTOMÁTICO DE CATEGORIA DE CARROCERIA
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
  return 'SEDAN'
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
  
  const detectedCategory = detectBodyCategory(vehicleModel, vehicleBrand)
  const [carColor, setCarColor] = useState(initialColor)
  const [bodyCategory, setBodyCategory] = useState<'SEDAN' | 'HATCH' | 'SUV' | 'PICKUP' | 'COUPE'>(detectedCategory)
  
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

  // 1. INICIALIZAÇÃO DA CENA 3D (THREE.JS)
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0b0f19')
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(6.5, 3.2, 7.5)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    rendererRef.current = renderer

    container.appendChild(renderer.domElement)

    // Orbit Controls (360° total e zoom)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2 + 0.05
    controls.minDistance = 3.5
    controls.maxDistance = 14
    controls.target.set(0, 0.7, 0)
    controlsRef.current = controls

    // ILUMINAÇÃO REFINADA DE ESTÚDIO AUTOMOTIVO
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8)
    sunLight.position.set(6, 12, 8)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    scene.add(sunLight)

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5)
    rimLight.position.set(-6, 8, -8)
    scene.add(rimLight)

    const frontLight = new THREE.DirectionalLight(0xffffff, 1.2)
    frontLight.position.set(0, 4, 10)
    scene.add(frontLight)

    // PISO ESTÚDIO COM GRID E SOMBRA SUAVE
    const gridHelper = new THREE.GridHelper(24, 24, '#38bdf8', '#1e293b')
    gridHelper.position.y = -0.01
    scene.add(gridHelper)

    const shadowPlaneGeo = new THREE.PlaneGeometry(24, 24)
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.5 })
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat)
    shadowPlane.rotation.x = -Math.PI / 2
    shadowPlane.receiveShadow = true
    scene.add(shadowPlane)

    const carGroup = new THREE.Group()
    scene.add(carGroup)
    carMeshGroupRef.current = carGroup

    const pinsGroup = new THREE.Group()
    scene.add(pinsGroup)
    pinsGroupRef.current = pinsGroup

    let animationFrameId: number
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

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

  // 2. CONSTRUÇÃO DO MODELO DE CARRO 3D ULTRA-ORGANICO E CURVADO COM EXTRUDEGEOMETRY
  useEffect(() => {
    const carGroup = carMeshGroupRef.current
    if (!carGroup) return

    // Limpa a malha anterior
    while (carGroup.children.length > 0) {
      carGroup.remove(carGroup.children[0])
    }

    // Material da Lataria com Acabamento Metálico Automotivo Glossy
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(carColor),
      metalness: 0.85,
      roughness: 0.15,
    })

    // Material dos Vidros (Curvados e Fumê)
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0284c7'),
      metalness: 0.9,
      roughness: 0.05,
      transparent: true,
      opacity: 0.65,
    })

    // Materiais de Acessórios e Rodas
    const tireMaterial = new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.9 })
    const rimMaterial = new THREE.MeshStandardMaterial({ color: '#f1f5f9', metalness: 0.95, roughness: 0.1 })
    const brakeMaterial = new THREE.MeshStandardMaterial({ color: '#dc2626', metalness: 0.5 })
    const chromeMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1.0, roughness: 0.05 })
    const headlightMaterial = new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#fef08a', emissiveIntensity: 1.0 })
    const tailLightMaterial = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 1.0 })

    // PARÂMETROS DA SILHUETA DE ACORDO COM O TIPO
    let length = 4.4, height = 1.3, width = 1.9, cabinRoofY = 1.2, hoodLen = 1.2, trunkLen = 0.9
    if (bodyCategory === 'HATCH') { length = 3.7; height = 1.35; hoodLen = 1.0; trunkLen = 0.3 }
    if (bodyCategory === 'SUV') { length = 4.5; height = 1.6; hoodLen = 1.3; trunkLen = 0.8 }
    if (bodyCategory === 'PICKUP') { length = 5.0; height = 1.5; hoodLen = 1.4; trunkLen = 1.5 }
    if (bodyCategory === 'COUPE') { length = 4.3; height = 1.1; hoodLen = 1.4; trunkLen = 0.8 }

    // CRIANDO A CURVA 2D DA SILHUETA LATERAL DO CARRO (BEZIER CURVES)
    const shape = new THREE.Shape()
    const halfL = length / 2

    // Ponto inicial: Pára-choque dianteiro inferior
    shape.moveTo(halfL, 0.25)
    // Curva do Pára-choque dianteiro
    shape.quadraticCurveTo(halfL + 0.1, 0.45, halfL - 0.1, 0.65)
    // Capô inclinado e suave
    shape.bezierCurveTo(halfL - 0.4, 0.75, halfL - hoodLen + 0.3, 0.78, halfL - hoodLen, 0.82)
    // Pára-brisa dianteiro inclinado
    shape.bezierCurveTo(halfL - hoodLen - 0.3, 1.15, halfL - hoodLen - 0.5, height, halfL - hoodLen - 0.9, height)
    // Teto curvo
    shape.bezierCurveTo(0, height + 0.05, -0.4, height + 0.02, -halfL + trunkLen + 0.6, height * 0.95)
    // Vidro traseiro inclinado
    shape.bezierCurveTo(-halfL + trunkLen + 0.3, height * 0.7, -halfL + trunkLen + 0.1, 0.72, -halfL + trunkLen, 0.7)
    // Tampa do porta-malas / traseira
    shape.bezierCurveTo(-halfL + 0.1, 0.68, -halfL - 0.05, 0.55, -halfL, 0.25)
    // Parte inferior do carro com recortes das rodas
    shape.lineTo(-halfL + 0.7, 0.25)
    // Caixas de roda traseira curvada
    shape.absarc(-halfL + 1.1, 0.25, 0.42, Math.PI, 0, true)
    shape.lineTo(halfL - 1.1, 0.25)
    // Caixas de roda dianteira curvada
    shape.absarc(halfL - 1.1, 0.25, 0.42, Math.PI, 0, true)
    shape.lineTo(halfL, 0.25)

    // EXTRUSÃO COM BORDAS ARREDONDADAS (BEVEL) PARA LATARIA SUAVE E CURVADA
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 2,
      depth: width - 0.3,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.15,
      bevelOffset: 0,
      bevelSegments: 8,
      curveSegments: 32,
    }

    const bodyGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    bodyGeo.center()
    bodyGeo.computeVertexNormals() // Deixa a superfície 100% lisa e refletiva sem aspecto quadrado!

    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial)
    bodyMesh.position.y = 0.55
    bodyMesh.castShadow = true
    bodyMesh.receiveShadow = true
    carGroup.add(bodyMesh)

    // CANOPY / VIDROS CURVADOS (PÁRA-BRISA E JANELAS)
    const glassShape = new THREE.Shape()
    glassShape.moveTo(halfL - hoodLen - 0.05, 0.85)
    glassShape.bezierCurveTo(halfL - hoodLen - 0.35, 1.18, halfL - hoodLen - 0.55, height - 0.02, halfL - hoodLen - 0.9, height - 0.02)
    glassShape.bezierCurveTo(0, height, -0.4, height - 0.02, -halfL + trunkLen + 0.55, height * 0.93)
    glassShape.bezierCurveTo(-halfL + trunkLen + 0.25, height * 0.72, -halfL + trunkLen + 0.05, 0.76, -halfL + trunkLen - 0.05, 0.75)
    glassShape.lineTo(halfL - hoodLen - 0.05, 0.85)

    const glassExtrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 1,
      depth: width - 0.24,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.12,
      bevelSegments: 4,
      curveSegments: 24,
    }

    const glassGeo = new THREE.ExtrudeGeometry(glassShape, glassExtrudeSettings)
    glassGeo.center()
    glassGeo.computeVertexNormals()

    const glassMesh = new THREE.Mesh(glassGeo, glassMaterial)
    glassMesh.position.y = 0.56
    carGroup.add(glassMesh)

    // RODAS ESPORTIVAS E DETALHADAS (4 RODAS)
    const wheelXPositions = [halfL - 1.1, -halfL + 1.1]
    const wheelZPositions = [(width/2) + 0.02, -(width/2) - 0.02]

    wheelXPositions.forEach((wx) => {
      wheelZPositions.forEach((wz) => {
        const wheelGroup = new THREE.Group()
        wheelGroup.position.set(wx, 0.42, wz)

        // Pneu de Borracha
        const tireGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.28, 32)
        tireGeo.rotateX(Math.PI / 2)
        const tireMesh = new THREE.Mesh(tireGeo, tireMaterial)
        tireMesh.castShadow = true
        wheelGroup.add(tireMesh)

        // Roda de Liga Leve (Jante Multi-raios)
        const rimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.3, 16)
        rimGeo.rotateX(Math.PI / 2)
        const rimMesh = new THREE.Mesh(rimGeo, rimMaterial)
        wheelGroup.add(rimMesh)

        // Pinça de Freio Esportiva (Vermelha)
        const brakeGeo = new THREE.BoxGeometry(0.12, 0.18, 0.1)
        const brakeMesh = new THREE.Mesh(brakeGeo, brakeMaterial)
        brakeMesh.position.set(0, 0.08, 0)
        wheelGroup.add(brakeMesh)

        carGroup.add(wheelGroup)
      })
    })

    // ESPELHOS RETROVISORES AERODINÂMICOS (ESQUERDA E DIREITA)
    const mirrorGeo = new THREE.BoxGeometry(0.18, 0.12, 0.22)
    const mirrorLeft = new THREE.Mesh(mirrorGeo, bodyMaterial)
    mirrorLeft.position.set(halfL - hoodLen - 0.2, 0.98, (width/2) + 0.15)
    mirrorLeft.castShadow = true
    const mirrorRight = mirrorLeft.clone()
    mirrorRight.position.set(halfL - hoodLen - 0.2, 0.98, -(width/2) - 0.15)
    carGroup.add(mirrorLeft, mirrorRight)

    // FARÓIS DIANTEIROS E LANTERNAS TRASEIRAS COM CURVATURA E GLOW
    const headGeo = new THREE.BoxGeometry(0.12, 0.18, 0.45)
    const headLeft = new THREE.Mesh(headGeo, headlightMaterial)
    headLeft.position.set(halfL + 0.08, 0.62, 0.65)
    const headRight = headLeft.clone()
    headRight.position.set(halfL + 0.08, 0.62, -0.65)
    carGroup.add(headLeft, headRight)

    const tailGeo = new THREE.BoxGeometry(0.12, 0.18, 0.5)
    const tailLeft = new THREE.Mesh(tailGeo, tailLightMaterial)
    tailLeft.position.set(-halfL - 0.08, 0.62, 0.65)
    const tailRight = tailLeft.clone()
    tailRight.position.set(-halfL - 0.08, 0.62, -0.65)
    carGroup.add(tailLeft, tailRight)

    // GRADE DIANTEIRA CROMADA
    const grilleGeo = new THREE.BoxGeometry(0.08, 0.22, 0.7)
    const grilleMesh = new THREE.Mesh(grilleGeo, chromeMaterial)
    grilleMesh.position.set(halfL + 0.09, 0.5, 0)
    carGroup.add(grilleMesh)

  }, [bodyCategory, carColor])

  // 3. ATUALIZAÇÃO DOS PINS 3D
  useEffect(() => {
    const pinsGroup = pinsGroupRef.current
    if (!pinsGroup) return

    while (pinsGroup.children.length > 0) {
      pinsGroup.remove(pinsGroup.children[0])
    }

    pins.forEach((pin, idx) => {
      const pinMeta = DAMAGE_TYPES.find(d => d.id === pin.type)
      const pinColor = pinMeta ? pinMeta.color : '#ef4444'

      const pinSubGroup = new THREE.Group()
      pinSubGroup.position.set(pin.x, pin.y, pin.z)

      const sphereGeo = new THREE.SphereGeometry(0.14, 16, 16)
      const sphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(pinColor),
        emissive: new THREE.Color(pinColor),
        emissiveIntensity: 0.8,
        roughness: 0.1,
      })
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat)
      pinSubGroup.add(sphereMesh)

      const ringGeo = new THREE.RingGeometry(0.18, 0.26, 24)
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(pinColor),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.rotation.x = Math.PI / 2
      pinSubGroup.add(ringMesh)

      pinsGroup.add(pinSubGroup)
    })
  }, [pins])

  // 4. RAYCASTING PARA CLICAR NA LATARIA E MARCAR PONTOS 3D
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

  function setCameraAngle(angle: 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'TOP' | 'FREE') {
    const controls = controlsRef.current
    const camera = cameraRef.current
    if (!controls || !camera) return

    if (angle === 'FRONT') { camera.position.set(7.5, 2.2, 0) }
    if (angle === 'BACK') { camera.position.set(-7.5, 2.2, 0) }
    if (angle === 'LEFT') { camera.position.set(0, 2.2, 7.5) }
    if (angle === 'RIGHT') { camera.position.set(0, 2.2, -7.5) }
    if (angle === 'TOP') { camera.position.set(0, 9, 0.1) }
    if (angle === 'FREE') { camera.position.set(6.5, 3.2, 7.5) }
    controls.target.set(0, 0.7, 0)
    controls.update()
  }

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-5 space-y-5 shadow-2xl text-white">
      {/* CABEÇALHO TÉCNICO 3D */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-400" /> Curvatura 3D Realista
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-widest">
              Silhueta: {bodyCategory}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
            Gêmeo Digital Automotivo • {vehicleBrand} {vehicleModel}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {readOnly
              ? 'Gire livremente em 360° para inspecionar os danos marcados na lataria.'
              : 'Clique em qualquer parte da pintura curva em 3D para registrar uma imperfeição.'}
          </p>
        </div>

        {/* CONTROLES DE PINTURA METÁLICA */}
        <div className="flex items-center gap-2 bg-neutral-900/90 p-2 rounded-2xl border border-neutral-800 self-start sm:self-auto">
          <Paintbrush className="w-4 h-4 text-neutral-400 ml-1" />
          <span className="text-xs font-semibold text-neutral-300">Pintura:</span>
          <div className="flex items-center gap-1.5">
            {VEHICLE_COLORS.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={() => setCarColor(c.hex)}
                className={`w-5 h-5 rounded-full border transition-all ${
                  carColor === c.hex ? 'ring-2 ring-blue-400 scale-125' : 'border-neutral-700 hover:scale-110'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CONTROLES DE CÂMERA E CARROCERIA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-neutral-900/90 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto border border-neutral-800">
          <span className="text-[10px] font-mono font-bold text-neutral-400 px-2 uppercase tracking-widest flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-blue-400" /> Câmera:
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
              className="px-3 py-1 text-xs font-bold rounded-xl transition-all bg-neutral-800/60 hover:bg-blue-600 text-neutral-200 hover:text-white"
            >
              {ang.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
          <span>Formato da Lataria:</span>
          <select
            value={bodyCategory}
            onChange={(e) => setBodyCategory(e.target.value as any)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1 text-xs font-bold text-white outline-none focus:border-blue-500"
          >
            <option value="SEDAN">Sedan Aerodinâmico</option>
            <option value="HATCH">Hatch Compacto</option>
            <option value="SUV">SUV / Crossover</option>
            <option value="PICKUP">Picape Robusta</option>
            <option value="COUPE">Cupê Esportivo</option>
          </select>
        </div>
      </div>

      {/* ÁREA DO CANVAS 3D WEBGL COM BEZIER CURVES */}
      <div 
        ref={mountRef}
        onClick={handleCanvasClick}
        className="relative w-full aspect-[2/1] sm:aspect-[2.4/1] bg-gradient-to-b from-neutral-950 via-slate-950 to-black rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-neutral-800/80 shadow-2xl group"
      >
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 text-[11px] font-mono text-neutral-300 flex items-center gap-2 pointer-events-none">
          <RotateCw className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '8s' }} />
          Gire 360° com o mouse / toque
        </div>

        {pendingPoint && (
          <div className="absolute top-3 right-3 bg-blue-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-400/50 shadow-lg animate-pulse">
            Ponto selecionado em 3D (X:{pendingPoint.x}, Y:{pendingPoint.y}, Z:{pendingPoint.z})
          </div>
        )}
      </div>

      {/* MODAL POPUP PARA CONFIRMAR O PIN DE AVARIA */}
      {pendingPoint && !readOnly && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-400" /> Adicionar Avaria na Lataria 3D
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
                      pinType === t.id ? 'bg-blue-600 text-white border-blue-400 shadow-md' : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
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
                        pinSeverity === s.id ? 'bg-white text-black border-white ring-2 ring-blue-500' : 'bg-neutral-950 text-neutral-400 border-neutral-800'
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
                  placeholder="Ex: Risco profundo na porta esquerda..."
                  className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingPoint(null)}
                  className="flex-1 py-2 text-xs font-bold text-neutral-300 bg-neutral-950 border border-neutral-800 rounded-xl hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddPin}
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Confirmar Pin 3D
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE PINS REGISTRADOS */}
      {pins.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-neutral-800/80">
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
                    selectedPinId === p.id ? 'border-blue-500 bg-blue-950/40' : 'border-neutral-800/80 bg-neutral-900/60'
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
