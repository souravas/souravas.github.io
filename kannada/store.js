/* ---------- Progress ----------
   What the page remembers, in this browser only (localStorage; there
   is no server, so a phone and a laptop each keep their own): every
   card's place in the review, and, for the Today screen, the lesson
   you are on, the lessons done and today's checklist. If storage is
   blocked, the page still works for the visit and forgets after.

   The review is Leitner boxes. A card in box n comes back INTERVALS[n]
   days after it was last right; a miss sends it back to box 1, due
   tomorrow. Box 0 holds a lesson's cards that no quiz has asked yet,
   in lesson order, and the review lets NEW_PER_DAY of them in a day,
   so a long lesson trickles in rather than landing all at once. */

const KEY = "kannada";
const INTERVALS = [0, 1, 3, 7, 14, 30, 60];
const TOP = INTERVALS.length - 1;
export const NEW_PER_DAY = 12;

const fresh = () => ({ v: 1, cards: {} });

function read() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (data?.v === 1 && data.cards && typeof data.cards === "object") return data;
  } catch {
    // Blocked or broken storage: start clean.
  }
  return fresh();
}

let state = read();
const listeners = new Set();

export const progress = () => state;

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Full or blocked: keep going without it.
  }
  for (const listener of listeners) listener();
}

// Run a function whenever the progress changes, here or in another tab.
export function onProgress(listener) {
  listeners.add(listener);
}

addEventListener("storage", (e) => {
  if (e.key !== KEY) return;
  state = read();
  for (const listener of listeners) listener();
});

// Today as a day number, by the local clock, so a day turns at midnight.
export function today() {
  const now = new Date();
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
}

// How many waiting cards the review may still let in today.
function allowance(day) {
  const [on, count] = state.introduced ?? [];
  return Math.max(0, NEW_PER_DAY - (on === day ? count : 0));
}

/* The cards due today, oldest first, then the waiting ones it lets in.
   byId: the cards file's map, so a card the note no longer has is
   skipped. Each comes with its box, which picks how it is asked. */
export function dueCards(byId) {
  const day = today();
  const due = [];
  const waiting = [];
  for (const [id, [box, on]] of Object.entries(state.cards)) {
    const card = byId.get(id);
    if (!card) continue;
    // A waiting card is let in from the day after its lesson's quiz.
    if (box === 0) {
      if (on < day) waiting.push({ card, box, on });
    } else if (on <= day) due.push({ card, box, on });
  }
  due.sort((a, b) => a.on - b.on || a.box - b.box || a.card.lesson - b.card.lesson);
  waiting.sort((a, b) => a.card.lesson - b.card.lesson || a.on - b.on);
  return [...due, ...waiting.slice(0, allowance(day))];
}

/* Move each answered card. A card new to the review starts in box 1,
   due tomorrow, right or wrong. A miss goes back to box 1. A right
   answer moves a due card up a box; one that was not due yet keeps its
   day, so a quiz taken again early does not rush the schedule. */
export function schedule(results) {
  const day = today();
  for (const { card, correct } of results) {
    const entry = state.cards[card.id];
    if (!entry || entry[0] === 0) {
      if (entry) {
        const [on, count] = state.introduced ?? [];
        state.introduced = [day, (on === day ? count : 0) + 1];
      }
      state.cards[card.id] = [1, day + 1];
    } else if (!correct) {
      state.cards[card.id] = [1, day + 1];
    } else if (entry[1] <= day) {
      const box = Math.min(entry[0] + 1, TOP);
      state.cards[card.id] = [box, day + INTERVALS[box]];
    }
  }
  save();
}

// A lesson's cards join the review, waiting in box 0, unless already in.
export function enter(cards) {
  const day = today();
  let added = 0;
  for (const card of cards) {
    if (state.cards[card.id]) continue;
    state.cards[card.id] = [0, day];
    added++;
  }
  if (added) save();
}

/* ---------- The day ----------
   The Today screen's memory: the lesson you are on (the first not yet
   done, in order), when each lesson was done, today's checklist for
   the lesson in hand, the day the review was last seen through, the
   days anything was done (for the streak), and which view was last
   open. */

export const LAST_LESSON = 89;

export const currentLesson = () => Math.min(state.lesson ?? 1, LAST_LESSON + 1);
export const doneLessons = () => state.done ?? {};

function markActive() {
  const day = today();
  const days = state.active ?? [];
  if (!days.includes(day)) state.active = [...days, day].slice(-120);
}

// Days in a row with something done, up to today (or yesterday, so a
// streak still shows in the morning before anything is done).
export function streak() {
  const days = new Set(state.active ?? []);
  let day = today();
  if (!days.has(day)) day -= 1;
  let count = 0;
  while (days.has(day)) {
    count++;
    day--;
  }
  return count;
}

// A lesson done moves you past it, unless you were already past it.
export function markDone(n) {
  state.done = { ...doneLessons(), [n]: today() };
  if (currentLesson() <= n) state.lesson = n + 1;
  markActive();
  save();
}

// Today's ticks, for one lesson: a new day or another lesson starts clean.
export function steps(lesson) {
  const t = state.today;
  return t && t.day === today() && t.lesson === lesson ? t.steps : {};
}

export function setStep(lesson, step, on) {
  const day = today();
  if (state.today?.day !== day || state.today?.lesson !== lesson) state.today = { day, lesson, steps: {} };
  state.today.steps[step] = on;
  if (on) markActive();
  save();
}

export const reviewedToday = () => state.reviewed === today();

export function markReviewed() {
  state.reviewed = today();
  markActive();
  save();
}

// Going on to the next lesson on the day one was done.
export const aheadToday = () => state.ahead === today();

export function goAhead() {
  state.ahead = today();
  save();
}

// "today" (the default) or "note", the whole note.
export const lastView = () => (state.view === "note" ? "note" : "today");

export function setView(view) {
  if (state.view === view) return;
  state.view = view;
  save();
}

// Start here shows until you start: its button, a lesson done or a card
// in review all count.
export const started = () => Boolean(state.started) || Object.keys(state.done ?? {}).length > 0 || Object.keys(state.cards).length > 0;

export function markStarted() {
  state.started = true;
  save();
}
