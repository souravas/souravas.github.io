// ========================
// Theme Toggle using data attribute with preferred color scheme detection
// ========================
const toggleButton = document.getElementById("theme-toggle");

// Check if a theme is stored; if not, use the user's preferred color scheme.
let storedTheme = localStorage.getItem("theme");
if (!storedTheme) {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    storedTheme = "dark";
  } else {
    storedTheme = "light";
  }
  localStorage.setItem("theme", storedTheme);
}

if (storedTheme === "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
  toggleButton.textContent = "☀️";
} else {
  document.documentElement.removeAttribute("data-theme");
  toggleButton.textContent = "🌙";
}

toggleButton.addEventListener("click", () => {
  if (document.documentElement.getAttribute("data-theme") === "dark") {
    document.documentElement.removeAttribute("data-theme");
    toggleButton.textContent = "🌙";
    localStorage.setItem("theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    toggleButton.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  }
});

// ========================
// Back-to-Top Button
// ========================
const backToTop = document.getElementById("back-to-top");

window.addEventListener("scroll", () => {
  backToTop.style.display = window.scrollY > 300 ? "block" : "none";
});

backToTop.addEventListener("click", (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Ensure correct initial display
backToTop.style.display = window.scrollY > 300 ? "flex" : "none";

// ========================
// Fixed Navigation Highlighting (with caching)
// ========================
document.addEventListener("DOMContentLoaded", () => {
  const sections = Array.from(document.querySelectorAll("section[id]"));
  const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
  const mobileLinks = Array.from(document.querySelectorAll(".mobile-nav a"));
  const headerOffset = 100; // Adjust if needed

  function updateActiveLink() {
    let currentSection = "";
    const scrollY = window.scrollY;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - headerOffset;
      const sectionHeight = section.offsetHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentSection = section.getAttribute("id");
      }
    });

    // If at the bottom of the page, set currentSection to the last section
    if (window.innerHeight + scrollY >= document.body.offsetHeight - 5) {
      currentSection = sections[sections.length - 1].getAttribute("id");
    }

    navLinks.forEach((link) => {
      if (link.getAttribute("href") === `#${currentSection}`) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    mobileLinks.forEach((link) => {
      if (link.getAttribute("href") === `#${currentSection}`) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  window.addEventListener("scroll", updateActiveLink);
  updateActiveLink();
});

// ========================
// Mobile Menu Toggle with aria-expanded
// ========================
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobileNav");

if (hamburger) {
  hamburger.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
    const expanded = hamburger.getAttribute("aria-expanded") === "true";
    hamburger.setAttribute("aria-expanded", (!expanded).toString());
  });
}

// Close mobile menu on link click
document.querySelectorAll(".mobile-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
  });
});
