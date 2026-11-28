# /hello-interview

- The Hello Interview key on /start (alias `hi`) opens this page. [main.js](main.js) replaces this tab with a saved web link. The editor opens when the browser has no saved link or the page is opened at `#edit`.
- **Save** accepts HTTP, HTTPS and file URLs. A `file:` URL records the path, and **Choose local file** grants the browser access to the file. [saved-file.js](saved-file.js) keeps one copy in IndexedDB and the shortcut reopens it. Choose the file again to refresh the saved copy.
- HTML and other active documents open inside a sandboxed frame using [the local viewer](../public/hello-interview-file-viewer.html). The viewer accepts the file from the parent page and has a restrictive CSP for its inline scripts and assets. Local HTML should be self-contained. PDF, plain text and raster images use the browser's native viewer.
- The `localStorage` key `start:hello-interview` also reads links saved through the original /start prompt and records when the shortcut points to the file copy. The address and file stay in each browser. Clearing site data deletes both. URL parameters never supply a destination.
- The form shares [editor styles](../shared/site-editor.css) and [address validation](../shared/web-url.js) with [/downloads](../downloads/CLAUDE.md). It has no service worker.
