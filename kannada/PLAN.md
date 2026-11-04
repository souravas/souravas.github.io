# /kannada improvement plan (temporary handoff file)

Sourav asked for the improvements below (all of the list but 12, recording yourself, which he dropped), each committed and pushed
to `main` on its own, so a new chat can pick up from the first unchecked
item. Delete this file once every item is done. The build does not ship
it: only `note.md` is read from this folder.

Order of work (numbers are the ones Sourav picked from):

- [x] 3. Lesson 1 as a 10-minute start: the rule and the five sound
      pairs stay, everything else folds under `> [!later]-`, and it ends
      with `> [!say] Say it today`: `nanage Kannada gottilla`.
- [x] 6. Quiz at the end of each lesson: cards built at build time from the
      lesson's English/Kannada tables (not from `[!later]` folds or exercise
      tables), run in a dialog. Recognise (Kannada shown, pick the English
      of 4), recall (English shown, say it, reveal, Got it / Not yet), and
      Lesson 1's sound pairs. No typed answers, on purpose.
- [x] 7. Spaced review: Leitner boxes in localStorage (1, 3, 7, 14, 30, 60
      days), a missed card back to tomorrow, "Review (N due)".
- [x] 1. Today screen: only the current lesson, a daily checklist (review,
      read aloud, quiz, listen 5 min, say one line), Done moves you on,
      Whole note mode, progress in the Lessons sheet.
- [x] 2. Start here: the three spelling rules and how a day works, first
      visit and from the bar.
- [x] 5. Street phrases in week one: Lessons 2 to 7 get `[!say]` lines
      from Lessons 58 and 60, flagged as not yet checked by a speaker.
- [ ] 4. "Learn today" and "For later" in Lessons 1 to 33: 8 to 15 lines
      to learn, look-up tables folded, nothing deleted.
- [ ] 8. Drill any table: a button under each table runs just that table.
- [ ] 9. Checkpoints (Lessons 33, 69, 89) as cards that feed the review.
- [ ] 11. Play Kannada lines with the device's Kannada voice: the note's
      spelling turned into Kannada script, tap a line to hear it.
- [ ] 10. Anki deck: the build writes `/kannada/anki.txt`.

Content edits keep to what the note already says: no new Kannada beyond
lines already in it. `note.md` now differs from the vault's copy, so it
has to be copied back into `70 - Learn/Language/Kannada Gottilla.md`.
