// The review's schedule and the saved copy of the progress. store.js is
// written for a browser, so it gets a localStorage and a window to
// listen on before it loads. Run with `npm test`.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { beforeEach, test } from 'node:test'
import { renderNote } from './render.js'

const kept = new Map()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key) => kept.get(key) ?? null,
    setItem: (key, value) => kept.set(key, String(value)),
  },
})
globalThis.addEventListener ??= () => {}

const store = await import('./store.js')
const { NEW_PER_DAY, LAST_LESSON } = store

const day = store.today()
const card = (id, lesson = 1) => ({ id, lesson })
const A = card('aaaaaaaaaa')
const B = card('bbbbbbbbbb')
const byId = (...cards) => new Map(cards.map((c) => [c.id, c]))

// Each test starts from progress of its own.
const begin = (progress = {}) => store.restore({ v: 1, cards: {}, ...progress })
beforeEach(() => begin())

test('a card new to the review is due tomorrow, right or wrong', () => {
  store.schedule([{ card: A, correct: true }, { card: B, correct: false }])
  assert.deepEqual(store.progress().cards, { [A.id]: [1, day + 1], [B.id]: [1, day + 1] })
})

test('a due card got right moves up a box and waits that box out', () => {
  begin({ cards: { [A.id]: [1, day], [B.id]: [3, day - 2] } })
  store.schedule([{ card: A, correct: true }, { card: B, correct: true }])
  assert.deepEqual(store.progress().cards, { [A.id]: [2, day + 3], [B.id]: [4, day + 14] })
})

test('a miss goes back to the first box, and the last box is the last', () => {
  begin({ cards: { [A.id]: [5, day], [B.id]: [6, day] } })
  store.schedule([{ card: A, correct: false }, { card: B, correct: true }])
  assert.deepEqual(store.progress().cards, { [A.id]: [1, day + 1], [B.id]: [6, day + 60] })
})

test('a card got right before it is due keeps its day', () => {
  begin({ cards: { [A.id]: [3, day + 4] } })
  store.schedule([{ card: A, correct: true }])
  assert.deepEqual(store.progress().cards[A.id], [3, day + 4])
})

test('what is due comes oldest first, and a card the note dropped is skipped', () => {
  begin({ cards: { [A.id]: [2, day], [B.id]: [1, day - 3], cccccccccc: [1, day - 9], dddddddddd: [2, day + 1] } })
  const due = store.dueCards(byId(A, B, card('dddddddddd')))
  assert.deepEqual(due.map((d) => d.card.id), [B.id, A.id])
})

test('waiting cards come in from the next day, a few a day', () => {
  const waiting = Array.from({ length: NEW_PER_DAY + 5 }, (_, i) => card(`${String(i).padStart(2, '0')}00000000`))
  store.enter(waiting)
  assert.equal(store.dueCards(byId(...waiting)).length, 0)
  begin({ cards: Object.fromEntries(waiting.map((c) => [c.id, [0, day - 1]])) })
  const due = store.dueCards(byId(...waiting))
  assert.equal(due.length, NEW_PER_DAY)
  store.schedule(due.map((d) => ({ card: d.card, correct: true })))
  assert.equal(store.dueCards(byId(...waiting)).length, 0)
})

test('entering a lesson twice adds its cards once', () => {
  begin({ cards: { [A.id]: [4, day + 9] } })
  store.enter([A, B])
  assert.deepEqual(store.progress().cards, { [A.id]: [4, day + 9], [B.id]: [0, day] })
})

test('the review is done for the day only when nothing was left due', () => {
  store.markReviewed(false)
  assert.equal(store.reviewedToday(), false)
  assert.equal(store.streak(), 1)
  store.markReviewed()
  assert.equal(store.reviewedToday(), true)
})

test('the streak is the days in a row up to today, or yesterday', () => {
  begin({ active: [day - 5, day - 3, day - 2, day - 1] })
  assert.equal(store.streak(), 3)
  store.markDone(1)
  assert.equal(store.streak(), 4)
  assert.equal(store.currentLesson(), 2)
})

test('a saved copy reads back as it was', () => {
  begin({ cards: { [A.id]: [2, day + 3] }, lesson: 7, done: { 6: day - 1 }, active: [day - 1, day], started: true, reviewed: day, view: 'note' })
  const before = structuredClone(store.progress())
  const copy = store.readSnapshot(store.snapshot())
  assert.deepEqual(copy.progress, before)
  assert.ok(!Number.isNaN(new Date(copy.saved).getTime()))
  assert.deepEqual(store.summary(copy.progress), { lesson: 7, cards: 1 })
})

test('a file that is not a copy is turned away, and a damaged one is trimmed', () => {
  assert.equal(store.readSnapshot('not json'), null)
  assert.equal(store.readSnapshot('{"v":1,"cards":{}}'), null)
  assert.equal(store.readSnapshot(JSON.stringify({ kind: 'kannada-gottilla-progress', progress: { v: 2, cards: {} } })), null)
  const damaged = { v: 1, cards: { [A.id]: [2, day], [B.id]: [9, day], short: [1, day], cccccccccc: 'x' }, lesson: 400, done: { 3: day, 999: day }, extra: true }
  const copy = store.readSnapshot(JSON.stringify({ kind: 'kannada-gottilla-progress', saved: 'x', progress: damaged }))
  assert.deepEqual(copy.progress, { v: 1, cards: { [A.id]: [2, day] }, done: { 3: day } })
})

test('restoring replaces what was here and keeps it', () => {
  begin({ cards: { [A.id]: [1, day] } })
  const copy = store.readSnapshot(JSON.stringify({ kind: 'kannada-gottilla-progress', progress: { v: 1, cards: { [B.id]: [3, day + 2] }, lesson: 12 } }))
  assert.equal(store.restore(copy.progress), true)
  assert.deepEqual(JSON.parse(kept.get('kannada')), { v: 1, cards: { [B.id]: [3, day + 2] }, lesson: 12 })
  assert.equal(store.currentLesson(), 12)
})

// The page and store.js have to agree on two things about the note.
test('the note has the lessons store.js counts, and ids of the shape it keeps', () => {
  const { html, cards } = renderNote(readFileSync(new URL('./note.md', import.meta.url), 'utf8'))
  assert.equal(html.match(/<section class="lesson">/g).length, LAST_LESSON)
  assert.match(html, new RegExp(`id="lesson-${LAST_LESSON}"`))
  for (const id of Object.keys(cards.cards)) assert.match(id, /^[0-9a-f]{10}$/)
})
