/* Service worker for the pages that should open without a network:
   /start, the browser homepage, /pomodoro, /kannada, /code and /systemdesign. Each
   page registers this file with its own scope, and each registration
   is a worker of its own that keeps one page, with the script and
   fonts it loads, in a cache named after it.

   /start opens from that cache, so it shows instantly and still works
   when the browser starts before the network is up, then refreshes
   the cache in the background: a deploy shows up on the next open.
   The others ask the network first, so they are always the latest,
   and open from the cache when it does not answer.

   A scope is registered without its slash (/start), so souravas.com/start
   is answered here too, skipping GitHub Pages' redirect to /start/.
   Only the page itself is answered that way; anything else in scope,
   and anything the cache doesn't hold, goes to the network as usual. */
const SCOPE = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const PAGE = `${SCOPE}/`;
const CACHE = SCOPE.slice(1);
const INSTANT = SCOPE === "/start";
// Retire registrations from before the move to /systemdesign.
const RETIRED = SCOPE === "/system";

// How long the others wait for the network before opening from cache.
const PATIENCE = 3000;

// What the page loads: every same-origin /assets/ or /fonts/ path in
// its HTML (fonts appear in the inlined CSS and the preload links), and
// a JSON file of its own (/kannada's cards). The path has to open an
// attribute or a url(), so a bookmark whose address merely contains
// /assets/ or /fonts/ is left alone; fetching that from this origin
// would 404 and fail every refresh.
const ASSET = new RegExp(`["'(](/(?:assets|fonts)/[\\w.-]+|${PAGE}[\\w.-]+\\.json)`, "g");
const assetsOf = (html) => new Set(Array.from(html.matchAll(ASSET), (m) => m[1]));

// Vite names /assets/ files by their content, as the build does the
// cards, so a cached copy is current forever. /fonts/ are shared with
// v1 under fixed names, so a new font would never replace the cached
// one unless we ask.
const hashed = (path) => !path.startsWith("/fonts/");

// Send the cached response's validator so the browser passes a 304 through.
// Without a validator, revalidate against the network.
function revalidationOptions(cached) {
  const headers = cached?.headers;
  const etag = headers?.get("etag");
  const modified = headers?.get("last-modified");
  return etag ? { headers: { "If-None-Match": etag } }
    : modified ? { headers: { "If-Modified-Since": modified } }
    : { cache: "no-cache" };
}

async function revalidate(cache, path) {
  const response = await fetch(path, revalidationOptions(await cache.match(path)));
  if (response.status === 304) return;
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  await cache.put(path, response);
}

async function fetchPage(cached) {
  const response = await fetch(PAGE, revalidationOptions(cached));
  if (response.ok || (cached && response.status === 304)) return response;
  throw new Error(`${PAGE}: ${response.status}`);
}

// Cache a fetched page with what it needs, then drop the assets neither
// it nor `keep` uses. The page goes in last, so the cache never holds a
// page without its assets.
async function store(cache, response, keep = new Set()) {
  const wanted = assetsOf(await response.clone().text());
  const held = (await cache.keys()).map((request) => new URL(request.url).pathname);
  const missing = [...wanted].filter((path) => !held.includes(path));
  const unhashed = [...wanted].filter((path) => held.includes(path) && !hashed(path));
  await Promise.all([cache.addAll(missing), ...unhashed.map((path) => revalidate(cache, path))]);
  await cache.put(PAGE, response);
  const unused = held.filter((path) => path !== PAGE && !wanted.has(path) && !keep.has(path));
  await Promise.all(unused.map((path) => cache.delete(path)));
}

const refresh = async (cache) => store(cache, await fetchPage());

// The assets of the copy in the cache: a page opened from it is about
// to ask for them, so they stay until the next open even if a deploy
// replaced them.
const inUse = async (cached) => (cached ? assetsOf(await cached.clone().text()) : new Set());

// Unchanged HTML points to the same assets. A font change gets a new path.
async function refreshInstant(cache, cached) {
  const fresh = await fetchPage(cached);
  if (fresh.status !== 304) await store(cache, fresh, await inUse(cached));
}

// /start: the cached copy at once, and a fresh one fetched behind it.
async function openInstant(event) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(PAGE);
  if (cached) {
    // The navigation consumes its copy while the refresh is in flight.
    event.waitUntil(refreshInstant(cache, cached.clone()).catch(() => {}));
    return cached;
  }
  try {
    await refresh(cache);
    return await cache.match(PAGE);
  } catch {
    return fetch(event.request);
  }
}

// The others: the network's copy, kept for next time, or the cached one
// when the network fails or takes too long (its copy is still kept when
// it comes).
async function openFresh(event) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(PAGE);
  const keep = await inUse(cached);
  const fresh = fetchPage();
  // Asked for now, while the event can still be made to wait, and first
  // in line for the response, so the copy is taken before the page
  // starts reading it.
  event.waitUntil(fresh.then((response) => store(cache, response.clone(), keep)).catch(() => {}));
  if (!cached) return fresh.catch(() => fetch(event.request));
  let timer;
  const late = new Promise((resolve) => {
    timer = setTimeout(() => resolve(cached), PATIENCE);
  });
  return Promise.race([fresh.catch(() => cached), late]).finally(() => clearTimeout(timer));
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  if (!RETIRED) event.waitUntil(caches.open(CACHE).then((cache) => refresh(cache)));
});

self.addEventListener("activate", (event) => {
  if (RETIRED) event.waitUntil(Promise.all([caches.delete(CACHE), self.registration.unregister()]));
});

self.addEventListener("fetch", (event) => {
  if (RETIRED) return;
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin) return;
  if (request.mode === "navigate") {
    if (url.pathname === SCOPE || url.pathname === PAGE) event.respondWith(INSTANT ? openInstant(event) : openFresh(event));
    return;
  }
  // ignoreVary: the page's module script is requested with an Origin
  // header the cached copy was stored without, so a Vary: Origin
  // response would never match.
  event.respondWith(caches.match(request, { ignoreVary: true }).then((hit) => hit ?? fetch(request)));
});

// A notification the page asked this worker to show (/pomodoro, on
// Android, where a page cannot show its own): a tap brings the page
// back, or opens it.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const open = clients.find((client) => new URL(client.url).pathname.startsWith(SCOPE));
      return open ? open.focus() : self.clients.openWindow(PAGE);
    }),
  );
});
