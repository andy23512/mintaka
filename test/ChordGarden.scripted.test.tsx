import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChordGarden } from '../src/tools/ChordGarden'

// Here the chords come in an order the test chooses, so the key state between chords is exact.
const script = vi.hoisted(() => ({ next: [] as string[][], excluded: [] as (string[] | undefined)[] }))
vi.mock('../src/tools/chords', () => ({
  CHORDS: [],
  pickChord: (exclude?: string[]) => {
    script.excluded.push(exclude)
    return script.next.shift()!
  },
}))

afterEach(() => {
  cleanup()
  script.next = []
  script.excluded = []
})

const down = (key: string) => act(() => void fireEvent.keyDown(window, { key }))
const up = (key: string) => act(() => void fireEvent.keyUp(window, { key }))
const active = (c: HTMLElement) =>
  [...c.querySelectorAll('.chord-key.active')].map((el) => el.textContent!.toLowerCase())
const target = (c: HTMLElement) =>
  [...c.querySelectorAll('.chord-key')].map((el) => el.textContent!.toLowerCase())

describe('ChordGarden between chords', () => {
  it('forgets the keys that were held when a chord was completed', () => {
    script.next = [['a', 'n', 's'], ['a', 'n', 'x']]
    const { container } = render(<ChordGarden />)
    down('a')
    down('n')
    down('s') // complete, with the keys still held down
    expect(target(container)).toEqual(['a', 'n', 'x'])
    expect(active(container)).toEqual([])
    down('x') // only x pressed since the new chord began
    expect(container.querySelectorAll('.garden-item')).toHaveLength(1)
    expect(active(container)).toEqual(['x'])
  })

  it('asks for the next chord to differ from the one just done', () => {
    script.next = [['a', 'n', 's'], ['t', 'l', 'y']]
    const { container } = render(<ChordGarden />)
    expect(script.excluded).toEqual([undefined])
    down('a')
    down('n')
    down('s')
    expect(script.excluded).toEqual([undefined, ['a', 'n', 's']])
    expect(target(container)).toEqual(['t', 'l', 'y'])
  })

  it('a key let go after the chord was done is harmless', () => {
    script.next = [['a', 'n', 's'], ['t', 'l', 'y']]
    const { container } = render(<ChordGarden />)
    down('a')
    down('n')
    down('s')
    up('a')
    up('n')
    up('s')
    expect(active(container)).toEqual([])
    expect(container.querySelectorAll('.garden-item')).toHaveLength(1)
  })
})
