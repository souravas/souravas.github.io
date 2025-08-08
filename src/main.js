//
// ========================
// Theme Toggle (Runs Immediately)
// ========================
const toggleButton = document.getElementById("theme-toggle");

(function initializeTheme() {
  let storedTheme = localStorage.getItem("theme");

  // If no stored theme, default based on system preference
  if (!storedTheme) {
    storedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  setTheme(storedTheme);
})();

function setTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    toggleButton.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
    toggleButton.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
}

toggleButton.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  setTheme(isDark ? "light" : "dark");
});

//
// ========================
// Main DOMContentLoaded
// ========================
document.addEventListener("DOMContentLoaded", () => {
  // Reusable throttle (moved up for other features)
  function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  //
  // Back-to-Top Button (Throttled)
  //
  const backToTop = document.getElementById("back-to-top");
  function toggleBackToTopVisibility() {
    if (window.scrollY > 300) backToTop.classList.add('is-visible'); else backToTop.classList.remove('is-visible');
  }
  window.addEventListener("scroll", throttle(toggleBackToTopVisibility, 100));
  backToTop.addEventListener("click", (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  toggleBackToTopVisibility();

  //
  // Navigation Highlighting (Throttled)
  //
  const sections = Array.from(document.querySelectorAll("section[id]"));
  const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
  const mobileLinks = Array.from(document.querySelectorAll(".mobile-nav a"));
  const headerOffset = 100;

  function updateActiveLink() {
    let currentSection = ""; const scrollY = window.scrollY;
    sections.forEach(section => {
      const sectionTop = section.offsetTop - headerOffset; const sectionHeight = section.offsetHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) currentSection = section.getAttribute("id");
    });
    if (window.innerHeight + scrollY >= document.body.offsetHeight - 5 && sections.length) currentSection = sections[sections.length - 1].getAttribute("id");
    [...navLinks, ...mobileLinks].forEach(link => {
      const isActive = link.getAttribute("href") === `#${currentSection}`;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener("scroll", throttle(updateActiveLink, 100));
  updateActiveLink();

  //
  // Mobile Menu Toggle
  //
  const hamburger = document.getElementById("hamburger");
  const mobileNav = document.getElementById("mobileNav");

  if (hamburger && mobileNav) {
    hamburger.addEventListener("click", () => {
      mobileNav.classList.toggle("open");
      const expanded = hamburger.getAttribute("aria-expanded") === "true";
      hamburger.setAttribute("aria-expanded", String(!expanded));
    });

    // Close mobile menu when any link is clicked
    mobileNav.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (link) {
        mobileNav.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
      }
    });
  }

  //
  // Service Worker Registration
  //
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ SW registered successfully:', registration);

          // Optional: Show a subtle indicator that SW is active
          if (registration.active) {
            console.log('🔄 Service Worker is active and running');
          }
        })
        .catch((registrationError) => {
          console.error('❌ SW registration failed:', registrationError);
        });
    });
  } else {
    console.log('❌ Service Worker not supported in this browser');
  }

  //
  // Resume/CV Lazy Loading
  //
  const cvButton = document.querySelector('a[href="assets/resume.pdf"]');
  if (cvButton) {
    cvButton.addEventListener('click', (e) => {
      // Let the default behavior happen (open PDF)
      // But also cache it for future offline use
      if ('caches' in window) {
        caches.open('sourav-portfolio-v1').then(cache => {
          cache.add('/assets/resume.pdf').catch(err => {
            console.log('Failed to cache resume:', err);
          });
        });
      }
    });
  }
});
