import { describe, expect, it, vi } from 'vitest'
import { CYCLE_SECONDS, PHASES, getPhaseAt, scaleForPhase } from '../src/tools/breath'
import { CHORDS, pickChord } from '../src/tools/chords'
import { OCEAN_WORDS, pickWord } from '../src/tools/typingWords'

/** Math.random returns these in order, then the last one forever. */
function randomSequence(...values: number[]) {
  let i = 0
  return vi.spyOn(Math, 'random').mockImplementation(() => values[Math.min(i++, values.length - 1)])
}

describe('breath pattern', () => {
  it('is 5-3-8, 16 seconds a cycle', () => {
    expect(PHASES.map((p) => [p.key, p.seconds])).toEqual([
      ['inhale', 5],
      ['hold', 3],
      ['exhale', 8],
    ])
    expect(CYCLE_SECONDS).toBe(16)
  })

  it('getPhaseAt names the phase and the time into it', () => {
    const at = (seconds: number) => {
      const { phase, t } = getPhaseAt(seconds)
      return [phase.key, t]
    }
    expect(at(0)).toEqual(['inhale', 0])
    expect(at(4.5)).toEqual(['inhale', 4.5])
    expect(at(5)).toEqual(['hold', 0])
    expect(at(7.5)).toEqual(['hold', 2.5])
    expect(at(8)).toEqual(['exhale', 0])
    expect(at(15.5)).toEqual(['exhale', 7.5])
  })

  it('getPhaseAt falls back to the start of inhale at or past the end of the cycle', () => {
    expect(getPhaseAt(16)).toEqual({ phase: PHASES[0], t: 0 })
    expect(getPhaseAt(100).phase.key).toBe('inhale')
  })

  it('scaleForPhase: inhale grows 0.55 to 1, hold stays 1, exhale shrinks 1 to 0.55', () => {
    expect(scaleForPhase('inhale', 0)).toBeCloseTo(0.55)
    expect(scaleForPhase('inhale', 0.5)).toBeCloseTo(0.775)
    expect(scaleForPhase('inhale', 1)).toBeCloseTo(1)
    for (const p of [0, 0.3, 1]) expect(scaleForPhase('hold', p)).toBe(1)
    expect(scaleForPhase('exhale', 0)).toBeCloseTo(1)
    expect(scaleForPhase('exhale', 0.5)).toBeCloseTo(0.775)
    expect(scaleForPhase('exhale', 1)).toBeCloseTo(0.55)
  })

  it('scaleForPhase eases: slow at the ends, so a quarter in is less than a quarter of the way', () => {
    const quarter = (scaleForPhase('inhale', 0.25) - 0.55) / 0.45
    expect(quarter).toBeGreaterThan(0)
    expect(quarter).toBeLessThan(0.25)
  })

  it('scaleForPhase clamps progress to 0..1', () => {
    expect(scaleForPhase('inhale', -3)).toBeCloseTo(0.55)
    expect(scaleForPhase('inhale', 9)).toBeCloseTo(1)
    expect(scaleForPhase('exhale', 9)).toBeCloseTo(0.55)
    expect(scaleForPhase('exhale', -9)).toBeCloseTo(1)
  })

  it('scaleForPhase treats any unknown phase like exhale', () => {
    expect(scaleForPhase('nope', 1)).toBeCloseTo(0.55)
  })
})

describe('CHORDS', () => {
  it('has distinct chords of three different lowercase letters', () => {
    for (const chord of CHORDS) {
      expect(chord).toHaveLength(3)
      expect(new Set(chord).size).toBe(3)
      for (const key of chord) expect(key).toMatch(/^[a-z]$/)
    }
    expect(new Set(CHORDS.map((c) => c.join(''))).size).toBe(CHORDS.length)
  })
})

describe('pickChord', () => {
  it('picks the chord the random number points at', () => {
    randomSequence(0)
    expect(pickChord()).toBe(CHORDS[0])
    randomSequence(0.99)
    expect(pickChord()).toBe(CHORDS[CHORDS.length - 1])
  })

  it('draws again when it hits the chord it was told to avoid', () => {
    randomSequence(0, 0.99)
    expect(pickChord(CHORDS[0])).toBe(CHORDS[CHORDS.length - 1])
  })

  it('may repeat a chord when none is excluded', () => {
    randomSequence(0, 0)
    expect(pickChord()).toBe(CHORDS[0])
    expect(pickChord()).toBe(CHORDS[0])
  })

  it('never returns the excluded chord', () => {
    for (const excluded of CHORDS) {
      for (let i = 0; i < 100; i++) expect(pickChord(excluded)).not.toBe(excluded)
    }
  })
})

describe('OCEAN_WORDS', () => {
  it('has several words, all lowercase letters, none repeated', () => {
    expect(OCEAN_WORDS.length).toBeGreaterThan(10)
    for (const word of OCEAN_WORDS) expect(word).toMatch(/^[a-z]+$/)
    expect(new Set(OCEAN_WORDS).size).toBe(OCEAN_WORDS.length)
  })
})

describe('pickWord', () => {
  it('picks the word the random number points at', () => {
    randomSequence(0)
    expect(pickWord()).toBe(OCEAN_WORDS[0])
    randomSequence(0.99)
    expect(pickWord()).toBe(OCEAN_WORDS[OCEAN_WORDS.length - 1])
  })

  it('draws again when it hits the word it was told to avoid', () => {
    randomSequence(0, 0.5)
    expect(pickWord(OCEAN_WORDS[0])).toBe(OCEAN_WORDS[Math.floor(0.5 * OCEAN_WORDS.length)])
  })

  it('never returns the excluded word', () => {
    for (const excluded of OCEAN_WORDS) {
      for (let i = 0; i < 20; i++) expect(pickWord(excluded)).not.toBe(excluded)
    }
  })

  it('treats an empty exclusion as none', () => {
    randomSequence(0)
    expect(pickWord('')).toBe(OCEAN_WORDS[0])
  })
})
