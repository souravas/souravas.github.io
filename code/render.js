/* ============================================================
   SOURAV — /code, build-time renderer
   Turns the three documents in this folder (PATTERNS.md,
   CHEATSHEET.md, README.md) into the page's HTML, with the Python
   highlighted here so the browser runs nothing to draw it.
   vite.config.js imports this; the browser never loads it.
   It reads the Markdown the documents use — headings, paragraphs,
   pipe tables, lists, fenced code, inline code, bold, italics and
   links — and nothing more.
   ============================================================ */

// In page order. A document's top heading takes its id, and its name is
// what the page calls it: the links between them say PATTERNS.md, so they
// also work where the files are read on their own, and the page shows
// Patterns. A title replaces the document's own heading.
export const DOCS = [
  { file: 'PATTERNS.md', id: 'patterns', name: 'Patterns' },
  { file: 'CHEATSHEET.md', id: 'cheatsheet', name: 'Cheatsheet' },
  { file: 'README.md', id: 'overview', name: 'Overview', title: 'Overview' },
]

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// "PATTERNS.md" and "PATTERNS" in the running text read as the page's name.
const DOC_NAME = /\b(CHEATSHEET|PATTERNS)(?:\.md)?\b/g
const docName = (s) => s.replace(DOC_NAME, (_, name) => name[0] + name.slice(1).toLowerCase())

// Running text: the page's names, and a bound that stays in one piece, as
// in a narrow table's "≤ 1,000".
const prose = (s) => escapeHtml(docName(s)).replace(/([≤≥]) (?=\S)/g, '$1\u00a0')

// A heading's leading emoji belongs to the file, not the page.
const LEADING_EMOJI = /^\p{Extended_Pictographic}️?\s*/u

/* ---------- Blocks ---------- */

const HEADING = /^(#{1,6})\s+(.+?)\s*$/
const TABLE_ROW = /^\s*\|/
const ORDERED = /^\s*(\d+)[.)]\s+(.*)$/
const BULLET = /^\s*[-*+]\s+(.*)$/
const RULE = /^\s*([-*_])(?:\s*\1){2,}\s*$/
const FENCE = /^```(\w*)\s*$/
const startsBlock = (line) =>
  HEADING.test(line) || TABLE_ROW.test(line) || ORDERED.test(line) || BULLET.test(line) || RULE.test(line) || FENCE.test(line)

const splitRow = (row) => {
  let s = row.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1)
  return s.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'))
}

function parseBlocks(lines) {
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    let m
    if (!line.trim()) {
      i++
    } else if ((m = FENCE.exec(line))) {
      const code = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++])
      i++
      blocks.push({ type: 'code', lang: m[1], lines: code })
    } else if ((m = HEADING.exec(line))) {
      blocks.push({ type: 'heading', level: m[1].length, text: m[2].replace(LEADING_EMOJI, ''), raw: m[2] })
      i++
    } else if (TABLE_ROW.test(line)) {
      const rows = []
      while (i < lines.length && TABLE_ROW.test(lines[i])) rows.push(lines[i++])
      // The second row is the |---|---| line under the header.
      blocks.push({ type: 'table', header: splitRow(rows[0]), rows: rows.slice(2).map(splitRow) })
    } else if (RULE.test(line)) {
      // The files rule off each section, and the page's sections rule
      // themselves off.
      i++
    } else if (ORDERED.test(line) || BULLET.test(line)) {
      const ordered = ORDERED.test(line)
      const item = ordered ? ORDERED : BULLET
      const list = { type: 'list', ordered, start: ordered ? Number(ORDERED.exec(line)[1]) : 1, items: [] }
      while (i < lines.length && item.test(lines[i])) {
        list.items.push(item.exec(lines[i++]).at(-1))
        // Indented lines continue the item above.
        while (i < lines.length && /^\s+\S/.test(lines[i]) && !startsBlock(lines[i])) {
          list.items[list.items.length - 1] += ` ${lines[i++].trim()}`
        }
      }
      blocks.push(list)
    } else {
      const text = []
      while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) text.push(lines[i++].trim())
      blocks.push({ type: 'paragraph', text: text.join(' ') })
    }
  }
  return blocks
}

/* ---------- Ids ----------
   The documents link to each other by GitHub's anchors: lowercased, its
   punctuation dropped and each space a hyphen, so "Fast & Slow Pointers"
   is fast--slow-pointers. The page uses the same ids, so those links work
   as written. An id two documents would share takes its document's name. */

const SLUG_STRIP = /[ -⁯⸀-⹿\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~·‐-―]/g
const slug = (text) => text.trim().toLowerCase().replace(SLUG_STRIP, '').replace(/ /g, '-')

const isContents = (block) => block.type === 'heading' && block.level === 2 && /table of contents/i.test(block.text)

function assignIds(docs) {
  const used = new Set(docs.map((doc) => doc.id))
  for (const doc of docs) {
    doc.anchors = new Map()
    doc.headings = new Map()
    const seen = new Map()
    for (const block of doc.blocks) {
      if (block.type !== 'heading') continue
      const base = slug(block.raw)
      const n = seen.get(base) ?? 0
      seen.set(base, n + 1)
      const anchor = n ? `${base}-${n}` : base
      let id = anchor
      if (block.level === 1) id = doc.id
      else if (isContents(block)) id = `${doc.id}-contents`
      else if (used.has(id)) id = `${doc.id}-${id}`
      used.add(id)
      block.id = id
      doc.anchors.set(anchor, id)
      if (!doc.headings.has(stripInline(block.text))) doc.headings.set(stripInline(block.text), id)
    }
  }
}

/* ---------- Inline ---------- */

const INLINE = /`([^`]+)`|\[([^\]]*)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\*([^*\s][^*]*?)\*/g

const stripInline = (s) =>
  docName(s)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*([^*\s][^*]*?)\*/g, '$1')
    .replace(/`/g, '')
    .trim()

// Where a link goes: out to the web, to a heading in this document, or to
// another document or a heading in it. Null if it lands nowhere.
function resolve(url, ctx) {
  if (/^https?:/i.test(url)) return url
  const [file, anchor] = url.split('#')
  const target = file ? ctx.byFile.get(file) : ctx.doc
  if (!target) return null
  return anchor ? (target.anchors.has(anchor) ? `#${target.anchors.get(anchor)}` : null) : `#${target.id}`
}

function inline(text, ctx) {
  let html = ''
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    html += prose(text.slice(last, m.index))
    last = m.index + m[0].length
    const [, code, label, url, bold, italic] = m
    if (code !== undefined) html += `<code>${escapeHtml(code)}</code>`
    else if (url !== undefined) {
      const href = resolve(url, ctx)
      if (!href) ctx.warn(`${ctx.doc.file}: ${url} links to nothing`)
      html += href ? `<a href="${escapeHtml(href)}">${inline(label, ctx)}</a>` : inline(label, ctx)
    } else if (bold !== undefined) html += `<strong>${inline(bold, ctx)}</strong>`
    else html += `<em>${inline(italic, ctx)}</em>`
  }
  return html + prose(text.slice(last))
}

/* ---------- Python ----------
   Each line is one span, so that a phone can wrap it under its own indent
   and Cover can hide it: .l, with its leading spaces in .w and its code in
   .x. A line with a comment on its end (.e) keeps the comment apart in .t,
   and the code with the spaces that align the comment (.p) in .a: on a
   narrow screen a comment that does not fit goes under its line instead of
   off the edge. A comment line lined up under such a comment continues it
   (.cc), and drops the alignment with it. A line's newline stays in the text, so a block's
   textContent is exactly its source, and wide screens lay the spans out
   inline as the plain text it is.
   Colour goes to what a reader scans for: keywords, names being defined,
   literals and comments. */

const KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
  'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in',
  'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
])

const PY_TOKEN = /(#.*)|((?:\b[rRbBfFuU]{1,2})?(?:"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?))|(\b(?:0[xXbBoO][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)\b)|(@[A-Za-z_][\w.]*)|([A-Za-z_]\w*)/g

function pyTokens(code) {
  const tokens = []
  let last = 0
  let defining = false
  for (const m of code.matchAll(PY_TOKEN)) {
    if (m.index > last) tokens.push(['', code.slice(last, m.index)])
    last = m.index + m[0].length
    const [text, comment, string, number, decorator, word] = m
    let kind = ''
    if (comment) kind = 'c'
    else if (string) kind = 's'
    else if (number) kind = 'n'
    else if (decorator) kind = 'k'
    else if (defining) kind = 'f'
    else if (KEYWORDS.has(word)) kind = 'k'
    tokens.push([kind, text])
    defining = word === 'def' || word === 'class'
  }
  if (last < code.length) tokens.push(['', code.slice(last)])
  return tokens
}

const tokenHtml = ([kind, text]) => (kind ? `<span class="${kind}">${escapeHtml(text)}</span>` : escapeHtml(text))

// A comment's "PATTERNS.md → Sorting" is a link to that heading.
const CROSS_REF = /\b(PATTERNS|CHEATSHEET)\.md → ([^).]+)/g

function commentHtml(text, ctx) {
  let html = ''
  let last = 0
  for (const m of text.matchAll(CROSS_REF)) {
    html += escapeHtml(docName(text.slice(last, m.index)))
    last = m.index + m[0].length
    const id = ctx.byFile.get(`${m[1]}.md`)?.headings.get(m[2].trim())
    if (!id) ctx.warn(`${ctx.doc.file}: "${m[0]}" names no heading`)
    const label = escapeHtml(docName(m[0]))
    html += id ? `<a href="#${id}">${label}</a>` : label
  }
  return html + escapeHtml(docName(text.slice(last)))
}

// The indent, as a class: the hanging indent on a phone is set from it.
const indentClass = (n) => {
  const step = Math.min(Math.floor(n / 4) * 4, 28)
  return step ? ` i${step}` : ''
}

function renderPython(lines, ctx) {
  // The column of the end-of-line comment above, and the indent of its code.
  let comment = null
  return lines.map((raw) => {
    if (!raw.trim()) {
      comment = null
      return '<span class="l">\n</span>'
    }
    const lead = /^ */.exec(raw)[0]
    const tokens = pyTokens(raw.slice(lead.length))
    const ws = lead ? `<span class="w">${lead}</span>` : ''
    const end = tokens.at(-1)[0] === 'c' ? tokens.pop()[1] : null

    if (end !== null && !tokens.length) {
      const cc = comment?.column === lead.length
      if (!cc) comment = null
      const classes = cc ? `l cc${indentClass(comment.indent)}` : `l${indentClass(lead.length)}`
      return `<span class="${classes}">${ws}<span class="c">${commentHtml(end, ctx)}</span>\n</span>`
    }

    if (end === null) {
      comment = null
      return `<span class="l${indentClass(lead.length)}">${ws}<span class="x">${tokens.map(tokenHtml).join('')}</span>\n</span>`
    }

    // The spaces that align the comment come off the code before it.
    const tail = tokens.at(-1)
    const pad = /\s*$/.exec(tail[1])[0]
    tail[1] = tail[1].slice(0, tail[1].length - pad.length)
    if (!tail[1]) tokens.pop()
    comment = { column: raw.length - end.length, indent: lead.length }
    return `<span class="l e${indentClass(lead.length)}"><span class="a">${ws}<span class="x">${tokens.map(tokenHtml).join('')}</span><span class="p">${pad}</span></span><span class="t c">${commentHtml(end, ctx)}\n</span></span>`
  }).join('')
}

// A shell line, laid out like Python so that its comment stays in reach.
function renderConsole(lines) {
  return lines.map((raw) => {
    const m = /^(.*?)(\s+)(# .*)$/.exec(raw)
    if (!m) return `<span class="l"><span class="x">${escapeHtml(raw)}</span>\n</span>`
    return `<span class="l e"><span class="a"><span class="x">${escapeHtml(m[1])}</span><span class="p">${m[2]}</span></span><span class="t c">${escapeHtml(m[3])}\n</span></span>`
  }).join('')
}

// A block with no language is the README's listing of the trees, which lines
// up as columns, so it never wraps. It scrolls sideways instead, which takes a
// tabindex to reach by keyboard. The others wrap (.wrap in style.css).
function renderCode(block, ctx) {
  if (block.lang === 'python') return `<div class="code py wrap"><pre><code>${renderPython(block.lines, ctx)}</code></pre></div>`
  if (block.lang === 'console') return `<div class="code wrap"><pre><code>${renderConsole(block.lines)}</code></pre></div>`
  return `<div class="code plain"><pre tabindex="0"><code>${block.lines.map((raw) => `${escapeHtml(raw)}\n`).join('')}</code></pre></div>`
}

/* ---------- Rendering ---------- */

function renderTable(block, ctx) {
  const cell = (tag, text, attrs = '') => `<${tag}${attrs}>${inline(text, ctx)}</${tag}>`
  // The README's first table has an empty header row: it is only a layout.
  const head = block.header.some(Boolean)
    ? `<thead><tr>${block.header.map((h) => cell('th', h, ' scope="col"')).join('')}</tr></thead>`
    : ''
  const rows = block.rows.map((row) => `<tr>${block.header.map((_, i) => cell('td', row[i] ?? '')).join('')}</tr>`).join('\n')
  return `<div class="table"><table>${head}<tbody>\n${rows}\n</tbody></table></div>`
}

function renderList(block, ctx, className = '') {
  const tag = block.ordered ? 'ol' : 'ul'
  const start = block.ordered && block.start !== 1 ? ` start="${block.start}"` : ''
  const cls = className ? ` class="${className}"` : ''
  return `<${tag}${cls}${start}>${block.items.map((item) => `<li>${inline(item, ctx)}</li>`).join('')}</${tag}>`
}

function renderBlock(block, ctx) {
  switch (block.type) {
    case 'paragraph': return `<p>${inline(block.text, ctx)}</p>`
    case 'table': return renderTable(block, ctx)
    case 'list': return renderList(block, ctx)
    case 'code': return renderCode(block, ctx)
  }
}

// How tall a section will be, roughly, so that the page is about the right
// length before its sections are laid out (main.js sets it; see .sec in
// style.css). Wide-screen pixels; main.js scales it on a phone.
function estimate(blocks) {
  let h = 0
  for (const block of blocks) {
    if (block.type === 'heading') h += 60
    else if (block.type === 'paragraph') h += 16 + 27 * Math.ceil(block.text.length / 80)
    else if (block.type === 'code') h += 50 + 21 * block.lines.length
    else if (block.type === 'table') h += 24 + 40 * (block.rows.length + 1)
    else if (block.type === 'list') h += 16 + 30 * block.items.length
  }
  return h
}

// A long section opens on the list of what is in it. The part of a heading
// before its dash is its name ("Min Stack — Constant-time getMin").
const SUB_TOC_MIN = 3
const shortTitle = (text) => stripInline(text).split(' — ')[0]

function subToc(blocks, title) {
  const subs = blocks.filter((b) => b.type === 'heading' && b.level === 3)
  if (subs.length < SUB_TOC_MIN) return ''
  const items = subs.map((b) => `<li><a href="#${b.id}">${escapeHtml(shortTitle(b.text))}</a></li>`).join('')
  return `<nav class="sub-toc" aria-label="In ${escapeHtml(title)}"><ul>${items}</ul></nav>`
}

// One document: a <section class="doc"> holding its intro, its table of
// contents and a <section class="sec"> for each second-level heading.
// Headings step down one, under the page's h1.
function renderDoc(doc, ctx) {
  ctx.doc = doc
  const html = []
  const groups = []
  let current = null
  const flush = () => {
    if (!current) return
    const [heading, ...body] = current
    const title = stripInline(heading.text)
    groups.push({ id: heading.id, title })
    html.push(`<section class="sec" data-id="${heading.id}" data-h="${estimate(current)}"><h3 id="${heading.id}">${inline(heading.text, ctx)}</h3>${subToc(body, title)}`)
    for (const block of body) {
      html.push(block.type === 'heading' ? `<h4 id="${block.id}">${inline(block.text, ctx)}</h4>` : renderBlock(block, ctx))
    }
    html.push('</section>')
    current = null
  }
  html.push(`<section class="doc" data-id="${doc.id}" data-name="${doc.name}">`)
  for (let i = 0; i < doc.blocks.length; i++) {
    const block = doc.blocks[i]
    if (block.type === 'heading' && block.level === 1) {
      html.push(`<h2 id="${doc.id}">${inline(doc.title ?? block.text, ctx)}</h2>`)
    } else if (isContents(block)) {
      flush()
      const list = doc.blocks[++i]
      html.push(`<nav class="contents" aria-label="${doc.name} contents"><h3 class="label" id="${block.id}">${inline(block.text, ctx)}</h3>${renderList(list, ctx, 'toc')}</nav>`)
    } else if (block.type === 'heading' && block.level === 2) {
      flush()
      current = [block]
    } else if (current) {
      current.push(block)
    } else {
      html.push(block.type === 'heading' ? `<h3 id="${block.id}">${inline(block.text, ctx)}</h3>` : renderBlock(block, ctx))
    }
  }
  flush()
  html.push('</section>')
  return { html: html.join('\n'), groups }
}

// The bar's Sections sheet, and on wide screens the rail beside the page.
function renderSections(docs) {
  return docs.map(({ doc, groups }) => {
    const items = groups.map(({ id, title }) => `<li><a href="#${id}">${escapeHtml(title)}</a></li>`).join('')
    return `<section><h2><a href="#${doc.id}">${escapeHtml(doc.name)}</a></h2><ol>${items}</ol></section>`
  }).join('\n')
}

/* ---------- The page ---------- */
export function renderDocs(sources, { warn = () => {} } = {}) {
  const docs = DOCS.map((doc) => ({
    ...doc,
    blocks: parseBlocks(sources[doc.file].replace(/\r\n?/g, '\n').split('\n')),
  }))
  assignIds(docs)
  const ctx = { byFile: new Map(docs.map((doc) => [doc.file, doc])), doc: null, warn }
  const rendered = docs.map((doc) => ({ doc, ...renderDoc(doc, ctx) }))
  return { html: rendered.map((r) => r.html).join('\n'), sections: renderSections(rendered) }
}
