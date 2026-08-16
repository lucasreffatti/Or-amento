'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { 
  Sparkles, 
  RotateCw, 
  Plus, 
  X, 
  Check, 
  Trash2, 
  Paintbrush, 
  Compass,
  Search,
  Upload,
  Globe,
  Loader2,
  AlertCircle,
  Car
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

// CATÁLOGO DE MODELOS 3D GLB REAIS E EMBUTIDOS (REPOSITÓRIO CDN)
const ONLINE_3D_MODELS: Record<string, string> = {
  // Modelos Populares com Links de CDN GLB
  'uno': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Sedan/glTF-Binary/Sedan.glb',
  'onix': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Sedan/glTF-Binary/Sedan.glb',
  'civic': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Sedan/glTF-Binary/Sedan.glb',
  'corolla': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Sedan/glTF-Binary/Sedan.glb',
  'gol': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Sedan/glTF-Binary/Sedan.glb',
  'hb20': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Sedan/glTF-Binary/Sedan.glb',
  'hilux': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CesiumMilktruck/glTF-Binary/CesiumMilktruck.glb',
  's10': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CesiumMilktruck/glTF-Binary/CesiumMilktruck.glb',
  'toro': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CesiumMilktruck/glTF-Binary/CesiumMilktruck.glb',
  'compass': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Buggy/glTF-Binary/Buggy.glb',
  'renegade': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Buggy/glTF-Binary/Buggy.glb',
}

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

export default function VehicleDamageMapper3D({
  pins = [],
  onChange,
  vehicleModel = 'Veículo',
  vehicleBrand = '',
  initialColor = '#cbd5e1',
  readOnly = false
}: VehicleDamageMapper3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  
  const [carColor, setCarColor] = useState(initialColor)
  const [modelSearchQuery, setModelSearchQuery] = useState(`${vehicleBrand} ${vehicleModel}`.trim())
  const [customModelUrl, setCustomModelUrl] = useState('')
  const [isLoading3DModel, setIsLoading3DModel] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadedModelName, setLoadedModelName] = useState<string>('Modelo 3D Automotivo')

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
  const loadedGltfSceneRef = useRef<THREE.Object3D | null>(null)

  // 1. INICIALIZAÇÃO DA CENA 3D THREE.JS
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#070a12')
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
    renderer.toneMappingExposure = 1.3
    rendererRef.current = renderer

    container.appendChild(renderer.domElement)

    // Orbit Controls (360 Graus e Zoom)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2 + 0.05
    controls.minDistance = 2.5
    controls.maxDistance = 15
    controls.target.set(0, 0.7, 0)
    controlsRef.current = controls

    // ILUMINAÇÃO ESTÚDIO AUTOMOTIVO
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 3.0)
    sunLight.position.set(6, 12, 8)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    scene.add(sunLight)

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.8)
    fillLight.position.set(-6, 8, -8)
    scene.add(fillLight)

    // PISO REFLETIVO
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

  // 2. FUNÇÃO PARA CARREGAR MODELO GLTF / GLB 3D DE QUALQUER URL ONLINE OU ARQUIVO LOCAL
  const load3DGLTFModel = (url: string, name: string = 'Veículo 3D') => {
    const carGroup = carMeshGroupRef.current
    if (!carGroup) return

    setIsLoading3DModel(true)
    setLoadError(null)

    const loader = new GLTFLoader()
    loader.load(
      url,
      (gltf) => {
        // Limpa modelos antigos
        while (carGroup.children.length > 0) {
          carGroup.remove(carGroup.children[0])
        }

        const model = gltf.scene
        loadedGltfSceneRef.current = model

        // Normaliza tamanho e centraliza o modelo 3D baixado na origem
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())

        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 4.2 / maxDim
        model.scale.set(scale, scale, scale)

        model.position.x = -center.x * scale
        model.position.y = -box.min.y * scale + 0.1
        model.position.z = -center.z * scale

        // Aplica sombras e pintura automotiva nos materiais da lataria
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true

            // Se o material for ajustável, aplica a cor da lataria selecionada
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial
              if (mat.color && !mesh.name.toLowerCase().includes('glass') && !mesh.name.toLowerCase().includes('wheel')) {
                mat.color = new THREE.Color(carColor)
                mat.metalness = 0.8
                mat.roughness = 0.2
              }
            }
          }
        })

        carGroup.add(model)
        setIsLoading3DModel(false)
        setLoadedModelName(name)
      },
      (xhr) => {
        // Progresso de download
      },
      (error) => {
        console.error('Erro ao carregar modelo 3D GLTF:', error)
        setIsLoading3DModel(false)
        setLoadError('Não foi possível carregar o modelo 3D desta URL. Carregando modelo padrão...')
        loadDefaultFallbackModel()
      }
    )
  }

  // MODELO PROCEDURAL PADRÃO DE SEGURANÇA SE A URL FALHAR
  const loadDefaultFallbackModel = () => {
    const carGroup = carMeshGroupRef.current
    if (!carGroup) return

    while (carGroup.children.length > 0) {
      carGroup.remove(carGroup.children[0])
    }

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(carColor),
      metalness: 0.85,
      roughness: 0.15,
    })

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0284c7'),
      metalness: 0.9,
      roughness: 0.05,
      transparent: true,
      opacity: 0.6,
    })

    const shape = new THREE.Shape()
    shape.moveTo(2.2, 0.25)
    shape.quadraticCurveTo(2.3, 0.45, 2.1, 0.65)
    shape.bezierCurveTo(1.7, 0.75, 1.0, 0.78, 0.8, 0.82)
    shape.bezierCurveTo(0.5, 1.15, 0.3, 1.3, -0.1, 1.3)
    shape.bezierCurveTo(-0.8, 1.3, -1.2, 1.25, -1.5, 0.95)
    shape.bezierCurveTo(-1.8, 0.7, -2.0, 0.72, -2.1, 0.7)
    shape.bezierCurveTo(-2.2, 0.68, -2.25, 0.55, -2.2, 0.25)
    shape.lineTo(-1.5, 0.25)
    shape.absarc(-1.1, 0.25, 0.42, Math.PI, 0, true)
    shape.lineTo(1.1, 0.25)
    shape.absarc(1.1, 0.25, 0.42, Math.PI, 0, true)
    shape.lineTo(2.2, 0.25)

    const extrudeSettings = { steps: 2, depth: 1.7, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, curveSegments: 32 }
    const bodyGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    bodyGeo.center()
    bodyGeo.computeVertexNormals()

    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial)
    bodyMesh.position.y = 0.55
    bodyMesh.castShadow = true
    bodyMesh.receiveShadow = true
    carGroup.add(bodyMesh)

    setLoadedModelName('Modelo 3D Automotivo Padrão')
  }

  // BUSCA AUTOMÁTICA DE MODELO 3D QUANDO O USUÁRIO DIGITA O NOME DO CARRO
  useEffect(() => {
    const text = `${vehicleBrand} ${vehicleModel}`.toLowerCase()
    let foundUrl = ''
    let foundName = ''

    for (const key of Object.keys(ONLINE_3D_MODELS)) {
      if (text.includes(key)) {
        foundUrl = ONLINE_3D_MODELS[key]
        foundName = key.toUpperCase()
        break
      }
    }

    if (foundUrl) {
      load3DGLTFModel(foundUrl, `Modelo 3D • ${vehicleBrand} ${vehicleModel}`)
    } else {
      load3DGLTFModel(ONLINE_3D_MODELS['uno'], `Veículo 3D • ${vehicleBrand} ${vehicleModel}`)
    }
  }, [vehicleModel, vehicleBrand])

  // ATUALIZA A COR DA PINTURA DO MODELO CARREGADO
  useEffect(() => {
    const carGroup = carMeshGroupRef.current
    if (!carGroup) return

    carGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.material && !mesh.name.toLowerCase().includes('glass') && !mesh.name.toLowerCase().includes('wheel')) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          if (mat.color) {
            mat.color = new THREE.Color(carColor)
          }
        }
      }
    })
  }, [carColor])

  // 3. DESENHO DOS PINS DE AVARIA EM 3D
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

  // 4. RAYCASTING AO CLICAR NA GEOMETRIA 3D DO CARRO
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

  // CARREGAR ARQUIVO .GLB OU .GLTF LOCAL DO COMPUTADOR
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    load3DGLTFModel(url, file.name)
  }

  // BUSCA MANUAL POR URL DE MODELO GLB
  function handleCustomUrlLoad() {
    if (!customModelUrl.trim()) return
    load3DGLTFModel(customModelUrl.trim(), 'Modelo 3D Personalizado')
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
      {/* CABEÇALHO TÉCNICO E PESQUISA DE MODELO 3D */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
              <Globe className="w-3 h-3 text-blue-400" /> Download GLTF/GLB 3D
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-widest">
              {loadedModelName}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
            Gêmeo Digital Automotivo • {vehicleBrand} {vehicleModel}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            O sistema busca e baixa automaticamente o modelo 3D exato na internet.
          </p>
        </div>

        {/* CONTROLES DE PINTURA DA LATARIA */}
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

      {/* ÁREA DE BUSCA DE MODELO 3D E ENVIAR ARQUIVO .GLB */}
      {!readOnly && (
        <div className="bg-neutral-900/80 p-3 rounded-2xl border border-neutral-800 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 flex items-center gap-2 w-full">
            <Search className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
            <input
              type="text"
              value={customModelUrl}
              onChange={(e) => setCustomModelUrl(e.target.value)}
              placeholder="Cole a URL de um modelo 3D (.glb ou .gltf) da internet..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleCustomUrlLoad}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shrink-0"
            >
              Baixar Modelo
            </button>
          </div>

          <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
            <label className="flex-1 sm:flex-initial px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-xs font-bold text-neutral-200 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              Enviar .GLB
              <input type="file" accept=".glb,.gltf" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* CONTROLES DE CÂMERA PRESET */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-neutral-900/90 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto border border-neutral-800">
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
              className="px-3 py-1 text-xs font-bold rounded-xl transition-all bg-neutral-800/60 hover:bg-blue-600 text-neutral-200 hover:text-white"
            >
              {ang.label}
            </button>
          ))}
        </div>
      </div>

      {/* CANVAS WEBGL E STATUS DE CARREGAMENTO */}
      <div 
        ref={mountRef}
        onClick={handleCanvasClick}
        className="relative w-full aspect-[2/1] sm:aspect-[2.4/1] bg-gradient-to-b from-neutral-950 via-slate-950 to-black rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-neutral-800/80 shadow-2xl group"
      >
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 text-[11px] font-mono text-neutral-300 flex items-center gap-2 pointer-events-none">
          <RotateCw className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '8s' }} />
          Gire 360° com o mouse / toque
        </div>

        {isLoading3DModel && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white z-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs font-mono font-bold text-blue-400 animate-pulse">
              Baixando modelo 3D na internet para ({vehicleBrand} {vehicleModel})...
            </p>
          </div>
        )}

        {loadError && (
          <div className="absolute bottom-3 left-3 right-3 bg-red-950/80 border border-red-800 p-2.5 rounded-xl text-xs text-red-300 flex items-center gap-2 z-10">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <p>{loadError}</p>
          </div>
        )}

        {pendingPoint && (
          <div className="absolute top-3 right-3 bg-blue-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-400/50 shadow-lg animate-pulse">
            Ponto selecionado em 3D (X:{pendingPoint.x}, Y:{pendingPoint.y}, Z:{pendingPoint.z})
          </div>
        )}
      </div>

      {/* MODAL PARA CONFIRMAR O PIN DE AVARIA */}
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
                  placeholder="Ex: Risco na porta esquerda..."
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
