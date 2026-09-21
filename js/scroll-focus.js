/* scroll-focus.js - a box that scrolls sideways (code, wide tables, wide diagrams)
   has to be reachable from the keyboard, or its hidden part is mouse-only.
   Pages draw their content by script, so watch for it and re-check on resize.
   Only boxes that actually overflow get a tab stop; the rest are left alone. */
(function () {
  var SEL = "pre, pre > code, .vizstage, .stagesvg, .tblwrap, table.grid";
  var queued = false;

  function mark() {
    queued = false;
    document.querySelectorAll(SEL).forEach(function (el) {
      var scrolls = el.scrollWidth > el.clientWidth + 1 &&
                    /auto|scroll/.test(getComputedStyle(el).overflowX);
      if (scrolls && !el.hasAttribute("tabindex")) {
        el.tabIndex = 0;
        el.setAttribute("data-scroll-focus", "");
      } else if (!scrolls && el.hasAttribute("data-scroll-focus")) {
        el.removeAttribute("tabindex");
        el.removeAttribute("data-scroll-focus");
      }
    });
  }

  function queue() {
    if (!queued) { queued = true; requestAnimationFrame(mark); }
  }

  new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
  addEventListener("resize", queue);
  // late stylesheets (highlight.js loads its theme after first paint) can make a box scroll
  addEventListener("load", queue);
  queue();
})();
