// /pomodoro's sounds, all made on the spot with Web Audio, so there is
// nothing to download: the alarms that ring when a timer ends, and the
// sounds that can play while you focus.
//
// A page may only make sound after a tap or a key. unlock() opens the
// audio on one; until then everything here stays quiet.

let ctx = null

export const unlock = () => {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  } catch {}
}

const open = () => ctx != null && ctx.state === 'running'

// A volume of 0–100, heard as roughly even steps.
const level = (volume) => (Math.max(0, Math.min(100, volume)) / 100) ** 2

// The alarms' notes are written at a quiet level, so that several at
// once never clip; this brings the loudest of them close to full scale
// at volume 100 (measured: the bell's peak, 0.9).
const ALARM_GAIN = 2.5

// ---------- Alarms ----------

// One note: an oscillator through its own swell and fade.
const note = (out, t, freq, { type = 'sine', peak = 1, attack = 0.01, decay = 1.2 } = {}) => {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(peak, t + attack)
  env.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  osc.connect(env).connect(out)
  osc.start(t)
  osc.stop(t + attack + decay + 0.05)
}

// Each schedules its sound from time t and gives how long it lasts. `to`
// is where the timer goes next: 'rest' after focus, 'work' after a
// break, so a chime can fall to a rest and rise to work.
const ALARMS = {
  chime(out, t, to, rounds) {
    const notes = to === 'rest' ? [784, 659, 523] : [523, 659, 784]
    for (let r = 0; r < rounds; r++) {
      notes.forEach((f, i) => note(out, t + r * 1.6 + i * 0.22, f, { peak: 0.3, decay: 1.2 }))
    }
    return rounds * 1.6
  },
  // A struck bell: a few out-of-tune partials, the high ones dying first.
  bell(out, t, to, rounds) {
    const base = to === 'rest' ? 523 : 659
    const partials = [[1, 0.22, 2.8], [2.76, 0.1, 1.6], [5.4, 0.045, 0.9], [8.93, 0.022, 0.5]]
    for (let r = 0; r < rounds; r++) {
      for (const [ratio, peak, decay] of partials) {
        note(out, t + r * 2.2, base * ratio, { peak, decay, attack: 0.004 })
      }
    }
    return rounds * 2.2
  },
  // A watch alarm: four quick beeps, three times over.
  digital(out, t, _to, rounds) {
    const soft = ctx.createBiquadFilter()
    soft.type = 'lowpass'
    soft.frequency.value = 3500
    soft.connect(out)
    for (let r = 0; r < rounds * 1.5; r++) {
      for (let i = 0; i < 4; i++) {
        const s = t + r * 0.9 + i * 0.13
        const osc = ctx.createOscillator()
        const env = ctx.createGain()
        osc.type = 'square'
        osc.frequency.value = 1760
        env.gain.setValueAtTime(0, s)
        env.gain.linearRampToValueAtTime(0.14, s + 0.004)
        env.gain.setValueAtTime(0.14, s + 0.07)
        env.gain.linearRampToValueAtTime(0, s + 0.075)
        osc.connect(env).connect(soft)
        osc.start(s)
        osc.stop(s + 0.08)
      }
    }
    return rounds * 1.35
  },
  // Wooden bars: a quick run down to rest, up to work.
  marimba(out, t, to, rounds) {
    const notes = to === 'rest' ? [1047, 880, 784, 659, 523] : [523, 659, 784, 880, 1047]
    for (let r = 0; r < rounds; r++) {
      notes.forEach((f, i) => {
        const s = t + r * 1.4 + i * 0.13
        note(out, s, f, { peak: 0.32, decay: 0.55, attack: 0.003 })
        note(out, s, f * 4, { peak: 0.04, decay: 0.12, attack: 0.002 })
      })
    }
    return rounds * 1.4
  },
}

export const ALARM_NAMES = Object.keys(ALARMS)

let ringing = null

// Rings the alarm `name` at `volume`, cutting short one still ringing.
// A preview rings once; a timer's end, twice.
export const alarm = (name, to, volume, rounds = 2) => {
  stopAlarm()
  if (!ALARMS[name] || !open()) return
  const out = ctx.createGain()
  out.gain.value = level(volume) * ALARM_GAIN
  out.connect(ctx.destination)
  const length = ALARMS[name](out, ctx.currentTime + 0.05, to, rounds)
  ringing = out
  setTimeout(() => {
    if (ringing === out) ringing = null
  }, (length + 2) * 1000)
}

export const stopAlarm = () => {
  if (!ringing) return
  const out = ringing
  ringing = null
  out.gain.setTargetAtTime(0, ctx.currentTime, 0.03)
  setTimeout(() => out.disconnect(), 300)
}

// ---------- While you focus ----------
// Each is a buffer that loops: a tick and a tock a second apart, or a
// few seconds of noise whose end is faded into its start (`blend`
// seconds of it), so the loop never clicks. Made once, the first time
// it is played.

const buffers = {}

const loop = (seconds, fill, blend = 0.25) => {
  const rate = ctx.sampleRate
  const length = Math.round(seconds * rate)
  const fade = Math.round(blend * rate)
  const x = new Float32Array(length + fade)
  fill(x, rate)
  let peak = 0
  for (const v of x) peak = Math.max(peak, Math.abs(v))
  const scale = peak > 0 ? 0.9 / peak : 0
  const buffer = ctx.createBuffer(1, length, rate)
  const out = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) out[i] = x[i] * scale
  // The loop's first moments blend from what would have come after its
  // end into its own start, so the end runs on into the start.
  for (let i = 0; i < fade; i++) {
    const w = Math.sin((Math.PI / 2) * (i / fade))
    out[i] = (x[i] * w + x[length + i] * Math.cos((Math.PI / 2) * (i / fade))) * scale
  }
  return buffer
}

// Their gains even out how loud they sound, with the noises' peaks
// normalised to 0.9 so none clips at volume 100.
const AMBIENTS = {
  // A tick on each second the clock shows, and a lower tock between.
  clock: {
    gain: 1.1,
    make: () =>
      loop(2, (x, rate) => {
        for (const [at, freq] of [[0, 2600], [1, 1900]]) {
          const start = Math.round(at * rate)
          for (let j = 0; j < 0.04 * rate; j++) {
            const t = j / rate
            const v = (Math.sin(2 * Math.PI * freq * t) * 0.6 + (Math.random() * 2 - 1) * 0.4) * Math.exp(-t / 0.004)
            x[start + j] += v
          }
        }
      }, 0),
  },
  // Deep and soft, like a distant waterfall.
  brown: {
    gain: 0.8,
    make: () =>
      loop(8, (x) => {
        let b = 0
        for (let i = 0; i < x.length; i++) {
          b = (b + 0.02 * (Math.random() * 2 - 1)) / 1.02
          x[i] = b
        }
      }),
  },
  // Brighter, like steady rain.
  pink: {
    gain: 0.6,
    make: () =>
      loop(8, (x) => {
        let b0 = 0
        let b1 = 0
        let b2 = 0
        for (let i = 0; i < x.length; i++) {
          const w = Math.random() * 2 - 1
          b0 = 0.99765 * b0 + w * 0.099046
          b1 = 0.963 * b1 + w * 0.2965164
          b2 = 0.57 * b2 + w * 1.0526913
          x[i] = b0 + b1 + b2 + w * 0.1848
        }
      }),
  },
}

export const AMBIENT_NAMES = Object.keys(AMBIENTS)

let bed = null

// Plays the sound `name` at `volume`, fading in, after `delay` seconds
// (so the clock can tick on the second). The one already playing just
// takes the new volume.
export const playAmbient = (name, volume, delay = 0) => {
  if (!AMBIENTS[name] || !open()) return
  if (bed?.name === name) {
    setAmbientVolume(volume)
    return
  }
  stopAmbient()
  buffers[name] ??= AMBIENTS[name].make()
  const src = ctx.createBufferSource()
  src.buffer = buffers[name]
  src.loop = true
  const gain = ctx.createGain()
  const t = ctx.currentTime + delay
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.setTargetAtTime(level(volume) * AMBIENTS[name].gain, t, 0.25)
  src.connect(gain).connect(ctx.destination)
  src.start(t)
  bed = { name, src, gain }
}

export const setAmbientVolume = (volume) => {
  if (!bed) return
  bed.gain.gain.setTargetAtTime(level(volume) * AMBIENTS[bed.name].gain, ctx.currentTime, 0.05)
}

export const stopAmbient = () => {
  if (!bed) return
  const { src, gain } = bed
  bed = null
  const t = ctx.currentTime
  gain.gain.cancelScheduledValues(t)
  gain.gain.setTargetAtTime(0, t, 0.12)
  src.stop(t + 0.8)
}

export const ambientPlaying = () => bed?.name ?? null
