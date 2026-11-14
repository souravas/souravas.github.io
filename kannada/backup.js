/* ---------- A copy of your progress ----------
   Progress lives in this browser alone (store.js), so clearing its
   data, or a new phone, would lose it. Start here offers it as a file:
   Save your progress downloads one, named for the day, and Restore
   reads one back in place of what this browser has, after saying what
   would replace what. The page then loads again from it. */

import { LAST_LESSON, progress, readSnapshot, restore, snapshot, summary } from "./store.js";

const pad = (n) => String(n).padStart(2, "0");

// "Lesson 23, 412 cards in review"
function describe(p) {
  const { lesson, cards } = summary(p);
  const where = lesson > LAST_LESSON ? `all ${LAST_LESSON} lessons done` : `Lesson ${lesson}`;
  return `${where}, ${cards} ${cards === 1 ? "card" : "cards"} in review`;
}

export function initBackup() {
  const note = document.getElementById("backup-note");
  const save = document.getElementById("backup-save");
  const open = document.getElementById("backup-open");
  const file = document.getElementById("backup-file");
  const status = document.getElementById("backup-status");
  if (!note || !save || !open || !file || !status) return;
  note.hidden = false;

  save.addEventListener("click", () => {
    const now = new Date();
    const url = URL.createObjectURL(new Blob([snapshot()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `kannada-gottilla-progress-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "Saved to your downloads.";
  });

  open.addEventListener("click", () => file.click());

  file.addEventListener("change", async () => {
    const [picked] = file.files;
    // Cleared, so picking the same file again is still a change.
    file.value = "";
    if (!picked) return;
    const copy = readSnapshot(await picked.text().catch(() => ""));
    if (!copy) {
      status.textContent = "That file is not a copy of this page's progress.";
      return;
    }
    const here = summary();
    if (here.cards > 0 || here.lesson > 1) {
      const saved = new Date(copy.saved);
      const when = Number.isNaN(saved.getTime()) ? "" : `, saved ${saved.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
      if (!confirm(`Replace this browser's progress (${describe(progress())}) with the file's (${describe(copy.progress)}${when})?`)) return;
    }
    if (restore(copy.progress)) location.reload();
    else status.textContent = "Restored for this visit only: this browser is not keeping progress.";
  });
}
