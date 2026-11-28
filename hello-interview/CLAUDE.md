# /hello-interview

- The Hello Interview key on /start (alias `hi`) opens this page. [main.js](main.js) replaces this tab with the saved link, or shows the editor if the browser has none or the page is opened at `#edit`.
- **Save and open** validates the pasted HTTP or HTTPS address, saves it in `localStorage`, and opens it in this tab. The key `start:hello-interview` also reads links saved through the original /start prompt. The address stays in each browser and clearing site data deletes it. URL parameters never supply a destination.
- The form shares [editor styles](../shared/site-editor.css) and [address validation](../shared/web-url.js) with [/downloads](../downloads/CLAUDE.md). It has no service worker.
