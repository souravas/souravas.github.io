/* ---------- Today ----------
   The page opens on one lesson, the one you are on, under the day's
   plan: the note's daily routine as a checklist (review, read it out
   loud, quiz, listen, say one line). Done, at the lesson's end, moves
   you on, and the next lesson waits for tomorrow unless you go ahead:
   one a day leaves the review the days it needs. A lesson number
   anywhere (a link in the text, the Lessons sheet) shows that lesson
   alone; any other heading opens the whole note, the page as it always
   was, until Today in the bar. Without JS the page is the whole note. */

import {
  aheadToday,
  currentLesson,
  doneLessons,
  goAhead,
  LAST_LESSON,
  lastView,
  markDone,
  markStarted,
  onProgress,
  reviewedToday,
  setStep,
  setView,
  steps,
  started,
  streak,
  today,
} from "./store.js";

const panel = document.getElementById("today");
const start = document.getElementById("start-here");
const strip = document.querySelector(".bar-links");

const root = document.documentElement;

let mode = "note";
let viewing = 1;
// A lesson opened by its number shows even when it is the day's lesson
// and done: Read it again.
let reading = false;
// Start here, opened again from the bar.
let starting = false;
let hooks = {};

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const heading = (n) => document.getElementById(`lesson-${n}`);
const section = (n) => heading(n)?.closest(".lesson");

// "Yes, No, Please and Sorry", from the lesson's heading.
const title = (n) => heading(n)?.textContent.replace(/^Lesson \d+\s*—\s*/, "").trim() ?? "";

// The lesson the day is about: the one you are on, or the one you
// finished today, until you choose to go ahead.
function dayLesson() {
  const n = currentLesson();
  if (n > 1 && doneLessons()[n - 1] === today() && !aheadToday()) return n - 1;
  return n;
}

const finishedToday = (n) => doneLessons()[n] === today();

const date = (day) =>
  new Date(day * 86400000).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });

/* ---------- The plan ---------- */

function step(lesson, key, name, note, { checked, action } = {}) {
  const li = el("li", "step");
  const box = el("input");
  box.type = "checkbox";
  box.id = `step-${key}`;
  box.checked = Boolean(checked ?? steps(lesson)[key]);
  box.addEventListener("change", () => setStep(lesson, key, box.checked));
  const label = el("label", "step-name", name);
  label.htmlFor = box.id;
  li.classList.toggle("is-ticked", box.checked);
  li.append(box, label);
  if (note) li.append(note);
  if (action) li.append(action);
  return li;
}

const noteOf = (...parts) => {
  const p = el("p", "step-note");
  p.append(...parts);
  return p;
};

const actionButton = (text, onClick, quiet = true) => {
  const b = el("button", quiet ? "action quiet" : "action", text);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
};

const lessonLink = (n, text = `Lesson ${n}`) => {
  const a = el("a", null, text);
  a.href = `#lesson-${n}`;
  return a;
};

// The lesson's Say it today line, from its callout, or none.
function sayLine(n) {
  const row = section(n)?.querySelector(".callout-say tbody tr");
  if (!row) return null;
  const cells = [...row.cells];
  const kn = cells.find((c) => c.classList.contains("kn"));
  const en = cells.find((c) => !c.classList.contains("kn"));
  return kn ? { kn: kn.textContent.trim(), en: en?.textContent.trim() ?? "" } : null;
}

function plan(n) {
  const list = el("ol", "plan");
  const reviewNote = noteOf("Counting the cards due…");
  const reviewButton = actionButton("Review", () => hooks.startReview?.());
  reviewButton.hidden = true;
  const review = step(n, "review", "Review", reviewNote, { checked: reviewedToday() || steps(n).review, action: reviewButton });
  list.append(review);
  // The count needs the cards file; nothing in review needs no count.
  hooks.dueCount?.().catch(() => undefined).then((due) => {
    if (due === undefined) {
      reviewNote.textContent = "The cards did not load. The Review button tries again.";
      return;
    }
    if (due === null) {
      reviewNote.textContent = "Nothing in review yet. A quiz adds its lesson's cards.";
    } else if (due === 0) {
      reviewNote.textContent = reviewedToday() ? "Done for today." : "Nothing due today.";
    } else {
      reviewNote.textContent = `${due} ${due === 1 ? "card" : "cards"} due, oldest first.`;
      reviewButton.hidden = false;
    }
    if (due === null || due === 0) {
      const box = review.querySelector("input");
      box.checked = true;
      review.classList.add("is-ticked");
    }
  });

  list.append(
    step(n, "read", "Read it out loud", noteOf("Every Kannada line said, never read in your head. Then Cover the Kannada and say each line from the English.")),
  );

  const quizButton = section(n)?.querySelector("[data-quiz]");
  list.append(
    step(n, "quiz", "Quiz", noteOf(quizButton ? `${quizButton.dataset.size} cards from this lesson.` : "This lesson has no cards to quiz."), {
      checked: quizButton ? undefined : true,
      action: quizButton ? actionButton("Quiz", () => hooks.startQuiz?.(n)) : undefined,
    }),
  );

  list.append(step(n, "listen", "Listen", noteOf("Five minutes of real Kannada, the same clip all week. ", lessonLink(88), " says where.")));

  const line = sayLine(n);
  const sayNote = line
    ? noteOf(el("span", "kn", line.kn), line.en ? ` (${line.en.replace(/[.!]$/, "")})` : "")
    : noteOf("One line from the last few lessons, to a real person.");
  list.append(step(n, "say", "Say it to someone", sayNote));
  return list;
}

/* ---------- The panel ---------- */

function render() {
  if (!panel) return;
  // A re-render after a tick keeps the focus on that tick.
  const focused = panel.contains(document.activeElement) ? document.activeElement.id : "";
  const day = dayLesson();
  const done = doneLessons();
  const nodes = [];
  const kicker = el("p", "today-kicker");
  const days = streak();
  const runText = days > 1 ? ` · ${days} days in a row` : "";

  if (viewing !== day && viewing <= LAST_LESSON) {
    // Another lesson, from a link or the sheet: a way back, and no plan.
    kicker.textContent = `Lesson ${viewing}${done[viewing] ? ` · done ${date(done[viewing])}` : ""}`;
    const back = el("p", "today-note");
    back.append(day > LAST_LESSON ? "Every lesson is done. " : `You are on Lesson ${day}. `);
    const a = el("a", null, day > LAST_LESSON ? "Back to today" : "Back to it");
    a.href = "#today";
    back.append(a);
    nodes.push(kicker, back);
  } else if (day > LAST_LESSON) {
    kicker.textContent = `Today${runText}`;
    nodes.push(kicker, el("h2", "today-title", "All 89 lessons done"));
    const note = el("p", "today-note", "The review keeps going: what you know comes back before you lose it. ");
    note.append(lessonLink(88), " has the listening, which is the rest of it.");
    nodes.push(note);
  } else {
    kicker.textContent = `Today · Lesson ${day} of ${LAST_LESSON}${runText}`;
    nodes.push(kicker, el("h2", "today-title", title(day)));
    if (finishedToday(day)) {
      const next = day + 1;
      const note = el("p", "today-note");
      if (next <= LAST_LESSON) {
        note.append(`Done for today. Lesson ${next}, ${title(next)}, is tomorrow's: one a day leaves the review the days it needs.`);
      } else {
        note.append("Done, and that was the last lesson.");
      }
      nodes.push(note, plan(day));
      const row = el("div", "today-actions");
      if (next <= LAST_LESSON) {
        row.append(
          actionButton(`Start Lesson ${next} now`, () => {
            goAhead();
            show(next);
          }),
        );
      }
      const again = lessonLink(day, `Read Lesson ${day} again`);
      again.className = "today-link";
      row.append(again);
      nodes.push(row);
    } else {
      nodes.push(plan(day), el("p", "today-hint", "Done is at the end of the lesson."));
    }
  }
  panel.replaceChildren(...nodes);
  if (focused) document.getElementById(focused)?.focus({ preventScroll: true });
}

/* ---------- Views ---------- */

// Today shows one lesson (none, once the day's is done); the note shows all.
function apply() {
  const isToday = mode === "today";
  root.classList.toggle("is-today", isToday);
  root.classList.add("is-ready");
  root.dataset.viewing = isToday ? String(viewing) : "";
  for (const s of document.querySelectorAll(".is-viewed, .has-viewed")) s.classList.remove("is-viewed", "has-viewed");
  if (panel) panel.hidden = !isToday;
  if (start) {
    start.hidden = !isToday || !(starting || !started());
    const go = start.querySelector("#start-go");
    const n = dayLesson();
    if (go) go.textContent = n === 1 && !doneLessons()[1] ? "Start Lesson 1" : n > LAST_LESSON ? "Back to today" : `Back to Lesson ${n}`;
  }
  if (isToday) {
    const day = dayLesson();
    const showLesson = viewing <= LAST_LESSON && (reading || !(viewing === day && finishedToday(day)));
    const s = showLesson && section(viewing);
    if (s) {
      s.classList.add("is-viewed");
      s.closest(".part")?.classList.add("has-viewed");
    }
    render();
  }
  for (const a of strip?.querySelectorAll("[data-view]") ?? []) {
    if (a.dataset.view === mode) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  }
  dispatchEvent(new Event("kannada:view"));
}

function show(n, target, { read = false, intro = false } = {}) {
  mode = "today";
  viewing = n;
  reading = read;
  starting = intro;
  apply();
  if (target && target !== heading(n)) target.scrollIntoView();
  else scrollTo(0, 0);
}

function openNote(target) {
  mode = "note";
  reading = false;
  starting = false;
  apply();
  target?.scrollIntoView();
}

// Where a hash lands in the today view: a lesson, or a heading inside
// one, shows that lesson; #today, or no hash, the day's; #top stays
// put; any other heading opens the whole note there. The whole note
// leaves every hash to the browser.
function route() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id === "top") return;
  if (id === "today") return show(dayLesson());
  if (mode !== "today") return;
  if (!id) return show(dayLesson());
  const target = document.getElementById(id);
  if (!target) return;
  const lesson = /^lesson-(\d+)(?:-|$)/.exec(id);
  if (lesson) show(Number(lesson[1]), target, { read: true });
  else openNote(target);
}

/* ---------- Done ----------
   Each lesson's end has a Done button (render.js writes it). */
function syncDone() {
  const done = doneLessons();
  for (const b of document.querySelectorAll("[data-done]")) {
    const n = Number(b.dataset.done);
    const isDone = Boolean(done[n]);
    b.disabled = isDone;
    b.textContent = isDone ? `Done ${date(done[n])}` : `Done with Lesson ${n}`;
  }
  // The Lessons sheet: done lessons filled in, the one you are on outlined.
  const current = currentLesson();
  for (const chip of document.querySelectorAll(".jump ol a")) {
    const n = Number(chip.hash.replace("#lesson-", ""));
    chip.classList.toggle("is-done", Boolean(done[n]));
    chip.classList.toggle("is-next", n === current);
  }
}

export function initToday(options) {
  if (!panel || !strip) return;
  hooks = options;

  // Today, Start here and Whole note lead the bar's links; the note's
  // own links show only in the whole note.
  const item = (text, view) => {
    const li = el("li", "view-link");
    if (view !== "today") li.classList.add("only-today");
    const a = el("a", null, text);
    a.href = view === "note" ? "#lesson-index" : "#today";
    a.dataset.view = view;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (view === "note") {
        setView("note");
        openNote(mode === "today" ? section(viewing) : null);
        return;
      }
      setView("today");
      if (location.hash) history.pushState(null, "", location.pathname);
      show(dayLesson(), null, { intro: view === "start" });
    });
    li.append(a);
    return li;
  };
  strip.prepend(item("Today", "today"), item("Start here", "start"), item("Whole note", "note"));

  start?.querySelector("#start-go")?.addEventListener("click", () => {
    markStarted();
    starting = false;
    apply();
    (panel ?? document.body).scrollIntoView();
  });

  document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-done]");
    if (!button || button.disabled) return;
    const n = Number(button.dataset.done);
    markDone(n);
    hooks.onDone?.(n);
    if (mode === "today") show(dayLesson());
  });

  addEventListener("hashchange", route);
  onProgress(() => {
    syncDone();
    if (mode === "today") render();
  });
  syncDone();

  // The first view: as the bootstrap in index.html guessed, from the
  // view last open and the address.
  const id = location.hash.slice(1);
  mode = root.classList.contains("is-today") || (lastView() === "today" && !id) ? "today" : "note";
  viewing = dayLesson();
  if (mode === "today" && id) route();
  else apply();
}
