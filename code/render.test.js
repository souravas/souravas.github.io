// The three documents into the page. Run with `npm test`.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { DOCS, renderDocs } from './render.js'

const PYTHON = [
  'def two_sum(nums, target):      # PATTERNS.md → Fast & Slow Pointers',
  '    seen = {}',
  '    for i, n in enumerate(nums):',
  '        if target - n in seen:  # found',
  '            return [seen[target - n], i]',
  '',
  '        seen[n] = i  # "a < b" & more',
]

const SOURCES = {
  'PATTERNS.md': `# Patterns

Intro, see [the cheatsheet](CHEATSHEET.md#sorting--keys).

## Table of Contents

- [Sorting](#sorting)
- [Fast & Slow Pointers](#fast--slow-pointers)

---

## Sorting

Text.

\`\`\`python
${PYTHON.join('\n')}
\`\`\`

## Fast & Slow Pointers

More.
`,
  'CHEATSHEET.md': `# Cheatsheet

## Sorting & Keys

See [patterns](PATTERNS.md#fast--slow-pointers).
`,
  'README.md': '# Code\n\nHello.\n',
}

const render = (sources) => {
  const warnings = []
  return { ...renderDocs(sources, { warn: (message) => warnings.push(message) }), warnings }
}

const text = (html) =>
  html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')

test("headings take GitHub's anchors as ids, so a file link works on both", () => {
  const { html, warnings } = render(SOURCES)
  assert.match(html, /<h3 id="fast--slow-pointers">Fast &amp; Slow Pointers<\/h3>/)
  assert.match(html, /see <a href="#sorting--keys">the cheatsheet<\/a>/)
  assert.match(html, /See <a href="#fast--slow-pointers">patterns<\/a>/)
  assert.deepEqual(warnings, [])
})

test('a link to a heading that is not there warns, and is left as text', () => {
  const { html, warnings } = render({ ...SOURCES, 'CHEATSHEET.md': '# Cheatsheet\n\n## Sorting & Keys\n\nSee [nowhere](PATTERNS.md#gone).\n' })
  assert.deepEqual(warnings, ['CHEATSHEET.md: PATTERNS.md#gone links to nothing'])
  assert.match(html, /<p>See nowhere\.<\/p>/)
})

// Copy, search and hand selection all read a block's text.
test("a code block's text is its source, line for line", () => {
  const { html } = render(SOURCES)
  const [, code] = /<pre><code>([\s\S]*?)<\/code><\/pre>/.exec(html)
  assert.equal(text(code), `${PYTHON.join('\n')}\n`.replace('PATTERNS.md →', 'Patterns →'))
})

test("a comment's PATTERNS.md → Heading is a link to it", () => {
  const { html } = render(SOURCES)
  assert.match(html, /# <a href="#fast--slow-pointers">Patterns → Fast &amp; Slow Pointers<\/a>/)
})

test('every section is in the Sections sheet, under its document', () => {
  const { sections } = render(SOURCES)
  assert.match(sections, /<h2><a href="#patterns">Patterns<\/a><\/h2><ol><li><a href="#sorting">Sorting<\/a><\/li><li><a href="#fast--slow-pointers">Fast &amp; Slow Pointers<\/a><\/li><\/ol>/)
})

test('the documents themselves render with nothing to warn about', () => {
  const sources = Object.fromEntries(DOCS.map((doc) => [doc.file, readFileSync(new URL(`./${doc.file}`, import.meta.url), 'utf8')]))
  assert.deepEqual(render(sources).warnings, [])
})
