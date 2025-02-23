// ========================
// Theme Toggle
// ========================
const toggleButton = document.getElementById("theme-toggle");

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

// Check stored theme or system preference
(function initializeTheme() {
  let storedTheme = localStorage.getItem("theme");
  if (!storedTheme) {
    storedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  setTheme(storedTheme);
})();

// Toggle theme on button click
toggleButton.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  setTheme(isDark ? "light" : "dark");
});

// ========================
// Back-to-Top Button
// ========================
const backToTop = document.getElementById("back-to-top");

window.addEventListener("scroll", () => {
  backToTop.style.display = window.scrollY > 300 ? "flex" : "none";
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

    // If near bottom, treat last section as current
    if (
      window.innerHeight + scrollY >= document.body.offsetHeight - 5 &&
      sections.length
    ) {
      currentSection = sections[sections.length - 1].getAttribute("id");
    }

    // Toggle 'active' class for nav links
    navLinks.forEach((link) => {
      link.classList.toggle(
        "active",
        link.getAttribute("href") === `#${currentSection}`
      );
    });

    mobileLinks.forEach((link) => {
      link.classList.toggle(
        "active",
        link.getAttribute("href") === `#${currentSection}`
      );
    });
  }

  window.addEventListener("scroll", updateActiveLink);
  updateActiveLink();
});

// ========================
// Mobile Menu Toggle
// ========================
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobileNav");

if (hamburger && mobileNav) {
  hamburger.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
    const expanded = hamburger.getAttribute("aria-expanded") === "true";
    hamburger.setAttribute("aria-expanded", (!expanded).toString());
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

document.addEventListener("DOMContentLoaded", function () {
  const contactForm = document.getElementById("contact-form");
  const resultElement = document.getElementById("contact-result");

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent normal form submission

    const formData = new FormData(contactForm);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        // Success message
        resultElement.textContent = "Message sent successfully!";
        // Clear the form
        contactForm.reset();
      } else {
        // Error message from Web3Forms
        resultElement.textContent = data.message || "Something went wrong!";
      }
    } catch (error) {
      // Network or server error
      resultElement.textContent = "Unable to send. Please try again later.";
      console.error(error);
    }
  });
});
