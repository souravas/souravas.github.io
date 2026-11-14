import { initSearch } from "./search.js";

/* ---------- How long the page is ----------
   A section off screen is skipped (content-visibility: auto in style.css),
   and takes the height it is given until it has been laid out. render.js
   estimates each, in data-h, so the scrollbar is about right from the
   start. Code wraps on a phone, which makes it taller. */
(() => {
  const scale = innerWidth < 900 ? 1.3 : 1;
  for (const section of document.querySelectorAll(".sec[data-h]")) {
    section.style.containIntrinsicBlockSize = `auto ${Math.round(section.dataset.h * scale)}px`;
  }
})();

/* ---------- Where you are ----------
   The bar lights the document on screen, its button names the section on
   screen, and the sheet (the rail on the widest screens) lights that
   section. "On screen" is the last section above a line a third of the way
   down, worked out once a frame while the page scrolls. It measures the
   sections themselves and never what is inside them: asking where anything
   inside a skipped section sits makes the browser lay it out. */
(() => {
  const bar = document.querySelector(".bar");
  const strip = document.querySelector(".bar-links");
  const button = document.getElementById("jump-button");
  const jump = document.getElementById("jump");
  const label = document.getElementById("jump-label");
  if (!bar || !strip || !button || !jump || !label) return;

  const places = [...document.querySelectorAll(".doc, .sec")];
  const docLinks = new Map([...strip.querySelectorAll("a")].map((a) => [a.hash.slice(1), a]));
  const sheetLinks = new Map([...jump.querySelectorAll("a")].map((a) => [a.hash.slice(1), a]));
  const rail = matchMedia("(min-width: 1180px)");

  // Bring the lit section to the middle of the sheet or the rail, which
  // scroll by themselves. Never scrollIntoView, which may move the page.
  const centre = (link) => {
    if (link) jump.scrollTop = link.offsetTop - (jump.clientHeight - link.offsetHeight) / 2;
  };

  let place = null;
  let doc = null;
  const update = () => {
    const line = bar.offsetHeight + innerHeight / 3;
    let next = null;
    for (const candidate of places) {
      if (candidate.getBoundingClientRect().top > line) break;
      next = candidate;
    }
    const nextDoc = next?.closest(".doc") ?? null;
    if (nextDoc !== doc) {
      docLinks.get(doc?.dataset.id)?.removeAttribute("aria-current");
      doc = nextDoc;
      docLinks.get(doc?.dataset.id)?.setAttribute("aria-current", "true");
    }
    if (next !== place) {
      sheetLinks.get(place?.dataset.id)?.removeAttribute("aria-current");
      place = next;
      const link = sheetLinks.get(place?.dataset.id);
      link?.setAttribute("aria-current", "location");
      const name = link?.textContent ?? "Sections";
      button.textContent = name;
      button.setAttribute("aria-label", `Sections: ${name}`);
      label.textContent = name;
      if (rail.matches) centre(link);
    }
  };

  let queued = false;
  const soon = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };
  addEventListener("scroll", soon, { passive: true });
  addEventListener("resize", soon);
  update();

  // A browser without popovers has no such state to ask about.
  const hide = () => {
    if (typeof jump.hidePopover === "function" && jump.matches(":popover-open")) jump.hidePopover();
  };

  jump.addEventListener("toggle", (e) => {
    if (e.newState === "open") centre(sheetLinks.get(place?.dataset.id));
  });
  // Picking a section closes the sheet on the way to it, and a window that
  // grows wide enough for the rail has no use for the sheet.
  jump.addEventListener("click", (e) => {
    if (e.target.closest("a")) hide();
  });
  rail.addEventListener("change", hide);
})();

/* ---------- Cover ----------
   Reading a template is not knowing it. Cover hides the code and keeps
   the comments, which say what each line is for, so you can write it from
   them and then check. Nothing moves. A tap shows a line that has its own
   comment, and otherwise the whole snippet, the lines up to a blank line
   before something unindented; another tap hides it. Turning Cover off
   shows them all. Without JS the button stays hidden. */
(() => {
  const toggle = document.getElementById("cover");
  if (!toggle || !document.querySelector(".py")) return;
  toggle.hidden = false;

  const isBlank = (line) => !line.textContent.trim();
  const isTop = (line) => !line.querySelector(".w");

  const snippet = (line) => {
    const lines = [...line.parentElement.children];
    const at = lines.indexOf(line);
    let from = at;
    let to = at;
    while (from > 0 && !(isBlank(lines[from - 1]) && isTop(lines[from]))) from--;
    while (to < lines.length - 1 && !(isBlank(lines[to + 1]) && (to + 2 >= lines.length || isTop(lines[to + 2])))) to++;
    return lines.slice(from, to + 1);
  };

  toggle.addEventListener("click", () => {
    const on = toggle.getAttribute("aria-pressed") !== "true";
    toggle.setAttribute("aria-pressed", String(on));
    document.body.classList.toggle("is-covering", on);
    if (!on) for (const line of document.querySelectorAll(".l.is-shown")) line.classList.remove("is-shown");
  });

  document.addEventListener("click", (e) => {
    if (!document.body.classList.contains("is-covering") || e.target.closest("a, button")) return;
    const line = e.target.closest(".py .l");
    if (!line) return;
    const show = !line.classList.contains("is-shown");
    for (const each of line.querySelector(".t") ? [line] : snippet(line)) each.classList.toggle("is-shown", show);
  });
})();

/* ---------- Copy ----------
   Where a pointer can hover, a code block offers its text. A block's text
   is its source, line for line (see render.js). Phones go without. */
(() => {
  if (!matchMedia("(hover: hover)").matches || !navigator.clipboard) return;
  for (const block of document.querySelectorAll(".code")) {
    const button = document.createElement("button");
    button.className = "copy";
    button.type = "button";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy this code");
    let timer;
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(block.querySelector("code").textContent.replace(/\n$/, ""));
        button.textContent = "Copied";
      } catch {
        button.textContent = "Not copied";
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        button.textContent = "Copy";
      }, 1400);
    });
    block.append(button);
  }
})();

/* ---------- Search ----------
   A result goes to its line, in the middle of the screen, and lights it
   for a moment. Back returns to where you were. */
const FLASH_MS = 1600;

function jumpTo(el, anchor, isHeading) {
  history.pushState(null, "", `#${anchor}`);
  const place = () => el.scrollIntoView({ block: isHeading ? "start" : "center" });
  place();
  // Laying out the section can move it, so look again once that is done.
  requestAnimationFrame(() => requestAnimationFrame(place));
  el.classList.add("is-found");
  setTimeout(() => el.classList.remove("is-found"), FLASH_MS);
}

initSearch({ onJump: jumpTo });

/* ---------- Offline ----------
   The page is read on a phone, often where the network is poor. /sw.js
   keeps a copy, so it opens without one; with one, it is always the
   latest. Production only: in dev it would serve stale copies over
   HMR. */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { scope: "/code" }).catch(() => {});
}
