import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BreathGuide } from '../src/tools/BreathGuide'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms))
const label = (c: HTMLElement) => c.querySelector('.breath-label')!.textContent
const count = (c: HTMLElement) => c.querySelector('.breath-count')!.textContent
const scale = (c: HTMLElement) =>
  Number(/scale\(([\d.]+)\)/.exec((c.querySelector('.breath-circle') as HTMLElement).style.transform)![1])

describe('BreathGuide', () => {
  it('starts breathing in, with 5 seconds to go', () => {
    const { container } = render(<BreathGuide />)
    expect(label(container)).toBe('Inhale')
    expect(count(container)).toBe('5')
    expect(container.querySelector('.breath-pattern')!.textContent).toBe(
      '5s inhale · 3s hold · 8s exhale',
    )
    expect(screen.getByRole('button').textContent).toBe('Pause')
    expect(container.querySelector('.breath-cycles')).toBeNull()
  })

  it('counts down each second of the inhale', () => {
    const { container } = render(<BreathGuide />)
    advance(1_100)
    expect(count(container)).toBe('4')
    advance(1_000)
    expect(count(container)).toBe('3')
    advance(2_000)
    expect(label(container)).toBe('Inhale')
    expect(count(container)).toBe('1')
  })

  it('moves on to hold at 5 seconds, then exhale at 8', () => {
    const { container } = render(<BreathGuide />)
    advance(5_100)
    expect([label(container), count(container)]).toEqual(['Hold', '3'])
    advance(2_000)
    expect([label(container), count(container)]).toEqual(['Hold', '1'])
    advance(1_000)
    expect([label(container), count(container)]).toEqual(['Exhale', '8'])
    advance(7_000)
    expect([label(container), count(container)]).toEqual(['Exhale', '1'])
  })

  it('goes round again after 16 seconds, and counts the cycles', () => {
    const { container } = render(<BreathGuide />)
    advance(16_100)
    expect([label(container), count(container)]).toEqual(['Inhale', '5'])
    expect(container.querySelector('.breath-cycles')!.textContent).toBe('1 cycles completed')
    advance(16_000)
    expect(container.querySelector('.breath-cycles')!.textContent).toBe('2 cycles completed')
  })

  it('counts a cycle only once it is finished, not once it is half done', () => {
    const { container } = render(<BreathGuide />)
    advance(24_600) // 8.6 s into the second cycle, in the exhale
    expect(label(container)).toBe('Exhale')
    expect(container.querySelector('.breath-cycles')!.textContent).toBe('1 cycles completed')
  })

  it('draws the circle small, growing on inhale, full on hold, shrinking on exhale', () => {
    const { container } = render(<BreathGuide />)
    advance(20)
    expect(scale(container)).toBeCloseTo(0.55, 1)
    advance(2_480) // half way through the inhale
    expect(scale(container)).toBeCloseTo(0.775, 1)
    advance(2_600) // inside the hold
    expect(scale(container)).toBe(1)
    advance(6_900) // 12 s in: half way through the exhale
    expect(scale(container)).toBeCloseTo(0.775, 1)
    advance(3_500) // 15.5 s in: near the end of the exhale
    expect(scale(container)).toBeCloseTo(0.55, 1)
  })

  it('pauses: the label, the count and the circle stay put, and the button says Resume', () => {
    const { container } = render(<BreathGuide />)
    advance(2_100)
    const before = [label(container), count(container), scale(container)]
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button').textContent).toBe('Resume')
    advance(30_000)
    expect([label(container), count(container), scale(container)]).toEqual(before)
  })

  it('resumes from where it stopped, not from where the clock has got to', () => {
    const { container } = render(<BreathGuide />)
    advance(2_100) // 2.1 s in: Inhale, 3 left
    fireEvent.click(screen.getByRole('button'))
    advance(30_000)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button').textContent).toBe('Pause')
    advance(100)
    expect([label(container), count(container)]).toEqual(['Inhale', '3'])
    advance(3_000) // now 5.2 s in
    expect([label(container), count(container)]).toEqual(['Hold', '3'])
  })

  it('stops its animation loop when it goes away', () => {
    const { unmount } = render(<BreathGuide />)
    advance(100)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
