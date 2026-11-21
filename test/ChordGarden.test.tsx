import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChordGarden } from '../src/tools/ChordGarden'
import { CHORDS } from '../src/tools/chords'

afterEach(cleanup)

const down = (key: string, init: KeyboardEventInit = {}) =>
  act(() => void fireEvent.keyDown(window, { key, ...init }))
const up = (key: string) => act(() => void fireEvent.keyUp(window, { key }))

const target = (container: HTMLElement) =>
  [...container.querySelectorAll('.chord-key')].map((el) => el.textContent!.toLowerCase())
const active = (container: HTMLElement) =>
  [...container.querySelectorAll('.chord-key.active')].map((el) => el.textContent!.toLowerCase())
const items = (container: HTMLElement) => container.querySelectorAll('.garden-item')

function playChord(container: HTMLElement) {
  const keys = target(container)
  for (const key of keys) down(key)
  for (const key of keys) up(key)
  return keys
}

describe('ChordGarden', () => {
  it('shows one of the chords as three capital letters, a hint and an empty seabed', () => {
    const { container } = render(<ChordGarden />)
    const keys = target(container)
    expect(CHORDS.map((c) => c.join(''))).toContain(keys.join(''))
    expect(
      [...container.querySelectorAll('.chord-key')].every((el) => /^[A-Z]$/.test(el.textContent!)),
    ).toBe(true)
    expect(container.querySelector('.chord-hint')!.textContent).toMatch(/No score, no wrong presses/)
    expect(container.querySelector('.garden-empty')!.textContent).toBe('The seabed is still bare...')
    expect(items(container)).toHaveLength(0)
  })

  it('lights up a key while it is held, and puts it out when it is let go', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0) // a n s
    const { container } = render(<ChordGarden />)
    expect(target(container)).toEqual(['a', 'n', 's'])
    expect(active(container)).toEqual([])
    down('a')
    expect(active(container)).toEqual(['a'])
    down('s')
    expect(active(container)).toEqual(['a', 's'])
    up('a')
    expect(active(container)).toEqual(['s'])
    up('s')
    expect(active(container)).toEqual([])
  })

  it('ignores keys that are not in the chord, and key repeat', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0)
    const { container } = render(<ChordGarden />)
    down('z')
    down('Enter')
    expect(active(container)).toEqual([])
    down('a', { repeat: true })
    expect(active(container)).toEqual([])
    down('a')
    down('a', { repeat: true })
    expect(active(container)).toEqual(['a'])
  })

  it('counts a capital letter (Shift held) as the same key', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0)
    const { container } = render(<ChordGarden />)
    down('A')
    expect(active(container)).toEqual(['a'])
    up('A')
    expect(active(container)).toEqual([])
  })

  it('does not grow anything until every key is held together', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0)
    const { container } = render(<ChordGarden />)
    down('a')
    down('n')
    up('n')
    down('s')
    expect(items(container)).toHaveLength(0)
    expect(target(container)).toEqual(['a', 'n', 's'])
  })

  it('grows one thing when the chord is complete, in any order, and picks a new chord', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0)
    const { container } = render(<ChordGarden />)
    down('s')
    down('a')
    down('n')
    expect(items(container)).toHaveLength(1)
    expect(container.querySelector('.garden-empty')).toBeNull()
    expect(target(container).join('')).not.toBe('ans')
    expect(active(container)).toEqual([]) // keys are forgotten, so the next chord starts clean
  })

  it('grows corals, plants and bubbles, each with a small random tilt and size', () => {
    const { container } = render(<ChordGarden />)
    for (let i = 0; i < 60; i++) playChord(container)
    const grown = [...items(container)] as HTMLElement[]
    expect(grown).toHaveLength(60)
    const emojis = new Set(grown.map((el) => el.textContent))
    expect([...emojis].sort()).toEqual(['🌿', '🪸', '🫧'].sort())
    const tilts = grown.map((el) => Number(/rotate\((-?[\d.]+)deg\)/.exec(el.style.transform)![1]))
    const sizes = grown.map((el) => Number(/scale\(([\d.]+)\)/.exec(el.style.transform)![1]))
    expect(Math.min(...tilts)).toBeGreaterThanOrEqual(-12)
    expect(Math.max(...tilts)).toBeLessThanOrEqual(12)
    expect(Math.min(...tilts)).toBeLessThan(-6) // it really does use the whole range
    expect(Math.max(...tilts)).toBeGreaterThan(6)
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(0.85)
    expect(Math.max(...sizes)).toBeLessThanOrEqual(1.15)
    expect(Math.min(...sizes)).toBeLessThan(0.92)
    expect(Math.max(...sizes)).toBeGreaterThan(1.08)
  })

  it('still counts the chord with another key held as well', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0)
    const { container } = render(<ChordGarden />)
    down('q')
    down('a')
    down('n')
    down('s')
    expect(items(container)).toHaveLength(1)
  })

  it('keeps growing, one per chord, and never asks for the same chord twice running', () => {
    const { container } = render(<ChordGarden />)
    for (let round = 1; round <= 40; round++) {
      const before = target(container).join('')
      playChord(container)
      expect(items(container)).toHaveLength(round)
      expect(target(container).join('')).not.toBe(before)
    }
  })

  it('gives every plant its own key', () => {
    const { container } = render(<ChordGarden />)
    for (let i = 0; i < 5; i++) playChord(container)
    expect(items(container)).toHaveLength(5)
  })

  it('stops listening to the keyboard when it goes away', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<ChordGarden />)
    const added = add.mock.calls.filter(([type]) => type === 'keydown' || type === 'keyup')
    expect(added.map(([type]) => type).sort()).toEqual(['keydown', 'keyup'])
    unmount()
    for (const [type, listener] of added) expect(remove).toHaveBeenCalledWith(type, listener)
  })
})
