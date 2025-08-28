import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Box3, Color, DoubleSide, Mesh, PerspectiveCamera, Texture, Vector3 } from 'three'
import { OrbitControls } from '@react-three/drei'

export interface Beam3DHandle { capture: () => Promise<string> }

export const Beam3D = forwardRef<Beam3DHandle, { result: any | null; params: any }>(function Beam3D({ result, params }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useImperativeHandle(ref, () => ({
    capture: async () => canvasRef.current ? canvasRef.current.toDataURL('image/png') : ''
  }))

  const length = params.length
  const section = params.section
  const h = section.type === 'rect' ? section.height : section.type === 'circle' ? section.diameter : section.depth
  const b = section.type === 'rect' ? section.width : section.type === 'circle' ? section.diameter : section.flange_width

  const stresses = result?.stress_bottom ?? []
  const maxAbs = Math.max(1e-9, ...stresses.map((s: number) => Math.abs(s)))

  return (
    <div style={{ height: '100%', borderRadius: 8, overflow: 'hidden' }}>
      <Canvas gl={{ preserveDrawingBuffer: true }} onCreated={({ gl }) => { canvasRef.current = gl.domElement }} camera={{ position: [length * 1.2, length * 0.4, length * 0.8], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 4]} intensity={0.8} />
        <OrbitControls enablePan enableZoom enableRotate />
        <BeamMesh length={length} width={b} height={h} stresses={stresses} maxAbs={maxAbs} />
      </Canvas>
    </div>
  )
})

function BeamMesh({ length, width, height, stresses, maxAbs }: { length: number; width: number; height: number; stresses: number[]; maxAbs: number }) {
  const segments = Math.max(20, stresses.length - 1)
  const segmentLength = length / segments

  return (
    <group position={[-length / 2, 0, 0]}>
      {new Array(segments).fill(0).map((_, i) => {
        const s = stresses[Math.min(i, stresses.length - 1)] ?? 0
        const t = (s / maxAbs + 1) / 2 // map [-max,max] -> [0,1]
        const color = stressColor(t)
        return (
          <mesh key={i} position={[i * segmentLength + segmentLength / 2, 0, 0]}>
            <boxGeometry args={[segmentLength * 0.98, height, width]} />
            <meshStandardMaterial color={color} side={DoubleSide} metalness={0.1} roughness={0.6} />
          </mesh>
        )
      })}
    </group>
  )
}

function stressColor(t: number): string {
  // blue -> green -> yellow -> red
  const r = Math.min(1, Math.max(0, 2 * t - 0.2))
  const g = Math.min(1, Math.max(0, 2 * (1 - Math.abs(t - 0.5))))
  const b = Math.min(1, Math.max(0, 1 - 2 * t + 0.2))
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
}

