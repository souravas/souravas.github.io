import { renderMermaidSVG } from 'beautiful-mermaid'
import { escapeHtml, renderNotebook } from '../code/render.js'

// Render diagrams at build time. Embed them as images so they work offline,
// keep their styles isolated, and require no browser-side Mermaid runtime.
function renderDiagram(source, topic, plain) {
  const svg = renderMermaidSVG(source, {
    bg: '#0a0a0a',
    fg: '#d4d4d4',
    accent: '#b8b1ff',
    font: 'Arial',
  }).replace(/^\s*@import[^\n]+\n/m, '\n')
  const [, width, height] = /\bwidth="([\d.]+)" height="([\d.]+)"/.exec(svg)
  const data = Buffer.from(svg).toString('base64')
  const name = escapeHtml(topic)
  return `<figure class="diagram">
    <div class="diagram-hint" hidden>Scroll sideways to see the full diagram</div>
    <div class="diagram-view" role="group" tabindex="0" aria-label="Diagram for ${name}">
      <img src="data:image/svg+xml;base64,${data}" alt="${name} diagram" width="${Math.ceil(Number(width))}" height="${Math.ceil(Number(height))}" loading="lazy" />
    </div>
    <details class="diagram-source"><summary>Mermaid source</summary>${plain}</details>
  </figure>`
}

export function renderSystem(sources, { warn } = {}) {
  return renderNotebook(sources['note.md'], { file: 'systemdesign/note.md', warn, renderDiagram })
}
