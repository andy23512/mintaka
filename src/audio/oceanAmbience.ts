import oceanWavesUrl from '../assets/audio/ocean-waves.mp3'

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
  private muted = true
  private volume = 0.7

  async start() {
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

    try {
      const response = await fetch(oceanWavesUrl)
      const arrayBuffer = await response.arrayBuffer()
      const waveBuffer = await ctx.decodeAudioData(arrayBuffer)

      const waveSource = ctx.createBufferSource()
      waveSource.buffer = waveBuffer
      waveSource.loop = true
      waveSource.connect(master)
      waveSource.start()
    } catch (error) {
      console.warn('Failed to load ocean ambience track', error)
    }

    master.gain.linearRampToValueAtTime(this.targetGain(), ctx.currentTime + 2.5)
  }

  private targetGain() {
    return this.muted ? 0 : this.baseVolume * this.volume
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
    this.muted = muted
    if (!this.ctx || !this.masterGain) return
    this.masterGain.gain.linearRampToValueAtTime(this.targetGain(), this.ctx.currentTime + 0.6)
  }

  setVolume(volume: number) {
    this.volume = Math.min(1, Math.max(0, volume))
    if (!this.ctx || !this.masterGain || this.muted) return
    this.masterGain.gain.linearRampToValueAtTime(this.targetGain(), this.ctx.currentTime + 0.15)
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
