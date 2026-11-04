/* ---------- Deck ----------
   A run of cards in the #deck dialog: a lesson's quiz, the day's
   review, a table's drill. Nothing is typed (typing the note's spelling
   on a phone tests spelling, not speaking), and a card is one of:
   - recognise: the Kannada, and up to four English lines to pick from
   - recall: the English; say the Kannada out loud, show it, and say
     whether you had it
   - pair: one of Lesson 1's sound pairs; which word means the thing
   A card missed comes back at the end of the run, up to twice. The run
   reports each card's first try, when it ends or the dialog closes. */

import { label, norm, shuffle } from "./cards.js";

const dialog = document.getElementById("deck");
const heading = document.getElementById("deck-title");
const counter = document.getElementById("deck-count");
const bar = document.getElementById("deck-progress");
const body = document.getElementById("deck-body");

let run = null;

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const button = (text, className = "action", onClick) => {
  const node = el("button", className, text);
  node.type = "button";
  if (onClick) node.addEventListener("click", onClick);
  return node;
};

const actions = (...buttons) => {
  const row = el("div", "deck-actions");
  row.append(...buttons);
  return row;
};

const ask = (text) => el("p", "deck-ask", text);

// Put a card on show, and focus where the next move is.
function show(nodes, focus) {
  body.replaceChildren(...nodes);
  body.scrollTop = 0;
  (focus ?? body.querySelector("button"))?.focus({ preventScroll: true });
}

/* Open a run. items: [{ card, mode }]. pool(card): the cards to find
   wrong answers among, its own lesson's first. onDone(results, ended):
   results are [{ card, mode, correct }], one per card, first try. note:
   a line for the end screen, from the results. */
export function openDeck({ title, items, pool = () => [], onDone, note }) {
  if (!dialog || !items.length) return;
  run = { title, pool, onDone, note, queue: items.slice(), first: new Map(), tries: new Map(), total: items.length, reported: false };
  heading.textContent = title;
  if (!dialog.open) dialog.showModal();
  next();
}

// A message in the dialog in place of cards, such as cards that did
// not load.
export function deckMessage(title, text) {
  if (!dialog) return;
  run = null;
  heading.textContent = title;
  counter.textContent = "";
  bar.value = 0;
  if (!dialog.open) dialog.showModal();
  show([el("p", "deck-prompt", text), actions(button("Close", "action", () => dialog.close()))]);
}

function next() {
  const item = run.queue.shift();
  if (!item) return finish();
  run.item = item;
  bar.max = run.total;
  bar.value = run.first.size;
  counter.textContent = item.again ? "Again" : `${run.first.size + 1} of ${run.total}`;
  if (item.mode === "pair") pair(item);
  else if (item.mode === "recognise") recognise(item);
  else recall(item);
}

function answer(correct) {
  const { card, mode } = run.item;
  if (!run.first.has(card.id)) run.first.set(card.id, { card, mode, correct });
  const tries = (run.tries.get(card.id) ?? 0) + 1;
  run.tries.set(card.id, tries);
  if (!correct && tries < 3) run.queue.push({ card, mode, again: true, last: run.item.asked });
}

// Up to three wrong answers: English from the same lesson and the ones
// before it, of about the same length, never one that the same Kannada
// also means.
function wrongAnswers(card) {
  const target = norm(card.kn);
  const ending = card.kn.startsWith("-");
  const taken = new Set([norm(label(card))]);
  const near = run
    .pool(card)
    .filter((c) => !c.pair && c.id !== card.id && norm(c.kn) !== target && c.kn.startsWith("-") === ending)
    .slice(0, 24);
  const closest = shuffle(near).sort((a, b) => Math.abs(a.en.length - card.en.length) - Math.abs(b.en.length - card.en.length));
  const picked = [];
  for (const c of shuffle(closest.slice(0, 10))) {
    const key = norm(label(c));
    if (taken.has(key)) continue;
    taken.add(key);
    picked.push(c);
    if (picked.length === 3) break;
  }
  return picked;
}

// Other Kannada the note gives for the same English, also right:
// Lesson 15 teaches both hELi-koDu and kalisu for teach.
function alsoRight(card) {
  const key = norm(label(card));
  const seen = new Set([norm(card.kn)]);
  const out = [];
  for (const c of run.pool(card)) {
    if (c.pair || norm(label(c)) !== key || seen.has(norm(c.kn))) continue;
    seen.add(norm(c.kn));
    out.push(c.kn);
  }
  return out;
}

// Choices as numbered buttons; a pick locks them and shows the answer.
function choices(list, isRight, text, onPick) {
  const group = el("div", "deck-options");
  group.setAttribute("role", "group");
  list.forEach((choice, i) => {
    const option = button("", "deck-option");
    option.append(el("span", "deck-key", String(i + 1)), el("span", "deck-choice", text(choice)));
    option.dataset.key = String(i + 1);
    option.addEventListener("click", () => {
      for (const b of group.querySelectorAll("button")) {
        b.disabled = true;
        if (isRight(list[Number(b.dataset.key) - 1])) b.classList.add("is-right");
      }
      const right = isRight(choice);
      if (!right) option.classList.add("is-wrong");
      onPick(right);
    });
    group.append(option);
  });
  return group;
}

// The line under a choice that says how it went, and Next.
function afterChoice() {
  const feedback = el("p", "deck-note");
  feedback.setAttribute("aria-live", "polite");
  const nextButton = button("Next", "action", next);
  nextButton.hidden = true;
  const done = (text) => {
    feedback.textContent = text;
    nextButton.hidden = false;
    nextButton.focus({ preventScroll: true });
  };
  return { feedback, row: actions(nextButton), done };
}

function recognise(item) {
  const { card } = item;
  const wrong = wrongAnswers(card);
  if (wrong.length < 2) return recall(item);
  const after = afterChoice();
  const group = choices(shuffle([card, ...wrong]), (c) => c === card, label, (right) => {
    answer(right);
    after.done(right ? "Right." : `It means: ${label(card)}`);
  });
  show([ask("What does it mean?"), el("p", "deck-prompt kn", card.kn), group, after.feedback, after.row]);
}

function recall(item) {
  const { card } = item;
  const nodes = [
    ask(card.kn.startsWith("-") ? "Say the ending, out loud" : "Say it in Kannada, out loud"),
    el("p", "deck-prompt", card.en),
  ];
  if (card.hint) nodes.push(el("p", "deck-hint", card.hint));
  const reveal = el("div", "deck-reveal");
  reveal.hidden = true;
  reveal.append(el("p", "deck-answer kn", card.kn));
  const also = alsoRight(card);
  if (also.length) {
    const line = el("p", "deck-also", "Also right: ");
    line.append(el("span", "kn", also.join(", ")));
    reveal.append(line);
  }
  const row = actions();
  const miss = button("Not yet", "action quiet", () => {
    answer(false);
    next();
  });
  const hit = button("Got it", "action", () => {
    answer(true);
    next();
  });
  miss.dataset.key = "1";
  hit.dataset.key = "2";
  const showButton = button("Show", "action", () => {
    reveal.hidden = false;
    row.replaceChildren(miss, hit);
    hit.focus({ preventScroll: true });
  });
  row.append(showButton);
  show([...nodes, reveal, row], showButton);
}

// Which of the pair means this? A card asked again asks another word.
function pair(item) {
  const { card } = item;
  const words = card.kn;
  let asked = Math.floor(Math.random() * words.length);
  if (item.last !== undefined && words.length > 1 && asked === item.last) asked = (asked + 1) % words.length;
  item.asked = asked;
  const after = afterChoice();
  const group = choices(shuffle(words.map((_, i) => i)), (i) => i === asked, (i) => words[i], (right) => {
    answer(right);
    after.done(words.map((w, i) => `${w} is ${card.en[i]}`).join(", "));
  });
  group.classList.add("is-pair");
  show([ask("Which one means"), el("p", "deck-prompt", card.en[asked]), group, after.feedback, after.row]);
}

function finish() {
  const results = [...run.first.values()];
  const right = results.filter((r) => r.correct).length;
  bar.value = bar.max;
  counter.textContent = "Done";
  const nodes = [ask("Done"), el("p", "deck-prompt", `${right} of ${results.length} right first time`)];
  const extra = run.note?.(results);
  if (extra) nodes.push(el("p", "deck-note", extra));
  const missed = results.filter((r) => !r.correct);
  if (missed.length) {
    const list = el("ul", "deck-missed");
    for (const { card } of missed) {
      const li = el("li");
      li.append(el("span", "kn", card.pair ? card.kn.join(" / ") : card.kn), el("span", "deck-missed-en", label(card)));
      list.append(li);
    }
    nodes.push(list);
  }
  const row = actions();
  const { title, pool } = run;
  // Going over the misses is practice: it changes no schedule.
  if (missed.length) {
    row.append(
      button("Go over the misses", "action quiet", () =>
        openDeck({ title, pool, items: missed.map(({ card }) => ({ card, mode: card.pair ? "pair" : "recall" })) }),
      ),
    );
  }
  const close = button("Close", "action", () => dialog.close());
  row.append(close);
  nodes.push(row);
  report(true);
  show(nodes, close);
}

// The results go out once: when the run ends, or when the dialog closes
// part way, with the cards answered so far.
function report(ended) {
  if (!run || run.reported) return;
  run.reported = true;
  run.onDone?.([...run.first.values()], ended);
}

if (dialog) {
  document.getElementById("deck-close")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    report(false);
    run = null;
    body.replaceChildren();
  });
  // Keys 1 to 4 pick a choice; 1 and 2 answer Not yet and Got it.
  dialog.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || !/^[1-9]$/.test(e.key)) return;
    const target = [...body.querySelectorAll("button[data-key]")].find((b) => b.dataset.key === e.key && !b.disabled);
    if (target) {
      e.preventDefault();
      target.click();
    }
  });
}
