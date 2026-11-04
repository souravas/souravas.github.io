/* ---------- Speech ----------
   The device's own Kannada voice, through the browser's speech engine:
   Google's on Android (its Kannada voice may need downloading in the
   phone's text-to-speech settings), Microsoft's online voices in Edge.
   Most other browsers have none, and then the page says so and offers
   nothing to tap. The voice reads Kannada script, so each line goes
   through script.js first. Voices often arrive after the page loads,
   so the list is asked again when it changes, and a few times besides
   for browsers that never say. */

import { spoken } from "./script.js";

// A little under the voice's own speed, for an ear still learning.
const RATE = 0.85;

let voice = null;
const listeners = new Set();

function pick() {
  const found = speechSynthesis.getVoices().find((v) => /^kn([-_]|$)/i.test(v.lang)) ?? null;
  if (found === voice) return;
  voice = found;
  document.documentElement.classList.toggle("can-speak", Boolean(voice));
  for (const listener of listeners) listener(Boolean(voice));
}

export function initSpeech() {
  if (!("speechSynthesis" in window)) return;
  pick();
  speechSynthesis.addEventListener?.("voiceschanged", pick);
  for (const wait of [250, 1000, 3000]) setTimeout(pick, wait);
}

export const canSpeak = () => Boolean(voice);

// Run a function now and whenever a Kannada voice comes or goes.
export function onVoice(listener) {
  listeners.add(listener);
  listener(Boolean(voice));
}

// Say a line of the note's Kannada. False if there is nothing to say it with.
export function speak(text) {
  if (!voice) return false;
  const script = spoken(text);
  if (!/\p{Script=Kannada}|[A-Za-z]/u.test(script)) return false;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(script);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = RATE;
  speechSynthesis.speak(utterance);
  return true;
}
