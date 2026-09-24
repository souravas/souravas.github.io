/* ---------- Quote ----------
   Shows a random quote from the list in the page, then swaps in a
   different one every three minutes. Timers keep running in a
   background tab (throttled to once a minute at most, well inside the
   period), so a tab left open has moved on by the time you return. */
(() => {
  const ROTATE_MS = 3 * 60 * 1000;
  const list = document.getElementById("quotes");
  const quotes = list ? [...list.children] : [];
  if (quotes.length === 0) return;

  let current = Math.floor(Math.random() * quotes.length);
  quotes[current].classList.add("is-current");
  if (quotes.length < 2) return;

  setInterval(() => {
    // Any quote but the one on screen: draw from the other n - 1 and
    // step over the current index.
    let next = Math.floor(Math.random() * (quotes.length - 1));
    if (next >= current) next += 1;
    list.classList.add("is-rotating");
    quotes[current].classList.remove("is-current");
    quotes[next].classList.add("is-current");
    current = next;
  }, ROTATE_MS);
})();

/* ---------- Quick launch ----------
   Type anywhere (or press /) to focus the prompt. The links filter in
   place: matches stay lit with the typed text highlighted, the rest dim.
   A link matches on an alias (its data-alias: "lc" finds LeetCode), then
   on its name, where the start of a word ("Code" in NeetCode) beats the
   inside of one, then on its site's name ("ticktick" finds Tasks). An
   alias, a space and a query ("lc two sum") opens that link's
   data-search, a URL with %s where the query goes. Candidates are that
   search, then the matching bookmarks (best match first), then "open
   all" for a matching group, then "visit" when the query looks like an
   address, then a Google search. ↑/↓ cycle through them, the
   prompt shows what Enter will open, Esc clears. Links and Enter open
   in this tab, since /start is the browser's homepage; clicking a
   group's heading opens all of its links in new tabs. */
(() => {
  const input = document.getElementById("q");
  const hint = document.getElementById("hint");
  if (!input || !hint) return;
  // Touch screens have no keyboard to type "anywhere" with.
  if (matchMedia("(hover: none)").matches) input.placeholder = "search";

  // Where a word starts in a label: after a space or hyphen, or at a
  // capital inside a word ("NeetCode" has words at 0 and 4). Each match
  // is the character before the start, if any; lookahead rather than
  // lookbehind, which Safari only reads from 16.4 on.
  const WORD_START = /(?:^|[^\p{L}\p{N}])(?=[\p{L}\p{N}])|\p{Ll}(?=\p{Lu})/gu;

  const links = [...document.querySelectorAll(".links a")].map((a) => {
    const name = a.querySelector(".name");
    const label = name.textContent.trim();
    // The label left of the TLD: "docs.google.com" → "google".
    const site = a.hostname.split(".").at(-2) ?? "";
    const aliases = (a.dataset.alias ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    const starts = new Set([...label.matchAll(WORD_START)].map((m) => m.index + m[0].length));
    const { search } = a.dataset;
    // Named in the prompt by host: "youtube.com", "claude.ai".
    const searchHost = search ? new URL(search.replace("%s", "")).hostname.replace(/^www\./, "") : "";
    return { a, name, label, key: label.toLowerCase(), site, aliases, starts, search, searchHost };
  });

  // How well a link matches the lowercased query, and where its name
  // does (-1 if not). Rank 0 is an alias, 1 the start of a word in the
  // name, 2 the inside of a word, 3 the site's name; no match is Infinity.
  const match = (link, needle) => {
    const first = link.key.indexOf(needle);
    let at = first;
    while (at !== -1 && !link.starts.has(at)) at = link.key.indexOf(needle, at + 1);
    let rank = Infinity;
    if (link.aliases.includes(needle)) rank = 0;
    else if (at !== -1) rank = 1;
    else if (first !== -1) rank = 2;
    else if (link.site.includes(needle)) rank = 3;
    return { rank, at: at === -1 ? first : at };
  };
  const URLISH = /^(?<scheme>https?:\/\/)?(?<host>localhost|(?:\d{1,3}\.){3}\d{1,3}|(?:[\w-]+\.)+[a-z]{2,})(?<port>:\d+)?(?<path>\/\S*)?$/i;
  // "os.path" and "node.js" are URL-shaped too. Without a scheme, www.,
  // port or path, only a familiar TLD puts "visit" ahead of the search.
  const KNOWN_TLD = /\.(com|org|net|io|dev|app|ai|co|in|me|gg|xyz|edu|gov|info|tv|fm|to|ly|page|site|tech|cloud|uk|us|eu|de)$/i;
  let candidates = [];
  let selected = 0;

  const say = (mark, text) => {
    const kbd = document.createElement("kbd");
    kbd.textContent = mark;
    hint.replaceChildren(kbd, text);
  };

  // A click or keypress lets a page open one tab; browsers block the rest
  // as pop-ups until the site is allowed to open them. window.open only
  // reports a blocked tab (null) without noopener, so drop the opener by
  // hand instead.
  const openAll = (hrefs) => {
    let blocked = 0;
    for (const href of hrefs) {
      const tab = window.open(href, "_blank");
      if (tab) tab.opener = null;
      else blocked += 1;
    }
    if (blocked) say("!", "allow pop-ups to open all");
  };

  const groups = [...document.querySelectorAll(".group")].map((section) => {
    const heading = section.querySelector("h2");
    const title = heading.textContent.trim();
    const hrefs = [...section.querySelectorAll(".links a")].map((a) => a.href);
    const button = document.createElement("button");
    button.type = "button";
    button.title = `Open all ${hrefs.length} links`;
    button.append(...heading.childNodes);
    button.addEventListener("click", () => openAll(hrefs));
    heading.replaceChildren(button);
    return { section, title, key: title.toLowerCase(), hrefs };
  });

  const highlight = (link, at, len) => {
    if (at === -1) {
      link.name.textContent = link.label;
      return;
    }
    const mark = document.createElement("mark");
    mark.textContent = link.label.slice(at, at + len);
    link.name.replaceChildren(link.label.slice(0, at), mark, link.label.slice(at + len));
  };

  // A candidate that opens q itself, or null. Addresses on the local
  // network are rarely served over HTTPS, so those default to http.
  const visit = (q) => {
    const url = URLISH.exec(q)?.groups;
    if (!url) return null;
    const local = /^(localhost|[\d.]+)$/i.test(url.host);
    return {
      hrefs: [url.scheme ? q : `${local ? "http" : "https"}://${q}`],
      label: `visit ${q}`,
      sure: Boolean(url.scheme || url.port || url.path || local || /^www\./i.test(url.host) || KNOWN_TLD.test(url.host)),
    };
  };

  const paint = () => {
    const current = candidates[selected];
    for (const link of links) link.a.classList.toggle("is-selected", current?.link === link);
    for (const group of groups) group.section.classList.toggle("is-selected", current?.group === group);
    if (current) say("↵", current.label);
    else hint.replaceChildren();
  };

  const update = () => {
    const q = input.value.trim();
    const needle = q.toLowerCase();
    // "lc two sum": the alias of a link with a search, then the query.
    const [, word = "", query = ""] = /^(\S+)\s+(.+)$/.exec(q) ?? [];
    const owner = query && links.find((link) => link.search && link.aliases.includes(word.toLowerCase()));
    const hits = [];
    for (const link of links) {
      const { rank, at } = q ? match(link, needle) : { rank: Infinity, at: -1 };
      link.a.classList.toggle("is-dim", q !== "" && rank === Infinity && link !== owner);
      highlight(link, at, needle.length);
      if (rank !== Infinity) hits.push({ link, rank, at });
    }
    // Best rank first, then earliest in the name (Array#sort is stable,
    // so equally good matches keep page order).
    candidates = hits.sort((x, y) => x.rank - y.rank || x.at - y.at)
      .map(({ link }) => ({ link, hrefs: [link.a.href], label: `open ${link.label}` }));
    if (owner) {
      const href = owner.search.replace("%s", encodeURIComponent(query));
      candidates.unshift({ link: owner, hrefs: [href], label: `search ${owner.searchHost}` });
    }
    for (const group of groups) {
      if (q && group.key.includes(needle)) {
        candidates.push({ group, hrefs: group.hrefs, label: `open all ${group.hrefs.length} in ${group.title}` });
      }
    }
    const address = visit(q);
    if (address?.sure) candidates.push(address);
    if (q) {
      candidates.push({ hrefs: [`https://www.google.com/search?q=${encodeURIComponent(q)}`], label: "search Google" });
    }
    if (address && !address.sure) candidates.push(address);
    selected = 0;
    paint();
  };

  const reset = () => {
    input.value = "";
    update();
    input.blur();
  };

  document.addEventListener("keydown", (e) => {
    if (e.target === input || e.defaultPrevented || e.isComposing) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || e.key === " ") return;
    e.preventDefault();
    input.focus();
    if (e.key !== "/") input.value += e.key;
    update();
  });

  input.addEventListener("input", update);
  input.addEventListener("keydown", (e) => {
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && candidates.length) {
      e.preventDefault();
      selected = (selected + (e.key === "ArrowDown" ? 1 : -1) + candidates.length) % candidates.length;
      paint();
    } else if (e.key === "Enter" && !e.isComposing && candidates.length) {
      e.preventDefault();
      const { hrefs } = candidates[selected];
      // Reset first so a pop-up warning from openAll stays on screen, and
      // so Back returns to an empty prompt.
      reset();
      // One link replaces this page, as a browser's new tab page would;
      // Ctrl/⌘+Enter opens it in a new tab instead.
      if (hrefs.length === 1 && !e.ctrlKey && !e.metaKey) location.assign(hrefs[0]);
      else openAll(hrefs);
    } else if (e.key === "Escape") {
      if (input.value) {
        input.value = "";
        update();
      } else {
        input.blur();
      }
    }
  });

  // Opening a link with the mouse mid-search returns the page to rest.
  document.addEventListener("click", (e) => {
    if (input.value && e.target.closest(".links a")) reset();
  });

  // With the prompt empty, pointing at a link names its alias in the
  // hint, so the short codes can be learned from the page. Pointing
  // away clears only that, never a pop-up warning.
  let naming = false;
  document.addEventListener("pointerover", (e) => {
    if (input.value || e.pointerType !== "mouse") return;
    const link = links.find(({ a }) => a.contains(e.target));
    if (link?.aliases.length) {
      say(link.aliases.join(" "), link.search ? `+ query searches ${link.searchHost}` : `opens ${link.label}`);
      naming = true;
    } else if (naming) {
      hint.replaceChildren();
      naming = false;
    }
  });
})();

/* ---------- Offline ----------
   /start is the browser's homepage, so it has to open instantly, even
   before the network is up. /start-sw.js serves a cached copy and
   refreshes it in the background. Production only: in dev it would
   serve stale copies over HMR. */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/start-sw.js", { scope: "/start" }).catch(() => {});
}
