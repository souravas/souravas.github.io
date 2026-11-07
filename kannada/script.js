/* ---------- Kannada script ----------
   The note's spelling, turned back into Kannada script: for the
   device's Kannada voice (speech.js), which reads script and not English
   letters, and for the Anki deck (the build). The spelling is the
   note's "How This Note Writes Kannada": a capital T, D, N or L is
   retroflex, a capital E, I or O or a doubled vowel is long, a hyphen
   is only a join (where a vowel meets a vowel a y slides in, so
   mane-alli is maneyalli). Script needs one more rule the spelling
   leaves to the ear: a nasal before a stop of its own kind is the
   anusvara, so enTu is ಎಂಟು and bengaLooru ಬೆಂಗಳೂರು.

   English inside a Kannada line (pen, office) and names (Geeta) stay in
   English letters, which a Kannada voice reads as English; the names
   the note says how to say (kannaDa, bengaLooru) go into script. The
   word lists below are every one the note's Kannada lines use: a new
   English word in the note goes in ENGLISH, a new name in NAMES, or it
   is read as Kannada. Every Kannada line starts lowercase, but a word
   can still start with a sound's capital (Enu, ELu, DaakTaru), so a
   capital alone does not make a name. The script is machine-made:
   right for the sounds, not always the spelling a Kannada reader
   expects (ಶ and ಷ have merged in speech, and this writes ಶ but for a
   handful of words). */

const ENGLISH = new Set([
  "a", "actor", "actress", "adjust", "airport", "already", "are", "away", "badminton", "bag", "ball",
  "basketball", "best", "bill", "book", "bus", "busy", "by", "call", "cancel", "canteen", "chapter",
  "charge", "charger", "chocolate", "choice", "church", "chutney", "classmate", "coffee", "come",
  "company", "cricket", "cricketer", "design", "developer", "discount", "disturb", "do", "doctor",
  "doing", "done", "drive", "driver", "e", "engineer", "enjoy", "even", "exercise", "football",
  "friend", "going", "guitar", "he", "help", "if", "internship", "is", "it", "jogging", "kilo", "know",
  "late", "later", "leave", "left", "let", "line", "lunch", "madam", "mail", "marathon", "match", "me",
  "means", "meeting", "message", "meter", "moment", "newspaper", "no", "not", "notes", "number", "of",
  "office", "or", "out", "pack", "parcel", "pen", "personal", "phone", "photo", "plate", "player",
  "pronouns", "purse", "rains", "rent", "right", "room", "root", "school", "see", "silk", "sir",
  "software", "special", "syllabus", "taxi", "tea", "teacher", "tell", "tennis", "the", "there",
  "ticket", "time", "train", "trip", "two", "us", "verb", "wait", "way", "what", "where", "will",
  "work", "you",
]);

const NAMES = new Set([
  "Agra", "Anil", "Avaya", "Bangalore", "Bollywood", "Canada", "Chennai", "Christmas", "Coorg",
  "Deepika", "Delhi", "Diana", "Divya", "Dravid", "Elton", "Emily", "English", "Fluffy", "Geeta",
  "Google", "Gopal", "Hampi", "Hebbal", "I", "IT", "India", "Indian", "It", "Jayanagara", "John",
  "Julia", "Kanchipuram", "Kumble", "MG", "Mahal", "Majestic", "Mumbai", "Murthy", "Mysore", "New",
  "Padukone", "Palace", "Peter", "Pooja", "Prakash", "Rahul", "Raj", "Ram", "Ramesh", "Ranveer",
  "Road", "Shyam", "Singh", "Soudha", "Sourav", "Sunita", "TV", "Taj", "UPI", "University", "Vidhana",
  "Vittala", "Whitefield", "York",
]);

// Names written in English letters that are Kannada words, in the note's
// own spelling: "Kannada is said kannaDa ... Bengaluru is said bengaLooru".
const SAID_AS = {
  Kannada: "kannaDa",
  Kannadiga: "kannaDiga",
  Bengaluru: "bengaLooru",
  Bengalur: "bengaLoor",
  Mysuru: "maisooru",
  Mysur: "maisoor",
  Bharata: "bhaarata",
  Bharatiya: "bhaaratIya",
  Bharatiyaru: "bhaaratIyaru",
};

const VIRAMA = "್";
const ANUSVARA = "ಂ";

// Longest first. Each: the spelling, the letter, the sign after a consonant.
const VOWELS = [
  ["aa", "ಆ", "ಾ"], ["ai", "ಐ", "ೈ"], ["au", "ಔ", "ೌ"], ["ou", "ಔ", "ೌ"], ["ee", "ಈ", "ೀ"], ["ii", "ಈ", "ೀ"],
  ["oo", "ಊ", "ೂ"], ["uu", "ಊ", "ೂ"], ["a", "ಅ", ""], ["A", "ಆ", "ಾ"], ["i", "ಇ", "ಿ"], ["I", "ಈ", "ೀ"],
  ["u", "ಉ", "ು"], ["U", "ಊ", "ೂ"], ["e", "ಎ", "ೆ"], ["E", "ಏ", "ೇ"], ["o", "ಒ", "ೊ"], ["O", "ಓ", "ೋ"],
];

const CONSONANTS = [
  ["ksh", "ಕ್ಷ"], ["gny", "ಜ್ಞ"], ["cch", "ಚ್ಚ"], ["chh", "ಛ"],
  ["kh", "ಖ"], ["gh", "ಘ"], ["ch", "ಚ"], ["jh", "ಝ"], ["Th", "ಠ"], ["Dh", "ಢ"], ["th", "ಥ"], ["dh", "ಧ"],
  ["ph", "ಫ"], ["bh", "ಭ"], ["Sh", "ಷ"], ["sh", "ಶ"],
  ["k", "ಕ"], ["g", "ಗ"], ["c", "ಕ"], ["j", "ಜ"], ["T", "ಟ"], ["D", "ಡ"], ["N", "ಣ"], ["t", "ತ"], ["d", "ದ"],
  ["n", "ನ"], ["p", "ಪ"], ["b", "ಬ"], ["m", "ಮ"], ["y", "ಯ"], ["r", "ರ"], ["l", "ಲ"], ["v", "ವ"], ["w", "ವ"],
  ["s", "ಸ"], ["h", "ಹ"], ["L", "ಳ"], ["f", "ಫ"], ["z", "ಜ"], ["q", "ಕ"], ["x", "ಕ್ಸ"],
];

// A nasal before a stop of its own kind is written as the anusvara.
const ANUSVARA_BEFORE = {
  n: new Set(["k", "kh", "g", "gh", "ch", "chh", "j", "jh", "T", "Th", "D", "Dh", "t", "th", "d", "dh"]),
  N: new Set(["T", "Th", "D", "Dh"]),
  m: new Set(["p", "ph", "b", "bh"]),
};

const match = (list, word, i) => list.find(([spelling]) => word.startsWith(spelling, i));

// The sh that is ಷ: before T (eshTu), after r (varsha), and in a few
// words where the ear cannot tell (bhaashe, aushadhi). A doubled ch is
// written cch (kacchida, bit), and a th that ends a word is the plain
// t of slang (sakkath).
const respell = (word) =>
  word
    .replace(/sh(?=T)/g, "Sh")
    .replace(/(?<=r)sh/g, "Sh")
    .replace(/(?<=bhaa|au|manu|santO|hu)sh/g, "Sh")
    .replace(/th$/, "t");

// One Kannada word, in the note's spelling, into script.
export function scriptWord(spelling) {
  const word = respell(spelling);
  let out = "";
  let open = false; // a consonant waiting for its vowel
  let i = 0;
  while (i < word.length) {
    const vowel = match(VOWELS, word, i);
    if (vowel) {
      out += open ? vowel[2] : vowel[1];
      open = false;
      i += vowel[0].length;
      continue;
    }
    const consonant = match(CONSONANTS, word, i);
    if (consonant) {
      const next = match(CONSONANTS, word, i + consonant[0].length);
      if (out && !open && next && ANUSVARA_BEFORE[consonant[0]]?.has(next[0])) {
        out += ANUSVARA;
        i += consonant[0].length;
        continue;
      }
      if (open) out += VIRAMA;
      out += consonant[1];
      open = true;
      i += consonant[0].length;
      continue;
    }
    if (open) out += VIRAMA;
    open = false;
    out += word[i++];
  }
  return open ? out + VIRAMA : out;
}

const isLatin = (part) => NAMES.has(part) || ENGLISH.has(part);

// A word as the note writes it, joins and all: "Bengalur-alli",
// "maaD-taa", "office-ge". Kannada parts join into one word, a y between
// two vowels; English letters stay apart, a space either side.
function scriptGroup(group) {
  const out = [];
  let kannada = "";
  for (const part of group.split("-")) {
    if (!part) continue;
    if (isLatin(part)) {
      if (kannada) out.push(scriptWord(kannada));
      kannada = "";
      out.push(part);
      continue;
    }
    const spelling = SAID_AS[part] ?? part;
    kannada = kannada && /[aeiouAEIOU]$/.test(kannada) && /^[aeiouAEIOU]/.test(spelling) ? `${kannada}y${spelling}` : kannada + spelling;
  }
  if (kannada) out.push(scriptWord(kannada));
  return out.join(" ");
}

// A Kannada line into script, all of it.
export function toScript(text) {
  return text.replace(/[A-Za-z]+(?:-[A-Za-z]+)*/g, scriptGroup);
}

// The part of a card's Kannada a voice should say: no English gloss after
// a spaced dash, alternatives and asides as pauses, in script.
export function spoken(text) {
  const kannada = text
    .split(" \u2014 ")[0]
    .replace(/\s*\/\s*/g, ", ")
    .replace(/\s*\(([^)]*)\)/g, ", $1")
    .replace(/…/g, "")
    .trim();
  return toScript(kannada);
}
