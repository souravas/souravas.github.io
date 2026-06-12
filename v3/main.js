const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const idle = window.requestIdleCallback || ((cb) => setTimeout(() => cb({ timeRemaining: () => 0 }), 1));

/* ---------- Theme toggle (shift change) ---------- */
(() => {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  btn.setAttribute("aria-pressed", root.getAttribute("data-theme") === "light" ? "true" : "false");
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    const run = () => {
      root.setAttribute("data-theme", next);
      root.style.colorScheme = next;
      if (themeMeta) themeMeta.content = next === "light" ? "#edf0ea" : "#050807";
      localStorage.setItem("theme", next);
      btn.setAttribute("aria-pressed", next === "light" ? "true" : "false");
    };
    if (document.startViewTransition && !reduceMotion) {
      document.startViewTransition(run);
    } else {
      run();
    }
    setTimeout(() => btn.blur(), 150);
  });
})();

/* ---------- Mobile nav ---------- */
(() => {
  const toggle = document.getElementById("navToggle");
  const links = document.querySelector(".nav");
  if (!toggle || !links) return;

  const mobileMq = window.matchMedia("(max-width: 860px)");
  const syncInert = () => {
    links.inert = mobileMq.matches && !links.classList.contains("open");
  };
  syncInert();
  mobileMq.addEventListener("change", syncInert);

  const close = () => {
    if (!links.classList.contains("open")) return;
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    syncInert();
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    syncInert();
    if (open) links.querySelector("a")?.focus({ preventScroll: true });
  });

  links.addEventListener("click", (e) => {
    if (e.target.tagName === "A") close();
  });
  document.addEventListener("click", (e) => {
    if (!toggle.contains(e.target) && !links.contains(e.target)) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.classList.contains("open")) {
      close();
      toggle.focus({ preventScroll: true });
    }
  });
})();

/* ---------- Scroll: progress, active section, back-to-top ---------- */
(() => {
  const header = document.querySelector(".console-bar");
  const progress = document.querySelector(".progress span");
  const backToTop = document.getElementById("back-to-top");
  const navLinks = Array.from(document.querySelectorAll(".nav a[href^='#']"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  let headerOffset = (header?.offsetHeight ?? 56) + 24;
  const publishOffset = () => {
    headerOffset = (header?.offsetHeight ?? 56) + 24;
    root.style.setProperty("--scroll-padding", `${headerOffset}px`);
  };
  publishOffset();

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;

      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      }

      backToTop?.classList.toggle("show", y > 480);

      const visible = window.innerHeight - headerOffset;
      const threshold = headerOffset + Math.max(80, visible / 3);
      let activeId = "";
      for (const sec of sections) {
        if (sec.getBoundingClientRect().top <= threshold) activeId = sec.id;
      }
      navLinks.forEach((a) => {
        const active = a.getAttribute("href") === "#" + activeId;
        a.classList.toggle("is-active", active);
        if (active) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });

      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      publishOffset();
      onScroll();
    }, 100);
  });
  onScroll();
})();

/* ---------- Reveal on scroll ---------- */
(() => {
  const items = document.querySelectorAll(".rv");
  if (!items.length) return;

  const revealAll = () => items.forEach((el) => el.classList.add("is-visible"));

  if (reduceMotion || typeof IntersectionObserver === "undefined") {
    revealAll();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.style.transitionDelay = `${parseInt(el.dataset.delay || "0", 10)}ms`;
        el.classList.add("is-visible");
        io.unobserve(el);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
  );
  items.forEach((el) => io.observe(el));

  // Safety net: never leave content invisible if intersection callbacks
  // don't fire (bots, headless, very tall viewports).
  idle(() => setTimeout(revealAll, 1500));
})();

/* ---------- Telemetry stream: only animate while on screen ---------- */
(() => {
  const stream = document.querySelector(".stream");
  if (!stream) return;
  if (typeof IntersectionObserver === "undefined") {
    stream.classList.add("is-rolling");
    return;
  }
  const io = new IntersectionObserver(
    ([entry]) => stream.classList.toggle("is-rolling", entry.isIntersecting),
    { rootMargin: "50px 0px" }
  );
  io.observe(stream);
})();

/* ---------- Metric count-up ---------- */
(() => {
  if (reduceMotion || typeof IntersectionObserver === "undefined") return;
  const counters = document.querySelectorAll(".count, .d-bullets .m");
  if (!counters.length) return;

  const animate = (el, prefix, target, decimals, suffix) => {
    const dur = 1100;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = prefix + (target * ease(p)).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);
        const m = el.textContent.match(/^([^0-9]*)(\d+(?:\.\d+)?)(.*)$/);
        if (!m) return;
        const decimals = (m[2].split(".")[1] || "").length;
        el.style.minWidth = `${el.offsetWidth}px`;
        const wait = parseInt(el.closest(".rv")?.dataset.delay || "0", 10) + 200;
        setTimeout(() => animate(el, m[1], parseFloat(m[2]), decimals, m[3]), wait);
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((el) => io.observe(el));
})();

/* ---------- Uptime readout (career started Jun 2019) ---------- */
(() => {
  const el = document.getElementById("uptime");
  if (!el) return;
  const now = new Date();
  const months = (now.getFullYear() - 2019) * 12 + now.getMonth() - 5;
  if (months < 0) return;
  const y = Math.floor(months / 12);
  const m = months % 12;
  el.textContent = m === 0 ? `${y}y` : `${y}y ${m}m`;
})();

/* ---------- Drop focus ring after opening external links ---------- */
(() => {
  const isExternal = (a) =>
    a && (a.hasAttribute("target") || /^https?:\/\//i.test(a.getAttribute("href") || ""));

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (isExternal(link)) setTimeout(() => link.blur(), 150);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    const el = document.activeElement;
    if (el && el.tagName === "A" && isExternal(el)) el.blur();
  });
})();

/* ---------- Clocks: console bar (IST, seconds) + footer ---------- */
(() => {
  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  if (typeof Intl === "undefined") return;

  const barEl = document.getElementById("sys-clock");
  const footEl = document.getElementById("footer-time");

  const barFmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
  const footFmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });

  const tick = () => {
    const now = new Date();
    if (barEl) barEl.textContent = `${barFmt.format(now)} IST`;
    if (footEl) footEl.textContent = ` · ${footFmt.format(now)} IST`;
  };
  tick();
  setInterval(() => {
    if (!document.hidden) tick();
  }, 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
  });
})();

/* ---------- HUD: cursor + scroll telemetry (fine pointers only) ---------- */
(() => {
  if (reduceMotion) return;
  const hud = document.getElementById("hud");
  if (!hud || !window.matchMedia("(pointer: fine) and (min-width: 961px)").matches) return;

  const xEl = document.getElementById("hud-x");
  const yEl = document.getElementById("hud-y");
  const sEl = document.getElementById("hud-s");
  hud.classList.add("hud-on");

  const pad = (n, w) => String(Math.max(0, Math.round(n))).padStart(w, "0");
  let px = 0;
  let py = 0;
  let queued = false;

  const paint = () => {
    queued = false;
    if (xEl) xEl.textContent = `x:${pad(px, 4)}`;
    if (yEl) yEl.textContent = `y:${pad(py, 4)}`;
    if (sEl) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      sEl.textContent = `scroll:${pad(pct, 3)}%`;
    }
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(paint);
  };

  window.addEventListener(
    "pointermove",
    (e) => {
      px = e.clientX;
      py = e.clientY;
      queue();
    },
    { passive: true }
  );
  window.addEventListener("scroll", queue, { passive: true });
  paint();
})();

/* ---------- Contact form (Formspree, mailto fallback) ---------- */
(() => {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const label = button ? button.querySelector("span") : null;
  const labelText = label ? label.textContent : "";
  let labelTimer = 0;

  const setLabel = (text, revertAfter) => {
    if (!label) return;
    clearTimeout(labelTimer);
    label.textContent = text;
    if (revertAfter) {
      labelTimer = setTimeout(() => {
        label.textContent = labelText;
      }, revertAfter);
    }
  };

  const mailtoFallback = (name, email, msg) => {
    const subject = encodeURIComponent(`Website contact from ${name}`);
    const body = encodeURIComponent(`From: ${name} <${email}>\n\n${msg}`);
    const a = document.createElement("a");
    a.href = `mailto:souravas007@gmail.com?subject=${subject}&body=${body}`;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setLabel("Opening mail app…", 2600);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const name = (data.get("name") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const msg = (data.get("message") || "").toString().trim();
    data.set("_subject", `Website contact from ${name}`);

    if (button) button.disabled = true;
    setLabel("Transmitting…");

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Formspree responded ${res.status}`);
      form.reset();
      setLabel("Transmission ok ✓", 4000);
    } catch {
      mailtoFallback(name, email, msg);
    } finally {
      if (button) button.disabled = false;
    }
  });
})();

/* ---------- Résumé prefetch on intent ---------- */
(() => {
  const targets = document.querySelectorAll('a[href$="resume.pdf"]');
  if (!targets.length) return;
  let prefetched = false;
  const prefetch = () => {
    if (prefetched) return;
    prefetched = true;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "document";
    link.href = "/assets/resume.pdf";
    document.head.appendChild(link);
  };
  targets.forEach((el) => {
    el.addEventListener("pointerenter", prefetch, { once: true });
    el.addEventListener("focus", prefetch, { once: true });
    el.addEventListener("touchstart", prefetch, { once: true, passive: true });
  });
})();

/* ---------- Console colophon ---------- */
idle(() => {
  console.log(
    "%c SOURAV.SYS — CONTROL ROOM %c all systems operational · uptime 7y · 0 rollbacks\n%c source → https://github.com/souravas/souravas.github.io",
    "background:#46e08e;color:#04130b;font-weight:700;padding:2px 8px;font-family:monospace",
    "color:inherit;font-family:monospace",
    "color:#46e08e;font-family:monospace"
  );
});
