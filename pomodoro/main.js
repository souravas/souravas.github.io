// /pomodoro: a focus timer and a break timer on one dial.
//
// Each mode keeps its own length, 1 to 60 minutes, set by dragging the
// ring (or arrow keys, Page Up/Down, or the mouse wheel over it) while
// that mode's timer has not started. A running timer counts down to a
// moment (endsAt) rather than counting ticks, so a background tab, whose
// timers the browser slows, still ends on time and shows the right time
// when it comes back. When Focus ends, Break starts on its own; when
// Break ends, Focus waits for Start. Each end plays a chime and, when the
// page is not in front, shows a notification.
//
// Everything is kept in localStorage (`pomodoro`): the two lengths, the
// mode, a running or paused timer, and the focus sessions done today, so
// a reload or a closed tab picks up where it was. The page works without
// it.

const KEY = 'pomodoro'
const MIN = 1
const MAX = 60
const DEFAULTS = { focus: 25, break: 5 }
const LABEL = { focus: 'Focus', break: 'Break' }

const $ = (id) => document.getElementById(id)
const timer = $('timer')
const dial = $('dial')
const arc = $('arc')
const knob = $('knob')
const time = $('time')
const stateLabel = $('state')
const go = $('go')
const reset = $('reset')
const tally = $('tally')
const lengths = { focus: $('focus-len'), break: $('break-len') }
const modeButtons = [...document.querySelectorAll('.mode')]

// ---------- State ----------

const clampMinutes = (n) => Math.min(MAX, Math.max(MIN, Math.round(n)))

const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const load = () => {
  let saved = {}
  try {
    saved = JSON.parse(localStorage.getItem(KEY)) ?? {}
  } catch {}
  const num = (v) => (Number.isFinite(v) ? v : null)
  return {
    focus: clampMinutes(num(saved.focus) ?? DEFAULTS.focus),
    break: clampMinutes(num(saved.break) ?? DEFAULTS.break),
    mode: saved.mode === 'break' ? 'break' : 'focus',
    endsAt: num(saved.endsAt),
    left: num(saved.left),
    day: typeof saved.day === 'string' ? saved.day : dayKey(),
    done: num(saved.done) ?? 0,
    asked: saved.asked === true,
  }
}

const state = load()

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {}
}

const phase = () => (state.endsAt != null ? 'running' : state.left != null ? 'paused' : 'idle')
const fullLength = (mode = state.mode) => state[mode] * 60_000
const remaining = () =>
  state.endsAt != null ? Math.max(0, state.endsAt - Date.now()) : (state.left ?? fullLength())

const doneToday = () => (state.day === dayKey() ? state.done : 0)

// ---------- Sound ----------
// A soft three-note chime, made on the spot, so there is nothing to
// download. Browsers only let a page make sound after a tap or a key, so
// the first one on the page opens the audio; a timer restored on load
// stays silent until then.

let audio = null

const unlockAudio = () => {
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') audio.resume()
  } catch {}
}

const chime = (notes) => {
  if (!audio || audio.state !== 'running') return
  const start = audio.currentTime + 0.05
  for (let round = 0; round < 2; round++) {
    notes.forEach((freq, i) => {
      const t = start + round * 1.6 + i * 0.22
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
      osc.connect(gain).connect(audio.destination)
      osc.start(t)
      osc.stop(t + 1.25)
    })
  }
}

// Down to rest, up to work.
const CHIMES = { focus: [784, 659, 523], break: [523, 659, 784] }

// ---------- Notifications ----------
// Asked for once, on the first Start. Phones that only notify through a
// service worker throw here, and the chime is left to do it.

const askToNotify = () => {
  if (state.asked || !('Notification' in window)) return
  state.asked = true
  save()
  try {
    if (Notification.permission === 'default') Notification.requestPermission()
  } catch {}
}

const notify = (title, body) => {
  if (document.hasFocus()) return
  try {
    if (Notification.permission !== 'granted') return
    const note = new Notification(title, { body, tag: 'pomodoro', icon: '/icon-192x192.png', silent: true })
    note.onclick = () => {
      window.focus()
      note.close()
    }
  } catch {}
}

// ---------- Timing ----------

let endTimer = 0
let tickTimer = 0

// One timeout for the end itself, set straight from a tap rather than
// chained off the display's ticks, so a hidden tab still runs it within
// a second. The ticks redraw, and end the timer too should the timeout
// come late.
const tick = () => (state.endsAt != null && Date.now() >= state.endsAt ? settle() : render())

const schedule = () => {
  clearTimeout(endTimer)
  clearInterval(tickTimer)
  if (state.endsAt == null) return
  endTimer = setTimeout(settle, Math.max(0, state.endsAt - Date.now()) + 20)
  tickTimer = setInterval(tick, 250)
}

// Ends whatever has run out: Focus moves on to Break, which starts at
// the moment Focus ended; Break hands back to Focus, waiting. After a
// long sleep both can have run out, and only the last end is sounded.
// `quiet` is for a page opened after its timer ended.
const settle = (quiet = false) => {
  let ended = null
  while (state.endsAt != null && Date.now() >= state.endsAt) {
    ended = state.mode
    if (state.mode === 'focus') {
      if (state.day !== dayKey()) {
        state.day = dayKey()
        state.done = 0
      }
      state.done += 1
      state.mode = 'break'
      state.endsAt += fullLength('break')
    } else {
      state.mode = 'focus'
      state.endsAt = null
    }
  }
  if (ended) {
    save()
    if (!quiet) {
      chime(CHIMES[ended])
      if (ended === 'focus') notify('Focus done', `Break for ${state.break} min.`)
      else notify('Break over', `Back to focus: ${state.focus} min.`)
    }
  }
  schedule()
  render()
}

// ---------- Actions ----------

const start = () => {
  unlockAudio()
  askToNotify()
  state.endsAt = Date.now() + (state.left ?? fullLength())
  state.left = null
  save()
  schedule()
  render()
}

const pause = () => {
  state.left = remaining()
  state.endsAt = null
  save()
  schedule()
  render()
}

const toggle = () => (phase() === 'running' ? pause() : start())

const stop = () => {
  state.endsAt = null
  state.left = null
  save()
  schedule()
  render()
}

// Switching modes drops a timer that was going, on purpose: pressing
// Break mid-focus means taking the break now.
const setMode = (mode) => {
  if (mode === state.mode) return
  state.mode = mode
  stop()
}

const setLength = (minutes) => {
  const n = clampMinutes(minutes)
  if (phase() !== 'idle' || n === state[state.mode]) return
  state[state.mode] = n
  save()
  render()
}

// ---------- Drawing ----------

const pad = (n) => String(n).padStart(2, '0')
const clock = (ms) => {
  const secs = Math.ceil(ms / 1000)
  return `${Math.floor(secs / 60)}:${pad(secs % 60)}`
}
const at = (ms) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

let lastLabel = ''

const render = () => {
  const p = phase()
  const ms = remaining()
  const mode = state.mode
  const set = state[mode]

  timer.dataset.mode = mode
  timer.dataset.phase = p
  for (const button of modeButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode))
  }
  lengths.focus.textContent = state.focus
  lengths.break.textContent = state.break

  // The arc is in seconds of a 3600-second face.
  arc.setAttribute('stroke-dasharray', `${Math.min(ms / 1000, 3600)} 3600`)
  const angle = (set / 60) * 2 * Math.PI
  knob.setAttribute('cx', (150 + 118 * Math.sin(angle)).toFixed(2))
  knob.setAttribute('cy', (150 - 118 * Math.cos(angle)).toFixed(2))

  time.textContent = clock(ms)
  const label = p === 'running' ? `Ends ${at(state.endsAt)}` : p === 'paused' ? 'Paused' : 'Drag to set'
  if (label !== lastLabel) {
    stateLabel.textContent = label
    lastLabel = label
  }

  dial.setAttribute('aria-label', `${LABEL[mode]} length`)
  dial.setAttribute('aria-valuenow', String(set))
  dial.setAttribute('aria-valuetext', `${set} minute${set === 1 ? '' : 's'}`)
  dial.setAttribute('aria-disabled', String(p !== 'idle'))
  dial.tabIndex = p === 'idle' ? 0 : -1

  go.textContent = p === 'running' ? 'Pause' : p === 'paused' ? 'Resume' : 'Start'
  reset.hidden = p === 'idle'

  const done = doneToday()
  tally.hidden = done === 0
  tally.textContent = `${done} done today`

  document.title = p === 'idle' ? 'Pomodoro' : `${p === 'paused' ? 'Paused' : clock(ms)} · ${LABEL[mode]}`
}

// ---------- Dial input ----------
// The angle from twelve o'clock, in whole minutes. A drag cannot wrap
// past twelve: from 60 it stays at 60, from 1 it stays at 1, until it
// comes back round the way it went.

const minutesAt = (event, from) => {
  const box = dial.getBoundingClientRect()
  const x = event.clientX - (box.left + box.width / 2)
  const y = event.clientY - (box.top + box.height / 2)
  // A first touch near the middle has no clear angle; let it be.
  if (from == null && Math.hypot(x, y) < box.width * 0.22) return null
  const degrees = ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360
  let n = Math.round(degrees / 6) || 60
  if (from != null && Math.abs(n - from) > 30) n = from > 30 ? MAX : MIN
  return clampMinutes(n)
}

let dragging = null

dial.addEventListener('pointerdown', (event) => {
  if (phase() !== 'idle' || event.button > 0) return
  const n = minutesAt(event, null)
  if (n == null) return
  event.preventDefault()
  dial.setPointerCapture(event.pointerId)
  dragging = event.pointerId
  dial.classList.add('is-dragging')
  dial.focus({ preventScroll: true })
  setLength(n)
})

dial.addEventListener('pointermove', (event) => {
  if (event.pointerId !== dragging) return
  setLength(minutesAt(event, state[state.mode]))
})

const endDrag = (event) => {
  if (event.pointerId !== dragging) return
  dragging = null
  dial.classList.remove('is-dragging')
}
dial.addEventListener('pointerup', endDrag)
dial.addEventListener('pointercancel', endDrag)

dial.addEventListener('keydown', (event) => {
  if (phase() !== 'idle') return
  const n = state[state.mode]
  const next = {
    ArrowUp: n + 1,
    ArrowRight: n + 1,
    ArrowDown: n - 1,
    ArrowLeft: n - 1,
    PageUp: n + 5,
    PageDown: n - 5,
    Home: MIN,
    End: MAX,
  }[event.key]
  if (next == null) return
  event.preventDefault()
  setLength(next)
})

// A minute a notch, and a trackpad's small scrolls add up to one.
let wheel = 0
dial.addEventListener(
  'wheel',
  (event) => {
    if (phase() !== 'idle') return
    event.preventDefault()
    wheel += event.deltaMode === 0 ? event.deltaY : event.deltaY * 40
    const steps = Math.trunc(wheel / 40)
    if (steps === 0) return
    wheel -= steps * 40
    setLength(state[state.mode] - steps)
  },
  { passive: false },
)

// ---------- Buttons and keys ----------

for (const button of modeButtons) {
  button.addEventListener('click', () => setMode(button.dataset.mode))
}
go.addEventListener('click', toggle)
reset.addEventListener('click', stop)

// Space starts and pauses from anywhere a key would not already press
// something.
document.addEventListener('keydown', (event) => {
  if (event.key !== ' ' || event.repeat || event.target.closest('button, a, input')) return
  event.preventDefault()
  toggle()
})

// Any tap or key opens the audio, so a timer restored on load can chime.
// A touch counts as one only once the finger lifts.
for (const type of ['pointerdown', 'pointerup', 'keydown']) {
  document.addEventListener(type, unlockAudio, { capture: true })
}

// A tab that comes back, or a phone that wakes, catches up at once.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) settle()
})

settle(true)
