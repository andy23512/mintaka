import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TypingSpace } from '../src/tools/TypingSpace'
import { OCEAN_WORDS } from '../src/tools/typingWords'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const word = (container: HTMLElement) => container.querySelector('.prompt-en')!.textContent!

describe('TypingSpace', () => {
  it('shows one ocean word and a textarea that already has focus', () => {
    const { container } = render(<TypingSpace />)
    expect(OCEAN_WORDS).toContain(word(container))
    const area = container.querySelector('textarea')!
    expect(document.activeElement).toBe(area)
    expect(area.getAttribute('spellcheck')).toBe('false')
    expect(area.placeholder).toMatch(/^Type freely here/)
  })

  it('says a word comes about every 20 seconds, with no score or tracking', () => {
    const { container } = render(<TypingSpace />)
    expect(container.querySelector('.typing-hint')!.textContent).toMatch(/every 20 seconds/)
    expect(container.querySelector('.typing-hint')!.textContent).toMatch(/no score, no tracking/)
  })

  it('keeps the word for 20 seconds, then changes it', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.5)
    const { container } = render(<TypingSpace />)
    expect(word(container)).toBe(OCEAN_WORDS[0])
    act(() => void vi.advanceTimersByTime(19_999))
    expect(word(container)).toBe(OCEAN_WORDS[0])
    act(() => void vi.advanceTimersByTime(1))
    expect(word(container)).toBe(OCEAN_WORDS[Math.floor(0.5 * OCEAN_WORDS.length)])
  })

  it('draws again when the new word would repeat the one on show', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0.5)
    const { container } = render(<TypingSpace />)
    expect(word(container)).toBe(OCEAN_WORDS[0])
    act(() => void vi.advanceTimersByTime(20_000))
    expect(word(container)).toBe(OCEAN_WORDS[Math.floor(0.5 * OCEAN_WORDS.length)])
  })

  it('never shows the same word twice in a row', () => {
    const { container } = render(<TypingSpace />)
    let previous = word(container)
    for (let i = 0; i < 400; i++) {
      act(() => void vi.advanceTimersByTime(20_000))
      const next = word(container)
      expect(next).not.toBe(previous)
      previous = next
    }
  })

  it('replaces the prompt element on each new word, so its fade-in plays again', () => {
    const { container } = render(<TypingSpace />)
    const first = container.querySelector('.typing-prompt')
    act(() => void vi.advanceTimersByTime(20_000))
    expect(container.querySelector('.typing-prompt')).not.toBe(first)
  })

  it('does not disturb what has been typed when the word changes', () => {
    const { container } = render(<TypingSpace />)
    const area = container.querySelector('textarea')!
    fireEvent.change(area, { target: { value: 'slowly, slowly' } })
    act(() => void vi.advanceTimersByTime(20_000))
    expect(container.querySelector('textarea')).toBe(area)
    expect(area.value).toBe('slowly, slowly')
    expect(document.activeElement).toBe(area)
  })

  it('stops its timer when it goes away', () => {
    const set = vi.spyOn(window, 'setInterval')
    const clear = vi.spyOn(window, 'clearInterval')
    const { unmount } = render(<TypingSpace />)
    expect(set).toHaveBeenCalledTimes(1)
    expect(set.mock.calls[0][1]).toBe(20_000)
    const id = set.mock.results[0].value
    expect(clear).not.toHaveBeenCalled()
    unmount()
    expect(clear).toHaveBeenCalledWith(id)
  })
})
