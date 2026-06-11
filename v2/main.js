const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const idle = window.requestIdleCallback || ((cb) => setTimeout(() => cb({ timeRemaining: () => 0 }), 1));

/* ---------- Theme toggle (paper-sheet sweep) ---------- */
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
      if (themeMeta) themeMeta.content = next === "light" ? "#f3eee3" : "#171511";
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
  const links = document.querySelector(".m-nav");
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

/* ---------- Scroll: progress rule + active section ---------- */
(() => {
  const header = document.querySelector(".masthead");
  const progress = document.querySelector(".progress span");
  const navLinks = Array.from(document.querySelectorAll(".m-nav a[href^='#']"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  let headerOffset = (header?.offsetHeight ?? 58) + 24;
  const publishOffset = () => {
    headerOffset = (header?.offsetHeight ?? 58) + 24;
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

/* ---------- Spec tape: only animate while on screen ---------- */
(() => {
  const tape = document.querySelector(".tape");
  if (!tape) return;
  if (typeof IntersectionObserver === "undefined") {
    tape.classList.add("is-rolling");
    return;
  }
  const io = new IntersectionObserver(
    ([entry]) => tape.classList.toggle("is-rolling", entry.isIntersecting),
    { rootMargin: "50px 0px" }
  );
  io.observe(tape);
})();

/* ---------- Outcome count-up ---------- */
(() => {
  if (reduceMotion || typeof IntersectionObserver === "undefined") return;
  const counters = document.querySelectorAll(".count, .e-bullets .m");
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

/* ---------- Footer year + IST clock ---------- */
(() => {
  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const el = document.getElementById("footer-time");
  if (!el || typeof Intl === "undefined") return;
  const fmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
  const tick = () => {
    el.textContent = ` · ${fmt.format(new Date())} IST`;
  };
  tick();
  setInterval(() => {
    if (!document.hidden) tick();
  }, 30000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
  });
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
    setLabel("Opening your mail app…", 2600);
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
      setLabel("Message sent ✓", 4000);
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
    "%c SOURAV — SYSTEMS LEDGER %c backend engineer · thanks for reading the fine print.\n%c source → https://github.com/souravas/souravas.github.io",
    "background:#c23a16;color:#f3eee3;font-weight:700;padding:2px 8px;font-family:monospace",
    "color:inherit;font-family:monospace",
    "color:#c23a16;font-family:monospace"
  );
});
