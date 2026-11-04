import { loadCards, preloadCards, shuffle } from "./cards.js";
import { deckMessage, openDeck } from "./deck.js";
import { dueCards, enter, markReviewed, onProgress, progress, schedule, setStep } from "./store.js";
import { canSpeak, initSpeech, onVoice, speak } from "./speech.js";
import { initToday } from "./today.js";

/* ---------- Where you are ----------
   The bar lights the part on screen, the Lessons button names the
   lesson on screen, and the Lessons sheet lights that lesson's number.
   "On screen" is the last heading above a line a third of the way
   down, worked out once a frame while the page scrolls. The today view
   shows one lesson, so it names that one (today.js keeps its number on
   the root element). */
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
  const root = document.documentElement;
  const update = () => {
    const today = root.classList.contains("is-today");
    const line = bar.offsetHeight + innerHeight / 3;
    const nextPart = today ? null : lastAbove(parts, line);
    const nextLesson = today
      ? document.getElementById(`lesson-${root.dataset.viewing}`)
      : lastAbove(lessons, line, (heading) => heading.parentElement);
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
  addEventListener("kannada:view", soon);
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

async function startQuiz(n) {
  const quiz = document.querySelector(`[data-quiz="${n}"]`);
  if (!quiz || quiz.getAttribute("aria-busy") === "true") return;
  quiz.setAttribute("aria-busy", "true");
  try {
    const cards = await loadCards();
    openDeck({
      title: `Lesson ${n} quiz`,
      items: lessonQuiz(cards, n, Number(quiz.dataset.size) || 8),
      pool: () => cards.near(n),
      // The answers set each card's place in the review; a quiz seen
      // through brings the rest of the lesson in behind them, and ticks
      // the day's plan.
      onDone(results, ended) {
        schedule(results);
        if (ended) {
          enter(cards.lesson(n).cards);
          setStep(n, "quiz", true);
        }
      },
      note: () => `Lesson ${n}'s cards join your review. Misses come back tomorrow.`,
    });
  } catch (error) {
    deckMessage(`Lesson ${n} quiz`, `${error.message} Check the connection and try again.`);
  } finally {
    quiz.removeAttribute("aria-busy");
  }
}

(() => {
  const ends = document.querySelectorAll(".lesson-end");
  if (!ends.length || !document.getElementById("deck")) return;
  for (const end of ends) end.hidden = false;
  preloadCards();
  document.addEventListener("click", (e) => {
    const quiz = e.target.closest("[data-quiz]");
    if (quiz) startQuiz(Number(quiz.dataset.quiz));
  });
})();

/* ---------- Drill ----------
   A Drill button under a table runs just that table: every card in it,
   shuffled, to say out loud (Lesson 1's pairs to pick), twenty-five at
   a time. It is practice, so it moves nothing in the review. For later
   tables have one too. */
const DRILL_SIZE = 25;

async function startDrill(key) {
  const n = Number.parseInt(key, 10);
  let cards;
  try {
    cards = await loadCards();
  } catch (error) {
    deckMessage(`Lesson ${n} drill`, `${error.message} Check the connection and try again.`);
    return;
  }
  const order = shuffle(cards.deck(key).slice());
  const run = (from) =>
    openDeck({
      title: `Lesson ${n} drill`,
      items: order.slice(from, from + DRILL_SIZE).map((card) => ({ card, mode: card.pair ? "pair" : "recall" })),
      pool: () => cards.near(n),
      more() {
        const left = order.length - from - DRILL_SIZE;
        return left > 0 ? { text: `Keep going, ${left} more`, start: () => run(from + DRILL_SIZE) } : null;
      },
    });
  run(0);
}

(() => {
  const rows = document.querySelectorAll(".drill-row");
  if (!rows.length || !document.getElementById("deck")) return;
  for (const row of rows) row.hidden = false;
  document.addEventListener("click", (e) => {
    const drill = e.target.closest("[data-drill]");
    if (drill) startDrill(drill.dataset.drill);
  });
})();

/* ---------- Checkpoints ----------
   Lessons 33, 69 and 89 are tests. Each exercise with answers has a
   Run as cards button above its answers: its lines to say (or, for
   Lesson 33's matching, to pick), and the results go into the review
   like a quiz's. */
async function startCheck(key) {
  const n = Number.parseInt(key, 10);
  let cards;
  try {
    cards = await loadCards();
  } catch (error) {
    deckMessage(`Lesson ${n} test`, `${error.message} Check the connection and try again.`);
    return;
  }
  const check = cards.check(key);
  if (!check?.cards.length) return;
  const title = check.title === "Test" ? `Lesson ${n} test` : `Lesson ${n}: ${check.title}`;
  openDeck({
    title,
    items: check.cards.map((card) => ({ card, mode: check.mode })),
    pool: (card) => (check.mode === "recognise" ? [...check.cards, ...cards.near(n)] : cards.near(card.lesson)),
    onDone(results, ended) {
      schedule(results);
      if (ended) setStep(n, "quiz", true);
    },
    note: () => "These join your review. Misses come back tomorrow.",
  });
}

(() => {
  const rows = document.querySelectorAll(".check-row");
  if (!rows.length || !document.getElementById("deck")) return;
  for (const row of rows) row.hidden = false;
  document.addEventListener("click", (e) => {
    const check = e.target.closest("[data-check]");
    if (check) startCheck(check.dataset.check);
  });
})();

/* ---------- Review ----------
   The cards due today, thirty at a time, from the Review button. A
   card in its first two boxes is asked to recognise, a later one to
   say: recognising comes first, saying is what lasts. */
const REVIEW_SIZE = 30;

async function startReview() {
  let cards;
  try {
    cards = await loadCards();
  } catch (error) {
    deckMessage("Review", `${error.message} Check the connection and try again.`);
    return;
  }
  const due = dueCards(cards.byId);
  if (!due.length) {
    deckMessage("Review", "Nothing is due today. A lesson's quiz adds its cards, and they start coming back tomorrow.");
    return;
  }
  openDeck({
    title: "Review",
    items: shuffle(due.slice(0, REVIEW_SIZE)).map(({ card, box }) => ({
      card,
      mode: card.pair ? "pair" : box <= 1 ? "recognise" : "recall",
    })),
    pool: (card) => cards.near(card.lesson),
    onDone(results, ended) {
      schedule(results);
      if (ended) markReviewed();
    },
    note: (results) =>
      results.some((r) => !r.correct)
        ? "Misses come back tomorrow. The rest wait longer each time you get them right."
        : "Each one waits longer now, up to two months, each time you get it right.",
    more() {
      const left = dueCards(cards.byId).length;
      return left ? { text: `Keep going, ${left} more`, start: startReview } : null;
    },
  });
}

(() => {
  const button = document.getElementById("review-button");
  if (!button || !document.getElementById("deck")) return;
  // The count needs the cards file, so a browser with nothing in review
  // never fetches it for this, and one with cards waits for the page
  // to settle first.
  const refresh = () => {
    if (!Object.keys(progress().cards).length) {
      button.hidden = true;
      return;
    }
    loadCards()
      .then((cards) => {
        const n = dueCards(cards.byId).length;
        button.hidden = n === 0;
        button.textContent = `Review ${n}`;
      })
      .catch(() => {});
  };
  button.addEventListener("click", startReview);
  onProgress(refresh);
  if ("requestIdleCallback" in window) requestIdleCallback(refresh, { timeout: 4000 });
  else setTimeout(refresh, 1500);
})();

/* ---------- Today ----------
   The plan's Review and Quiz run the same decks as the buttons, and a
   lesson marked done brings all its cards into the review. */
initToday({
  startQuiz,
  startReview,
  // Cards due today, or null with nothing in review (then no fetch).
  async dueCount() {
    if (!Object.keys(progress().cards).length) return null;
    const cards = await loadCards();
    return dueCards(cards.byId).length;
  },
  onDone(n) {
    loadCards()
      .then((cards) => enter(cards.lesson(n).cards))
      .catch(() => {});
  },
});

/* ---------- Hearing ----------
   With a Kannada voice on the device, a tap on any Kannada in the note
   (a table cell, a word in the text, Lesson 1's letters) says it, and
   the word lights while it does. In Cover, a tap that shows a cell says
   it, and the tap that hides it again says nothing. Start here says
   whether this device can. */
initSpeech();

document.addEventListener("click", (e) => {
  if (!canSpeak()) return;
  const target = e.target.closest(".page .kn, .page [lang='kn'], .masthead [lang='kn']");
  if (!target || e.target.closest("a, button, summary, input, label")) return;
  const cell = target.closest("td.c");
  if (cell && document.body.classList.contains("is-covering") && !cell.classList.contains("is-shown")) return;
  if (!speak(target.textContent)) return;
  target.classList.add("is-speaking");
  setTimeout(() => target.classList.remove("is-speaking"), 900);
});

(() => {
  const note = document.getElementById("voice-note");
  if (!note) return;
  onVoice((ok) => {
    note.textContent = ok
      ? "Tap any Kannada line to hear it in this device's Kannada voice, and a quiz says each answer as you show it. It is a machine's voice: right for the sounds, stiff for the tune."
      : "This browser has no Kannada voice, so the page cannot read lines out here. Android has one in Google's speech engine (the Kannada voice may need downloading in the text-to-speech settings), and so does Edge on Windows.";
  });
})();
