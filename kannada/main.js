import { loadCards, preloadCards, shuffle } from "./cards.js";
import { deckMessage, openDeck } from "./deck.js";

/* ---------- Where you are ----------
   The bar lights the part on screen, the Lessons button names the
   lesson on screen, and the Lessons sheet lights that lesson's number.
   "On screen" is the last heading above a line a third of the way
   down, worked out once a frame while the page scrolls. */
(() => {
  const bar = document.querySelector(".bar");
  const strip = document.querySelector(".bar-links");
  const button = document.getElementById("jump-button");
  const jump = document.getElementById("jump");
  const label = document.getElementById("jump-label");
  if (!bar || !strip || !button || !jump || !label) return;

  const parts = [...document.querySelectorAll(".part > h2[id]")];
  const lessons = [...document.querySelectorAll(".lesson > h3[id]")];
  const links = new Map([...strip.querySelectorAll("a")].map((a) => [a.hash.slice(1), a]));
  const chips = new Map([...jump.querySelectorAll("ol a")].map((a) => [a.hash.slice(1), a]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  // box(heading) is the element measured for it. A lesson is measured by
  // its section, which starts where its heading does: a lesson off screen
  // is skipped (content-visibility: auto in style.css), and asking where
  // anything inside it sits makes the browser lay it out, which after a
  // jump or a rotation would be every lesson above the screen.
  const lastAbove = (headings, line, box = (heading) => heading) => {
    let found = null;
    for (const heading of headings) {
      if (box(heading).getBoundingClientRect().top > line) break;
      found = heading;
    }
    return found;
  };

  // "Lesson 23 · Habitual and Future for Every Pronoun" for a number in
  // the sheet.
  const describe = (chip) => (chip ? `Lesson ${chip.textContent} · ${chip.title}` : "Lessons");

  let part = null;
  let lesson = null;
  const update = () => {
    const line = bar.offsetHeight + innerHeight / 3;
    const nextPart = lastAbove(parts, line);
    const nextLesson = lastAbove(lessons, line, (heading) => heading.parentElement);
    if (nextPart !== part) {
      links.get(part?.id)?.removeAttribute("aria-current");
      part = nextPart;
      const link = links.get(part?.id);
      if (link) {
        link.setAttribute("aria-current", "true");
        // On a phone the links scroll sideways: bring this one to the middle.
        const left = link.offsetLeft - (strip.clientWidth - link.offsetWidth) / 2;
        strip.scrollTo({ left, behavior: reduce.matches ? "auto" : "smooth" });
      }
    }
    if (nextLesson !== lesson) {
      chips.get(lesson?.id)?.removeAttribute("aria-current");
      lesson = nextLesson;
      chips.get(lesson?.id)?.setAttribute("aria-current", "location");
      button.textContent = lesson ? lesson.querySelector(".num").textContent : "Lessons";
    }
  };

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  update();

  /* ---------- Lessons sheet ----------
     Its top line names the lesson under the pointer or keyboard focus,
     or else the lesson on screen. Picking a number closes the sheet on
     the way to the lesson. */
  const rest = () => {
    label.textContent = describe(chips.get(lesson?.id));
  };
  jump.addEventListener("toggle", (e) => {
    if (e.newState === "open") rest();
  });
  jump.addEventListener("pointerover", (e) => {
    const chip = e.target.closest("ol a");
    if (chip) label.textContent = describe(chip);
  });
  jump.addEventListener("pointerleave", rest);
  jump.addEventListener("focusin", (e) => {
    const chip = e.target.closest("ol a");
    if (chip) label.textContent = describe(chip);
  });
  jump.addEventListener("click", (e) => {
    if (e.target.closest("ol a") && typeof jump.hidePopover === "function") jump.hidePopover();
  });
})();

/* ---------- Cover ----------
   The note's routine says to read a lesson out loud, then cover the
   Kannada and say each line from the English. Cover hides the Kannada
   in the tables (the cells render.js marks .c) without moving anything;
   a tap shows a cell, another hides it, and turning Cover off shows
   them all. Without JS the button stays hidden. */
(() => {
  const toggle = document.getElementById("cover");
  if (!toggle || !document.querySelector("td.c")) return;
  toggle.hidden = false;

  toggle.addEventListener("click", () => {
    const on = toggle.getAttribute("aria-pressed") !== "true";
    toggle.setAttribute("aria-pressed", String(on));
    document.body.classList.toggle("is-covering", on);
    if (!on) for (const cell of document.querySelectorAll("td.is-shown")) cell.classList.remove("is-shown");
  });

  document.addEventListener("click", (e) => {
    if (!document.body.classList.contains("is-covering") || e.target.closest("a")) return;
    e.target.closest("td.c")?.classList.toggle("is-shown");
  });
})();

/* ---------- Quiz ----------
   Each lesson with cards ends on a Quiz button (render.js writes it,
   hidden until this shows it). A quiz is up to eight of the lesson's
   cards: its Say it today lines always, the rest at random. Lesson 1's
   sound pairs go first, then half the lines to recognise and half to
   say, the Say it today lines among the ones to say. */
function lessonQuiz(cards, n, size) {
  const { cards: all, say } = cards.lesson(n);
  const picked = new Set(say.slice(0, 2));
  for (const card of shuffle(all.slice())) {
    if (picked.size >= size) break;
    picked.add(card);
  }
  const chosen = [...picked];
  const sayCards = chosen.filter((c) => say.includes(c));
  const lines = shuffle(chosen.filter((c) => !c.pair && !say.includes(c)));
  const half = Math.ceil((lines.length + sayCards.length) / 2);
  return [
    ...chosen.filter((c) => c.pair).map((card) => ({ card, mode: "pair" })),
    ...lines.slice(0, half).map((card) => ({ card, mode: "recognise" })),
    ...shuffle([...lines.slice(half), ...sayCards]).map((card) => ({ card, mode: "recall" })),
  ];
}

(() => {
  const ends = document.querySelectorAll(".lesson-end");
  if (!ends.length || !document.getElementById("deck")) return;
  for (const end of ends) end.hidden = false;
  preloadCards();

  document.addEventListener("click", async (e) => {
    const quiz = e.target.closest("[data-quiz]");
    if (!quiz || quiz.getAttribute("aria-busy") === "true") return;
    const n = Number(quiz.dataset.quiz);
    quiz.setAttribute("aria-busy", "true");
    try {
      const cards = await loadCards();
      openDeck({
        title: `Lesson ${n} quiz`,
        items: lessonQuiz(cards, n, Number(quiz.dataset.size) || 8),
        pool: () => cards.near(n),
      });
    } catch (error) {
      deckMessage(`Lesson ${n} quiz`, `${error.message} Check the connection and try again.`);
    } finally {
      quiz.removeAttribute("aria-busy");
    }
  });
})();
