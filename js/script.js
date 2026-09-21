const toggle = document.getElementById("themeToggle");
const root = document.documentElement;
const store = {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
};

// pages that set the theme in <head> already have it; this covers the ones that do not
const saved = store.get("dsa-theme");
if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  root.setAttribute("data-theme", "dark");
}

const label = () => {
  if (!toggle) return;
  const dark = root.getAttribute("data-theme") === "dark";
  toggle.textContent = dark ? "Light" : "Dark";
  toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
};
label();

if (toggle) {
  toggle.addEventListener("click", () => {
    const dark = root.getAttribute("data-theme") === "dark";
    if (dark) root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", "dark");
    store.set("dsa-theme", dark ? "light" : "dark");
    label();
  });
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
