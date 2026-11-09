# /pomodoro

- [main.js](main.js) runs the timer and the Settings sheet. A running timer counts down to a moment (`endsAt`) and ends on one `setTimeout` set when it starts, never chained off the display's ticks, so a throttled background tab still ends on time.
- [sound.js](sound.js) makes every sound with Web Audio, with no audio files. The levels were measured in the browser: at volume 100 the alarms peak near full scale without clipping, and the start sounds at about half that; match those when adding a sound. A page can only make sound after a tap or a key press.
- [themes.js](themes.js) holds Black (whose tokens are also the stylesheet's `:root` defaults) and published palettes. A theme's two starting colours must read at 4.5:1 or better on its ground and on their own tint. Its grey for quiet text is lifted only where it reads under 4.5:1.
- localStorage keeps the timer under `pomodoro` and the settings under `pomodoro-settings`, including the theme's tokens as `paint`, which an inline script in the head applies before first paint. The page works without storage.
