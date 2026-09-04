'use client'

import { useRef, useState, useEffect, useMemo, Suspense, Component, ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Clone } from '@react-three/drei'
import * as THREE from 'three'
import { useTheme } from 'next-themes'

class GLTFErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: any) {
    console.warn("Falla al cargar hucha.glb, usando modelo alternativo:", error)
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// Componente que intenta cargar el modelo GLTF descargado por el usuario
function LoadedPiggyBank({ opacity = 1.0, scale = 0.8, ...props }: { opacity?: number; scale?: number;[key: string]: any }) {
  const { scene } = useGLTF('/hucha.glb')

  return (
    <Clone
      object={scene}
      castShadow
      receiveShadow
      rotation={[0, -Math.PI / 2, 0]}
      scale={scale}
      deep="materialsOnly"
      inject={(node: any) => {
        if (node.isMesh && node.material) {
          node.material = node.material.clone()
          node.material.transparent = opacity < 1.0
          node.material.opacity = opacity

          // Preservar ojos negros/oscuros o ranura negra calculando luminancia
          const color = node.material.color
          if (color) {
            const luminance = color.r * 0.299 + color.g * 0.587 + color.b * 0.114
            if (luminance > 0.08) {
              color.set('#ff8fa3') // Rosa cerdito hermoso
            } else {
              color.set('#1e293b') // Ojos / ranura negros
            }
          }

          node.material.roughness = 0.12
          node.material.metalness = 0.08
        }
        return null
      }}
      {...props}
    />
  )
}

// Cerdito de repuesto (procedimental) en caso de que no exista hucha.glb
function DefaultPiggy({ opacity = 1.0, isDark, ...props }: { opacity?: number; isDark: boolean;[key: string]: any }) {
  return (
    <group {...props}>
      {/* Cuerpo (Esfera ovalada) */}
      <mesh castShadow receiveShadow scale={[1.25, 1.0, 1.0]}>
        <sphereGeometry args={[1.35, 32, 32]} />
        <meshPhysicalMaterial
          color={isDark ? '#f472b6' : '#ec4899'}
          roughness={0.08}
          metalness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          transparent={opacity < 1.0}
          opacity={opacity}
          transmission={0}
          thickness={1.5}
        />
      </mesh>

      {/* Hocico */}
      <mesh position={[1.5, -0.15, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 32]} />
        <meshPhysicalMaterial color={isDark ? '#ec4899' : '#db2777'} roughness={0.15} clearcoat={0.5} transparent={opacity < 1.0} opacity={opacity} />
      </mesh>
      {/* Fosas nasales */}
      <mesh position={[1.61, -0.07, 0.08]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 8]} />
        <meshBasicMaterial color="#1e293b" transparent={opacity < 1.0} opacity={opacity} />
      </mesh>
      <mesh position={[1.61, -0.07, -0.08]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 8]} />
        <meshBasicMaterial color="#1e293b" transparent={opacity < 1.0} opacity={opacity} />
      </mesh>

      {/* Ojos */}
      <mesh position={[1.05, 0.35, 0.45]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color="#1e293b" transparent={opacity < 1.0} opacity={opacity} />
      </mesh>
      <mesh position={[1.05, 0.35, -0.45]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color="#1e293b" transparent={opacity < 1.0} opacity={opacity} />
      </mesh>

      {/* Oreja Derecha */}
      <mesh position={[0.4, 1.1, 0.65]} rotation={[0.3, 0.2, -0.4]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.08, 32]} />
        <meshPhysicalMaterial color={isDark ? '#f472b6' : '#ec4899'} roughness={0.15} clearcoat={0.5} transparent={opacity < 1.0} opacity={opacity} />
      </mesh>
      {/* Oreja Izquierda */}
      <mesh position={[0.4, 1.1, -0.65]} rotation={[-0.3, -0.2, -0.4]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.08, 32]} />
        <meshPhysicalMaterial color={isDark ? '#f472b6' : '#ec4899'} roughness={0.15} clearcoat={0.5} transparent={opacity < 1.0} opacity={opacity} />
      </mesh>

      {/* Patas */}
      <mesh position={[0.5, -0.9, 0.6]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.4, 16]} />
        <meshPhysicalMaterial color={isDark ? '#ec4899' : '#db2777'} roughness={0.1} transparent={opacity < 1.0} opacity={opacity} />
      </mesh>
      <mesh position={[0.5, -0.9, -0.6]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.4, 16]} />
        <meshPhysicalMaterial color={isDark ? '#ec4899' : '#db2777'} roughness={0.1} transparent={opacity < 1.0} opacity={opacity} />
      </mesh>
      <mesh position={[-0.5, -0.9, 0.6]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.4, 16]} />
        <meshPhysicalMaterial color={isDark ? '#ec4899' : '#db2777'} roughness={0.1} transparent={opacity < 1.0} opacity={opacity} />
      </mesh>
      <mesh position={[-0.5, -0.9, -0.6]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.4, 16]} />
        <meshPhysicalMaterial color={isDark ? '#ec4899' : '#db2777'} roughness={0.1} transparent={opacity < 1.0} opacity={opacity} />
      </mesh>

      {/* Ranura para Monedas */}
      <mesh position={[0, 0.98, 0]}>
        <boxGeometry args={[0.5, 0.04, 0.1]} />
        <meshBasicMaterial color="#111827" transparent={opacity < 1.0} opacity={opacity} />
      </mesh>

      {/* Cola */}
      <mesh position={[-1.35, 0, 0]} rotation={[0.4, 0.5, 0.8]}>
        <torusGeometry args={[0.18, 0.05, 8, 24, Math.PI * 1.6]} />
        <meshPhysicalMaterial color={isDark ? '#f472b6' : '#ec4899'} roughness={0.1} transparent={opacity < 1.0} opacity={opacity} />
      </mesh>
    </group>
  )
}

interface InteractivePiggyProps {
  basePosition: [number, number, number]
  baseRotation?: [number, number, number]
  scale: number
  opacity: number
  speed: number
  phase: number
  hasModel: boolean | null
  isDark: boolean
}

// Componente para un cerdito interactivo individual
function InteractivePiggy({
  basePosition,
  baseRotation = [0, 0, 0],
  scale,
  opacity,
  speed,
  phase,
  hasModel,
  isDark
}: InteractivePiggyProps) {
  const ref = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [bounceTime, setBounceTime] = useState(-1)

  const triggerBounce = () => {
    setBounceTime(0)
  }

  useFrame((state, delta) => {
    if (!ref.current) return
    const time = state.clock.getElapsedTime()
    const pointer = state.pointer // Coordenadas [-1, 1]

    // 1. Flotación elástica base
    const floatOffset = Math.sin(time * speed + phase) * 0.35
    const targetY = basePosition[1] + floatOffset

    // 2. Parallax e inclinación al mover el ratón (incorporando la rotación base)
    const targetRotX = baseRotation[0] - pointer.y * 0.22
    const targetRotY = baseRotation[1] + pointer.x * 0.28 + Math.sin(time * 0.2 + phase) * 0.15
    const targetRotZ = baseRotation[2]

    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, targetRotX, 0.1)
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targetRotY, 0.1)
    ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, targetRotZ, 0.1)

    // 3. Hover scale (crece levemente cuando el puntero pasa sobre él)
    const targetScale = hovered ? scale * 1.15 : scale

    // 4. Salto y deformación física al hacer clic
    if (bounceTime >= 0) {
      const nextTime = bounceTime + delta * 7.5 // Velocidad del salto
      const bounceHeight = Math.max(0, Math.sin(nextTime) * Math.exp(-nextTime * 0.4) * 0.9)
      const squash = 1.0 - bounceHeight * 0.15

      ref.current.position.y = targetY + bounceHeight
      ref.current.scale.set(
        THREE.MathUtils.lerp(ref.current.scale.x, targetScale * (2 - squash), 0.15),
        THREE.MathUtils.lerp(ref.current.scale.y, targetScale * squash, 0.15),
        THREE.MathUtils.lerp(ref.current.scale.z, targetScale * (2 - squash), 0.15)
      )

      if (nextTime > Math.PI * 3) {
        setBounceTime(-1)
      } else {
        setBounceTime(nextTime)
      }
    } else {
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, 0.08)
      ref.current.scale.set(
        THREE.MathUtils.lerp(ref.current.scale.x, targetScale, 0.08),
        THREE.MathUtils.lerp(ref.current.scale.y, targetScale, 0.08),
        THREE.MathUtils.lerp(ref.current.scale.z, targetScale, 0.08)
      )
    }
  })

  const loadedPigProps = {
    opacity,
    scale: 0.32, // Escala base interna adaptada para el modelo GLTF hucha.glb
  }

  const fallbackPigProps = {
    opacity,
    scale: 0.64, // Escala base interna adaptada para el DefaultPiggy
  }

  return (
    <group
      ref={ref}
      position={basePosition}
      scale={scale}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        if (typeof document !== 'undefined') document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered(false)
        if (typeof document !== 'undefined') document.body.style.cursor = 'auto'
      }}
      onClick={(e) => {
        e.stopPropagation()
        triggerBounce()
      }}
    >
      {hasModel === true && (
        <Suspense fallback={null}>
          <LoadedPiggyBank {...loadedPigProps} />
        </Suspense>
      )}
    </group>
  )
}

interface SceneContentProps {
  theme: string
  hasModel: boolean | null
}

function SceneContent({ theme, hasModel }: SceneContentProps) {
  const isDark = theme === 'dark'

  // Configuración de los cerditos flotantes (posiciones base, orientaciones, tamaños y opacidades)
  const piggiesConfig = useMemo(() => [
    // Hucha central principal (más cercana Z=1.0)
    { id: 'main', basePosition: [2.5, -0.6, 1.0] as [number, number, number], baseRotation: [0, -Math.PI / 1, 0] as [number, number, number], scale: 2.2, opacity: 0.75, speed: 0.7, phase: 0 },
    // Cerditos de fondo pero traídos más cerca en el eje Z
    { id: 'bg1', basePosition: [-3.8, 2.3, -0.5] as [number, number, number], baseRotation: [0, Math.PI / 4, 0] as [number, number, number], scale: 1.3, opacity: 0.35, speed: 0.45, phase: 1.2 },
    { id: 'bg2', basePosition: [3.6, 2.2, -1.0] as [number, number, number], baseRotation: [0, -Math.PI / 3, 0] as [number, number, number], scale: 1.1, opacity: 0.25, speed: 0.55, phase: 2.8 },
    { id: 'bg3', basePosition: [-2.8, -2.2, 0.5] as [number, number, number], baseRotation: [0, Math.PI / 6, 0] as [number, number, number], scale: 1.4, opacity: 0.45, speed: 0.35, phase: 4.1 },
    { id: 'bg4', basePosition: [3.2, -2.0, -0.5] as [number, number, number], baseRotation: [0, -Math.PI / 5, 0] as [number, number, number], scale: 1.15, opacity: 0.3, speed: 0.5, phase: 5.4 },
    { id: 'bg5', basePosition: [-0.5, 3.2, -2.0] as [number, number, number], baseRotation: [0, Math.PI / 2, 0] as [number, number, number], scale: 0.9, opacity: 0.2, speed: 0.4, phase: 0.7 },
    { id: 'bg6', basePosition: [-5.2, 0.2, 1.0] as [number, number, number], baseRotation: [0, -Math.PI / 2, 0] as [number, number, number], scale: 1.2, opacity: 0.35, speed: 0.5, phase: 2.1 },
    { id: 'bg7', basePosition: [0.2, -3.4, -1.5] as [number, number, number], baseRotation: [0, Math.PI / 1.1, 0] as [number, number, number], scale: 1.0, opacity: 0.25, speed: 0.3, phase: 3.5 },
    { id: 'bg8', basePosition: [5.5, -0.2, -2.5] as [number, number, number], baseRotation: [0, -Math.PI / 1.3, 0] as [number, number, number], scale: 0.95, opacity: 1, speed: 0.6, phase: 4.9 },
    // Cerdito gigante del usuario
    { id: 'bg9', basePosition: [2, 2.0, -2.0] as [number, number, number], baseRotation: [0, Math.PI / 2, 0] as [number, number, number], scale: 10.6, opacity: 1, speed: 0.4, phase: 0 },
    // NUEVOS cerditos súper cercanos (primer plano) en los laterales
    { id: 'bg10', basePosition: [-4.5, -1.0, 2.0] as [number, number, number], baseRotation: [0, Math.PI / 4, 0] as [number, number, number], scale: 3.2, opacity: 0.6, speed: 0.5, phase: 1.8 },
    { id: 'bg11', basePosition: [4.8, -1.5, 1.5] as [number, number, number], baseRotation: [0, -Math.PI / 3, 0] as [number, number, number], scale: 2.8, opacity: 0.5, speed: 0.45, phase: 3.1 },
    { id: 'bg12', basePosition: [-3.0, 2.5, 2.5] as [number, number, number], baseRotation: [0, Math.PI / 1.2, 1] as [number, number, number], scale: 4.5, opacity: 1, speed: 0.5, phase: 4.9 },
  ], [])

  return (
    <group>
      {piggiesConfig.map((cfg) => (
        <InteractivePiggy
          key={cfg.id}
          basePosition={cfg.basePosition}
          baseRotation={cfg.baseRotation}
          scale={cfg.scale}
          opacity={cfg.opacity}
          speed={cfg.speed}
          phase={cfg.phase}
          hasModel={hasModel}
          isDark={isDark}
        />
      ))}
    </group>
  )
}

export function ThreeScene() {
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme || 'dark'

  const [hasModel, setHasModel] = useState<boolean | null>(null)
  const [eventSource, setEventSource] = useState<HTMLElement | undefined>(undefined)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setEventSource(document.body)
    }

    // Ejecutar check en el cliente al montar para verificar hucha.glb
    fetch('/hucha.glb', { method: 'HEAD' })
      .then((res) => {
        const contentType = res.headers.get('content-type') || ''
        if (res.ok && !contentType.includes('text/html')) {
          setHasModel(true)
        } else {
          setHasModel(false)
        }
      })
      .catch(() => {
        setHasModel(false)
      })
  }, [])

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-transparent pointer-events-none"
    >
      <Canvas
        shadows
        eventSource={eventSource}
        camera={{ position: [0, 0, 13], fov: 45 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'none', background: 'transparent' }}
      >
        <ambientLight intensity={theme === 'dark' ? 0.8 : 1.2} />

        {/* Luz principal direccional para proyectar sombras optimizadas */}
        <directionalLight
          castShadow
          position={[6, 12, 5]}
          intensity={1.8}
          shadow-mapSize={[512, 512]}
          shadow-camera-far={30}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />

        {/* Luces puntuales de contra para reflejos metálicos extra */}
        <pointLight position={[-8, -5, -5]} intensity={1.0} color="#8b5cf6" />
        <pointLight position={[8, 5, 2]} intensity={0.8} color="#f472b6" />

        <SceneContent theme={theme} hasModel={hasModel} />
      </Canvas>
    </div>
  )
}
