import { THEMES } from "../shared/themes.js";
import { fillThemeChoices } from "../shared/theme-picker.js";
import { normalizeSettings, SETTINGS_KEY, themePaint } from "./theme.js";

const root = document.documentElement;
const meta = document.querySelector('meta[name="theme-color"]');
const sheet = document.getElementById("settings");
const open = document.getElementById("open-settings");
const close = document.getElementById("close-settings");
const themes = document.getElementById("themes");
const swatches = document.getElementById("accents");
const custom = document.getElementById("custom-accent");
const note = document.getElementById("accent-note");
const backgrounds = sheet.querySelectorAll('input[name="background"]');

function readSettings() {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY)));
  } catch {
    return normalizeSettings();
  }
}

function fillAccentChoices(theme) {
  swatches.replaceChildren(...theme.colors.map(([label, hex]) => {
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "accent";
    input.value = hex;
    input.title = label;
    input.setAttribute("aria-label", label);
    input.style.setProperty("--swatch", hex);
    return input;
  }));
}

let settings;
let controlsTheme;

function renderControls(paint) {
  if (!controlsTheme) fillThemeChoices(themes);
  if (controlsTheme !== settings.theme) fillAccentChoices(THEMES[settings.theme]);
  controlsTheme = settings.theme;
  for (const input of themes.querySelectorAll("input")) input.checked = input.value === settings.theme;
  for (const input of swatches.querySelectorAll("input")) input.checked = input.value === settings.accent;
  for (const input of backgrounds) input.checked = input.value === settings.background;
  custom.value = settings.accent;
  note.hidden = paint["--accent"] === settings.accent;
}

function render(next) {
  settings = next;
  const paint = themePaint(settings);
  for (const [key, color] of Object.entries(paint)) root.style.setProperty(key, color);
  meta.content = paint["--bg"];
  if (controlsTheme) renderControls(paint);
  return paint;
}

render(readSettings());

if (typeof sheet.showModal === "function") {
  open.hidden = false;
  open.addEventListener("click", () => {
    if (!controlsTheme) renderControls(themePaint(settings));
    sheet.showModal();
  });
  close.addEventListener("click", () => sheet.close());
  sheet.addEventListener("click", (event) => {
    if (event.target !== sheet) return;
    const { top, right, bottom, left } = sheet.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
      sheet.close();
    }
  });
}

sheet.addEventListener("input", ({ target }) => {
  const next = { ...settings };
  if (target.name === "theme") {
    next.theme = target.value;
    next.accent = THEMES[next.theme].focus;
  } else if (target.name === "accent" || target === custom) {
    next.accent = target.value;
  } else if (target.name === "background") {
    next.background = target.value;
  } else {
    return;
  }

  const paint = render(next);
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, paint }));
  } catch {}
});

window.addEventListener("storage", (event) => {
  if (event.key === SETTINGS_KEY || event.key === null) render(readSettings());
});
