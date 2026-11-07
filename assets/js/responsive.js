/* responsive.js - Escape closes the drawer, and the page behind it stops scrolling
   while the drawer is open. Pages without a drawer have no #side and do nothing. */
(function () {
  var side = document.getElementById("side"), scrim = document.getElementById("scrim");
  if (!side || !scrim) return;
  var mq = window.matchMedia("(max-width:900px)");
  function sync() { document.documentElement.style.overflow = side.classList.contains("open") && mq.matches ? "hidden" : ""; }
  new MutationObserver(sync).observe(side, { attributes: true, attributeFilter: ["class"] });
  if (mq.addEventListener) mq.addEventListener("change", sync);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && side.classList.contains("open")) scrim.click();
  });
})();
