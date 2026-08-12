function createNoiseBuffer(ctx: AudioContext, seconds: number) {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.2
  }
  return buffer
}

function createBurstBuffer(ctx: AudioContext, seconds: number) {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

export class OceanAmbience {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private dropBuffer: AudioBuffer | null = null
  private started = false
  private readonly baseVolume = 0.55

  start() {
    if (this.started) return
    this.started = true

    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    const ctx = new AudioContextCtor()
    this.ctx = ctx

    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
    this.masterGain = master
    this.dropBuffer = createBurstBuffer(ctx, 0.3)

    // Layer 1: broad wave wash — filtered noise with a slow-sweeping cutoff
    const washSource = ctx.createBufferSource()
    washSource.buffer = createNoiseBuffer(ctx, 4)
    washSource.loop = true

    const washFilter = ctx.createBiquadFilter()
    washFilter.type = 'lowpass'
    washFilter.frequency.value = 650
    washFilter.Q.value = 0.7

    const washFilterLfo = ctx.createOscillator()
    washFilterLfo.frequency.value = 1 / 7
    const washFilterLfoGain = ctx.createGain()
    washFilterLfoGain.gain.value = 280
    washFilterLfo.connect(washFilterLfoGain)
    washFilterLfoGain.connect(washFilter.frequency)

    const washGain = ctx.createGain()
    washGain.gain.value = 0.85

    const swellLfo = ctx.createOscillator()
    swellLfo.frequency.value = 1 / 9
    const swellLfoGain = ctx.createGain()
    swellLfoGain.gain.value = 0.18
    const swellLfoOffset = ctx.createConstantSource()
    swellLfoOffset.offset.value = 0.82
    swellLfo.connect(swellLfoGain)

    washSource.connect(washFilter)
    washFilter.connect(washGain)
    swellLfoGain.connect(washGain.gain)
    swellLfoOffset.connect(washGain.gain)
    washGain.connect(master)

    // Layer 2: airy high-frequency shimmer — quiet bandpassed noise, slowly panning
    const shimmerSource = ctx.createBufferSource()
    shimmerSource.buffer = createNoiseBuffer(ctx, 4)
    shimmerSource.loop = true

    const shimmerFilter = ctx.createBiquadFilter()
    shimmerFilter.type = 'bandpass'
    shimmerFilter.frequency.value = 3800
    shimmerFilter.Q.value = 0.9

    const shimmerGain = ctx.createGain()
    shimmerGain.gain.value = 0.05

    const panner = ctx.createStereoPanner()
    const panLfo = ctx.createOscillator()
    panLfo.frequency.value = 1 / 13
    const panLfoGain = ctx.createGain()
    panLfoGain.gain.value = 0.6
    panLfo.connect(panLfoGain)
    panLfoGain.connect(panner.pan)

    shimmerSource.connect(shimmerFilter)
    shimmerFilter.connect(shimmerGain)
    shimmerGain.connect(panner)
    panner.connect(master)

    washSource.start()
    shimmerSource.start()
    washFilterLfo.start()
    swellLfo.start()
    swellLfoOffset.start()
    panLfo.start()

    master.gain.linearRampToValueAtTime(this.baseVolume, ctx.currentTime + 2.5)
  }

  playRipple(intensity = 1) {
    if (!this.ctx || !this.masterGain || !this.dropBuffer) return
    const ctx = this.ctx
    const now = ctx.currentTime

    const source = ctx.createBufferSource()
    source.buffer = this.dropBuffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 5
    const baseFreq = 850 + Math.random() * 700
    filter.frequency.setValueAtTime(baseFreq * 1.8, now)
    filter.frequency.exponentialRampToValueAtTime(baseFreq * 0.55, now + 0.16)

    const gain = ctx.createGain()
    const peak = 0.1 * Math.min(1, Math.max(0.2, intensity))
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(peak, now + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    source.start(now)
    source.stop(now + 0.3)
  }

  setMuted(muted: boolean) {
    if (!this.ctx || !this.masterGain) return
    const target = muted ? 0 : this.baseVolume
    this.masterGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.6)
  }

  dispose() {
    this.masterGain?.disconnect()
    this.ctx?.close()
    this.ctx = null
    this.masterGain = null
    this.dropBuffer = null
    this.started = false
  }
}

export const oceanAmbience = new OceanAmbience()
