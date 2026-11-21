import { beforeEach, describe, expect, it } from 'vitest'
import { useUIStore } from '../src/store/useUIStore'

beforeEach(() => useUIStore.setState(useUIStore.getInitialState(), true))

describe('useUIStore', () => {
  it('starts with no tool open and the sound off (muted, not started, volume 0.7)', () => {
    const s = useUIStore.getState()
    expect(s.activeTool).toBe('none')
    expect(s.audioStarted).toBe(false)
    expect(s.audioMuted).toBe(true)
    expect(s.volume).toBe(0.7)
  })

  it('opens a tool, switches to another, and closes it when asked for again', () => {
    const { setActiveTool } = useUIStore.getState()
    setActiveTool('typing')
    expect(useUIStore.getState().activeTool).toBe('typing')
    setActiveTool('breath')
    expect(useUIStore.getState().activeTool).toBe('breath')
    setActiveTool('breath')
    expect(useUIStore.getState().activeTool).toBe('none')
    setActiveTool('chord')
    expect(useUIStore.getState().activeTool).toBe('chord')
    setActiveTool('chord')
    expect(useUIStore.getState().activeTool).toBe('none')
  })

  it('startAudio marks audio as started but leaves it muted', () => {
    useUIStore.getState().startAudio()
    expect(useUIStore.getState().audioStarted).toBe(true)
    expect(useUIStore.getState().audioMuted).toBe(true)
  })

  it('toggleMute flips back and forth', () => {
    const { toggleMute } = useUIStore.getState()
    toggleMute()
    expect(useUIStore.getState().audioMuted).toBe(false)
    toggleMute()
    expect(useUIStore.getState().audioMuted).toBe(true)
  })

  it('setVolume stores the volume and unmutes', () => {
    useUIStore.getState().setVolume(0.2)
    expect(useUIStore.getState().volume).toBe(0.2)
    expect(useUIStore.getState().audioMuted).toBe(false)
  })

  it('setVolume does not touch the other fields', () => {
    useUIStore.getState().setActiveTool('chord')
    useUIStore.getState().setVolume(0)
    expect(useUIStore.getState().activeTool).toBe('chord')
    expect(useUIStore.getState().audioStarted).toBe(false)
  })
})
