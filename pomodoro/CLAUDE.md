# /pomodoro

- [main.js](main.js) runs the timer and the Settings sheet. A running timer counts down to a moment (`endsAt`) and ends on one `setTimeout` set when it starts, never chained off the display's ticks, so a throttled background tab still ends on time.
- [sound.js](sound.js) makes every sound with Web Audio, with no audio files. The levels were measured in the browser: at volume 100 the alarms peak near full scale without clipping, and the start sounds at about half that; match those when adding a sound. A page can only make sound after a tap or a key press.
- [themes.js](themes.js) holds Black (whose tokens are also the stylesheet's `:root` defaults) and published palettes. A theme's two starting colours must read at 4.5:1 or better on its ground and on their own tint. Its grey for quiet text is lifted only where it reads under 4.5:1.
- The head's Countdowns link opens TickTick's countdowns (`ticktick.com/webapp/#countdown`) in a new tab, so leaving for it never stops a running timer's alarm.
- localStorage keeps the timer under `pomodoro` and the settings under `pomodoro-settings`, including the theme's tokens as `paint`, which an inline script in the head applies before first paint. The page works without storage.
- Two tabs of the page share that storage. Each takes up what the other writes (a `storage` listener), so they show one timer, and at an end only the tab that gets the `pomodoro-alarm` lock rings; a tab that cannot make sound yet does not ask for it.
- On a phone a timer only rings while the page is on screen: a frozen page cannot. So "Keep the screen on" defaults to on where there is no hover (a touch screen), and off elsewhere. A browser that had already saved its settings keeps what it saved.
- main.js registers the shared [/sw.js](../public/sw.js) with scope `/pomodoro`: the page opens without a network, and on Android, where a page cannot construct a `Notification`, the worker shows it instead.
- The page must fit without scrolling. Below 721px of height the tighter spacing applies (`@media (max-height: 720px)`); the roomy spacing needs 706px with a full dial. Check the fit again after adding anything to the page.
