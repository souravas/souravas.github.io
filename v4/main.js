import "./style.css";

const root = document.documentElement;

/* ---------- Theme toggle ---------- */
(() => {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  const themeMetas = document.querySelectorAll('meta[name="theme-color"]');

  // The button's label ("Dark" / "Light") and color-scheme both follow
  // data-theme in CSS, so they are right from first paint. No inline
  // color-scheme: it would outrank the print stylesheet's light one.
  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    themeMetas.forEach((m) => {
      m.content = next === "dark" ? "#161615" : "#fdfdfc";
    });
    // Storage can be blocked (site data off, some private modes); the
    // theme still switches, it just isn't remembered.
    try {
      localStorage.setItem("theme", next);
    } catch {}
  });
})();

/* ---------- Footer year ---------- */
(() => {
  const el = document.getElementById("footer-year");
  if (el) el.textContent = new Date().getFullYear();
})();

/* ---------- Contact form (Formspree, mailto fallback) ---------- */
(() => {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const label = button ? button.querySelector("span") : null;
  const labelText = label ? label.textContent : "";
  let labelTimer = 0;

  const setLabel = (text, revertAfter) => {
    if (!label) return;
    clearTimeout(labelTimer);
    label.textContent = text;
    if (revertAfter) {
      labelTimer = setTimeout(() => {
        label.textContent = labelText;
      }, revertAfter);
    }
  };

  const mailtoFallback = (name, email, msg) => {
    const subject = encodeURIComponent(`Website contact from ${name}`);
    const body = encodeURIComponent(`From: ${name} <${email}>\n\n${msg}`);
    const href = `mailto:hello.souravas@gmail.com?subject=${subject}&body=${body}`;

    // Open via a synthetic <a> so handler-less devices fall back to whatever
    // the OS does with mailto: links, rather than navigating the page away.
    const a = document.createElement("a");
    a.href = href;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setLabel("Opening your mail app…", 2600);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const name = (data.get("name") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const msg = (data.get("message") || "").toString().trim();
    data.set("_subject", `Website contact from ${name}`);

    if (button) button.disabled = true;
    setLabel("Sending…");

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Formspree responded ${res.status}`);
      form.reset();
      setLabel("Message sent", 4000);
    } catch {
      mailtoFallback(name, email, msg);
    } finally {
      if (button) button.disabled = false;
    }
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
