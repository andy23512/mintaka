import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { oceanAmbience } from '../audio/oceanAmbience'
import { SEA_FLOOR_DEPTH } from './floorShaders'
import { MAX_RIPPLES, oceanFragmentShader, oceanVertexShader } from './oceanShaders'

const RIPPLE_MIN_INTERVAL = 0.045
const RIPPLE_SOUND_MIN_INTERVAL = 0.22

function createOceanMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: oceanVertexShader,
    fragmentShader: oceanFragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uRipplePos: {
        value: Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector2(9999, 9999)),
      },
      uRippleTime: { value: new Float32Array(MAX_RIPPLES).fill(-1000) },
      uRippleActive: { value: new Float32Array(MAX_RIPPLES) },
      uSunDir: { value: new THREE.Vector3(0.35, 0.55, 0.2).normalize() },
      uColorShallow: { value: new THREE.Color('#d8fbf5') },
      uColorDeep: { value: new THREE.Color('#0c5e78') },
      uSkyZenith: { value: new THREE.Color('#3fa9c9') },
      uSkyHorizon: { value: new THREE.Color('#eafffb') },
      uOpacity: { value: 0.94 },
      uFloorDepth: { value: SEA_FLOOR_DEPTH },
      uExtinction: { value: 0.15 },
    },
  })
}

interface OceanProps {
  segments?: number
}

export function Ocean({ segments = 180 }: OceanProps) {
  const material = useMemo(() => createOceanMaterial(), [])
  const cursorRef = useRef(0)
  const lastRippleAt = useRef(0)
  const lastRippleSoundAt = useRef(-Infinity)

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(90, 90, segments, segments),
    [segments],
  )

  const spawnRipple = (point: THREE.Vector3, elapsed: number) => {
    if (elapsed - lastRippleAt.current < RIPPLE_MIN_INTERVAL) return
    lastRippleAt.current = elapsed

    const i = cursorRef.current
    const posArray = material.uniforms.uRipplePos.value as THREE.Vector2[]
    const timeArray = material.uniforms.uRippleTime.value as Float32Array
    const activeArray = material.uniforms.uRippleActive.value as Float32Array

    posArray[i].set(point.x, point.y)
    timeArray[i] = elapsed
    activeArray[i] = 1

    cursorRef.current = (cursorRef.current + 1) % MAX_RIPPLES

    if (elapsed - lastRippleSoundAt.current >= RIPPLE_SOUND_MIN_INTERVAL) {
      lastRippleSoundAt.current = elapsed
      oceanAmbience.playRipple(0.5 + Math.random() * 0.5)
    }
  }

  const handlePointer = (event: ThreeEvent<PointerEvent>) => {
    const local = event.object.worldToLocal(event.point.clone())
    spawnRipple(local, material.uniforms.uTime.value as number)
  }

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={handlePointer}
      onPointerDown={handlePointer}
    />
  )
}
