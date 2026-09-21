const toggle = document.getElementById("themeToggle");
const root = document.documentElement;
const saved = localStorage.getItem("dsa-theme");

if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  root.setAttribute("data-theme", "dark");
  if (toggle) toggle.textContent = "Light";
}

if (toggle) {
  toggle.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    if (isDark) {
      root.removeAttribute("data-theme");
      toggle.textContent = "Dark";
      localStorage.setItem("dsa-theme", "light");
    } else {
      root.setAttribute("data-theme", "dark");
      toggle.textContent = "Light";
      localStorage.setItem("dsa-theme", "dark");
    }
  });
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
