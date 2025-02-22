// ========================
// Theme Toggle using data attribute
// ========================
const toggleButton = document.getElementById("theme-toggle");
const currentTheme = localStorage.getItem("theme");

if (currentTheme === "dark") {
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
// Fixed Navigation Highlighting
// ========================
document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a");
  const mobileLinks = document.querySelectorAll(".mobile-nav a");
  const headerOffset = 100; // Adjust if needed

  function updateActiveLink() {
    let currentSection = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - headerOffset;
      const sectionHeight = section.offsetHeight;
      if (
        window.scrollY >= sectionTop &&
        window.scrollY < sectionTop + sectionHeight
      ) {
        currentSection = section.getAttribute("id");
      }
    });

    // If at the bottom of the page, explicitly set currentSection to the last section
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 5) {
      currentSection = sections[sections.length - 1].getAttribute("id");
    }

    navLinks.forEach((link) => link.classList.remove("active"));
    mobileLinks.forEach((link) => link.classList.remove("active"));

    if (currentSection) {
      document
        .querySelector(`.nav-links a[href="#${currentSection}"]`)
        ?.classList.add("active");
      document
        .querySelector(`.mobile-nav a[href="#${currentSection}"]`)
        ?.classList.add("active");
    }
  }

  window.addEventListener("scroll", updateActiveLink);
  updateActiveLink();
});

// ========================
// Mobile Menu Toggle
// ========================
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobileNav");

if (hamburger) {
  hamburger.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
    const expanded =
      hamburger.getAttribute("aria-expanded") === "true" ? true : false;
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
