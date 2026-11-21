export const PHASES = [
  { key: 'inhale', label: 'Inhale', seconds: 5 },
  { key: 'hold', label: 'Hold', seconds: 3 },
  { key: 'exhale', label: 'Exhale', seconds: 8 },
] as const

export const CYCLE_SECONDS = PHASES.reduce((sum, p) => sum + p.seconds, 0)

export function getPhaseAt(elapsedInCycle: number) {
  let t = elapsedInCycle
  for (const phase of PHASES) {
    if (t < phase.seconds) return { phase, t }
    t -= phase.seconds
  }
  return { phase: PHASES[0], t: 0 }
}

export function scaleForPhase(phaseKey: string, progress: number) {
  const eased = 0.5 - 0.5 * Math.cos(Math.min(1, Math.max(0, progress)) * Math.PI)
  if (phaseKey === 'inhale') return 0.55 + 0.45 * eased
  if (phaseKey === 'hold') return 1
  return 1 - 0.45 * eased
}
