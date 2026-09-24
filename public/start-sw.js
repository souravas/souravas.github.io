/* Service worker for /start, the browser homepage.
   Opens the page from cache, so it shows instantly and still works
   when the browser starts before the network is up, then refreshes the
   cache in the background: a deploy shows up on the next open.

   Registered with scope /start (no slash), so a homepage set to
   souravas.com/start is answered here too, skipping GitHub Pages'
   redirect to /start/. Only /start and /start/ are served from cache;
   every other page in scope (/start/v1/, /start/v2/) and anything the
   cache doesn't hold goes to the network as usual. */
const CACHE = "start";
const PAGE = "/start/";

// The script and fonts the page loads: every same-origin /assets/ or
// /fonts/ path in its HTML (fonts appear in the inlined CSS and the
// preload links).
const assetsOf = (html) => new Set(html.match(/\/(?:assets|fonts)\/[\w.-]+/g));

// Fetch the page and cache it with what it needs, then drop the assets
// neither it nor `keep` uses. The page goes in last, so the cache never
// holds a page without its assets.
async function refresh(cache, keep = new Set()) {
  const response = await fetch(PAGE, { cache: "no-cache" });
  if (!response.ok) throw new Error(`${PAGE}: ${response.status}`);
  const wanted = assetsOf(await response.clone().text());
  const held = (await cache.keys()).map((request) => new URL(request.url).pathname);
  await cache.addAll([...wanted].filter((path) => !held.includes(path)));
  await cache.put(PAGE, response);
  const unused = held.filter((path) => path !== PAGE && !wanted.has(path) && !keep.has(path));
  await Promise.all(unused.map((path) => cache.delete(path)));
}

async function openPage(event) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(PAGE);
  if (cached) {
    // The copy being served is about to ask for its own assets, so they
    // stay until the next open even if a deploy replaced them.
    const inUse = cached.clone().text().then(assetsOf);
    event.waitUntil(inUse.then((keep) => refresh(cache, keep)).catch(() => {}));
    return cached;
  }
  try {
    await refresh(cache);
    return await cache.match(PAGE);
  } catch {
    return fetch(event.request);
  }
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => refresh(cache)));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin) return;
  if (request.mode === "navigate") {
    if (url.pathname === "/start" || url.pathname === PAGE) event.respondWith(openPage(event));
    return;
  }
  // ignoreVary: the page's module script is requested with an Origin
  // header the cached copy was stored without, so a Vary: Origin
  // response would never match.
  event.respondWith(caches.match(request, { ignoreVary: true }).then((hit) => hit ?? fetch(request)));
});
