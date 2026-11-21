import { useEffect, useRef, useState } from 'react'
import { pickChord } from './chords'
import './ChordGarden.css'

const GROWTH_EMOJIS = ['🪸', '🌿', '🫧']

interface GardenItem {
  id: number
  emoji: string
  rotate: number
  scale: number
}

export function ChordGarden() {
  const [target, setTarget] = useState<string[]>(() => pickChord())
  const [held, setHeld] = useState<Set<string>>(() => new Set())
  const [garden, setGarden] = useState<GardenItem[]>([])
  const nextId = useRef(0)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const key = e.key.toLowerCase()
      setHeld((prev) => {
        if (prev.has(key)) return prev
        const next = new Set(prev)
        next.add(key)
        return next
      })
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      setHeld((prev) => {
        if (!prev.has(key)) return prev
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    if (!target.every((key) => held.has(key))) return

    setGarden((g) => [
      ...g,
      {
        id: nextId.current++,
        emoji: GROWTH_EMOJIS[Math.floor(Math.random() * GROWTH_EMOJIS.length)],
        rotate: Math.random() * 24 - 12,
        scale: 0.85 + Math.random() * 0.3,
      },
    ])
    setTarget((prev) => pickChord(prev))
    setHeld(new Set())
  }, [held, target])

  return (
    <div className="chord-garden glass-panel">
      <div className="chord-keys">
        {target.map((key) => (
          <span key={key} className={`chord-key ${held.has(key) ? 'active' : ''}`}>
            {key.toUpperCase()}
          </span>
        ))}
      </div>
      <p className="chord-hint">
        Press these keys together, like a chord — something grows each time. No score, no wrong
        presses.
      </p>
      <div className="garden-bed">
        {garden.length === 0 && <span className="garden-empty">The seabed is still bare...</span>}
        {garden.map((item) => (
          <span
            key={item.id}
            className="garden-item"
            style={{
              transform: `rotate(${item.rotate}deg) scale(${item.scale})`,
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>
    </div>
  )
}
