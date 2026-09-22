/* theme.js - the light/dark toggle, shared by every page.

   The <head> of each page carries a three-line snippet that sets data-theme
   before first paint, because a stylesheet cannot read localStorage and a flash
   of the wrong theme is worse than a slightly larger head. This file is the
   other half: it wires the button up once the page exists. Ten pages had their
   own copy, and they had drifted on whether the button also gets an aria-label.

   The stored key stays "dsa-theme" so nobody signed in on the old pages loses
   their preference. */

(function () {
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");
  const read = () => { try { return localStorage.getItem("dsa-theme"); } catch (e) { return null; } };
  const write = v => { try { localStorage.setItem("dsa-theme", v); } catch (e) {} };

  // the head snippet usually did this already; repeat it for any page without one
  const saved = read();
  if (saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches)) {
    root.setAttribute("data-theme", "dark");
  }

  const isDark = () => root.getAttribute("data-theme") === "dark";
  const label = () => {
    if (!btn) return;
    btn.textContent = isDark() ? "Light" : "Dark";
    btn.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");
  };
  label();

  if (btn) btn.addEventListener("click", () => {
    if (isDark()) { root.removeAttribute("data-theme"); write("light"); }
    else { root.setAttribute("data-theme", "dark"); write("dark"); }
    label();
  });

  // the landing page footer carries the year; harmless everywhere else
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
