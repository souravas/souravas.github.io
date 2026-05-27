import "./style.css";

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;
const idle = window.requestIdleCallback || ((cb) => setTimeout(() => cb({ timeRemaining: () => 0 }), 1));

/* ---------- Theme toggle ---------- */
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
      if (themeMeta) themeMeta.content = next === "light" ? "#f6f3ec" : "#08090c";
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

/* ---------- Mobile nav toggle ---------- */
(() => {
  const toggle = document.getElementById("navToggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  const close = () => {
    if (!links.classList.contains("open")) return;
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      const first = links.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    }
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

/* ---------- Scroll: header, progress, active link, back-to-top ---------- */
(() => {
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress span");
  const backToTop = document.getElementById("back-to-top");
  const navLinks = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  let headerOffset = (header?.offsetHeight ?? 80) + 24;
  const publishOffset = () => {
    headerOffset = (header?.offsetHeight ?? 80) + 24;
    root.style.setProperty("--scroll-padding", `${headerOffset}px`);
  };
  publishOffset();

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (header) header.classList.toggle("is-scrolled", y > 8);
      if (backToTop) backToTop.classList.toggle("is-visible", y > 300);

      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? Math.min(100, (y / max) * 100) : 0;
        progress.style.width = pct + "%";
      }

      // active link: pick the last section whose top has entered the upper
      // third of the visible area below the header. This makes short
      // trailing sections (like Contact) light up as soon as they dominate
      // the viewport, even if the page can't scroll far enough to push
      // their top past the header line.
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
  const items = document.querySelectorAll(".reveal");
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
        const delay = parseInt(el.dataset.delay || "0", 10);
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add("is-visible");
        io.unobserve(el);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
  );
  items.forEach((el) => io.observe(el));

  // Safety net: if the page never scrolls (bot, headless tester, very tall
  // viewport, or content-visibility skipping intersection callbacks for
  // off-screen sections) reveal everything after a short idle so the page
  // can never get stuck with permanently invisible content.
  idle(() => setTimeout(revealAll, 1500));
})();

/* ---------- Cursor glow ---------- */
idle(() => {
  if (!finePointer || reduceMotion) return;
  const glow = document.querySelector(".cursor-glow");
  if (!glow) return;

  let mx = -9999, my = -9999, tx = -9999, ty = -9999;
  let running = false;

  const tick = () => {
    const dx = mx - tx;
    const dy = my - ty;
    tx += dx * 0.18;
    ty += dy * 0.18;
    glow.style.transform = `translate3d(${tx - 180}px, ${ty - 180}px, 0)`;
    if (Math.abs(dx) > 0.25 || Math.abs(dy) > 0.25) {
      requestAnimationFrame(tick);
    } else {
      running = false;
    }
  };

  window.addEventListener("pointermove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  }, { passive: true });
});

/* ---------- Tile spotlight (per-tile, no scroll listener) ---------- */
idle(() => {
  if (!finePointer || reduceMotion) return;
  document.querySelectorAll(".tile").forEach((tile) => {
    let rect = null;
    let frame = 0;
    let lx = 0, ly = 0;
    const apply = () => {
      frame = 0;
      tile.style.setProperty("--mx", `${lx}px`);
      tile.style.setProperty("--my", `${ly}px`);
    };
    tile.addEventListener("pointerenter", () => { rect = tile.getBoundingClientRect(); });
    tile.addEventListener("pointermove", (e) => {
      if (!rect) rect = tile.getBoundingClientRect();
      lx = e.clientX - rect.left;
      ly = e.clientY - rect.top;
      if (!frame) frame = requestAnimationFrame(apply);
    }, { passive: true });
    tile.addEventListener("pointerleave", () => {
      rect = null;
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
    });
  });
});

/* ---------- Magnetic buttons ---------- */
idle(() => {
  if (!finePointer || reduceMotion) return;
  const buttons = document.querySelectorAll(".magnetic");
  const strength = 14;
  const lift = 2; // matches CSS .btn:hover { transform: translateY(-2px) }

  buttons.forEach((btn) => {
    let frame = 0;
    let tx = 0, ty = 0;
    const apply = () => {
      frame = 0;
      btn.style.transform = `translate(${tx}px, ${ty - lift}px)`;
    };
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * strength;
      ty = ((e.clientY - r.top) / r.height - 0.5) * strength;
      if (!frame) frame = requestAnimationFrame(apply);
    });
    btn.addEventListener("pointerleave", () => {
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      btn.style.transform = "";
    });
  });
});

/* ---------- Hero card tilt ---------- */
idle(() => {
  if (!finePointer || reduceMotion) return;
  const card = document.querySelector(".hero-card");
  if (!card) return;

  let frame = 0;
  let rx = 0, ry = 0;
  const apply = () => {
    frame = 0;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rx = +(-py * 4).toFixed(2);
    ry = +(px * 6).toFixed(2);
    if (!frame) frame = requestAnimationFrame(apply);
  });
  card.addEventListener("pointerleave", () => {
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    card.style.transform = "";
  });
});

/* ---------- Back-to-top FAB ---------- */
(() => {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
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

/* ---------- Pause atmosphere when tab hidden ---------- */
(() => {
  document.addEventListener("visibilitychange", () => {
    root.classList.toggle("is-bg-paused", document.hidden);
  });
})();

/* ---------- Footer year ---------- */
(() => {
  const el = document.getElementById("footer-year");
  if (el) el.textContent = new Date().getFullYear();
})();

/* ---------- Contact form (mailto fallback) ---------- */
(() => {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const name = (data.get("name") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const msg = (data.get("message") || "").toString().trim();

    const subject = encodeURIComponent(`Website contact from ${name}`);
    const body = encodeURIComponent(`From: ${name} <${email}>\n\n${msg}`);
    const href = `mailto:souravas007@gmail.com?subject=${subject}&body=${body}`;

    // Open via a synthetic <a> so handler-less devices fall back to whatever
    // the OS does with mailto: links, rather than navigating the page away.
    const a = document.createElement("a");
    a.href = href;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
})();

/* ---------- Lazy prefetch the résumé on hover/focus ---------- */
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
