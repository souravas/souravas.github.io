/* ============================================================
   SOURAV — /kannada, build-time renderer
   Turns the Obsidian note (kannada/note.md, a copy of "70 - Learn/
   Language/Kannada Gottilla.md" in the hope vault) into the page's
   HTML. vite.config.js imports this; the browser never loads it.
   It reads the Markdown the note uses — headings, paragraphs, pipe
   tables, lists, callouts, inline code, bold, italics, links and
   wiki-links — and nothing more.
   ============================================================ */

// The vault the note lives in, the one /start's Obsidian link opens. A
// wiki-link to another note in it opens that note in Obsidian.
const VAULT = 'hope'

// "## Lesson 12 — Numbers 1 to 100" is a lesson; its id is lesson-12.
const LESSON_HEADING = /^Lesson (\d+) — (.+)$/

// Table columns that hold English. Every other column holds Kannada,
// which is set in the mono face (it tells the I of iddIra from an l)
// and hidden by the Cover button.
const ENGLISH_COLUMNS = new Set([
  'Meaning', 'What it means', 'Word for word', 'Use', 'Run', 'Who', 'What changes',
  'What happened', 'Which one this note uses', 'Sound', 'Speaker', 'Case', 'Level',
  'Time', 'Register', 'Language', 'Order', 'Follows', 'Formula', 'Number', 'Letter',
  'Lesson', 'Lessons',
])
const isEnglishColumn = (header) => header.startsWith('English') || ENGLISH_COLUMNS.has(header)

// Lists, callouts and the odd paragraph carry Kannada without backticks
// (the exercises and their answers, the story in Lesson 83). Their words
// are weighed: a capital inside a word gives Kannada away (iddIra,
// maaDtEne), a capitalised word is a name and counts either way, these
// common words and single letters are English, and any other word is
// Kannada if the note's Kannada columns or backticks use it.
const ENGLISH_WORDS = new Set([
  'the', 'an', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'to', 'of', 'in', 'on', 'at',
  'by', 'for', 'with', 'and', 'or', 'but', 'not', 'no', 'it', 'its', 'this', 'that', 'these',
  'those', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'we', 'us', 'our', 'they', 'them',
  'their', 'my', 'me', 'do', 'does', 'did', 'have', 'has', 'had', 'will', 'would', 'can',
  'could', 'what', 'where', 'when', 'how', 'who', 'why', 'which', 'as', 'if', 'so', 'from',
  'there', 'here', 'all', 'one', 'some', 'any',
])
const WORD = /[A-Za-z][A-Za-z'’-]*/g

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Header text without its backticks, for matching ("to — `-ge`").
const plainText = (s) => s.replace(/`/g, '').trim()

const slug = (s) =>
  plainText(s).toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/* ---------- Blocks ---------- */

const HEADING = /^(#{1,6})\s+(.+?)\s*$/
const TABLE_ROW = /^\s*\|/
const QUOTE = /^\s*>/
const ORDERED = /^\s*(\d+)[.)]\s+(.*)$/
const BULLET = /^\s*[-*+]\s+(.*)$/
const RULE = /^\s*([-*_])(?:\s*\1){2,}\s*$/
const startsBlock = (line) =>
  HEADING.test(line) || TABLE_ROW.test(line) || QUOTE.test(line) || ORDERED.test(line) || BULLET.test(line) || RULE.test(line)

// A row's cells. An escaped pipe (\|, as wiki-link aliases are written
// inside tables) stays in its cell.
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
    } else if ((m = HEADING.exec(line))) {
      blocks.push({ type: 'heading', level: m[1].length, text: m[2] })
      i++
    } else if (TABLE_ROW.test(line)) {
      const rows = []
      while (i < lines.length && TABLE_ROW.test(lines[i])) rows.push(lines[i++])
      // The second row is the |---|---| line under the header.
      blocks.push({ type: 'table', header: splitRow(rows[0]), rows: rows.slice(2).map(splitRow) })
    } else if (QUOTE.test(line)) {
      const inner = []
      while (i < lines.length && QUOTE.test(lines[i])) inner.push(lines[i++].replace(/^\s*>\s?/, ''))
      // > [!success]- Answers: an Obsidian callout, folded when it ends in -.
      const head = /^\[!(\w+)\]([+-]?)\s*(.*)$/.exec(inner[0])
      if (head) {
        blocks.push({ type: 'callout', kind: head[1].toLowerCase(), fold: head[2], title: head[3], body: parseBlocks(inner.slice(1)) })
      } else {
        blocks.push({ type: 'quote', body: parseBlocks(inner) })
      }
    } else if (RULE.test(line)) {
      blocks.push({ type: 'rule' })
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

/* ---------- Headings ----------
   Each heading gets an id: lesson-N for a lesson, lesson-N-name for a
   heading inside one (Lessons 29 and 33 both have a "Speak"), and the
   heading's words for the rest. Wiki-links find them by text. */

function assignIds(blocks) {
  const used = new Set()
  const byText = new Map()
  const parts = []
  let lesson = null
  const unique = (base) => {
    let id = base || 'section'
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`
    used.add(id)
    return id
  }
  for (const block of blocks) {
    if (block.type !== 'heading') continue
    const m = block.level === 2 ? LESSON_HEADING.exec(block.text) : null
    if (m) {
      lesson = { n: Number(m[1]), title: m[2] }
      lesson.id = block.id = unique(`lesson-${lesson.n}`)
      block.lesson = lesson
      parts.at(-1)?.lessons.push(lesson)
    } else {
      if (block.level <= 2) lesson = null
      block.id = unique(`${lesson ? `lesson-${lesson.n}-` : ''}${slug(block.text)}`)
      if (block.level === 1) parts.push({ id: block.id, title: block.text, lessons: [] })
    }
    if (!byText.has(block.text)) byText.set(block.text, block.id)
  }
  return { byText, parts }
}

/* ---------- Kannada ---------- */

// Every word the note marks as Kannada: its Kannada table columns and
// everything in backticks.
function collectKannada(blocks, lexicon = new Set()) {
  const add = (text) => {
    for (const word of text.match(WORD) ?? []) {
      lexicon.add(word)
      for (const part of word.split('-')) if (part) lexicon.add(part)
    }
  }
  const addCode = (text) => {
    for (const [, code] of text.matchAll(/`([^`]+)`/g)) add(code)
  }
  for (const block of blocks) {
    if (block.type === 'table') {
      const english = block.header.map((h) => isEnglishColumn(plainText(h)))
      for (const row of block.rows) {
        row.forEach((cell, i) => (english[i] || cell.includes('`') ? addCode(cell) : add(cell)))
      }
    } else if (block.type === 'list') {
      block.items.forEach(addCode)
    } else if (block.text || block.title) {
      addCode(block.text ?? block.title)
    }
    if (block.body) collectKannada(block.body, lexicon)
  }
  return lexicon
}

// How much of a stretch of text reads as Kannada (see ENGLISH_WORDS).
function weigh(text, lexicon) {
  const words = text
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, ' $1 ')
    .replace(/\]\([^)]*\)/g, ']')
    .match(WORD) ?? []
  let kannada = 0
  let english = 0
  for (const word of words) {
    if (/[a-z][A-Z]/.test(word)) kannada++
    else if (/^[A-Z]/.test(word)) continue
    else if (word.length < 2 || ENGLISH_WORDS.has(word.toLowerCase())) english++
    else if (lexicon.has(word) || word.split('-').every((part) => !part || lexicon.has(part))) kannada++
    else english++
  }
  return { kannada, share: kannada / (kannada + english || 1) }
}

// Where " — " splits an exercise line into its Kannada and its English
// note ("nanna hesaru — your name"), or -1. A dash in backticks is text.
function dashAt(text) {
  let code = false
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '`') code = !code
    else if (!code && text.startsWith(' — ', i)) return i
  }
  return -1
}

/* ---------- Inline ---------- */

const INLINE = /`([^`]+)`|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\*([^*\s][^*]*?)\*/g
const SAFE_URL = /^(?:https?:|mailto:|obsidian:|#)/i

// "Lesson 38" links to that lesson, as do the numbers after "Lessons"
// ("Lessons 35 and 36", "Lessons 58 to 67").
const LESSON_REF = /\bLesson (\d+)\b|\bLessons (\d+(?:(?:,? and |, | to | or )\d+)*)\b/g

// An ending ("-lilla", "-taa") is kept whole: a browser may break a line
// after a hyphen, which would leave the hyphen on its own. It runs on
// escaped text, so it stops at an &, short of a quote's &quot;.
const ENDING = /(^|[\s(])(-[A-Za-z][^\s,;:.!?)&]*)/g
const keepEndings = (html) => html.replace(ENDING, '$1<span class="nw">$2</span>')

function plain(text, ctx, links) {
  let html = keepEndings(escapeHtml(text))
  if (links) {
    html = html.replace(LESSON_REF, (all, one, many) => {
      if (one) return ctx.lessons.has(Number(one)) ? `<a href="#lesson-${one}">${all}</a>` : all
      return all.replace(/\d+/g, (n) => (ctx.lessons.has(Number(n)) ? `<a href="#lesson-${n}">${n}</a>` : n))
    })
  }
  // Kannada script (Lesson 1's letters) is marked so it is read as Kannada.
  return html.replace(/\p{Script=Kannada}+(?:\s+\p{Script=Kannada}+)*/gu, (s) => `<span lang="kn">${s}</span>`)
}

function inline(text, ctx, { links = true } = {}) {
  let html = ''
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    html += plain(text.slice(last, m.index), ctx, links)
    last = m.index + m[0].length
    const [, code, target, alias, label, url, bold, italic] = m
    if (code !== undefined) html += `<i class="kn">${keepEndings(escapeHtml(code))}</i>`
    else if (target !== undefined) html += wikiLink(target, alias, ctx)
    else if (label !== undefined) {
      html += SAFE_URL.test(url) ? `<a href="${escapeHtml(url)}">${inline(label, ctx, { links: false })}</a>` : inline(label, ctx, { links })
    } else if (bold !== undefined) html += `<strong>${inline(bold, ctx, { links })}</strong>`
    else html += `<em>${inline(italic, ctx, { links })}</em>`
  }
  return html + plain(text.slice(last), ctx, links)
}

// [[#Heading|alias]] links within the note; [[Folder/Note|alias]] opens
// another note of the vault in Obsidian.
function wikiLink(target, alias, ctx) {
  const label = escapeHtml(alias ?? target.replace(/^#/, ''))
  if (target.startsWith('#')) {
    const id = headingId(target.slice(1), ctx)
    return id ? `<a href="#${id}">${label}</a>` : label
  }
  return `<a href="obsidian://open?vault=${VAULT}&amp;file=${encodeURIComponent(target)}">${label}</a>`
}

function headingId(text, ctx) {
  const id = ctx.ids.get(text) ?? [...ctx.ids].find(([key]) => key.toLowerCase() === text.toLowerCase())?.[1]
  if (!id) ctx.warn(`[[#${text}]] names no heading`)
  return id
}

/* ---------- Rendering ---------- */

function renderHeading(block, ctx) {
  const tag = `h${Math.min(block.level + 1, 6)}`
  const body = block.lesson
    ? `<span class="num">Lesson ${block.lesson.n}</span><span class="dash"> — </span>${inline(block.lesson.title, ctx, { links: false })}`
    : inline(block.text, ctx, { links: false })
  return `<${tag} id="${block.id}">${body}</${tag}>`
}

function renderParagraph(block, ctx) {
  const { kannada, share } = weigh(block.text, ctx.lexicon)
  return `<p${kannada >= 5 && share >= 0.7 ? ' class="kn"' : ''}>${inline(block.text, ctx)}</p>`
}

function renderItem(text, ctx) {
  const at = dashAt(text)
  const head = at === -1 ? text : text.slice(0, at)
  const { kannada, share } = weigh(head, ctx.lexicon)
  if (kannada === 0 || share < 0.5) return inline(text, ctx)
  return `<span class="kn">${inline(head, ctx)}</span>${at === -1 ? '' : inline(text.slice(at), ctx)}`
}

function renderList(block, ctx) {
  const tag = block.ordered ? 'ol' : 'ul'
  const start = block.ordered && block.start !== 1 ? ` start="${block.start}"` : ''
  return `<${tag}${start}>${block.items.map((item) => `<li>${renderItem(item, ctx)}</li>`).join('')}</${tag}>`
}

// Lesson numbers in a table cell, as links: the Lesson Index's
// [[#Lesson 1 — …|1]] · [[#Lesson 2 — …|2]], or the Ending Sheet's "14, 66".
function lessonLinks(text, ctx) {
  const links = []
  for (const [all, target, alias, n] of text.matchAll(/\[\[#([^\]|]+)\|([^\]]+)\]\]|\b(\d+)\b/g)) {
    const id = target ? headingId(target, ctx) : ctx.lessons.has(Number(n)) && `lesson-${n}`
    links.push(id ? `<a class="chip" href="#${id}">${escapeHtml(alias ?? n)}</a>` : escapeHtml(alias ?? all))
  }
  return links.length ? `<span class="chips">${links.join('')}</span>` : inline(text, ctx)
}

function renderTable(block, ctx) {
  const headers = block.header.map(plainText)
  const english = headers.map(isEnglishColumn)
  // Cover hides what a row asks you to say: all its Kannada when the row
  // opens in English, otherwise only a column headed Kannada.
  const covered = headers.map((h, i) => !english[i] && (english[0] || h === 'Kannada'))
  const classes = [headers[0] === 'Lessons' && 'index', headers.length >= 4 && 'wide'].filter(Boolean)
  const cell = (text, i) => {
    if (headers[i] === 'Lesson' || headers[i] === 'Lessons') return `<td>${lessonLinks(text, ctx)}</td>`
    // A Kannada column's cell with backticks is English that marks its
    // own Kannada ("`-ri` on a plain command").
    if (english[i] || text.includes('`')) return `<td>${inline(text, ctx)}</td>`
    return `<td class="kn${covered[i] ? ' c' : ''}">${inline(text, ctx)}</td>`
  }
  const head = block.header.map((h) => `<th scope="col">${inline(h, ctx, { links: false })}</th>`).join('')
  const rows = block.rows.map((row) => `<tr>${headers.map((_, i) => cell(row[i] ?? '', i)).join('')}</tr>`).join('\n')
  return `<div class="table"><table${classes.length ? ` class="${classes.join(' ')}"` : ''}><thead><tr>${head}</tr></thead><tbody>\n${rows}\n</tbody></table></div>`
}

function renderCallout(block, ctx) {
  const title = block.title ? inline(block.title, ctx) : block.kind[0].toUpperCase() + block.kind.slice(1)
  const body = block.body.map((b) => renderBlock(b, ctx)).join('\n')
  if (!block.fold) return `<div class="callout"><p class="callout-title">${title}</p><div class="callout-body">${body}</div></div>`
  return `<details class="callout"${block.fold === '+' ? ' open' : ''}><summary>${title}</summary><div class="callout-body">${body}</div></details>`
}

function renderBlock(block, ctx) {
  switch (block.type) {
    case 'heading': return renderHeading(block, ctx)
    case 'paragraph': return renderParagraph(block, ctx)
    case 'table': return renderTable(block, ctx)
    case 'list': return renderList(block, ctx)
    case 'callout': return renderCallout(block, ctx)
    case 'quote': return `<blockquote>${block.body.map((b) => renderBlock(b, ctx)).join('\n')}</blockquote>`
    case 'rule': return '<hr />'
  }
}

// The lesson grid in the bar's Lessons sheet, one list per block of
// lessons (Beginner, Intermediate, Advanced).
function renderJump(parts) {
  return parts.filter((part) => part.lessons.length).map((part) => {
    const first = part.lessons[0].n
    const last = part.lessons.at(-1).n
    const items = part.lessons
      .map((l) => `<li><a href="#${l.id}" title="${escapeHtml(plainText(l.title))}">${l.n}</a></li>`)
      .join('')
    return `<section aria-labelledby="jump-${part.id}"><h2 id="jump-${part.id}">${escapeHtml(part.title)} <span>${first}–${last}</span></h2><ol>${items}</ol></section>`
  }).join('\n')
}

/* ---------- The note ----------
   Each top-level heading opens a <section class="part">, each lesson a
   <section class="lesson">, and each other second-level heading (the
   Ending Sheet's two halves) a <section class="sub">. */
export function renderNote(markdown, { warn = () => {} } = {}) {
  const text = markdown.replace(/\r\n?/g, '\n').replace(/^---\n[\s\S]*?\n---\n/, '')
  const blocks = parseBlocks(text.split('\n'))
  const { byText, parts } = assignIds(blocks)
  const ctx = {
    ids: byText,
    lessons: new Set(parts.flatMap((part) => part.lessons.map((l) => l.n))),
    lexicon: collectKannada(blocks),
    warn,
  }
  const html = []
  const open = []
  const close = (level) => {
    while (open.length && open.at(-1) >= level) {
      html.push('</section>')
      open.pop()
    }
  }
  for (const block of blocks) {
    if (block.type === 'heading' && block.level <= 2) {
      close(block.level)
      html.push(`<section class="${block.level === 1 ? 'part' : block.lesson ? 'lesson' : 'sub'}">`)
      open.push(block.level)
    }
    html.push(renderBlock(block, ctx))
  }
  close(0)
  return { html: html.join('\n'), jump: renderJump(parts) }
}
