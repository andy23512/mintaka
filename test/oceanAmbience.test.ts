import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OceanAmbience } from '../src/audio/oceanAmbience'

interface FakeParam {
  value: number
  setValueAtTime: ReturnType<typeof vi.fn>
  linearRampToValueAtTime: ReturnType<typeof vi.fn>
  exponentialRampToValueAtTime: ReturnType<typeof vi.fn>
}
const param = (): FakeParam => ({
  value: 0,
  setValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
})

let contexts: FakeContext[]

class FakeContext {
  sampleRate = 44100
  currentTime = 10
  destination = { name: 'destination' }
  gains: { gain: FakeParam; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = []
  filters: { type: string; Q: { value: number }; frequency: FakeParam; connect: ReturnType<typeof vi.fn> }[] = []
  sources: {
    buffer: unknown
    loop: boolean
    connect: ReturnType<typeof vi.fn>
    start: ReturnType<typeof vi.fn>
    stop: ReturnType<typeof vi.fn>
  }[] = []
  buffers: { channels: number; length: number; rate: number; data: Float32Array; node: object }[] = []
  close = vi.fn()
  decodeAudioData = vi.fn(async () => ({ decoded: true }))

  constructor() {
    contexts.push(this)
  }
  createGain() {
    const node = { gain: param(), connect: vi.fn(), disconnect: vi.fn() }
    this.gains.push(node)
    return node
  }
  createBiquadFilter() {
    const node = { type: '', Q: { value: 0 }, frequency: param(), connect: vi.fn() }
    this.filters.push(node)
    return node
  }
  createBufferSource() {
    const node = { buffer: null as unknown, loop: false, connect: vi.fn(), start: vi.fn(), stop: vi.fn() }
    this.sources.push(node)
    return node
  }
  createBuffer(channels: number, length: number, rate: number) {
    const data = new Float32Array(length)
    const node = { getChannelData: () => data }
    this.buffers.push({ channels, length, rate, data, node })
    return node
  }
}

beforeEach(() => {
  contexts = []
  vi.stubGlobal('AudioContext', FakeContext)
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(8) })),
  )
})
afterEach(() => vi.unstubAllGlobals())

const master = () => contexts[0].gains[0]

describe('OceanAmbience.start', () => {
  it('builds one context with a master gain at 0 wired to the speakers', async () => {
    await new OceanAmbience().start()
    expect(contexts).toHaveLength(1)
    expect(master().gain.value).toBe(0)
    expect(master().connect).toHaveBeenCalledWith(contexts[0].destination)
  })

  it('does nothing the second time', async () => {
    const ambience = new OceanAmbience()
    await ambience.start()
    await ambience.start()
    expect(contexts).toHaveLength(1)
    expect(contexts[0].gains).toHaveLength(1)
  })

  it('does not start twice when called again before the first one finishes loading', async () => {
    const ambience = new OceanAmbience()
    await Promise.all([ambience.start(), ambience.start()])
    expect(contexts).toHaveLength(1)
  })

  it('loops the downloaded waves into the master gain', async () => {
    await new OceanAmbience().start()
    const ctx = contexts[0]
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1)
    expect(ctx.sources).toHaveLength(1)
    const [waves] = ctx.sources
    expect(waves.buffer).toEqual({ decoded: true })
    expect(waves.loop).toBe(true)
    expect(waves.connect).toHaveBeenCalledWith(master())
    expect(waves.start).toHaveBeenCalledTimes(1)
  })

  it('fades in over 2.5 seconds, to 0 while still muted', async () => {
    await new OceanAmbience().start()
    expect(master().gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 12.5)
  })

  it('fades in to base 0.55 times the volume if unmuted before it starts', async () => {
    const ambience = new OceanAmbience()
    ambience.setMuted(false)
    ambience.setVolume(0.5)
    await ambience.start()
    const [[target, when]] = master().gain.linearRampToValueAtTime.mock.calls
    expect(target).toBeCloseTo(0.275)
    expect(when).toBe(12.5)
  })

  it('keeps going, still fading in, when the track cannot be loaded', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await new OceanAmbience().start()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toBe('Failed to load ocean ambience track')
    expect(contexts[0].sources).toHaveLength(0)
    expect(master().gain.linearRampToValueAtTime).toHaveBeenCalledTimes(1)
  })

  it('also keeps going when the track cannot be decoded', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const ambience = new OceanAmbience()
    vi.stubGlobal(
      'AudioContext',
      class extends FakeContext {
        decodeAudioData = vi.fn().mockRejectedValue(new Error('bad data'))
      },
    )
    await ambience.start()
    expect(master().gain.linearRampToValueAtTime).toHaveBeenCalledTimes(1)
  })

  it('uses webkitAudioContext where there is no AudioContext', async () => {
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('webkitAudioContext', FakeContext)
    await new OceanAmbience().start()
    expect(contexts).toHaveLength(1)
  })

  it('makes the 0.3 second burst of noise from the sample rate', async () => {
    await new OceanAmbience().start()
    const [burst] = contexts[0].buffers
    expect(burst.channels).toBe(1)
    expect(burst.rate).toBe(44100)
    expect(burst.length).toBe(13230)
    expect(Math.min(...burst.data)).toBeGreaterThanOrEqual(-1)
    expect(Math.max(...burst.data)).toBeLessThanOrEqual(1)
    expect(new Set(burst.data).size).toBeGreaterThan(1000)
    // white noise around zero, not just between 0 and 1
    expect(Math.min(...burst.data)).toBeLessThan(-0.95)
    expect(Math.max(...burst.data)).toBeGreaterThan(0.95)
    const mean = burst.data.reduce((sum, v) => sum + v, 0) / burst.length
    expect(Math.abs(mean)).toBeLessThan(0.05)
  })
})

describe('OceanAmbience.setMuted / setVolume', () => {
  async function started() {
    const ambience = new OceanAmbience()
    await ambience.start()
    master().gain.linearRampToValueAtTime.mockClear()
    return ambience
  }

  it('unmuting ramps up over 0.6 seconds to 0.55 times the volume (0.7 by default)', async () => {
    const ambience = await started()
    ambience.setMuted(false)
    const [[target, when]] = master().gain.linearRampToValueAtTime.mock.calls
    expect(target).toBeCloseTo(0.385)
    expect(when).toBeCloseTo(10.6)
  })

  it('muting ramps down to 0', async () => {
    const ambience = await started()
    ambience.setMuted(false)
    ambience.setMuted(true)
    expect(master().gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, expect.closeTo(10.6))
  })

  it('a volume change ramps over 0.15 seconds while unmuted', async () => {
    const ambience = await started()
    ambience.setMuted(false)
    master().gain.linearRampToValueAtTime.mockClear()
    ambience.setVolume(0.4)
    const [[target, when]] = master().gain.linearRampToValueAtTime.mock.calls
    expect(target).toBeCloseTo(0.22)
    expect(when).toBeCloseTo(10.15)
  })

  it('a volume change while muted stays silent, but is used when unmuting', async () => {
    const ambience = await started()
    ambience.setVolume(0.2)
    expect(master().gain.linearRampToValueAtTime).not.toHaveBeenCalled()
    ambience.setMuted(false)
    expect(master().gain.linearRampToValueAtTime.mock.calls[0][0]).toBeCloseTo(0.11)
  })

  it('clamps the volume to 0..1', async () => {
    const ambience = await started()
    ambience.setMuted(false)
    ambience.setVolume(5)
    expect(master().gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(
      expect.closeTo(0.55),
      expect.anything(),
    )
    ambience.setVolume(-5)
    expect(master().gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, expect.anything())
  })

  it('can be called before start without throwing', () => {
    const ambience = new OceanAmbience()
    expect(() => {
      ambience.setMuted(false)
      ambience.setVolume(0.3)
      ambience.setMuted(true)
    }).not.toThrow()
    expect(contexts).toHaveLength(0)
  })
})

describe('OceanAmbience.playRipple', () => {
  it('does nothing before start', () => {
    new OceanAmbience().playRipple()
    expect(contexts).toHaveLength(0)
  })

  async function ripple(intensity?: number, random = 0.5) {
    const ambience = new OceanAmbience()
    await ambience.start()
    vi.spyOn(Math, 'random').mockReturnValue(random)
    ambience.playRipple(intensity)
    const ctx = contexts[0]
    return { ctx, source: ctx.sources[1], filter: ctx.filters[0], gain: ctx.gains[1] }
  }

  it('plays the burst through a bandpass filter and a gain into the master gain', async () => {
    const { ctx, source, filter, gain } = await ripple()
    expect(source.buffer).toBe(ctx.buffers[0].node)
    expect(filter.type).toBe('bandpass')
    expect(filter.Q.value).toBe(5)
    expect(source.connect).toHaveBeenCalledWith(filter)
    expect(filter.connect).toHaveBeenCalledWith(gain)
    expect(gain.connect).toHaveBeenCalledWith(master())
  })

  it('starts now and stops 0.3 seconds later', async () => {
    const { source } = await ripple()
    expect(source.start).toHaveBeenCalledWith(10)
    expect(source.stop).toHaveBeenCalledWith(expect.closeTo(10.3))
  })

  it('sweeps the filter down from 1.8 to 0.55 of a random base of 850 to 1550 Hz', async () => {
    const mid = await ripple(1, 0.5) // base 1200
    expect(mid.filter.frequency.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(2160), 10)
    expect(mid.filter.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(660),
      expect.closeTo(10.16),
    )
    contexts = []
    const low = await ripple(1, 0) // base 850
    expect(low.filter.frequency.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(1530), 10)
  })

  it('swells to a peak in 6 ms then dies away by 0.24 s', async () => {
    const { gain } = await ripple(1)
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0, 10)
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.1), expect.closeTo(10.006, 4))
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, expect.closeTo(10.24))
  })

  it('peaks at 0.1 times the intensity, between 0.2 and 1', async () => {
    const peak = async (intensity?: number) => {
      contexts = []
      const { gain } = await ripple(intensity)
      return gain.gain.linearRampToValueAtTime.mock.calls[0][0] as number
    }
    expect(await peak()).toBeCloseTo(0.1) // default intensity 1
    expect(await peak(0.5)).toBeCloseTo(0.05)
    expect(await peak(0.2)).toBeCloseTo(0.02)
    expect(await peak(0)).toBeCloseTo(0.02) // raised to 0.2
    expect(await peak(5)).toBeCloseTo(0.1) // capped at 1
  })
})

describe('OceanAmbience.dispose', () => {
  it('disconnects, closes the context and goes quiet', async () => {
    const ambience = new OceanAmbience()
    await ambience.start()
    ambience.dispose()
    expect(master().disconnect).toHaveBeenCalledTimes(1)
    expect(contexts[0].close).toHaveBeenCalledTimes(1)
    const sourcesBefore = contexts[0].sources.length
    ambience.playRipple()
    ambience.setMuted(false)
    ambience.setVolume(0.9)
    expect(contexts[0].sources).toHaveLength(sourcesBefore)
  })

  it('can start again afterwards with a new context', async () => {
    const ambience = new OceanAmbience()
    await ambience.start()
    ambience.dispose()
    await ambience.start()
    expect(contexts).toHaveLength(2)
  })

  it('is harmless before start, and twice', async () => {
    const ambience = new OceanAmbience()
    expect(() => ambience.dispose()).not.toThrow()
    await ambience.start()
    ambience.dispose()
    expect(() => ambience.dispose()).not.toThrow()
    expect(contexts[0].close).toHaveBeenCalledTimes(1)
  })
})
