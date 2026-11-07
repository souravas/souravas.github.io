// /pomodoro: focus, break and long-break timers on one dial.
//
// Each mode keeps its own length, 1 to 60 minutes, set by dragging the
// ring (or arrow keys, Page Up/Down, or the mouse wheel over it) while
// that mode's timer has not started; once it has, +5 min adds time, up
// to two hours left. A running timer counts down to a moment (endsAt)
// rather than counting ticks, so a background tab, whose timers the
// browser slows, still ends on time and shows the right time when it
// comes back.
//
// When Focus ends, a break follows: a long one after every few focus
// sessions (Settings), else a short one. Breaks start on their own and
// Focus waits for Start, unless Settings say otherwise. Each end rings
// the chosen alarm and, when the page is not in front, shows a
// notification. A sound can play while Focus runs (sound.js).
//
// localStorage keeps the timer under `pomodoro` (the lengths, the mode,
// a running or paused timer, the round to a long break and today's
// sessions) and the settings under `pomodoro-settings`, so a reload or a
// closed tab picks up where it was. The page works without it.

import * as sound from './sound.js'

const KEY = 'pomodoro'
const SETTINGS_KEY = 'pomodoro-settings'
const MIN = 1
const MAX = 60
// +5 min adds this much, until this much is left.
const EXTRA = 5
const CAP = 120
// A timer whose end is caught later than this (the page was closed, or
// the computer asleep) moves on to the next one without starting it.
const LATE = 60_000
const LABEL = { focus: 'Focus', break: 'Break', long: 'Long break' }

// Colours that read well on black, the first for Focus and the fourth
// for breaks to begin with; any other can be picked as a custom one.
const PALETTE = [
  ['Lavender', '#b8b1ff'],
  ['Blue', '#82b4ff'],
  ['Teal', '#6fd3c8'],
  ['Green', '#a9c9a4'],
  ['Amber', '#f4c06a'],
  ['Tomato', '#ff7d66'],
  ['Rose', '#f59ac0'],
  ['White', '#e5e5e5'],
]

const SETTINGS = {
  focusColor: '#b8b1ff',
  breakColor: '#a9c9a4',
  background: 'black',
  alarm: 'chime',
  alarmVolume: 70,
  ambient: 'off',
  ambientVolume: 50,
  every: 4,
  autoBreak: true,
  autoFocus: false,
  wake: false,
}
const CHOICES = {
  background: ['black', 'tint'],
  alarm: [...sound.ALARM_NAMES, 'off'],
  ambient: ['off', ...sound.AMBIENT_NAMES],
  every: [0, 2, 3, 4, 5, 6],
}
const HEX = /^#[0-9a-f]{6}$/i

const $ = (id) => document.getElementById(id)
const root = document.documentElement
const dial = $('dial')
const arc = $('arc')
const knob = $('knob')
const time = $('time')
const stateLabel = $('state')
const go = $('go')
const reset = $('reset')
const more = $('more')
const rounds = $('rounds')
const tallyText = $('tally-text')
const sheet = $('settings')
const themeColor = document.querySelector('meta[name="theme-color"]')
const lengths = { focus: $('focus-len'), break: $('break-len'), long: $('long-len') }
const modeButtons = [...document.querySelectorAll('.mode')]

// ---------- Storage ----------

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? {}
  } catch {
    return {}
  }
}
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

const clampMinutes = (n) => Math.min(MAX, Math.max(MIN, Math.round(n)))
const num = (v) => (Number.isFinite(v) ? v : null)
const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const loadState = () => {
  const s = read(KEY)
  return {
    focus: clampMinutes(num(s.focus) ?? 25),
    break: clampMinutes(num(s.break) ?? 5),
    long: clampMinutes(num(s.long) ?? 15),
    mode: s.mode in LABEL ? s.mode : 'focus',
    endsAt: num(s.endsAt),
    left: num(s.left),
    // The whole of the timer going, +5s and all, for today's minutes.
    total: num(s.total),
    round: num(s.round) ?? 0,
    day: typeof s.day === 'string' ? s.day : dayKey(),
    done: num(s.done) ?? 0,
    minutes: num(s.minutes) ?? 0,
    asked: s.asked === true,
  }
}

const loadSettings = () => {
  const s = read(SETTINGS_KEY)
  const out = {}
  for (const [key, fallback] of Object.entries(SETTINGS)) {
    const v = s[key]
    const ok = CHOICES[key]
      ? CHOICES[key].includes(v)
      : key.endsWith('Color')
        ? HEX.test(v)
        : typeof v === typeof fallback && (typeof v !== 'number' || (v >= 0 && v <= 100))
    out[key] = ok ? v : fallback
  }
  return out
}

const state = loadState()
const settings = loadSettings()
const save = () => write(KEY, state)
const saveSettings = () => write(SETTINGS_KEY, settings)

const phase = () => (state.endsAt != null ? 'running' : state.left != null ? 'paused' : 'idle')
const fullLength = (mode = state.mode) => state[mode] * 60_000
const remaining = () =>
  state.endsAt != null ? Math.max(0, state.endsAt - Date.now()) : (state.left ?? fullLength())

// A new day starts the count again.
const rollDay = () => {
  if (state.day === dayKey()) return
  state.day = dayKey()
  state.done = 0
  state.minutes = 0
  state.round = 0
}

// ---------- Notifications ----------
// Asked for once, on the first Start. Phones that only notify through a
// service worker throw here, and the alarm is left to do it.

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

// ---------- Side effects of the phase ----------
// The sound while focusing, and the screen kept on, follow the timer;
// both are checked whenever it changes.

let previewing = 0

const wantAmbient = () => settings.ambient !== 'off' && phase() === 'running' && state.mode === 'focus'

const syncAmbient = () => {
  if (wantAmbient()) {
    clearTimeout(previewing)
    previewing = 0
    // The clock ticks as the seconds turn over.
    sound.playAmbient(settings.ambient, settings.ambientVolume, (remaining() % 1000) / 1000)
  } else if (!previewing) {
    sound.stopAmbient()
  }
}

// A few seconds of the chosen sound, when it would not otherwise play.
const previewAmbient = () => {
  clearTimeout(previewing)
  previewing = 0
  if (wantAmbient() || settings.ambient === 'off') return syncAmbient()
  sound.playAmbient(settings.ambient, settings.ambientVolume)
  previewing = setTimeout(() => {
    previewing = 0
    syncAmbient()
  }, 4000)
}

let wakeLock = null
let wakePending = false

const syncWake = async () => {
  const want = settings.wake && phase() === 'running' && !document.hidden
  if (want && !wakeLock && !wakePending && 'wakeLock' in navigator) {
    wakePending = true
    try {
      wakeLock = await navigator.wakeLock.request('screen')
      wakeLock.addEventListener('release', () => {
        wakeLock = null
      })
    } catch {}
    wakePending = false
    if (!settings.wake || phase() !== 'running') syncWake()
  } else if (!want && wakeLock) {
    const lock = wakeLock
    wakeLock = null
    lock.release().catch(() => {})
  }
}

let lastSide = ''

const syncSide = () => {
  const key = `${phase()}|${state.mode}|${settings.ambient}|${settings.wake}`
  if (key === lastSide) return
  lastSide = key
  syncAmbient()
  syncWake()
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

// Ends whatever has run out. Focus counts toward today and the round,
// and hands over to a break; a break hands back to Focus. The next one
// starts from the moment the last ended, if Settings say it starts on
// its own and the end was caught in time. Only the last end is rung.
const settle = () => {
  let ended = null
  let late = false
  while (state.endsAt != null && Date.now() >= state.endsAt) {
    const end = state.endsAt
    late = Date.now() - end > LATE
    ended = state.mode
    let auto
    if (state.mode === 'focus') {
      rollDay()
      state.done += 1
      state.minutes += Math.round((state.total ?? fullLength()) / 60_000)
      state.round += 1
      state.mode = settings.every && state.round >= settings.every ? 'long' : 'break'
      auto = settings.autoBreak
    } else {
      if (state.mode === 'long') state.round = 0
      state.mode = 'focus'
      auto = settings.autoFocus
    }
    state.left = null
    state.total = fullLength()
    state.endsAt = auto && !late ? end + fullLength() : null
  }
  if (ended) {
    save()
    if (!late) {
      if (settings.alarm !== 'off') sound.alarm(settings.alarm, ended === 'focus' ? 'rest' : 'work', settings.alarmVolume)
      if (ended === 'focus') notify('Focus done', `${LABEL[state.mode]} for ${state[state.mode]} min.`)
      else notify(`${LABEL[ended]} over`, `Back to focus: ${state.focus} min.`)
    }
  }
  schedule()
  render()
}

// ---------- Actions ----------

const start = () => {
  sound.unlock()
  sound.stopAlarm()
  askToNotify()
  if (state.left == null) state.total = fullLength()
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
  sound.stopAlarm()
  state.endsAt = null
  state.left = null
  state.total = null
  save()
  schedule()
  render()
}

// Five more minutes on the timer going, never past two hours left.
const extend = () => {
  if (phase() === 'idle') return
  const add = Math.min(EXTRA * 60_000, CAP * 60_000 - remaining())
  if (add <= 0) return
  if (state.endsAt != null) state.endsAt += add
  else state.left += add
  state.total = (state.total ?? fullLength()) + add
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
const hours = (m) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${pad(m % 60)}m` : ''}`)

let lastLabel = ''
let lastRounds = ''

const render = () => {
  const p = phase()
  const ms = remaining()
  const mode = state.mode
  const set = state[mode]

  root.dataset.mode = mode
  root.dataset.phase = p
  for (const button of modeButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode))
    if (button.dataset.mode === 'long') button.hidden = !settings.every && mode !== 'long'
  }
  for (const m of Object.keys(lengths)) lengths[m].textContent = state[m]

  // The arc is in seconds of a 3600-second face; past an hour it is full.
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
  more.hidden = p === 'idle'
  more.disabled = ms >= CAP * 60_000 - 1000

  // The round to a long break, as dots: one lit for each focus done.
  const today = state.day === dayKey()
  const every = settings.every
  const filled = today ? Math.min(state.round, every) : 0
  const roundsKey = `${every}|${filled}`
  if (roundsKey !== lastRounds) {
    lastRounds = roundsKey
    rounds.hidden = !every
    rounds.replaceChildren(
      ...Array.from({ length: every }, (_, i) => {
        const dot = document.createElement('span')
        if (i < filled) dot.className = 'on'
        return dot
      }),
    )
    rounds.setAttribute('aria-label', `${filled} of ${every} focus sessions before a long break`)
  }
  const done = today ? state.done : 0
  tallyText.hidden = done === 0
  tallyText.textContent = `${done} session${done === 1 ? '' : 's'} · ${hours(today ? state.minutes : 0)} today`

  document.title = p === 'idle' ? 'Pomodoro' : `${p === 'paused' ? 'Paused' : clock(ms)} · ${LABEL[mode]}`
  const bar = settings.background === 'tint' ? tint(mode === 'focus' ? settings.focusColor : settings.breakColor) : '#000000'
  if (themeColor.getAttribute('content') !== bar) themeColor.setAttribute('content', bar)
  syncSide()
}

// ---------- Settings ----------

const swatchGroups = [...document.querySelectorAll('.swatches')]

// The palette as radio buttons, then a custom colour, for each group.
for (const group of swatchGroups) {
  const name = group.dataset.setting
  const who = name === 'focusColor' ? 'Focus' : 'Breaks'
  for (const [label, hex] of PALETTE) {
    const input = document.createElement('input')
    input.type = 'radio'
    input.className = 'swatch'
    input.name = name
    input.value = hex
    input.title = label
    input.setAttribute('aria-label', label)
    input.style.setProperty('--swatch', hex)
    group.append(input)
  }
  const custom = document.createElement('label')
  custom.className = 'swatch swatch-custom'
  custom.title = 'Any colour'
  const picker = document.createElement('input')
  picker.type = 'color'
  picker.dataset.custom = name
  picker.setAttribute('aria-label', `Any colour for ${who}`)
  custom.append(picker)
  group.append(custom)
}

// The tinted background is the mode's colour at 12% on black, as in the
// stylesheet; render() gives the browser's bar the same.
const tint = (hex) =>
  `#${[1, 3, 5].map((i) => pad(Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.12).toString(16))).join('')}`

const applySettings = () => {
  root.style.setProperty('--focus', settings.focusColor)
  root.style.setProperty('--break', settings.breakColor)
  if (settings.background === 'tint') root.dataset.bg = 'tint'
  else delete root.dataset.bg
}

// Ticks what is chosen in the sheet.
const showSettings = () => {
  for (const input of sheet.querySelectorAll('input[name]')) {
    const v = settings[input.name]
    if (input.type === 'checkbox') input.checked = v === true
    else if (input.type === 'radio') input.checked = String(v).toLowerCase() === input.value.toLowerCase()
    else if (input.type === 'range') input.value = String(v)
  }
  for (const picker of sheet.querySelectorAll('input[data-custom]')) {
    const v = settings[picker.dataset.custom]
    const preset = PALETTE.some(([, hex]) => hex === v.toLowerCase())
    picker.value = v
    picker.parentElement.classList.toggle('is-on', !preset)
    picker.parentElement.style.setProperty('--swatch', v)
  }
  $('wake-row').hidden = !('wakeLock' in navigator)
}

const change = (name, value) => {
  settings[name] = value
  saveSettings()
  applySettings()
  showSettings()
  render()
}

sheet.addEventListener('change', (event) => {
  const input = event.target
  sound.unlock()
  if (input.dataset.custom) return change(input.dataset.custom, input.value.toLowerCase())
  const { name } = input
  if (!(name in settings)) return
  if (input.type === 'checkbox') return change(name, input.checked)
  if (input.type === 'range') {
    change(name, Number(input.value))
    if (name === 'alarmVolume') sound.alarm(settings.alarm === 'off' ? 'chime' : settings.alarm, 'rest', settings.alarmVolume, 1)
    else previewAmbient()
    return
  }
  change(name, name === 'every' ? Number(input.value) : input.value)
  if (name === 'alarm' && input.value !== 'off') sound.alarm(input.value, 'rest', settings.alarmVolume, 1)
  if (name === 'alarm' && input.value === 'off') sound.stopAlarm()
  if (name === 'ambient') previewAmbient()
})

// Volumes and a custom colour follow the pointer as it moves.
sheet.addEventListener('input', (event) => {
  const input = event.target
  if (input.dataset.custom) {
    settings[input.dataset.custom] = input.value.toLowerCase()
    applySettings()
    input.parentElement.style.setProperty('--swatch', input.value)
    return
  }
  if (input.name === 'ambientVolume') {
    settings.ambientVolume = Number(input.value)
    sound.setAmbientVolume(settings.ambientVolume)
  }
})

sheet.addEventListener('toggle', (event) => {
  if (event.newState === 'open') showSettings()
})

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
more.addEventListener('click', extend)

// Space starts and pauses, and + adds five minutes, from anywhere a key
// would not already type or choose something. A button the mouse pressed
// keeps the focus, but Space there still means the timer, not that
// button again; on a button reached by Tab, Space presses the button.
let pointerFocus = false
document.addEventListener('pointerdown', () => (pointerFocus = true), { capture: true })
document.addEventListener(
  'keydown',
  (event) => {
    if (event.key === 'Tab') pointerFocus = false
  },
  { capture: true },
)

document.addEventListener('keydown', (event) => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || sheet.matches(':popover-open')) return
  if (event.target.closest('a, input, select, textarea')) return
  const onButton = event.target.closest('button') != null
  if (event.key === ' ' && !(onButton && !pointerFocus)) {
    event.preventDefault()
    toggle()
  } else if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    extend()
  }
})

// Any tap or key opens the audio, so a timer restored on load can ring,
// and its sound can start. A touch counts as one only once it lifts.
const opened = () => {
  sound.unlock()
  lastSide = ''
  setTimeout(syncSide, 50)
}
for (const type of ['pointerdown', 'pointerup', 'keydown']) {
  document.addEventListener(type, opened, { capture: true })
}

// A tab that comes back, or a phone that wakes, catches up at once, and
// takes the screen lock again (the browser lets it go when hidden).
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return
  settle()
  syncWake()
})

applySettings()
showSettings()
settle()
