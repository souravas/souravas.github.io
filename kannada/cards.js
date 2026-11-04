/* ---------- Cards ----------
   The lessons' cards. The build writes them to a file of their own,
   named in the page's <meta name="cards">: each card's English,
   Kannada, hint and lesson by id, each table's card ids by the key in
   its data-deck (a lesson's own tables in decks, together its cards,
   and its For later ones in drills), and each lesson's Say it today
   lines. Fetched once, when the page is idle or when a quiz first
   asks. */

let loading = null;

export function loadCards() {
  if (!loading) {
    const url = document.querySelector('meta[name="cards"]')?.content;
    loading = (url ? fetch(url) : Promise.reject(new Error("This page names no cards.")))
      .then((response) => {
        if (!response.ok) throw new Error(`The cards did not load (${response.status}).`);
        return response.json();
      })
      .then(index)
      .catch((error) => {
        loading = null;
        throw error;
      });
  }
  return loading;
}

// Warm the cards once the page has settled, so the first quiz opens at
// once. A failure here is quiet: the quiz asks again and says so.
export function preloadCards() {
  const go = () => loadCards().catch(() => {});
  if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 4000 });
  else setTimeout(go, 1500);
}

// "I am a student." and "i am a student" are one English line.
export const norm = (s) =>
  s.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();

// Fisher and Yates, in place.
export function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// A card's English as a choice: "do, make (polite)".
export const label = (card) =>
  card.pair ? card.en.join(" / ") : card.hint ? `${card.en} (${card.hint})` : card.en;

function index({ cards, decks, drills = {}, say }) {
  const byId = new Map();
  for (const [id, [en, kn, hint, lesson, pair]] of Object.entries(cards)) {
    byId.set(id, { id, en, kn, hint, lesson, pair: pair === 1 });
  }
  // A lesson's cards are its tables' ("12.3" is Lesson 12's), once each.
  const lessonCards = new Map();
  for (const [key, ids] of Object.entries(decks)) {
    const n = Number.parseInt(key, 10);
    if (!lessonCards.has(n)) lessonCards.set(n, { cards: [], say: [] });
    const { cards: list } = lessonCards.get(n);
    for (const id of ids) {
      const card = byId.get(id);
      if (card && !list.includes(card)) list.push(card);
    }
  }
  for (const [n, ids] of Object.entries(say)) {
    const entry = lessonCards.get(Number(n));
    if (entry) entry.say = ids.map((id) => byId.get(id)).filter(Boolean);
  }
  const numbers = [...lessonCards.keys()].sort((a, b) => a - b);
  return {
    byId,
    card: (id) => byId.get(id),
    lesson: (n) => lessonCards.get(n) ?? { cards: [], say: [] },
    // A table's cards, by the key in its data-deck: a lesson's own table
    // or one of its For later ones.
    deck: (key) => (decks[key] ?? drills[key] ?? []).map((id) => byId.get(id)).filter(Boolean),
    // The cards of a lesson, then of the lessons before it, nearest
    // first, then of the ones after: where a quiz finds its wrong answers,
    // so they are lines already met wherever there are enough.
    near(n) {
      const order = [...numbers].sort((a, b) => (a > n) - (b > n) || Math.abs(a - n) - Math.abs(b - n));
      return order.flatMap((m) => lessonCards.get(m).cards);
    },
  };
}
