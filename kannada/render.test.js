// The lessons note into the page, its cards and its Anki deck. Run with
// `npm test`.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { renderNote } from './render.js'

const NOTE = `# Beginner

## Lesson 1 — Greetings

Say \`namaskaara\` to anyone. See [[#Lesson 2 — Thanks|the next lesson]], or Lesson 2.

|English|Kannada|
|---|---|
|hello|namaskaara|
|how are you?|hEgiddIra?|
|thanks|dhanyavaada|

> [!later]- For later
> |English|Kannada|
> |---|---|
> |good morning|shubhOdaya|
> |good night|shubha raatri|
> |see you|sigONa|

> [!say] Say it today
> |English|Kannada|
> |---|---|
> |hello|namaskaara|

## Lesson 2 — Thanks

|Level|Verb|Example|
|---|---|---|
|casual|*bare stem*|baa|
`

const render = (markdown) => {
  const warnings = []
  return { ...renderNote(markdown, { warn: (message) => warnings.push(message) }), warnings }
}

test('a lesson is a section with its number as its id', () => {
  const { html, jump, warnings } = render(NOTE)
  assert.match(html, /<section class="lesson">\n<h3 id="lesson-1"><span class="num">Lesson 1<\/span>/)
  assert.match(jump, /<a href="#lesson-2" title="Thanks">2<\/a>/)
  assert.deepEqual(warnings, [])
})

test('wiki-links and lesson numbers in the text link to the lesson', () => {
  const { html } = render(NOTE)
  assert.match(html, /See <a href="#lesson-2">the next lesson<\/a>, or <a href="#lesson-2">Lesson 2<\/a>\./)
})

test('a wiki-link to a heading that is not there warns', () => {
  const { warnings } = render(`${NOTE}\nSee [[#Lesson 9 — Gone]].\n`)
  assert.deepEqual(warnings, ['[[#Lesson 9 — Gone]] names no heading'])
})

test('Kannada columns are set as Kannada and covered; English ones are not', () => {
  const { html } = render(NOTE)
  assert.match(html, /<tr><td>hello<\/td><td class="kn c">namaskaara<\/td><\/tr>/)
})

test('a cell all in italics is English in a Kannada column', () => {
  const { html } = render(NOTE)
  assert.match(html, /<td>casual<\/td><td><em>bare stem<\/em><\/td><td class="kn c">baa<\/td>/)
})

// The review keeps each card's place by its id, so an id that changed
// would lose that card's history in every browser.
test("a card's id is the start of the SHA-1 of its English and Kannada", () => {
  const { cards } = render(NOTE)
  assert.deepEqual(cards.cards['37ec14b940'], ['hello', 'namaskaara', '', 1, 0])
})

test("a lesson's cards are its own tables', its For later ones only drills", () => {
  const { cards, html } = render(NOTE)
  assert.deepEqual(cards.decks, { '1.1': ['37ec14b940', 'f44f407b61', '979934ae67'], '1.3': ['37ec14b940'] })
  assert.deepEqual(cards.drills, { '1.2': ['fccb994f1e', 'bfb079c5fa', '78a3a4790d'] })
  assert.deepEqual(cards.say, { 1: ['37ec14b940'] })
  assert.match(html, /data-quiz="1" data-size="3"/)
  // Lesson 2's only table has no English to ask from, so no quiz.
  assert.doesNotMatch(html, /data-quiz="2"/)
})

test('the Anki deck has each lesson card once, in script too, under its id', () => {
  const { anki } = render(NOTE)
  const rows = anki.split('\n').filter((line) => line && !line.startsWith('#'))
  assert.equal(rows.length, 3)
  assert.equal(rows[0], 'hello\tnamaskaara<br>ನಮಸ್ಕಾರ\tKannada Gottilla::01 Greetings\tkannada-gottilla lesson-01 say\tkg-37ec14b940\tBasic (and reversed card)')
})

test('the note itself renders with nothing to warn about', () => {
  const { cards, warnings } = render(readFileSync(new URL('./note.md', import.meta.url), 'utf8'))
  assert.deepEqual(warnings, [])
  assert.ok(Object.keys(cards.cards).length > 1000)
})
