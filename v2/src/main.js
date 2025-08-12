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

// Contact form -> fallback to mailto with better UX
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

// Contact form -> fallback to mailto with better UX
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