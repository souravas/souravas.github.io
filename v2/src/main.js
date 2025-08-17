// Import styles
import "./style.css";

// Theme toggle functionality
(function () {
  const root = document.documentElement;
  const key = "theme";
  const btn = document.getElementById("themeToggle");

  function setTheme(theme) {
    if (theme === "light") {
      root.setAttribute("data-theme", theme);
      if (btn) btn.textContent = "☀️";
    } else {
      root.removeAttribute("data-theme");
      if (btn) btn.textContent = "🌙";
    }
  }

  const saved = localStorage.getItem(key);
  if (saved === "light") {
    setTheme("light");
  } else {
    setTheme("dark");
  }

  if (btn) {
    btn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme");
      const next = current === "light" ? "dark" : "light";

      setTheme(next);

      if (next === "light") {
        localStorage.setItem(key, next);
      } else {
        localStorage.removeItem(key);
      }

      // Remove focus to prevent the blue outline from staying
      setTimeout(() => {
        btn.blur();
      }, 150);
    });
  }
})();

// Mobile navigation toggle
document.addEventListener("DOMContentLoaded", function () {
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.querySelector(".nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = navLinks.classList.contains("open");

      if (isOpen) {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      } else {
        navLinks.classList.add("open");
        navToggle.setAttribute("aria-expanded", "true");
      }
    });

    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("click", function (e) {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }
});

// Contact form handling
(function () {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    try {
      const data = new FormData(form);
      const name = encodeURIComponent(data.get("name") || "");
      const email = encodeURIComponent(data.get("email") || "");
      const msg = encodeURIComponent(data.get("message") || "");

      if (!name || !email || !msg) {
        alert("Please fill in all fields");
        return;
      }

      const subject = `Website contact from ${decodeURIComponent(name)}`;
      const body = `From: ${decodeURIComponent(name)} <${decodeURIComponent(
        email
      )}>%0D%0A%0D%0A${decodeURIComponent(msg)}`;
      window.location.href = `mailto:souravas007@gmail.com?subject=${subject}&body=${body}`;
    } catch (error) {
      console.error("Contact form error:", error);
      alert("Error sending message. Please try again.");
    }
  });
})();

// Back-to-top button
(function () {
  const backToTop = document.getElementById("back-to-top");
  if (!backToTop) return;

  function toggleBackToTopVisibility() {
    if (window.scrollY > 300) {
      backToTop.classList.add("is-visible");
    } else {
      backToTop.classList.remove("is-visible");
    }
  }

  let ticking = false;
  function throttledScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        toggleBackToTopVisibility();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener("scroll", throttledScroll, { passive: true });

  backToTop.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  toggleBackToTopVisibility();
})();

// Active navigation highlighting (header-aware)
(function () {
  const sections = Array.from(document.querySelectorAll("section[id]"));
  const navLinks = Array.from(
    document.querySelectorAll(".nav-links a[href^='#']")
  );

  function getHeaderOffset() {
    const header = document.querySelector(".site-header");
    if (!header) return 80;
    // Add a little breathing room below the header
    return Math.ceil(header.offsetHeight + 20);
  }

  function setScrollPadding(px) {
    document.documentElement.style.setProperty("--scroll-padding", `${px}px`);
  }

  let headerOffset = getHeaderOffset();
  setScrollPadding(headerOffset);

  function updateActiveLink() {
    // +1 to avoid edge cases when scroll equals exact offsetTop
    const scrollY = window.scrollY + 1;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    let currentSection = "";

    const nearBottom = scrollY + windowHeight >= documentHeight - 100;

    if (nearBottom) {
      currentSection = sections.at(-1)?.id || "";
    } else {
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const sectionTop = section.offsetTop - headerOffset - 1;
        if (scrollY >= sectionTop) {
          currentSection = section.id;
          break;
        }
      }
      if (scrollY < 50) {
        currentSection = "";
      }
    }

    navLinks.forEach((link) => {
      const targetSection = link.getAttribute("href")?.substring(1);
      const isActive = currentSection && currentSection === targetSection;
      link.classList.toggle("active", !!isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  let navTicking = false;
  function throttledNavScroll() {
    if (!navTicking) {
      requestAnimationFrame(() => {
        updateActiveLink();
        navTicking = false;
      });
      navTicking = true;
    }
  }

  function onResize() {
    headerOffset = getHeaderOffset();
    setScrollPadding(headerOffset);
    updateActiveLink();
  }

  window.addEventListener("scroll", throttledNavScroll, { passive: true });
  window.addEventListener("resize", onResize);
  updateActiveLink();
})();

// Remove focus from external links
(function () {
  document.addEventListener("click", function (e) {
    const link = e.target.closest("a");

    if (link && (link.hasAttribute("target") || link.href.startsWith("http"))) {
      setTimeout(() => {
        link.blur();
      }, 150);
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      const focusedElement = document.activeElement;
      if (
        focusedElement &&
        focusedElement.tagName === "A" &&
        (focusedElement.hasAttribute("target") ||
          focusedElement.href.startsWith("http"))
      ) {
        focusedElement.blur();
      }
    }
  });
})();

// Load GitHub projects (if projects section exists)
(async function loadProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  grid.innerHTML = '<div class="loading">Loading projects...</div>';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(
      "https://api.github.com/users/souravas/repos?per_page=100&sort=updated",
      {
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const repos = await res.json();

    const filtered = repos
      .filter((r) => !r.fork && !r.private && r.description)
      .sort((a, b) => {
        const starDiff = b.stargazers_count - a.stargazers_count;
        if (starDiff !== 0) return starDiff;
        return new Date(b.updated_at) - new Date(a.updated_at);
      })
      .slice(0, 6);

    if (filtered.length === 0) {
      throw new Error("No public repositories found");
    }

    grid.innerHTML = "";

    for (const r of filtered) {
      const el = document.createElement("a");
      el.className = "card";
      el.href = r.html_url;
      el.target = "_blank";
      el.rel = "noreferrer";
      el.innerHTML = `<h3>${r.name}</h3>
        <p class="muted">${r.description ?? "No description provided."}</p>
        <p class="small muted">★ ${r.stargazers_count} · ⑂ ${
        r.forks_count
      } · Updated ${new Date(r.updated_at).toLocaleDateString()}</p>`;
      grid.appendChild(el);
    }
  } catch (err) {
    grid.innerHTML =
      `<p class="muted">Couldn't auto-load projects right now. Visit ` +
      `<a href="https://github.com/souravas" target="_blank" ` +
      `rel="noreferrer">github.com/souravas</a>.</p>`;
  }
})();