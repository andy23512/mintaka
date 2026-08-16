import { useEffect } from 'react'
import { useUIStore } from '../store/useUIStore'
import { oceanAmbience } from './oceanAmbience'

export function useOceanAmbience() {
  const audioStarted = useUIStore((s) => s.audioStarted)
  const audioMuted = useUIStore((s) => s.audioMuted)
  const volume = useUIStore((s) => s.volume)

  useEffect(() => {
    if (audioStarted) oceanAmbience.start()
  }, [audioStarted])

  useEffect(() => {
    oceanAmbience.setMuted(audioMuted)
  }, [audioMuted])

  useEffect(() => {
    oceanAmbience.setVolume(volume)
  }, [volume])

  useEffect(() => () => oceanAmbience.dispose(), [])
}
