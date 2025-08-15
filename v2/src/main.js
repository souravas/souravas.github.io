// Import styles
import './style.css'

// Theme toggle with improved performance
(function(){
  const root = document.documentElement;
  const key = "theme";

  // Apply saved theme immediately
  const saved = localStorage.getItem(key);
  if(saved === 'light'){
    root.setAttribute("data-theme", saved);
  }

  // Setup theme toggle button
  const btn = document.getElementById("themeToggle");
  if(btn){
    btn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme");
      const next = current === "light" ? null : "light";

      if(next){
        root.setAttribute("data-theme", next);
        localStorage.setItem(key, next);
      } else {
        root.removeAttribute("data-theme");
        localStorage.removeItem(key);
      }
    });
  }
})();

// Mobile navigation toggle - Simplified
document.addEventListener('DOMContentLoaded', function(){
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.querySelector(".nav-links");

  if(navToggle && navLinks){
    console.log("Navigation elements found and ready"); // Debug log

    navToggle.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = navLinks.classList.contains("open");

      if(isOpen) {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        console.log("Menu closed");
      } else {
        navLinks.classList.add("open");
        navToggle.setAttribute("aria-expanded", "true");
        console.log("Menu opened");
      }
    });

    // Close menu when clicking on a link
    navLinks.addEventListener("click", function(e) {
      if(e.target.tagName === "A"){
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        console.log("Menu closed via link click");
      }
    });

    // Close menu when clicking outside
    document.addEventListener("click", function(e) {
      if(!navToggle.contains(e.target) && !navLinks.contains(e.target)){
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  } else {
    console.error("Navigation elements not found!", {
      navToggle: !!navToggle,
      navLinks: !!navLinks
    });
  }
});// Contact form -> fallback to mailto with better UX
(function(){
  const form = document.getElementById('contact-form');
  if(!form) return;

  form.addEventListener('submit', (e)=>{
    e.preventDefault();

    try {
      const data = new FormData(form);
      const name = encodeURIComponent(data.get('name') || "");
      const email = encodeURIComponent(data.get('email') || "");
      const msg = encodeURIComponent(data.get('message') || "");

      if(!name || !email || !msg) {
        alert('Please fill in all fields');
        return;
      }

      const subject = `Website contact from ${decodeURIComponent(name)}`;
      const body = `From: ${decodeURIComponent(name)} <${decodeURIComponent(email)}>%0D%0A%0D%0A${decodeURIComponent(msg)}`;
      window.location.href = `mailto:souravas007@gmail.com?subject=${subject}&body=${body}`;
    } catch (error) {
      console.error('Contact form error:', error);
      alert('Error sending message. Please try again.');
    }
  });
})();

// Back-to-Top Button functionality
(function(){
  const backToTop = document.getElementById("back-to-top");
  if(!backToTop) return;

  function toggleBackToTopVisibility() {
    if (window.scrollY > 300) {
      backToTop.classList.add('is-visible');
    } else {
      backToTop.classList.remove('is-visible');
    }
  }

  // Throttle scroll events for performance
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

  window.addEventListener("scroll", throttledScroll);
  
  backToTop.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  
  // Initial check
  toggleBackToTopVisibility();
})();

// Active navigation highlighting - Simple and reliable approach
(function(){
  const sections = Array.from(document.querySelectorAll("section[id]"));
  const navLinks = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
  const headerOffset = 120; // Slightly larger offset

  function updateActiveLink() {
    const scrollY = window.scrollY;
    let currentSection = "";
    
    // Simple approach: find the section whose top is closest to current scroll position
    // but only if we've actually scrolled past its beginning
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      const sectionTop = section.offsetTop - headerOffset;
      
      if (scrollY >= sectionTop) {
        currentSection = section.getAttribute("id");
        break;
      }
    }

    // Don't highlight anything if we're at the very top
    if (scrollY < 50) {
      currentSection = "";
    }

    // Don't highlight contact unless we're really deep into it
    if (currentSection === "contact") {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        const contactTop = contactSection.offsetTop - headerOffset;
        const contactHeight = contactSection.offsetHeight;
        
        // Only highlight contact if we're at least 200px into the section
        if (scrollY < contactTop + 200) {
          currentSection = ""; // Don't highlight contact unless we're really in it
        }
      }
    }

    navLinks.forEach(link => {
      const targetSection = link.getAttribute("href")?.substring(1);
      const isActive = currentSection && currentSection === targetSection;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
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

  window.addEventListener("scroll", throttledNavScroll);
  updateActiveLink(); // Initial check
})();

// Load projects from GitHub with improved error handling
(async function loadProjects(){
  const grid = document.getElementById("projects-grid");
  if(!grid) return;

  // Add loading state
  grid.innerHTML = '<div class="loading">Loading projects...</div>';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch("https://api.github.com/users/souravas/repos?per_page=100&sort=updated", {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if(!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const repos = await res.json();

    // Filter & rank with better logic
    const filtered = repos
      .filter(r => !r.fork && !r.private && r.description) // Only repos with descriptions
      .sort((a,b)=> {
        // Prioritize by stars, then by recent updates
        const starDiff = b.stargazers_count - a.stargazers_count;
        if (starDiff !== 0) return starDiff;
        return new Date(b.updated_at) - new Date(a.updated_at);
      })
      .slice(0,6);

    if(filtered.length === 0) {
      throw new Error("No public repositories found");
    }

    // Clear loading state
    grid.innerHTML = '';

    for(const r of filtered){
      const el = document.createElement("a");
      el.className = "card";
      el.href = r.html_url;
      el.target = "_blank";
      el.rel = "noreferrer";
      el.innerHTML = `<h3>${r.name}</h3>
        <p class="muted">${r.description ?? "No description provided."}</p>
        <p class="small muted">★ ${r.stargazers_count} · ⑂ ${r.forks_count} · Updated ${new Date(r.updated_at).toLocaleDateString()}</p>`;
      grid.appendChild(el);
    }
  } catch (err){
    grid.innerHTML = `<p class="muted">Couldn’t auto-load projects right now. Visit <a href="https://github.com/souravas" target="_blank" rel="noreferrer">github.com/souravas</a>.</p>`;
  }
})();