import { useMemo } from 'react'
import * as THREE from 'three'
import { SEA_FLOOR_DEPTH, floorFragmentShader, floorVertexShader } from './floorShaders'

function createFloorMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: floorVertexShader,
    fragmentShader: floorFragmentShader,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uSandLight: { value: new THREE.Color('#d8c89a') },
        uSandDark: { value: new THREE.Color('#a88f66') },
      },
    ]),
  })
}

interface SeaFloorProps {
  segments?: number
}

export function SeaFloor({ segments = 48 }: SeaFloorProps) {
  const material = useMemo(() => createFloorMaterial(), [])
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(90, 90, segments, segments),
    [segments],
  )

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0, -SEA_FLOOR_DEPTH, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  )
}
