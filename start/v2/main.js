/* ---------- Quick launch ----------
   Type anywhere (or press /) to focus the prompt. The links filter in
   place: matches stay lit with the typed text highlighted, the rest dim.
   Candidates are the matching bookmarks (best match first), then "visit"
   when the query looks like a URL, then a Google search. ↑/↓ cycle
   through them, the prompt shows what Enter will open, Esc clears. */
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
    if (!current) {
      hint.replaceChildren();
      return;
    }
    const kbd = document.createElement("kbd");
    kbd.textContent = "↵";
    hint.replaceChildren(kbd, current.label);
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
      .map(({ link }) => ({ link, href: link.a.href, label: `open ${link.label}` }));
    if (URLISH.test(q)) {
      candidates.push({ href: /^https?:\/\//i.test(q) ? q : `https://${q}`, label: `visit ${q}` });
    }
    if (q) {
      candidates.push({ href: `https://www.google.com/search?q=${encodeURIComponent(q)}`, label: "search Google" });
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
      window.open(candidates[selected].href, "_blank", "noopener,noreferrer");
      reset();
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
