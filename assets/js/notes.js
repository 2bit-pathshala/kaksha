/* notes.js - the controller behind the section notes: hld, lld, hr and dsa-notes.

   All four render the same shape of content (a topic tree of cards, hints,
   snippets and practice links) with the same sidebar, search and pager, so all
   four carried their own copy of this. The copies had drifted: only dsa-notes
   knew how to show more than one language, only hld and hr coloured the source
   badges properly, and dsa-notes painted every badge green because its data
   happens to use one source. This file takes the better half of each.

   A page calls NOTES.mount() with its data and its defaults; everything else
   is shared. */

window.NOTES = (function () {
  const $ = s => document.querySelector(s);
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const lcUrl = s => (typeof s === "string" && s.startsWith("http"))
    ? s : `https://leetcode.com/problems/${s}/`;

  /* the source badges, by the short code the data uses. A code with no entry
     renders in the muted default, which is right for a generic label like LIST */
  const SRC = {
    GFG: "gfg", EDU: "edu", HI: "hi", GH: "gh", BB: "bb", DG: "dg", CWA: "cwa",
    AMZN: "amzn", HBR: "hbr", MUSE: "muse", LFY: "lfy", EXP: "exp",
  };
  const srcClass = src => {
    const c = SRC[String(src).toUpperCase()];
    return c ? " " + c : "";
  };

  /* language tabs, in display order: pseudocode first, then the four languages */
  const LANGS = [
    ["pseudo", "Pseudocode", "plaintext"],
    ["py",     "Python",     "python"],
    ["java",   "Java",       "java"],
    ["cpp",    "C++",        "cpp"],
    ["js",     "JavaScript", "javascript"],
  ];

  function mount(cfg) {
    const DATA = cfg.data;
    const CODE = cfg.code || {};             // extra snippets keyed by node name
    const LANG = cfg.lang || "python";       // label for a single, untabbed snippet
    const HL = cfg.hl || LANG;               // its highlight.js class

    const params = new URLSearchParams(location.search);
    const topics = DATA.map(t => t.n);
    let current = params.get("topic");
    if (!topics.includes(current)) current = topics[0];

    /* ---- sidebar ---- */
    const tnav = $("#topicNav");
    topics.forEach(t => {
      const a = document.createElement("a");
      a.href = "?topic=" + encodeURIComponent(t);
      a.textContent = t;
      if (t === current) a.className = "active";
      tnav.appendChild(a);
    });

    const menuBtn = $("#menuBtn"), side = $("#side"), scrim = $("#scrim");
    const toggleSide = () => { side.classList.toggle("open"); scrim.classList.toggle("open"); };
    if (menuBtn) menuBtn.addEventListener("click", toggleSide);
    if (scrim) scrim.addEventListener("click", toggleSide);

    /* ---- search across every topic, pattern and sub-pattern ----
       Spaces, hyphens and symbols are dropped before matching, so "b tree",
       "btree" and "b-tree" all find the same node. Several words means every
       word has to appear somewhere in the trail. */
    const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const searchIdx = [];
    DATA.forEach(t => {
      const walk = (node, trail) => {
        const path = trail ? (trail + " › " + node.n) : node.n;
        searchIdx.push({ topic: t.n, name: node.n, path, hay: normalize(t.n + " " + path) });
        (node.c || []).forEach(ch => walk(ch, path));
      };
      (t.c || []).forEach(ch => walk(ch, ""));
    });

    const searchInput = $("#noteSearch"), resBox = $("#searchResults");
    searchInput.addEventListener("input", () => {
      const tokens = searchInput.value.trim().toLowerCase().split(/\s+/).map(normalize).filter(Boolean);
      const match = hay => tokens.every(tk => hay.includes(tk));
      [...tnav.children].forEach(a => {
        a.style.display = (!tokens.length || match(normalize(a.textContent))) ? "" : "none";
      });
      if (!tokens.length) { resBox.innerHTML = ""; resBox.classList.remove("show"); return; }
      const matches = searchIdx.filter(r => match(r.hay)).slice(0, 40);
      resBox.innerHTML = "";
      if (!matches.length) {
        resBox.innerHTML = '<div class="search-empty">No matches</div>';
      } else {
        matches.forEach(r => {
          const a = document.createElement("a");
          a.href = "?topic=" + encodeURIComponent(r.topic) + "#n-" + slug(r.name);
          a.innerHTML = `<span class="r-topic">${r.topic}</span><span class="r-name">${r.path}</span>`;
          resBox.appendChild(a);
        });
      }
      resBox.classList.add("show");
    });

    /* ---- one practice link ---- */
    function problemEl(p) {
      const [num, href, title, diff] = p;
      const isNum = typeof num === "number";
      const a = document.createElement("a");
      a.className = "prob";
      a.href = lcUrl(href); a.target = "_blank"; a.rel = "noopener";
      a.innerHTML =
        `<span class="tag ${diff}">${diff}</span>` +
        `<span class="pn${isNum ? "" : srcClass(num)}">${isNum ? "#" + num : String(num).toUpperCase()}</span>` +
        `<span class="pt">${title}</span>`;
      return a;
    }

    /* ---- a code block, tabbed when the snippet comes in several languages ---- */
    // snippet keys are written with a plain hyphen, so fold the long dashes a
    // node name may carry. Escaped rather than literal so this file passes the
    // house-style check that forbids an em-dash in anything we author.
    const denash = s => s.replace(/[\u2013\u2014]/g, "-");

    function codeBlock(value, host) {
      const langs = (typeof value === "string")
        ? [[LANG, LANG, HL, value]]
        : LANGS.filter(l => value[l[0]]).map(l => [l[0], l[1], l[2], value[l[0]]]);
      if (!langs.length) return;

      const wrap = document.createElement("div"); wrap.className = "codewrap";
      const bar = document.createElement("div"); bar.className = "codebar";
      bar.innerHTML = '<span class="dot" style="background:#ff5f56"></span>' +
        '<span class="dot" style="background:#ffbd2e"></span>' +
        '<span class="dot" style="background:#27c93f"></span>';

      let tabs = null;
      if (langs.length > 1) {
        tabs = document.createElement("div"); tabs.className = "langtabs"; bar.appendChild(tabs);
      } else {
        const lab = document.createElement("span"); lab.className = "lang";
        lab.textContent = langs[0][2]; bar.appendChild(lab);
      }
      wrap.appendChild(bar);

      const pre = document.createElement("pre"); pre.className = "code";
      const code = document.createElement("code");
      pre.appendChild(code); wrap.appendChild(pre); host.appendChild(wrap);

      const show = i => {
        const [, , hlLang, src] = langs[i];
        code.className = "language-" + hlLang;
        code.removeAttribute("data-highlighted");
        code.textContent = src;
        if (window.hljs) { try { hljs.highlightElement(code); } catch (e) {} }
        if (tabs) tabs.querySelectorAll("button").forEach((b, j) => b.classList.toggle("on", j === i));
      };
      if (tabs) langs.forEach((l, i) => {
        const b = document.createElement("button"); b.type = "button"; b.textContent = l[1];
        b.addEventListener("click", () => show(i)); tabs.appendChild(b);
      });
      show(0);
    }

    /* ---- the pieces hanging off one node ---- */
    function blocks(node, host) {
      if (node.h) { const d = document.createElement("div"); d.className = "hint"; d.innerHTML = "💡 " + node.h; host.appendChild(d); }
      if (node.note) { const d = document.createElement("div"); d.className = "note"; d.innerHTML = node.note; host.appendChild(d); }
      const codeVal = node.code || CODE[denash(node.n)];
      if (codeVal) codeBlock(codeVal, host);
      if (node.p) {
        const w = document.createElement("div"); w.className = "qwrap";
        const hd = document.createElement("div"); hd.className = "qhead"; hd.textContent = "Practice: test yourself";
        w.appendChild(hd);
        const pr = document.createElement("div"); pr.className = "probs";
        node.p.forEach(q => pr.appendChild(problemEl(q)));
        w.appendChild(pr); host.appendChild(w);
      }
    }

    /* ---- the tree. Every top-level pattern gets its own card ---- */
    function render(node, host, depth) {
      if (depth === 1) {
        const card = document.createElement("section"); card.className = "pcard";
        const h = document.createElement("h2"); h.className = "pat";
        h.id = "n-" + slug(node.n); h.textContent = node.n; card.appendChild(h);
        blocks(node, card);
        if (node.c) node.c.forEach(ch => render(ch, card, depth + 1));
        host.appendChild(card);
        return;
      }
      const leaf = !node.c;
      const h = document.createElement(depth === 2 && !leaf ? "h3" : "h4");
      h.className = depth === 2 && !leaf ? "sub" : "leaf";
      h.id = "n-" + slug(node.n); h.textContent = node.n;
      host.appendChild(h);
      blocks(node, host);
      if (!leaf) node.c.forEach(ch => render(ch, host, depth + 1));
    }

    const topicNode = DATA.find(t => t.n === current);
    const main = $("#main");
    const h1 = document.createElement("h1"); h1.className = "topic"; h1.textContent = current;
    main.appendChild(h1);
    if (topicNode.h) {
      const i = document.createElement("div"); i.className = "intro"; i.innerHTML = "💡 " + topicNode.h;
      main.appendChild(i);
    }
    (topicNode.c || []).forEach(ch => render(ch, main, 1));
    if (topicNode.p) blocks(topicNode, main);

    /* ---- previous / next topic ---- */
    const idx = topics.indexOf(current);
    const navRow = document.createElement("div"); navRow.className = "nav";
    const prev = document.createElement("a"); prev.className = "btn";
    if (idx > 0) { prev.href = "?topic=" + encodeURIComponent(topics[idx - 1]); prev.textContent = "← " + topics[idx - 1]; }
    else prev.style.visibility = "hidden";
    const next = document.createElement("a"); next.className = "btn";
    if (idx < topics.length - 1) { next.href = "?topic=" + encodeURIComponent(topics[idx + 1]); next.textContent = topics[idx + 1] + " →"; }
    else next.style.visibility = "hidden";
    navRow.append(prev, next); main.appendChild(navRow);

    /* ---- arriving on a search result: jump, then flash the heading ---- */
    function scrollToHash() {
      if (!location.hash) return;
      const el = document.getElementById(location.hash.slice(1));
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
    }
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
  }

  return { mount };
})();
