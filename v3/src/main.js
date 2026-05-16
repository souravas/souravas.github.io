import "./style.css";

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Theme toggle ---------- */
(() => {
  const KEY = "theme-v3";
  const btn = document.getElementById("themeToggle");

  const apply = (t) => {
    root.setAttribute("data-theme", t);
    root.style.colorScheme = t;
  };

  const saved = localStorage.getItem(KEY);
  apply(saved === "light" ? "light" : "dark");

  if (!btn) return;
  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    const run = () => {
      apply(next);
      localStorage.setItem(KEY, next);
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
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  links.addEventListener("click", (e) => {
    if (e.target.tagName === "A") close();
  });

  document.addEventListener("click", (e) => {
    if (!toggle.contains(e.target) && !links.contains(e.target)) close();
  });
})();

/* ---------- Scroll: header style, progress bar, active link ---------- */
(() => {
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress span");
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
  window.addEventListener("resize", () => {
    publishOffset();
    onScroll();
  });
  onScroll();
})();

/* ---------- Reveal on scroll ---------- */
(() => {
  if (reduceMotion) {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
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
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();

/* ---------- Cursor glow + tile spotlight ---------- */
(() => {
  if (!window.matchMedia("(pointer: fine)").matches || reduceMotion) return;
  const glow = document.querySelector(".cursor-glow");
  const tiles = Array.from(document.querySelectorAll(".tile"));

  let mx = -9999, my = -9999, tx = -9999, ty = -9999;
  const lerp = (a, b, t) => a + (b - a) * t;

  window.addEventListener("pointermove", (e) => {
    mx = e.clientX;
    my = e.clientY;

    for (const tile of tiles) {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty("--mx", `${e.clientX - r.left}px`);
      tile.style.setProperty("--my", `${e.clientY - r.top}px`);
    }
  }, { passive: true });

  function tick() {
    tx = lerp(tx, mx, 0.18);
    ty = lerp(ty, my, 0.18);
    if (glow) glow.style.transform = `translate3d(${tx - 240}px, ${ty - 240}px, 0)`;
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ---------- Magnetic buttons ---------- */
(() => {
  if (!window.matchMedia("(pointer: fine)").matches || reduceMotion) return;
  const buttons = document.querySelectorAll(".magnetic");
  const strength = 14;

  buttons.forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * strength;
      const y = ((e.clientY - r.top) / r.height - 0.5) * strength;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener("pointerleave", () => {
      btn.style.transform = "";
    });
  });
})();

/* ---------- Hero card tilt ---------- */
(() => {
  if (!window.matchMedia("(pointer: fine)").matches || reduceMotion) return;
  const card = document.querySelector(".hero-card");
  if (!card) return;

  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
  });
  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
})();

/* ---------- Back-to-top FAB ---------- */
(() => {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;

  let ticking = false;
  const update = () => {
    btn.classList.toggle("is-visible", window.scrollY > 300);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  update();
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

/* ---------- Contact form (mailto fallback) ---------- */
(() => {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get("name") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const msg = (data.get("message") || "").toString().trim();

    if (!name || !email || !msg) {
      alert("Please fill in all fields.");
      return;
    }
    const subject = encodeURIComponent(`Website contact from ${name}`);
    const body = encodeURIComponent(`From: ${name} <${email}>\n\n${msg}`);
    window.location.href = `mailto:souravas007@gmail.com?subject=${subject}&body=${body}`;
  });
})();
