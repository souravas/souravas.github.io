/* ---------- Quick launch ----------
   Type or paste anywhere (or press /) to fill the prompt. The links
   filter in place: matches stay lit with the typed text highlighted,
   the rest dim. A link matches on an alias (its data-alias: "lc" finds
   LeetCode), then on its name, where the start of a word ("Ready" in
   Interview Ready) beats the name's initials ("dp" finds Design
   Patterns) or the starts of its words in order ("sys des" finds
   System Design), which beat the inside of a word, then on its addresses:
   its site's name ("zerodha" finds Kite), or the start of any other
   word in them ("docs" finds Cashflow, "kannada" finds Language). An
   alias, a space and a query ("lc two sum") opens that link's
   data-search, a URL with %s where the query goes. Candidates are that
   search, then the matching bookmarks (best match first), then Now
   when the query starts "now", then "open all" for a group whose name
   the query starts, then "visit" when the query looks like an
   address, then a Google search. ↑/↓ cycle through
   them, the prompt shows what Enter will open, Esc clears. Links and
   Enter open in this tab, since /start is the browser's homepage; a
   link with data-also opens its href and
   those URLs in new tabs, on a click or a middle click, and clicking a
   group's heading opens all of its links in new tabs. So does Now, the
   bolt at the prompt's end, for every link marked data-now, wherever
   it sits; pointing at it lights those links.
   Set https://souravas.com/start/?q=%s as a search engine and the
   address bar takes the same queries: the page opens what Enter would. */
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
    // The label left of the TLD: "docs.google.com" → "google". A link
    // that opens an app names it in its scheme: "obsidian://…". A page
    // on this site has none, or "sou" would find them all; its path
    // names it instead (words, below).
    const site = a.origin === location.origin ? ""
      : a.protocol.startsWith("http") ? a.hostname.split(".").at(-2) ?? ""
      : a.protocol.slice(0, -1);
    const aliases = (a.dataset.alias ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    const starts = [...label.matchAll(WORD_START)].map((m) => m.index + m[0].length);
    // The first letter of each word: "dp" for Design Patterns.
    const initials = starts.map((i) => label[i]).join("").toLowerCase();
    // Everything the link opens, in order: its href, then data-also.
    const hrefs = [a.href, ...(a.dataset.also ?? "").split(/\s+/).filter(Boolean)];
    // The other words in all of those addresses, which a query has to
    // start, so "view" doesn't find LLD: each host's labels but the TLD
    // ("docs" in docs.google.com, "koofr" from data-also), and for a
    // page on this site the first segment of its path ("kannada").
    // www, app and web name no site.
    const words = hrefs.flatMap((href) => {
      const url = new URL(href, location.href);
      if (!url.protocol.startsWith("http")) return [];
      if (url.origin === location.origin) return url.pathname.split("/").filter(Boolean).slice(0, 1);
      return url.hostname.split(".").slice(0, -1).filter((part) => !["www", "app", "web"].includes(part));
    });
    const { search } = a.dataset;
    // Named in the prompt by host: "youtube.com", "claude.ai".
    const searchHost = search ? new URL(search.replace("%s", "")).hostname.replace(/^www\./, "") : "";
    return { a, name, label, key: label.toLowerCase(), site, words, aliases, starts, initials, hrefs, search, searchHost };
  });

  // The [from, to) ranges of a link's name where each word of a query
  // of several starts a word, in order ("sys des" in System Design), or
  // null.
  const wordStarts = (link, words) => {
    const marks = [];
    let from = 0;
    for (const word of words) {
      const at = link.starts.find((i) => i >= from && link.key.startsWith(word, i));
      if (at === undefined) return null;
      marks.push([at, at + word.length]);
      from = at + word.length;
    }
    return marks;
  };

  // How well a link matches the lowercased query, and the [from, to)
  // ranges of its name to mark. Rank 0 is an alias, 1 the start of a word
  // in the name, 2 its initials or its words' starts, 3 the inside of a
  // word, 4 its addresses (the site's name, or the start of another word
  // in them); no match is Infinity.
  const match = (link, needle) => {
    const first = link.key.indexOf(needle);
    let at = first;
    while (at !== -1 && !link.starts.includes(at)) at = link.key.indexOf(needle, at + 1);
    const words = needle.split(/\s+/);
    const starts = words.length > 1 ? wordStarts(link, words) : null;
    let rank = Infinity;
    let marks = [];
    if (at !== -1) {
      rank = 1;
      marks = [[at, at + needle.length]];
    } else if (link.initials.startsWith(needle)) {
      rank = 2;
      marks = link.starts.slice(0, needle.length).map((i) => [i, i + 1]);
    } else if (starts) {
      rank = 2;
      marks = starts;
    } else if (first !== -1) {
      rank = 3;
      marks = [[first, first + needle.length]];
    } else if (link.site.includes(needle) || link.words.some((word) => word.startsWith(needle))) {
      rank = 4;
    }
    // An alias outranks the rest, but its name is still marked.
    if (link.aliases.includes(needle)) rank = 0;
    return { rank, marks };
  };
  const URLISH = /^(?<scheme>https?:\/\/)?(?<host>localhost|(?:\d{1,3}\.){3}\d{1,3}|(?:[\w-]+\.)+[a-z]{2,})(?<port>:\d+)?(?<path>[/?#]\S*)?$/i;
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
    const hrefs = links.filter(({ a }) => section.contains(a)).flatMap((link) => link.hrefs);
    const button = document.createElement("button");
    button.type = "button";
    button.title = `Open all ${hrefs.length} links`;
    button.append(...heading.childNodes);
    button.addEventListener("click", () => openAll(hrefs));
    heading.replaceChildren(button);
    return { section, title, key: title.toLowerCase(), hrefs };
  });

  // Now: the links marked data-now, in page order. Its bolt stays hidden
  // until a link is marked.
  const now = links.filter(({ a }) => a.hasAttribute("data-now"));
  const nowHrefs = now.flatMap((link) => link.hrefs);
  const nowButton = document.getElementById("now");
  const hasNow = Boolean(nowButton && now.length);
  if (hasNow) {
    nowButton.title = `Now: open all ${now.length} links`;
    nowButton.hidden = false;
  }
  const lightNow = (on) => {
    for (const link of links) {
      link.a.classList.toggle("is-now", on && now.includes(link));
      link.a.classList.toggle("is-dim", on && !now.includes(link));
    }
  };

  // Marks each [from, to) range of a link's name.
  const highlight = (link, marks) => {
    const parts = [];
    let end = 0;
    for (const [from, to] of marks) {
      const mark = document.createElement("mark");
      mark.textContent = link.label.slice(from, to);
      parts.push(link.label.slice(end, from), mark);
      end = to;
    }
    link.name.replaceChildren(...parts, link.label.slice(end));
  };

  // Whether q is a whole address with its scheme, whatever its host:
  // "http://nas:5000", "http://[::1]:3000/".
  const isAddress = (q) => {
    if (!/^https?:\/\/\S+$/i.test(q)) return false;
    try {
      new URL(q);
      return true;
    } catch {
      return false;
    }
  };

  // A candidate that opens q itself, or null. Addresses on the local
  // network are rarely served over HTTPS, so those default to http. A
  // query or fragment right after the host ("example.com?ref=x") counts
  // only with a familiar TLD, so "node.js?" stays a search.
  const visit = (q) => {
    if (isAddress(q)) return { hrefs: [q], label: `visit ${q}`, sure: true };
    const url = URLISH.exec(q)?.groups;
    if (!url) return null;
    const local = /^(localhost|[\d.]+)$/i.test(url.host);
    return {
      hrefs: [url.scheme ? q : `${local ? "http" : "https"}://${q}`],
      label: `visit ${q}`,
      sure: Boolean(url.scheme || url.port || url.path?.startsWith("/") || local || /^www\./i.test(url.host) || KNOWN_TLD.test(url.host)),
    };
  };

  const paint = () => {
    const current = candidates[selected];
    for (const link of links) link.a.classList.toggle("is-selected", current?.link === link);
    for (const group of groups) group.section.classList.toggle("is-selected", current?.group === group);
    for (const link of now) link.a.classList.toggle("is-now", current?.now === true);
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
      const { rank, marks } = q ? match(link, needle) : { rank: Infinity, marks: [] };
      link.a.classList.toggle("is-dim", q !== "" && rank === Infinity && link !== owner);
      highlight(link, marks);
      if (rank !== Infinity) hits.push({ link, rank, at: marks[0]?.[0] ?? -1 });
    }
    // Best rank first, then earliest in the name (Array#sort is stable,
    // so equally good matches keep page order).
    candidates = hits.sort((x, y) => x.rank - y.rank || x.at - y.at)
      .map(({ link }) => ({ link, hrefs: link.hrefs, label: `open ${link.label}` }));
    if (owner) {
      const href = owner.search.replace("%s", encodeURIComponent(query));
      candidates.unshift({ link: owner, hrefs: [href], label: `search ${owner.searchHost}` });
    }
    if (q && hasNow && "now".startsWith(needle)) {
      candidates.push({ now: true, hrefs: nowHrefs, label: `open all ${now.length} in Now` });
    }
    // A group's name is one word, so only its start counts: "de" offers
    // Design, not Code.
    for (const group of groups) {
      if (q && group.key.startsWith(needle)) {
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

  // Pasting anywhere fills the prompt too, as one line: a pasted address
  // or "lc two sum" is then an Enter away.
  document.addEventListener("paste", (e) => {
    if (e.target === input) return;
    const text = e.clipboardData?.getData("text").replace(/\s+/g, " ").trim();
    if (!text) return;
    e.preventDefault();
    input.focus();
    input.value += text;
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

  // Opening a link with the mouse, by a click or a middle click, returns
  // the page to rest mid-search. A link to several places opens them all
  // in new tabs; the browser alone would open only its href. The link is
  // found before reset() redraws the names, which detaches a <mark> that
  // was clicked, and reset() goes first so a pop-up warning from openAll
  // stays on screen.
  const openLink = (e) => {
    const a = e.target.closest(".links a");
    if (!a) return;
    if (input.value) reset();
    const { hrefs } = links.find((link) => link.a === a);
    if (hrefs.length > 1) {
      e.preventDefault();
      openAll(hrefs);
    }
  };
  document.addEventListener("click", openLink);
  document.addEventListener("auxclick", (e) => {
    if (e.button === 1) openLink(e);
  });

  // With the prompt empty, pointing at a link or tabbing to it names its
  // alias in the hint, so the short codes can be learned from the page.
  // Pointing at Now, or tabbing to it, lights the links it opens and
  // names them; a tap that focuses it doesn't, so a phone isn't left
  // with the page dimmed. Moving away clears only that, never a pop-up
  // warning.
  let naming = false;
  const nameAlias = (target, pointing = false) => {
    if (input.value) return;
    const link = links.find(({ a }) => a.contains(target));
    const onNow = hasNow && nowButton.contains(target) && (pointing || nowButton.matches(":focus-visible"));
    lightNow(onNow);
    if (onNow) {
      say("now", `opens ${now.map(({ label }) => label).join(", ")}`);
    } else if (link?.aliases.length) {
      say(link.aliases.join(" "), link.search ? `+ query searches ${link.searchHost}` : `opens ${link.label}`);
    } else if (naming) {
      hint.replaceChildren();
    }
    naming = onNow || Boolean(link?.aliases.length);
  };
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType === "mouse") nameAlias(e.target, true);
  });
  // The pointer leaving the window, as it does from the bolt up to the
  // tab strip, enters nothing here, so clear what it lit.
  document.addEventListener("pointerout", (e) => {
    if (e.pointerType === "mouse" && !e.relatedTarget) nameAlias(null, true);
  });
  document.addEventListener("focusin", (e) => nameAlias(e.target));
  // Clears the hint first, so a pop-up warning from openAll stays.
  nowButton?.addEventListener("click", () => {
    hint.replaceChildren();
    naming = false;
    openAll(nowHrefs);
  });
  // Focus leaving for nothing, as a click on the page leaves it.
  document.addEventListener("focusout", (e) => {
    if (!e.relatedTarget) nameAlias(null);
  });

  // The address bar: /start/?q=lc+two+sum opens what Enter would, in
  // place of this page, so Back skips it. Opening several tabs takes a
  // click or a key press, which loading a page isn't, so a candidate
  // that opens more than one waits in the prompt for Enter. The query
  // leaves the address either way, so a reload doesn't repeat it.
  const asked = new URLSearchParams(location.search).get("q")?.trim();
  if (asked) {
    history.replaceState(null, "", location.pathname + location.hash);
    input.value = asked;
    update();
    const { hrefs } = candidates[0];
    if (hrefs.length === 1) location.replace(hrefs[0]);
    else input.focus();
  }
})();

/* ---------- Offline ----------
   /start is the browser's homepage, so it has to open instantly, even
   before the network is up. /start-sw.js serves a cached copy and
   refreshes it in the background. Production only: in dev it would
   serve stale copies over HMR. */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/start-sw.js", { scope: "/start" }).catch(() => {});
}
