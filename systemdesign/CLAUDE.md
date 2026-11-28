# /systemdesign

- Edit [note.md](note.md) to update *System Design Mastery*. The opening YAML frontmatter is for the Markdown source. Each `#` heading starts a module, each `##` heading starts a topic, and deeper headings stay nested under that topic.
- The `systemdesign-docs` plugin in vite.config.js runs [render.js](render.js) through the same [Markdown renderer as /code](../code/render.js). It renders the note, the module index and the Sections sheet into [index.html](index.html). The build checks links to headings, including Obsidian's `[[#Heading]]` links.
- Mermaid fences become embedded diagrams with their source available below. They render at build time and scroll sideways when wider than the reading column. `main.js` shows a scroll hint when a diagram overflows its viewport.
- [style.css](style.css) and [main.js](main.js) import the same reader as /code, with search, a section sheet on phones and a rail on wide screens. Production registers [/sw.js](../public/sw.js) with scope `/systemdesign` for offline reading.
