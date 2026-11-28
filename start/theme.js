import { THEMES } from "../shared/themes.js";

export const SETTINGS_KEY = "start-settings";

export function normalizeSettings(saved) {
  const theme = typeof saved?.theme === "string" && Object.hasOwn(THEMES, saved.theme)
    ? saved.theme
    : "black";
  const accent = typeof saved?.accent === "string" && /^#[0-9a-f]{6}$/i.test(saved.accent)
    ? saved.accent.toLowerCase()
    : THEMES[theme].focus;
  return {
    theme,
    accent,
    background: saved?.background === "tint" ? "tint" : "plain",
  };
}

function rgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function blend(color, base, weight) {
  const channels = rgb(base);
  return "#" + rgb(color).map((value, i) => {
    const mixed = Math.round(value * weight + channels[i] * (1 - weight));
    return mixed.toString(16).padStart(2, "0");
  }).join("");
}

function luminance(color) {
  const [r, g, b] = rgb(color).map((byte) => {
    const channel = byte / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Preserve the chosen colour when it reads clearly. Dark accents and
// quiet text on a tinted background can need a lift toward the theme's text.
function readableColor(color, background, text) {
  const ground = luminance(background) + 0.05;
  if ((luminance(color) + 0.05) / ground >= 4.5) return color;

  for (let step = 1; step < 20; step++) {
    const lifted = blend(text, color, step / 20);
    if ((luminance(lifted) + 0.05) / ground >= 4.5) return lifted;
  }
  return text;
}

export function themePaint(settings) {
  const theme = THEMES[settings.theme];
  const { accent } = settings;
  const tinted = settings.background === "tint";
  const black = settings.theme === "black" && !tinted;
  const bg = tinted ? blend(accent, theme.bg, 0.12) : theme.bg;
  const line = tinted ? blend(accent, theme.line, 0.14) : theme.line;
  const rule = tinted ? blend(accent, theme.rule, 0.16) : theme.rule;
  const muted = tinted ? blend(theme.body, theme.muted, 0.6) : theme.muted;
  const face = black ? "#0b0b0b" : blend(line, bg, 0.45);
  const faceHover = black ? "#121212" : blend(line, bg, 0.82);
  const text = readableColor(theme.text, faceHover, "#ffffff");
  const legend = black ? "#7d7d7d" : blend(theme.body, muted, 0.52);

  return {
    "--bg": bg,
    "--line": line,
    "--rule": rule,
    "--edge": theme.edge,
    "--text": text,
    "--heading": black ? "#d4d4d4" : theme.text,
    "--body": readableColor(theme.body, face, text),
    "--muted": readableColor(muted, bg, text),
    "--accent": readableColor(accent, faceHover, text),
    "--face": face,
    "--face-hover": faceHover,
    "--face-line": black ? "#1e1e1e" : line,
    "--face-lip": black ? "#171717" : blend(line, bg, 0.76),
    "--icon": black ? "#8a8a8a" : blend(theme.body, muted, 0.24),
    "--legend": readableColor(legend, faceHover, text),
  };
}
