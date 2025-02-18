// Theme Toggle
const toggleButton = document.getElementById("theme-toggle");
const currentTheme = localStorage.getItem("theme");

if (currentTheme === "dark") {
  document.body.classList.add("dark-mode");
  toggleButton.textContent = "☀️";
}

toggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const theme = document.body.classList.contains("dark-mode")
    ? "dark"
    : "light";
  toggleButton.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem("theme", theme);
});

// Back-to-Top Button
const backToTop = document.getElementById("back-to-top");
window.addEventListener("scroll", () => {
  backToTop.style.display = window.scrollY > 300 ? "block" : "none";
});
backToTop.addEventListener("click", (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Fixed Navigation Highlighting
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

// Mobile Menu Toggle
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobileNav");

if (hamburger) {
  hamburger.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
  });
}

// Close mobile menu on link click
document.querySelectorAll(".mobile-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
  });
});
