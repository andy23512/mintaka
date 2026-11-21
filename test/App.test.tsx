import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import { oceanAmbience } from '../src/audio/oceanAmbience'
import { useUIStore } from '../src/store/useUIStore'

// jsdom has no WebGL or Web Audio, so the 3D scene and the audio engine are stand-ins.
vi.mock('../src/scene/OceanScene', () => ({ OceanScene: () => <div data-testid="scene" /> }))
vi.mock('../src/audio/oceanAmbience', () => ({
  oceanAmbience: {
    start: vi.fn(),
    setMuted: vi.fn(),
    setVolume: vi.fn(),
    dispose: vi.fn(),
  },
}))

beforeEach(() => {
  useUIStore.setState(useUIStore.getInitialState(), true)
  vi.clearAllMocks()
})
afterEach(cleanup)

const click = (name: RegExp | string) => fireEvent.click(screen.getByRole('button', { name }))

describe('App: welcome card', () => {
  it('asks to start the audio, and shows no volume control yet', () => {
    render(<App />)
    expect(screen.getByText('Welcome to Mintaka')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Enter the Ocean' })).toBeTruthy()
    expect(screen.queryByRole('slider')).toBeNull()
    expect(oceanAmbience.start).not.toHaveBeenCalled()
  })

  it('Enter the Ocean starts the audio, hides the card and shows the volume control', () => {
    render(<App />)
    click('Enter the Ocean')
    expect(useUIStore.getState().audioStarted).toBe(true)
    expect(oceanAmbience.start).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Welcome to Mintaka')).toBeNull()
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeTruthy()
  })

  it('still lets you browse the tools without starting the audio', () => {
    render(<App />)
    click('Slow Typing Space')
    expect(screen.getByRole('textbox')).toBeTruthy()
    expect(screen.getByText('Welcome to Mintaka')).toBeTruthy()
  })
})

describe('App: volume control', () => {
  const started = () => {
    render(<App />)
    click('Enter the Ocean')
  }

  it('starts muted, and the button offers to unmute', () => {
    started()
    expect(screen.getByRole('button', { name: 'Unmute' }).textContent).toBe('🔇')
    expect(oceanAmbience.setMuted).toHaveBeenLastCalledWith(true)
  })

  it('the button toggles mute and tells the audio engine', () => {
    started()
    click('Unmute')
    expect(screen.getByRole('button', { name: 'Mute' }).textContent).toBe('🔊')
    expect(oceanAmbience.setMuted).toHaveBeenLastCalledWith(false)
    click('Mute')
    expect(screen.getByRole('button', { name: 'Unmute' })).toBeTruthy()
    expect(oceanAmbience.setMuted).toHaveBeenLastCalledWith(true)
  })

  it('the slider shows the volume (0.7), goes from 0 to 1, and moving it sets it and unmutes', () => {
    started()
    const slider = screen.getByRole('slider', { name: 'Volume' }) as HTMLInputElement
    expect([slider.min, slider.max, slider.step, slider.value]).toEqual(['0', '1', '0.01', '0.7'])
    fireEvent.change(slider, { target: { value: '0.25' } })
    expect(useUIStore.getState().volume).toBe(0.25)
    expect(useUIStore.getState().audioMuted).toBe(false)
    expect(oceanAmbience.setVolume).toHaveBeenLastCalledWith(0.25)
    expect(oceanAmbience.setMuted).toHaveBeenLastCalledWith(false)
    expect(slider.value).toBe('0.25')
  })

  it('gives the audio engine the volume as soon as it renders', () => {
    render(<App />)
    expect(oceanAmbience.setVolume).toHaveBeenCalledWith(0.7)
  })

  it('shuts the audio engine down when it goes away', () => {
    const { unmount } = render(<App />)
    expect(oceanAmbience.dispose).not.toHaveBeenCalled()
    unmount()
    expect(oceanAmbience.dispose).toHaveBeenCalledTimes(1)
  })
})

describe('App: tool dock', () => {
  const dock = ['Slow Typing Space', '5-3-8 Breath Guide', 'Chord Garden']
  const open = () => ({
    typing: !!document.querySelector('.typing-space'),
    breath: !!document.querySelector('.breath-guide'),
    chord: !!document.querySelector('.chord-garden'),
  })
  const activeButtons = () =>
    [...document.querySelectorAll('.dock-button.active')].map((el) => el.textContent)

  it('has three tools and none open at first', () => {
    render(<App />)
    expect(screen.getAllByRole('navigation')).toHaveLength(1)
    for (const name of dock) expect(screen.getByRole('button', { name })).toBeTruthy()
    expect(open()).toEqual({ typing: false, breath: false, chord: false })
    expect(activeButtons()).toEqual([])
  })

  it('opens each tool from its own button and marks that button active', () => {
    render(<App />)
    click('Slow Typing Space')
    expect(open()).toEqual({ typing: true, breath: false, chord: false })
    expect(activeButtons()).toEqual(['Slow Typing Space'])
    click('5-3-8 Breath Guide')
    expect(open()).toEqual({ typing: false, breath: true, chord: false })
    expect(activeButtons()).toEqual(['5-3-8 Breath Guide'])
    click('Chord Garden')
    expect(open()).toEqual({ typing: false, breath: false, chord: true })
    expect(activeButtons()).toEqual(['Chord Garden'])
  })

  it('closes the tool when its button is pressed again', () => {
    render(<App />)
    click('Chord Garden')
    click('Chord Garden')
    expect(open()).toEqual({ typing: false, breath: false, chord: false })
    expect(activeButtons()).toEqual([])
  })
})

describe('App: the rest', () => {
  it('shows the 3D scene, the title and a source link that opens in a new tab', () => {
    render(<App />)
    expect(screen.getByTestId('scene')).toBeTruthy()
    expect(screen.getByText('MINTAKA')).toBeTruthy()
    expect(screen.getByText('Clear Crystal Ocean')).toBeTruthy()
    const link = screen.getByRole('link', { name: 'Source on GitHub' }) as HTMLAnchorElement
    expect(link.href).toBe('https://github.com/andy23512/mintaka')
    expect(link.target).toBe('_blank')
    expect(link.rel).toBe('noopener')
  })
})
