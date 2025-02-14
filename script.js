// Theme toggle functionality
const toggleButton = document.getElementById("theme-toggle");
const currentTheme = localStorage.getItem("theme");

if (currentTheme === "dark") {
  document.body.classList.add("dark-mode");
  toggleButton.textContent = "☀️";
}

toggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  let theme = "light";
  if (document.body.classList.contains("dark-mode")) {
    theme = "dark";
    toggleButton.textContent = "☀️";
  } else {
    theme = "light";
    toggleButton.textContent = "🌙";
  }
  localStorage.setItem("theme", theme);
});
