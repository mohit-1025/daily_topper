import type { ThemeId } from '@/types'

type Ambience = 'rain' | 'forest' | 'meadow' | 'chimes' | 'ocean' | 'night'
type AmbienceEvent = 'birds' | 'gulls' | 'chimes' | 'crickets' | 'none'

interface Patch {
  bpm: number
  root: number
  scale: number[]
  chords: number[][]
  chordEvery: number
  padWave: OscillatorType
  padLevel: number
  padCutoff: number
  pluckEvery: number
  pluckChance: number
  pluckWave: OscillatorType
  pluckDecay: number
  pluckLevel: number
  pluckOctave: number
  partialLevel: number
  partialRatio: number
  bassLevel: number
  ambience: Ambience
  event: AmbienceEvent
  eventChance: number
  reverb: number
}

/*
 * Every theme is a different soundscape: the tonal layer stays sparse and the
 * ambience layer (rain, birds, leaves, bees, waves, crickets) carries the character.
 * Everything is synthesised on the fly, so no audio files ship with the app.
 */
const PATCHES: Record<ThemeId, Patch> = {
  paper: {
    bpm: 52,
    root: 60,
    scale: [0, 2, 4, 7, 9, 12],
    chords: [
      [0, 7, 12, 16],
      [-3, 4, 9, 12],
      [-5, 2, 7, 11],
      [-1, 4, 7, 11],
    ],
    chordEvery: 8,
    padWave: 'sine',
    padLevel: 0.034,
    padCutoff: 2000,
    pluckEvery: 2,
    pluckChance: 0.44,
    pluckWave: 'triangle',
    pluckDecay: 2.4,
    pluckLevel: 0.046,
    pluckOctave: 12,
    partialLevel: 0.012,
    partialRatio: 2,
    bassLevel: 0.034,
    ambience: 'rain',
    event: 'birds',
    eventChance: 0.06,
    reverb: 0.6,
  },
  forest: {
    bpm: 48,
    root: 62,
    scale: [0, 2, 4, 7, 9, 12],
    chords: [
      [0, 7, 12, 14],
      [-3, 2, 7, 9],
      [-5, 0, 4, 7],
      [-1, 4, 7, 9],
    ],
    chordEvery: 8,
    padWave: 'sine',
    padLevel: 0.024,
    padCutoff: 1300,
    pluckEvery: 2,
    pluckChance: 0.4,
    pluckWave: 'sine',
    pluckDecay: 0.9,
    pluckLevel: 0.038,
    pluckOctave: 12,
    partialLevel: 0.018,
    partialRatio: 4,
    bassLevel: 0.02,
    ambience: 'forest',
    event: 'birds',
    eventChance: 0.5,
    reverb: 0.7,
  },
  honey: {
    bpm: 60,
    root: 65,
    scale: [0, 2, 4, 7, 9, 12],
    chords: [
      [0, 7, 12, 16],
      [-3, 4, 9, 12],
      [-5, 2, 7, 11],
      [-1, 4, 7, 11],
    ],
    chordEvery: 8,
    padWave: 'triangle',
    padLevel: 0.026,
    padCutoff: 1500,
    pluckEvery: 2,
    pluckChance: 0.34,
    pluckWave: 'sine',
    pluckDecay: 1.1,
    pluckLevel: 0.03,
    pluckOctave: 12,
    partialLevel: 0.008,
    partialRatio: 2,
    bassLevel: 0.024,
    ambience: 'meadow',
    event: 'birds',
    eventChance: 0.1,
    reverb: 0.45,
  },
  lavender: {
    bpm: 44,
    root: 64,
    scale: [0, 2, 4, 7, 11, 12],
    chords: [
      [0, 4, 7, 11],
      [-3, 2, 7, 12],
      [-5, 0, 4, 9],
      [-1, 4, 7, 11],
    ],
    chordEvery: 8,
    padWave: 'sine',
    padLevel: 0.021,
    padCutoff: 3200,
    pluckEvery: 4,
    pluckChance: 0.45,
    pluckWave: 'sine',
    pluckDecay: 3.4,
    pluckLevel: 0.026,
    pluckOctave: 12,
    partialLevel: 0.007,
    partialRatio: 3,
    bassLevel: 0.017,
    ambience: 'chimes',
    event: 'chimes',
    eventChance: 0.3,
    reverb: 1,
  },
  ocean: {
    bpm: 40,
    root: 59,
    scale: [0, 3, 5, 7, 10, 12],
    chords: [
      [0, 3, 7, 10],
      [-4, 0, 5, 12],
      [-5, 2, 7, 10],
      [-2, 3, 7, 12],
    ],
    chordEvery: 8,
    padWave: 'sine',
    padLevel: 0.015,
    padCutoff: 900,
    pluckEvery: 4,
    pluckChance: 0.38,
    pluckWave: 'triangle',
    pluckDecay: 2.8,
    pluckLevel: 0.028,
    pluckOctave: 12,
    partialLevel: 0.005,
    partialRatio: 2,
    bassLevel: 0.024,
    ambience: 'ocean',
    event: 'gulls',
    eventChance: 0.025,
    reverb: 0.5,
  },
  midnight: {
    bpm: 46,
    root: 55,
    scale: [0, 2, 3, 5, 7, 10],
    chords: [
      [0, 3, 7, 10],
      [-4, 0, 3, 7],
      [-5, 0, 4, 7],
      [-2, 3, 7, 10],
    ],
    chordEvery: 8,
    padWave: 'sine',
    padLevel: 0.017,
    padCutoff: 1100,
    pluckEvery: 4,
    pluckChance: 0.4,
    pluckWave: 'sine',
    pluckDecay: 3.4,
    pluckLevel: 0.03,
    pluckOctave: 12,
    partialLevel: 0.013,
    partialRatio: 2,
    bassLevel: 0.021,
    ambience: 'night',
    event: 'crickets',
    eventChance: 0.65,
    reverb: 0.82,
  },
}

const LOOKAHEAD = 1.8
const BASE_GAIN = 0.24

function midiToFreq(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

class StudyMusicEngine {
  private ctx: AudioContext | null = null
  private ir: AudioBuffer | null = null
  private master: GainNode | null = null
  private volumeNode: GainNode | null = null
  private bus: GainNode | null = null
  private sources = new Set<AudioScheduledSourceNode>()
  private timer: number | null = null
  private theme: ThemeId = 'paper'
  private playing = false
  private volume = 0.7
  private step = 0
  private nextTime = 0

  get isPlaying() {
    return this.playing
  }

  async start(theme: ThemeId): Promise<boolean> {
    if (this.playing && this.theme === theme) return true
    const wasPlaying = this.playing
    this.theme = theme
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctor) return false
        this.ctx = new Ctor({ latencyHint: 'playback' })
      }
      if (this.ctx.state === 'suspended') await this.ctx.resume()
      if (wasPlaying) this.teardown(0.6)
      this.build(PATCHES[this.theme])
      this.playing = true
      return true
    } catch {
      this.playing = false
      this.teardown(0.2)
      return false
    }
  }

  stop() {
    if (!this.playing) return
    this.playing = false
    this.teardown(0.9)
    window.setTimeout(() => {
      if (!this.playing && this.ctx?.state === 'running') void this.ctx.suspend()
    }, 1200)
  }

  async setTheme(theme: ThemeId): Promise<boolean> {
    if (theme === this.theme) return this.playing
    if (!this.playing) {
      this.theme = theme
      return false
    }
    return this.start(theme)
  }

  setVolume(percent: number) {
    this.volume = Math.min(1, Math.max(0, percent / 100))
    const node = this.volumeNode
    const ctx = this.ctx
    if (!node || !ctx) return
    const now = ctx.currentTime
    node.gain.cancelScheduledValues(now)
    node.gain.setValueAtTime(node.gain.value, now)
    node.gain.linearRampToValueAtTime(this.volume, now + 0.18)
  }

  private build(patch: Patch) {
    const ctx = this.ctx
    if (!ctx) return
    const now = ctx.currentTime

    const master = ctx.createGain()
    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(BASE_GAIN, now + 2.6)

    const volume = ctx.createGain()
    volume.gain.value = this.volume

    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -28
    compressor.ratio.value = 3
    compressor.attack.value = 0.02
    compressor.release.value = 0.45

    const bus = ctx.createGain()
    master.connect(volume)
    volume.connect(compressor)
    compressor.connect(ctx.destination)
    bus.connect(master)

    const reverb = ctx.createConvolver()
    reverb.buffer = this.impulseBuffer()
    const wet = ctx.createGain()
    wet.gain.value = patch.reverb
    bus.connect(reverb)
    reverb.connect(wet)
    wet.connect(master)

    this.master = master
    this.volumeNode = volume
    this.bus = bus
    this.buildAmbience(patch)
    this.step = 0
    this.nextTime = now + 0.35
    this.tick(patch)
    this.timer = window.setInterval(() => this.tick(patch), 400)
  }

  private tick(patch: Patch) {
    const ctx = this.ctx
    if (!ctx || !this.bus) return
    const horizon = ctx.currentTime + LOOKAHEAD
    while (this.nextTime < horizon) {
      this.scheduleStep(patch, this.step, this.nextTime)
      this.nextTime += 60 / patch.bpm
      this.step += 1
    }
  }

  private scheduleStep(patch: Patch, step: number, time: number) {
    const beat = 60 / patch.bpm
    if (step % patch.chordEvery === 0) {
      const chord = patch.chords[(step / patch.chordEvery) % patch.chords.length]
      this.pad(patch, chord, time, beat * patch.chordEvery * 1.15)
      this.bass(patch, chord[0], time, beat * patch.chordEvery)
    }
    if (step % patch.pluckEvery === 0 && Math.random() < patch.pluckChance) {
      this.pluck(patch, time, beat * 2)
    }
    if (patch.event !== 'none' && Math.random() < patch.eventChance) {
      this.ambientEvent(patch.event, time)
    }
  }

  private ambientEvent(event: AmbienceEvent, time: number) {
    if (event === 'birds') this.bird(time)
    else if (event === 'gulls') this.gull(time)
    else if (event === 'chimes') this.chime(time)
    else if (event === 'crickets') this.crickets(time)
  }

  private pad(patch: Patch, chord: number[], time: number, duration: number) {
    const ctx = this.ctx
    const bus = this.bus
    if (!ctx || !bus) return
    const level = patch.padLevel / Math.sqrt(chord.length)
    for (const interval of chord) {
      const osc = ctx.createOscillator()
      osc.type = patch.padWave
      osc.frequency.value = midiToFreq(patch.root + interval)
      osc.detune.value = (Math.random() - 0.5) * 10
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = patch.padCutoff
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, time)
      gain.gain.exponentialRampToValueAtTime(level, time + 2.2)
      gain.gain.setValueAtTime(level, time + duration * 0.72)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(bus)
      osc.start(time)
      osc.stop(time + duration + 0.2)
      this.track(osc, () => {
        filter.disconnect()
        gain.disconnect()
      })
    }
  }

  private bass(patch: Patch, interval: number, time: number, duration: number) {
    const ctx = this.ctx
    const bus = this.bus
    if (!ctx || !bus) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = midiToFreq(patch.root - 12 + interval)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(patch.bassLevel, time + 0.9)
    gain.gain.setValueAtTime(patch.bassLevel, time + duration * 0.8)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
    osc.connect(gain)
    gain.connect(bus)
    osc.start(time)
    osc.stop(time + duration + 0.2)
    this.track(osc, () => gain.disconnect())
  }

  private pluck(patch: Patch, time: number, slot: number) {
    const ctx = this.ctx
    const bus = this.bus
    if (!ctx || !bus) return
    const note = patch.scale[Math.floor(Math.random() * patch.scale.length)]
    const octave = Math.random() < 0.25 ? 12 : 0
    const freq = midiToFreq(patch.root + patch.pluckOctave + note + octave)
    const velocity = 0.7 + Math.random() * 0.3
    const decay = Math.min(patch.pluckDecay, slot * 1.8)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 3400

    const osc = ctx.createOscillator()
    osc.type = patch.pluckWave
    osc.frequency.value = freq
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(patch.pluckLevel * velocity, time + 0.014)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay)
    osc.connect(gain)
    gain.connect(filter)
    filter.connect(bus)
    osc.start(time)
    osc.stop(time + decay + 0.1)
    this.track(osc, () => {
      gain.disconnect()
      filter.disconnect()
    })

    if (patch.partialLevel <= 0) return

    const partial = ctx.createOscillator()
    partial.type = 'sine'
    partial.frequency.value = freq * patch.partialRatio
    const partialGain = ctx.createGain()
    partialGain.gain.setValueAtTime(0.0001, time)
    partialGain.gain.exponentialRampToValueAtTime(patch.partialLevel * velocity, time + 0.014)
    partialGain.gain.exponentialRampToValueAtTime(0.0001, time + decay * 0.5)
    partial.connect(partialGain)
    partialGain.connect(filter)
    partial.start(time)
    partial.stop(time + decay * 0.55)
    this.track(partial, () => partialGain.disconnect())
  }

  private chime(time: number) {
    const ctx = this.ctx
    const bus = this.bus
    if (!ctx || !bus) return
    const scale = [0, 2, 4, 7, 11, 12]
    const freq = midiToFreq(64 + 24 + scale[Math.floor(Math.random() * scale.length)])
    const partials = [1, 2.76, 5.4]
    const levels = [0.02, 0.009, 0.004]
    partials.forEach((ratio, index) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq * ratio
      const gain = ctx.createGain()
      const decay = 3.6 - index * 0.7
      gain.gain.setValueAtTime(0.0001, time)
      gain.gain.exponentialRampToValueAtTime(levels[index], time + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + decay)
      osc.connect(gain)
      gain.connect(bus)
      osc.start(time)
      osc.stop(time + decay + 0.1)
      this.track(osc, () => gain.disconnect())
    })
  }

  private bird(time: number) {
    const ctx = this.ctx
    const bus = this.bus
    if (!ctx || !bus) return
    const pan = ctx.createStereoPanner()
    pan.pan.value = Math.random() * 1.8 - 0.9
    pan.connect(bus)

    const base = 1900 + Math.random() * 1400
    const style = Math.random()
    const notes: { at: number; from: number; to: number; dur: number }[] = []

    if (style < 0.42) {
      const count = 2 + Math.floor(Math.random() * 2)
      for (let index = 0; index < count; index += 1) {
        notes.push({
          at: time + index * 0.16,
          from: base * (1 + index * 0.04),
          to: base * 1.28,
          dur: 0.12,
        })
      }
    } else if (style < 0.74) {
      const count = 4 + Math.floor(Math.random() * 3)
      for (let index = 0; index < count; index += 1) {
        notes.push({
          at: time + index * 0.048,
          from: base,
          to: base * 0.93,
          dur: 0.035,
        })
      }
    } else {
      notes.push({ at: time, from: base * 1.08, to: base * 1.4, dur: 0.1 })
      notes.push({ at: time + 0.24, from: base * 1.4, to: base * 0.95, dur: 0.16 })
    }

    notes.forEach((note, index) => {
      this.sweep(note, 0.016, pan, index === notes.length - 1)
    })
  }

  private gull(time: number) {
    const ctx = this.ctx
    const bus = this.bus
    if (!ctx || !bus) return
    const pan = ctx.createStereoPanner()
    pan.pan.value = Math.random() * 1.4 - 0.7
    pan.connect(bus)
    const notes = [
      { at: time, from: 1500, to: 1180, dur: 0.2 },
      { at: time + 0.32, from: 1450, to: 980, dur: 0.28 },
    ]
    notes.forEach((note, index) => {
      this.sweep(note, 0.006, pan, index === notes.length - 1)
    })
  }

  private crickets(time: number) {
    const ctx = this.ctx
    const bus = this.bus
    if (!ctx || !bus) return
    const groups = 1 + Math.floor(Math.random() * 2)
    for (let group = 0; group < groups; group += 1) {
      const pan = ctx.createStereoPanner()
      pan.pan.value = Math.random() * 1.6 - 0.8
      pan.connect(bus)
      const base = 3900 + Math.random() * 900
      const pulses = 3 + Math.floor(Math.random() * 3)
      const start = time + group * (0.24 + Math.random() * 0.3)
      for (let index = 0; index < pulses; index += 1) {
        const at = start + index * 0.055
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = base - index * 18
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.0001, at)
        gain.gain.exponentialRampToValueAtTime(0.011, at + 0.008)
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.032)
        osc.connect(gain)
        gain.connect(pan)
        osc.start(at)
        osc.stop(at + 0.05)
        const last = index === pulses - 1
        this.track(osc, () => {
          gain.disconnect()
          if (last) pan.disconnect()
        })
      }
    }
  }

  private sweep(
    note: { at: number; from: number; to: number; dur: number },
    peak: number,
    pan: StereoPannerNode,
    last: boolean,
  ) {
    const ctx = this.ctx
    if (!ctx) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(note.from, note.at)
    osc.frequency.exponentialRampToValueAtTime(Math.max(200, note.to), note.at + note.dur)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, note.at)
    gain.gain.exponentialRampToValueAtTime(peak, note.at + Math.min(0.02, note.dur * 0.4))
    gain.gain.exponentialRampToValueAtTime(0.0001, note.at + note.dur)
    osc.connect(gain)
    gain.connect(pan)
    osc.start(note.at)
    osc.stop(note.at + note.dur + 0.03)
    this.track(osc, () => {
      gain.disconnect()
      if (last) pan.disconnect()
    })
  }

  private buildAmbience(patch: Patch) {
    const ctx = this.ctx
    const bus = this.bus
    if (!ctx || !bus) return
    const now = ctx.currentTime
    const fade = ctx.createGain()
    fade.gain.setValueAtTime(0.0001, now)
    fade.connect(bus)

    if (patch.ambience === 'rain') {
      fade.gain.exponentialRampToValueAtTime(0.85, now + 3)

      const hiss = this.noiseSource('white')
      const hissFilter = ctx.createBiquadFilter()
      hissFilter.type = 'bandpass'
      hissFilter.frequency.value = 2300
      hissFilter.Q.value = 0.55
      const hissGain = ctx.createGain()
      hissGain.gain.value = 0.05
      hiss.connect(hissFilter)
      hissFilter.connect(hissGain)
      hissGain.connect(fade)
      hiss.start()
      this.slowLfo(hissGain.gain, 0.08, 0.012)

      const patter = this.noiseSource('white')
      const patterFilter = ctx.createBiquadFilter()
      patterFilter.type = 'bandpass'
      patterFilter.frequency.value = 5200
      patterFilter.Q.value = 0.9
      const patterGain = ctx.createGain()
      patterGain.gain.value = 0.009
      patter.connect(patterFilter)
      patterFilter.connect(patterGain)
      patterGain.connect(fade)
      patter.start()
      this.slowLfo(patterGain.gain, 0.23, 0.004)

      const body = this.noiseSource('brown')
      const bodyFilter = ctx.createBiquadFilter()
      bodyFilter.type = 'lowpass'
      bodyFilter.frequency.value = 420
      const bodyGain = ctx.createGain()
      bodyGain.gain.value = 0.02
      body.connect(bodyFilter)
      bodyFilter.connect(bodyGain)
      bodyGain.connect(fade)
      body.start()
      return
    }

    if (patch.ambience === 'forest') {
      fade.gain.exponentialRampToValueAtTime(0.8, now + 3)
      const wind = this.noiseSource('white')
      const windFilter = ctx.createBiquadFilter()
      windFilter.type = 'lowpass'
      windFilter.frequency.value = 900
      const windGain = ctx.createGain()
      windGain.gain.value = 0.062
      wind.connect(windFilter)
      windFilter.connect(windGain)
      windGain.connect(fade)
      wind.start()
      this.slowLfo(windGain.gain, 0.09, 0.025)

      const leaves = this.noiseSource('white')
      const leafFilter = ctx.createBiquadFilter()
      leafFilter.type = 'bandpass'
      leafFilter.frequency.value = 3200
      leafFilter.Q.value = 0.7
      const leafGain = ctx.createGain()
      leafGain.gain.value = 0.014
      leaves.connect(leafFilter)
      leafFilter.connect(leafGain)
      leafGain.connect(fade)
      leaves.start()
      this.slowLfo(leafGain.gain, 0.17, 0.006)
      return
    }

    if (patch.ambience === 'meadow') {
      fade.gain.exponentialRampToValueAtTime(0.8, now + 3)

      const breeze = this.noiseSource('white')
      const breezeFilter = ctx.createBiquadFilter()
      breezeFilter.type = 'lowpass'
      breezeFilter.frequency.value = 700
      const breezeGain = ctx.createGain()
      breezeGain.gain.value = 0.038
      breeze.connect(breezeFilter)
      breezeFilter.connect(breezeGain)
      breezeGain.connect(fade)
      breeze.start()
      this.slowLfo(breezeGain.gain, 0.06, 0.012)

      const grass = this.noiseSource('white')
      const grassFilter = ctx.createBiquadFilter()
      grassFilter.type = 'bandpass'
      grassFilter.frequency.value = 2600
      grassFilter.Q.value = 0.6
      const grassGain = ctx.createGain()
      grassGain.gain.value = 0.01
      grass.connect(grassFilter)
      grassFilter.connect(grassGain)
      grassGain.connect(fade)
      grass.start()
      this.slowLfo(grassGain.gain, 0.14, 0.004)

      const beeFilter = ctx.createBiquadFilter()
      beeFilter.type = 'lowpass'
      beeFilter.frequency.value = 620
      beeFilter.Q.value = 2
      const bees = ctx.createGain()
      bees.gain.value = 0.14
      const tremolo = ctx.createGain()
      tremolo.gain.value = 0.55
      const pan = ctx.createStereoPanner()
      beeFilter.connect(bees)
      bees.connect(tremolo)
      tremolo.connect(pan)
      pan.connect(fade)

      for (const freq of [130, 196]) {
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.value = freq
        osc.detune.value = freq === 130 ? -4 : 5
        osc.connect(beeFilter)
        osc.start()
        this.track(osc)
      }
      this.slowLfo(tremolo.gain, 5.8, 0.16)
      this.slowLfo(pan.pan, 0.05, 0.35)
      return
    }

    if (patch.ambience === 'chimes') {
      fade.gain.exponentialRampToValueAtTime(0.6, now + 3)
      const wind = this.noiseSource('white')
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1000
      filter.Q.value = 0.4
      const gain = ctx.createGain()
      gain.gain.value = 0.05
      wind.connect(filter)
      filter.connect(gain)
      gain.connect(fade)
      wind.start()
      this.slowLfo(gain.gain, 0.11, 0.02)
      return
    }

    if (patch.ambience === 'ocean') {
      fade.gain.exponentialRampToValueAtTime(1, now + 3)
      const deep = this.noiseSource('brown')
      const deepFilter = ctx.createBiquadFilter()
      deepFilter.type = 'lowpass'
      deepFilter.frequency.value = 300
      const deepGain = ctx.createGain()
      deepGain.gain.value = 0.14
      const pan = ctx.createStereoPanner()
      deep.connect(deepFilter)
      deepFilter.connect(deepGain)
      deepGain.connect(pan)
      pan.connect(fade)
      deep.start()
      this.slowLfo(deepGain.gain, 0.055, 0.07)
      this.slowLfo(pan.pan, 0.037, 0.35)

      const foam = this.noiseSource('white')
      const foamFilter = ctx.createBiquadFilter()
      foamFilter.type = 'bandpass'
      foamFilter.frequency.value = 1700
      foamFilter.Q.value = 0.6
      const foamGain = ctx.createGain()
      foamGain.gain.value = 0.026
      foam.connect(foamFilter)
      foamFilter.connect(foamGain)
      foamGain.connect(fade)
      foam.start()
      this.slowLfo(foamGain.gain, 0.083, 0.014)
      return
    }

    fade.gain.exponentialRampToValueAtTime(0.55, now + 3)
    const breeze = this.noiseSource('brown')
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 520
    const gain = ctx.createGain()
    gain.gain.value = 0.05
    breeze.connect(filter)
    filter.connect(gain)
    gain.connect(fade)
    breeze.start()
    this.slowLfo(gain.gain, 0.07, 0.02)
  }

  private slowLfo(param: AudioParam, frequency: number, depth: number) {
    const ctx = this.ctx
    if (!ctx) return
    const lfo = ctx.createOscillator()
    lfo.frequency.value = frequency
    const amount = ctx.createGain()
    amount.gain.value = depth
    lfo.connect(amount)
    amount.connect(param)
    lfo.start()
    this.track(lfo, () => amount.disconnect())
  }

  private noiseSource(kind: 'white' | 'brown') {
    const ctx = this.ctx!
    const length = Math.floor(ctx.sampleRate * 4)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1
      if (kind === 'brown') {
        last = (last + 0.02 * white) / 1.02
        data[index] = last * 3.2
      } else {
        data[index] = white
      }
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    this.track(source)
    return source
  }

  private impulseBuffer() {
    const ctx = this.ctx!
    if (this.ir) return this.ir
    const length = Math.floor(ctx.sampleRate * 2.6)
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel)
      for (let index = 0; index < length; index += 1) {
        data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / length, 3)
      }
    }
    this.ir = buffer
    return buffer
  }

  private track(source: AudioScheduledSourceNode, cleanup?: () => void) {
    this.sources.add(source)
    source.addEventListener(
      'ended',
      () => {
        this.sources.delete(source)
        try {
          source.disconnect()
        } catch {
          /* already detached */
        }
        cleanup?.()
      },
      { once: true },
    )
  }

  private clearTimer() {
    if (this.timer !== null) {
      window.clearInterval(this.timer)
      this.timer = null
    }
  }

  private teardown(fadeSec: number) {
    this.clearTimer()
    const ctx = this.ctx
    const master = this.master
    const sources = this.sources
    this.master = null
    this.volumeNode = null
    this.bus = null
    this.sources = new Set()

    if (!ctx || !master) {
      sources.forEach((source) => this.stopSource(source))
      return
    }

    const now = ctx.currentTime
    const level = Math.max(master.gain.value, 0.0001)
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(level, now)
    master.gain.exponentialRampToValueAtTime(0.0001, now + fadeSec)

    window.setTimeout(
      () => {
        sources.forEach((source) => this.stopSource(source))
        try {
          master.disconnect()
        } catch {
          /* already detached */
        }
      },
      Math.ceil(fadeSec * 1000) + 120,
    )
  }

  private stopSource(source: AudioScheduledSourceNode) {
    try {
      source.stop()
    } catch {
      /* already stopped */
    }
  }
}

export const studyMusic = new StudyMusicEngine()
