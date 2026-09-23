/* ---------- Quick launch ----------
   Type anywhere (or press /) to focus the prompt. The links filter in
   place: matches stay lit with the typed text highlighted, the rest dim.
   Candidates are the matching bookmarks (best match first), then "open
   all" for a matching group, then "visit" when the query looks like a
   URL, then a Google search. ↑/↓ cycle through them, the prompt shows
   what Enter will open, Esc clears. Clicking a group's heading opens
   all of its links. */
(() => {
  const input = document.getElementById("q");
  const hint = document.getElementById("hint");
  if (!input || !hint) return;

  const links = [...document.querySelectorAll(".links a")].map((a) => {
    const name = a.querySelector(".name");
    const label = name.textContent.trim();
    return { a, name, label, key: label.toLowerCase() };
  });
  const URLISH = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i;
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
    const matches = [];
    for (const link of links) {
      const at = q ? link.key.indexOf(needle) : -1;
      link.a.classList.toggle("is-dim", q !== "" && at === -1);
      highlight(link, at, needle.length);
      if (at !== -1) matches.push({ link, at });
    }
    // Array#sort is stable, so equally good matches keep page order.
    candidates = matches
      .sort((x, y) => x.at - y.at)
      .map(({ link }) => ({ link, hrefs: [link.a.href], label: `open ${link.label}` }));
    for (const group of groups) {
      if (q && group.key.includes(needle)) {
        candidates.push({ group, hrefs: group.hrefs, label: `open all ${group.hrefs.length} in ${group.title}` });
      }
    }
    if (URLISH.test(q)) {
      candidates.push({ hrefs: [/^https?:\/\//i.test(q) ? q : `https://${q}`], label: `visit ${q}` });
    }
    if (q) {
      candidates.push({ hrefs: [`https://www.google.com/search?q=${encodeURIComponent(q)}`], label: "search Google" });
    }
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
      // Reset first so a pop-up warning from openAll stays on screen.
      reset();
      openAll(hrefs);
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
})();
