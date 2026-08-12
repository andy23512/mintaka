import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { Ocean } from './Ocean'

function CameraRig() {
  const t0 = useRef(Math.random() * 100)
  useFrame((state) => {
    const t = state.clock.elapsedTime + t0.current
    state.camera.position.x = Math.sin(t * 0.06) * 0.6
    state.camera.position.y = 2.4 + Math.sin(t * 0.11) * 0.12
    state.camera.lookAt(0, 0.1, -8)
  })
  return null
}

const isLowPowerDevice =
  typeof window !== 'undefined' &&
  (window.matchMedia('(pointer: coarse)').matches || navigator.hardwareConcurrency <= 4)

export function OceanScene() {
  return (
    <Canvas
      dpr={isLowPowerDevice ? [1, 1] : [1, 1.75]}
      gl={{ antialias: true, alpha: false }}
      camera={{ position: [0, 2.4, 7.5], fov: 52, near: 0.1, far: 200 }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color('#0c5e78')
        scene.fog = new THREE.Fog('#1f8fa8', 18, 55)
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.55} color="#bdf6ee" />
        <hemisphereLight args={['#bdf6ee', '#062c40', 0.6]} />
        <Ocean segments={isLowPowerDevice ? 90 : 180} />
        <Sparkles
          count={isLowPowerDevice ? 30 : 60}
          scale={[26, 3, 26]}
          size={2.4}
          speed={0.15}
          opacity={0.55}
          color="#eafffb"
          position={[0, 0.6, -6]}
        />
        <CameraRig />
      </Suspense>
    </Canvas>
  )
}
