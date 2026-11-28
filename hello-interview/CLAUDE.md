# /hello-interview

- The Hello Interview key on /start (alias `hi`) opens this page. [main.js](main.js) replaces this tab with a saved web link. The editor opens when the browser has no saved link or the page is opened at `#edit`.
- **Save** accepts HTTP, HTTPS and file URLs. A saved file URL appears with an **Open file** link and a **Copy URL** button for browsers that require pasting it into the address bar.
- The `localStorage` key `start:hello-interview` also reads links saved through the original /start prompt. The address stays in each browser and clearing site data deletes it. URL parameters never supply a destination.
- The form shares [editor styles](../shared/site-editor.css) and [address validation](../shared/web-url.js) with [/downloads](../downloads/CLAUDE.md). It has no service worker.
