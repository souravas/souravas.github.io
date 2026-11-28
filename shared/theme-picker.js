import { THEMES } from "./themes.js";

// Each radio shows the theme's background and two accents in its own colours.
export function fillThemeChoices(list) {
  for (const [key, theme] of Object.entries(THEMES)) {
    const label = document.createElement("label");
    label.className = "theme";
    for (const token of ["bg", "rule", "text", "focus", "break"]) {
      label.style.setProperty(`--t-${token}`, theme[token]);
    }

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "theme";
    input.value = key;

    const face = document.createElement("span");
    face.className = "theme-face";
    const dots = document.createElement("span");
    dots.className = "theme-dots";
    dots.setAttribute("aria-hidden", "true");
    dots.append(document.createElement("i"), document.createElement("i"));
    const title = document.createElement("span");
    title.className = "theme-name";
    title.textContent = theme.name;

    face.append(dots, title);
    label.append(input, face);
    list.append(label);
  }
}
