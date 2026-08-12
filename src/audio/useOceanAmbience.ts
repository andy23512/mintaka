import { useEffect } from 'react'
import { useUIStore } from '../store/useUIStore'
import { oceanAmbience } from './oceanAmbience'

export function useOceanAmbience() {
  const audioStarted = useUIStore((s) => s.audioStarted)
  const audioMuted = useUIStore((s) => s.audioMuted)

  useEffect(() => {
    if (audioStarted) oceanAmbience.start()
  }, [audioStarted])

  useEffect(() => {
    oceanAmbience.setMuted(audioMuted)
  }, [audioMuted])

  useEffect(() => () => oceanAmbience.dispose(), [])
}
