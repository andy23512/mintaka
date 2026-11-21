import { useEffect, useRef, useState } from 'react'
import { CYCLE_SECONDS, getPhaseAt, scaleForPhase } from './breath'
import './BreathGuide.css'

export function BreathGuide() {
  const [running, setRunning] = useState(true)
  const [display, setDisplay] = useState({ label: 'Inhale', secondsLeft: 5, cycles: 0 })
  const circleRef = useRef<HTMLDivElement>(null)
  const startRef = useRef(performance.now())
  const pausedElapsedRef = useRef(0)
  const lastLabelRef = useRef('')
  const lastSecondsRef = useRef(0)

  useEffect(() => {
    if (running) {
      startRef.current = performance.now() - pausedElapsedRef.current * 1000
    } else {
      pausedElapsedRef.current = (performance.now() - startRef.current) / 1000
    }
  }, [running])

  useEffect(() => {
    let raf: number
    const tick = () => {
      if (running) {
        const elapsedSec = (performance.now() - startRef.current) / 1000
        const cyclePos = elapsedSec % CYCLE_SECONDS
        const completedCycles = Math.floor(elapsedSec / CYCLE_SECONDS)
        const { phase, t } = getPhaseAt(cyclePos)
        const progress = t / phase.seconds
        const scale = scaleForPhase(phase.key, progress)

        if (circleRef.current) {
          circleRef.current.style.transform = `scale(${scale.toFixed(4)})`
        }

        const secondsLeft = Math.max(1, Math.ceil(phase.seconds - t))
        if (phase.label !== lastLabelRef.current || secondsLeft !== lastSecondsRef.current) {
          lastLabelRef.current = phase.label
          lastSecondsRef.current = secondsLeft
          setDisplay({ label: phase.label, secondsLeft, cycles: completedCycles })
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running])

  return (
    <div className="breath-guide glass-panel">
      <div className="breath-stage">
        <div className="breath-glow" />
        <div className="breath-circle" ref={circleRef}>
          <span className="breath-label">{display.label}</span>
          <span className="breath-count">{display.secondsLeft}</span>
        </div>
      </div>
      <p className="breath-pattern">5s inhale · 3s hold · 8s exhale</p>
      <div className="breath-controls">
        <button type="button" className="breath-toggle" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Resume'}
        </button>
        {display.cycles > 0 && (
          <span className="breath-cycles">{display.cycles} cycles completed</span>
        )}
      </div>
    </div>
  )
}
