/* ---------- Quick launch ----------
   Start typing anywhere to open it. Matches bookmarks by name, offers
   to visit anything that looks like a URL, and falls back to a Google
   search. ↑/↓ move, Enter opens, Esc closes. */
(() => {
  const dialog = document.getElementById("search");
  const input = document.getElementById("searchInput");
  const list = document.getElementById("searchResults");
  if (!dialog || !input || !list) return;

  const bookmarks = [...document.querySelectorAll(".links a")].map((a) => ({
    name: a.textContent.trim(),
    href: a.href,
    icon: a.querySelector("use")?.getAttribute("href"),
  }));
  const URLISH = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i;
  const SVG_NS = "http://www.w3.org/2000/svg";
  let selected = 0;

  const option = ([name, href, iconId, kind], i) => {
    const a = document.createElement("a");
    a.className = "result";
    a.id = `result-${i}`;
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("role", "option");

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", iconId);
    svg.append(use);

    const label = document.createElement("span");
    label.className = "result-name";
    label.textContent = name;
    const tag = document.createElement("span");
    tag.className = "result-kind";
    tag.textContent = kind;

    a.append(svg, label, tag);
    return a;
  };

  const results = (q) => {
    const needle = q.toLowerCase();
    const out = bookmarks
      .map((b) => ({ ...b, at: b.name.toLowerCase().indexOf(needle) }))
      .filter((b) => b.at !== -1)
      .sort((a, b) => a.at - b.at)
      .map((b) => [b.name, b.href, b.icon, "Bookmark"]);
    if (URLISH.test(q)) {
      out.push([q, /^https?:\/\//i.test(q) ? q : `https://${q}`, "#mdi-open-in-new", "Visit URL"]);
    }
    out.push([q, `https://www.google.com/search?q=${encodeURIComponent(q)}`, "#mdi-magnify", "Search Google"]);
    return out;
  };

  const select = (i) => {
    const opts = [...list.children];
    if (!opts.length) return;
    selected = (i + opts.length) % opts.length;
    opts.forEach((el, j) => el.setAttribute("aria-selected", String(j === selected)));
    opts[selected].scrollIntoView({ block: "nearest" });
    input.setAttribute("aria-activedescendant", opts[selected].id);
  };

  const render = () => {
    const q = input.value.trim();
    list.replaceChildren(...(q ? results(q).map(option) : []));
    if (q) select(0);
    else input.removeAttribute("aria-activedescendant");
  };

  document.addEventListener("keydown", (e) => {
    if (dialog.open || e.defaultPrevented || e.isComposing) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || e.key === " ") return;
    e.preventDefault();
    dialog.showModal();
    input.value = e.key;
    render();
  });

  input.addEventListener("input", render);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      select(selected + (e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault();
      list.children[selected]?.click();
    }
  });

  list.addEventListener("mousemove", (e) => {
    const i = [...list.children].indexOf(e.target.closest(".result"));
    if (i !== -1 && i !== selected) select(i);
  });
  list.addEventListener("click", (e) => {
    if (e.target.closest(".result")) dialog.close();
  });
  // A click whose target is the <dialog> itself landed on the backdrop.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    input.value = "";
    render();
  });
})();
