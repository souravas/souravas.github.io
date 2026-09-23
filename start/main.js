/* ---------- Clock ----------
   Re-renders on each minute boundary, and again when the tab comes
   back into view (timers stall while a laptop sleeps). */
(() => {
  const el = document.getElementById("clock");
  if (!el) return;

  const fmt = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short", hour12: true });
  let timer;

  const tick = () => {
    const now = new Date();
    el.textContent = fmt.format(now);
    el.dateTime = now.toISOString();
    clearTimeout(timer);
    timer = setTimeout(tick, 60_000 - (now.getTime() % 60_000) + 50);
  };

  tick();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  });
})();

/* ---------- Weather ----------
   Open-Meteo current conditions (free, no API key, CORS-enabled).
   Cached for 10 minutes, matching Homepage's widget. */
const WEATHER = { label: "Bangalore", latitude: 13.0017, longitude: 77.7463 };
const WEATHER_TTL = 10 * 60_000;

// WMO weather code → [day label, icon, night label].
const WMO = {
  0: ["Sunny", "clear", "Clear"],
  1: ["Mainly sunny", "clear", "Mainly clear"],
  2: ["Partly cloudy", "partly"],
  3: ["Cloudy", "cloudy"],
  45: ["Foggy", "fog"],
  48: ["Rime fog", "fog"],
  51: ["Light drizzle", "rainy"],
  53: ["Drizzle", "rainy"],
  55: ["Heavy drizzle", "rainy"],
  56: ["Light freezing drizzle", "rainy"],
  57: ["Freezing drizzle", "rainy"],
  61: ["Light rain", "rainy"],
  63: ["Rain", "rainy"],
  65: ["Heavy rain", "pouring"],
  66: ["Light freezing rain", "rainy"],
  67: ["Freezing rain", "pouring"],
  71: ["Light snow", "snowy"],
  73: ["Snow", "snowy"],
  75: ["Heavy snow", "snowy"],
  77: ["Snow grains", "snowy"],
  80: ["Light showers", "rainy"],
  81: ["Showers", "pouring"],
  82: ["Heavy showers", "pouring"],
  85: ["Snow showers", "snowy"],
  86: ["Heavy snow showers", "snowy"],
  95: ["Thunderstorm", "lightning-rainy"],
  96: ["Thunderstorm with hail", "lightning-rainy"],
  99: ["Thunderstorm with hail", "lightning-rainy"],
};

const weatherIcon = (key, isDay) => {
  if (key === "clear") return isDay ? "mdi-weather-sunny" : "mdi-weather-night";
  if (key === "partly") return isDay ? "mdi-weather-partly-cloudy" : "mdi-weather-night-partly-cloudy";
  return `mdi-weather-${key}`;
};

(() => {
  const box = document.getElementById("weather");
  const icon = document.getElementById("weatherIcon");
  const temp = document.getElementById("weatherTemp");
  const desc = document.getElementById("weatherDesc");
  if (!box || !icon || !temp || !desc) return;

  const KEY = "start:weather";
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${WEATHER.latitude}&longitude=${WEATHER.longitude}` +
    "&current=temperature_2m,weather_code,is_day";
  const num = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

  const render = ({ temperature_2m: t, weather_code: code, is_day: isDay }) => {
    const [dayLabel, key, nightLabel = dayLabel] = WMO[code] ?? ["Unknown", "cloudy"];
    temp.textContent = `${WEATHER.label}, ${num.format(t)}°C`;
    desc.textContent = isDay ? dayLabel : nightLabel;
    icon.setAttribute("href", `#${weatherIcon(key, isDay)}`);
    box.hidden = false;
  };

  const read = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(KEY));
      return cached?.url === url ? cached : null;
    } catch {
      return null;
    }
  };
  const write = (value) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
    } catch {}
  };

  let inflight = false;
  const refresh = async () => {
    const cached = read();
    if (cached) render(cached.current);
    if ((cached && Date.now() - cached.at < WEATHER_TTL) || inflight) return;
    inflight = true;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { current } = await res.json();
      render(current);
      write({ url, at: Date.now(), current });
    } catch {
      // Leave whatever is showing: the stale reading, or nothing.
    } finally {
      inflight = false;
    }
  };

  refresh();
  setInterval(() => {
    if (document.visibilityState === "visible") refresh();
  }, WEATHER_TTL);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh();
  });
})();

/* ---------- Quick launch ----------
   Start typing anywhere to open it. Matches bookmarks by name, offers
   to visit anything that looks like a URL, and falls back to a Google
   search. ↑/↓ move, Enter opens, Esc closes. */
(() => {
  const dialog = document.getElementById("search");
  const input = document.getElementById("searchInput");
  const list = document.getElementById("searchResults");
  if (!dialog || !input || !list) return;

  const bookmarks = [...document.querySelectorAll(".links a")].map((a) => ({
    name: a.textContent.trim(),
    href: a.href,
    icon: a.querySelector("use")?.getAttribute("href"),
  }));
  const URLISH = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i;
  const SVG_NS = "http://www.w3.org/2000/svg";
  let selected = 0;

  const option = ([name, href, iconId, kind], i) => {
    const a = document.createElement("a");
    a.className = "result";
    a.id = `result-${i}`;
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("role", "option");

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", iconId);
    svg.append(use);

    const label = document.createElement("span");
    label.className = "result-name";
    label.textContent = name;
    const tag = document.createElement("span");
    tag.className = "result-kind";
    tag.textContent = kind;

    a.append(svg, label, tag);
    return a;
  };

  const results = (q) => {
    const needle = q.toLowerCase();
    const out = bookmarks
      .map((b) => ({ ...b, at: b.name.toLowerCase().indexOf(needle) }))
      .filter((b) => b.at !== -1)
      .sort((a, b) => a.at - b.at)
      .map((b) => [b.name, b.href, b.icon, "Bookmark"]);
    if (URLISH.test(q)) {
      out.push([q, /^https?:\/\//i.test(q) ? q : `https://${q}`, "#mdi-open-in-new", "Visit URL"]);
    }
    out.push([q, `https://www.google.com/search?q=${encodeURIComponent(q)}`, "#mdi-magnify", "Search Google"]);
    return out;
  };

  const select = (i) => {
    const opts = [...list.children];
    if (!opts.length) return;
    selected = (i + opts.length) % opts.length;
    opts.forEach((el, j) => el.setAttribute("aria-selected", String(j === selected)));
    opts[selected].scrollIntoView({ block: "nearest" });
    input.setAttribute("aria-activedescendant", opts[selected].id);
  };

  const render = () => {
    const q = input.value.trim();
    list.replaceChildren(...(q ? results(q).map(option) : []));
    if (q) select(0);
    else input.removeAttribute("aria-activedescendant");
  };

  document.addEventListener("keydown", (e) => {
    if (dialog.open || e.defaultPrevented || e.isComposing) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || e.key === " ") return;
    e.preventDefault();
    dialog.showModal();
    input.value = e.key;
    render();
  });

  input.addEventListener("input", render);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      select(selected + (e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault();
      list.children[selected]?.click();
    }
  });

  list.addEventListener("mousemove", (e) => {
    const i = [...list.children].indexOf(e.target.closest(".result"));
    if (i !== -1 && i !== selected) select(i);
  });
  list.addEventListener("click", (e) => {
    if (e.target.closest(".result")) dialog.close();
  });
  // A click whose target is the <dialog> itself landed on the backdrop.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    input.value = "";
    render();
  });
})();
