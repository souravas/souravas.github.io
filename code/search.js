/* ---------- Search ----------
   The page is its own index: everything searchable is already in the DOM,
   so the first search reads it and nothing else is downloaded. A query is
   words that must all appear, in a line or in the headings above it, with
   at least one in the line. Underscores and hyphens count as spaces, so
   "two sum" finds two_sum. Results come back headings first, then the names
   of things (a def, a class, the comment that titles a snippet), then code,
   then prose; within those, a whole match before a match at the start,
   before the words together at a word's start, before the words apart, in
   page order, with a line that explains itself in a comment ahead of a line
   that only uses the same call. A heading also matches on its initials, so
   "lis" finds Longest Increasing Subsequence. */

const LIMIT = 60;
const MINOR = new Set(["a", "an", "and", "the", "of", "on", "in", "to", "for", "with", "from", "across", "by"]);
const KIND = { heading: 4, name: 3, code: 2, prose: 1 };

const normalize = (s) => s.toLowerCase().replace(/[_-]/g, " ");

const initialsOf = (title) =>
  normalize(title.split(" — ")[0])
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word && !MINOR.has(word))
    .map((word) => word[0])
    .join("");

// The name a code line gives something: a def, a class, or the comment
// that titles the snippet under it, which follows a blank line.
function nameIn(line, text) {
  const def = /^(?:def|class)\s+(\w+)/.exec(text);
  if (def) return def[1];
  const before = line.previousElementSibling;
  if (text.startsWith("#") && (!before || !before.textContent.trim())) return text.replace(/^#\s*/, "").split(" — ")[0];
  return null;
}

function buildIndex(root) {
  const entries = [];
  let doc = "";
  let sec = "";
  let sub = "";
  let anchor = "";
  const add = (el, kind, text, name = null) => {
    const path = [doc, sec, sub].filter(Boolean);
    entries.push({ el, kind, text, name, anchor, path, norm: normalize(text), normName: name && normalize(name), normPath: normalize(path.join(" ")) });
  };
  for (const el of root.querySelectorAll("h2[id], h3[id], h4[id], p, li, tbody tr, .l, .plain code")) {
    if (el.closest(".contents, .sub-toc")) continue;
    if (el.matches("h2, h3, h4")) {
      const title = el.textContent.trim();
      anchor = el.id;
      if (el.matches("h2")) {
        [doc, sec, sub] = ["", "", ""];
        add(el, "heading", title);
        doc = el.closest(".doc").dataset.name;
      } else if (el.matches("h3")) {
        [sec, sub] = ["", ""];
        add(el, "heading", title);
        sec = title;
      } else {
        sub = "";
        add(el, "heading", title);
        sub = title.split(" — ")[0];
      }
      entries.at(-1).initials = initialsOf(title);
    } else if (el.matches(".l")) {
      const text = el.textContent.trim();
      if (!text) continue;
      const name = nameIn(el, text);
      add(el, name ? "name" : "code", text, name);
      entries.at(-1).explained = Boolean(el.querySelector(".t"));
    } else if (el.matches(".plain code")) {
      for (const line of el.textContent.split("\n")) if (line.trim()) add(el, "code", line.trim());
    } else if (el.matches("tr")) {
      add(el, "prose", [...el.cells].map((cell) => cell.textContent.trim()).join(" · "));
    } else {
      add(el, "prose", el.textContent.trim().replace(/\s+/g, " "));
    }
  }
  return entries;
}

const startsWord = (text, word) => {
  let at = text.indexOf(word);
  while (at !== -1) {
    if (at === 0 || !/[\p{L}\p{N}]/u.test(text[at - 1])) return true;
    at = text.indexOf(word, at + 1);
  }
  return false;
};

// How good a match, or 0 for none. Higher kinds always outrank lower ones.
function score(entry, query, words) {
  const inLine = words.filter((word) => entry.norm.includes(word));
  if (!inLine.length || !words.every((word) => entry.norm.includes(word) || entry.normPath.includes(word))) {
    if (entry.kind === "heading" && words.length === 1 && words[0].length > 1 && entry.initials === words[0]) return KIND.heading * 10 + 4;
    return 0;
  }
  const named = entry.normName ?? entry.norm;
  let quality = 0;
  if (named === query || entry.norm === query) quality = 5;
  else if (named.startsWith(query) || entry.norm.startsWith(query)) quality = 4;
  else if (startsWord(entry.norm, query)) quality = 3;
  else if (inLine.every((word) => startsWord(entry.norm, word))) quality = 2;
  else if (entry.norm.includes(query)) quality = 1;
  return KIND[entry.kind] * 10 + quality + (entry.explained ? 0.5 : 0);
}

// Long prose shows the stretch around the first match.
const AROUND = 56;
function excerpt(text, words) {
  const shown = text.replace(/\s{2,}/g, "  ");
  if (shown.length <= AROUND * 2 + 20) return shown;
  const norm = normalize(shown);
  const at = Math.min(...words.map((word) => norm.indexOf(word)).filter((i) => i !== -1), shown.length);
  const from = at <= AROUND ? 0 : shown.lastIndexOf(" ", at - AROUND) + 1;
  const to = shown.indexOf(" ", at + AROUND);
  return `${from ? "…" : ""}${shown.slice(from, to === -1 ? undefined : to)}${to === -1 ? "" : "…"}`;
}

// Text with its matches marked, as DOM nodes.
function marked(text, words) {
  const norm = normalize(text);
  const hits = [];
  for (const word of words) {
    let at = norm.indexOf(word);
    while (at !== -1) {
      hits.push([at, at + word.length]);
      at = norm.indexOf(word, at + word.length);
    }
  }
  hits.sort((a, b) => a[0] - b[0]);
  const out = document.createDocumentFragment();
  let last = 0;
  for (const [from, to] of hits) {
    if (to <= last) continue;
    const start = Math.max(from, last);
    out.append(text.slice(last, start));
    const mark = document.createElement("mark");
    mark.textContent = text.slice(start, to);
    out.append(mark);
    last = to;
  }
  out.append(text.slice(last));
  return out;
}

export function initSearch({ onJump }) {
  const dialog = document.getElementById("find");
  const input = document.getElementById("find-input");
  const list = document.getElementById("find-results");
  const status = document.getElementById("find-status");
  const open = document.getElementById("search-button");
  const close = document.getElementById("find-close");
  const root = document.getElementById("content");
  if (!dialog || !input || !list || !status || !open || !close || !root || typeof dialog.showModal !== "function") return;
  open.hidden = false;

  const HINT = "Headings, code and text. Try lis, bisect_left or word ladder.";
  status.textContent = HINT;

  let index = null;
  let results = [];
  let active = 0;

  const paintActive = () => {
    [...list.children].forEach((li, i) => {
      const hit = li.firstElementChild;
      if (i === active) {
        hit.setAttribute("aria-current", "true");
        hit.scrollIntoView({ block: "nearest" });
      } else {
        hit.removeAttribute("aria-current");
      }
    });
  };

  const update = () => {
    index ??= buildIndex(root);
    const query = normalize(input.value).replace(/\s+/g, " ").trim();
    list.replaceChildren();
    results = [];
    active = 0;
    if (!query) {
      status.textContent = HINT;
      return;
    }
    const words = query.split(" ");
    const scored = [];
    for (const entry of index) {
      const s = score(entry, query, words);
      if (s) scored.push([s, entry]);
    }
    // Array.prototype.sort is stable, so equal scores stay in page order.
    scored.sort((a, b) => b[0] - a[0]);
    results = scored.slice(0, LIMIT).map(([, entry]) => entry);
    const total = scored.length;
    status.textContent = !total ? `Nothing for "${input.value.trim()}"` : total > LIMIT ? `First ${LIMIT} of ${total}` : `${total} ${total === 1 ? "result" : "results"}`;
    for (const entry of results) {
      const li = document.createElement("li");
      const hit = document.createElement("a");
      hit.className = `hit hit-${entry.kind}`;
      hit.href = `#${entry.anchor}`;
      const text = document.createElement("span");
      text.className = "hit-text";
      text.append(marked(excerpt(entry.text, words), words));
      hit.append(text);
      if (entry.path.length) {
        const path = document.createElement("span");
        path.className = "hit-path";
        path.textContent = entry.path.join(" · ");
        hit.append(path);
      }
      li.append(hit);
      list.append(li);
    }
    paintActive();
  };

  const go = (entry) => {
    dialog.close();
    onJump(entry.el, entry.anchor, entry.kind === "heading");
  };

  const show = () => {
    if (!dialog.open) dialog.showModal();
    input.focus();
    input.select();
  };

  open.addEventListener("click", show);
  close.addEventListener("click", () => dialog.close());
  input.addEventListener("input", update);

  // A click outside the panel, on wider screens, closes it.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  input.addEventListener("keydown", (e) => {
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && results.length) {
      e.preventDefault();
      active = (active + (e.key === "ArrowDown" ? 1 : -1) + results.length) % results.length;
      paintActive();
    } else if (e.key === "Enter" && !e.isComposing && results.length) {
      e.preventDefault();
      go(results[active]);
    }
  });

  list.addEventListener("click", (e) => {
    const hit = e.target.closest(".hit");
    if (!hit || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    go(results[[...list.children].indexOf(hit.parentElement)]);
  });

  // Typing anywhere starts a search, as on /start: "/" opens it empty and
  // any other key begins the query. Enter and space keep their usual jobs.
  document.addEventListener("keydown", (e) => {
    if (dialog.open || e.defaultPrevented || e.isComposing) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || e.key === " ") return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
    e.preventDefault();
    if (!dialog.open) dialog.showModal();
    input.value = e.key === "/" ? "" : e.key;
    input.focus();
    update();
  });
}
