#!/usr/bin/env node
/* check.js - the guard rails for the concept pages.
   Run it with:  node check.js
   Every check here exists because something once broke in exactly that way.

   The structural checks need nothing but node. The DOM checks need jsdom, and
   are skipped with a note if it is not installed (npm i --no-save jsdom). */

const fs = require("fs"), vm = require("vm"), path = require("path");
const P = __dirname + path.sep;
let fails = 0;
const ok   = (name, detail) => console.log("  ok    " + name.padEnd(16) + detail);
const bad  = (name, detail) => { fails++; console.log("  FAIL  " + name.padEnd(16) + detail); };
const test = (name, pass, detail) => (pass ? ok : bad)(name, detail);

/* ---------- load the data the same way a browser would ---------- */
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(P + "js/viz.js", "utf8") + "\n;globalThis.V=VIZ;globalThis.D=DRAW;", ctx);
vm.runInContext(fs.readFileSync(P + "data/concept-data.js", "utf8") + "\n;globalThis.C=CONCEPTS;", ctx);
const CONCEPTS = ctx.C, VIZ = ctx.V, DRAW = ctx.D;

/* ---------- 1. every concept has every field, and points at real visuals ---------- */
{
  // `see` is optional: not every concept has an outside link worth keeping
  const FIELDS = ["id","n","group","one","plain","why","hing","viz","costs",
                  "traps","impl","code","codecap","q","p"];
  const problems = [];
  const ids = new Set();
  for (const c of CONCEPTS) {
    const missing = FIELDS.filter(f => !(f in c) || (Array.isArray(c[f]) && !c[f].length));
    if (missing.length) problems.push(c.id + " missing " + missing.join("/"));
    if (ids.has(c.id)) problems.push("duplicate id " + c.id);
    ids.add(c.id);
    const langs = Object.keys(c.code || {});
    if (langs.length !== 5) problems.push(c.id + " has " + langs.length + " code tabs");
    (c.viz || []).forEach(v => { if (!VIZ[v]) problems.push(c.id + " points at missing visual " + v); });
    // the floor every page must clear, so a new page cannot land thinner than the set
    if (c.why.length < 5)   problems.push(c.id + " has only " + c.why.length + " reasoning steps");
    if (c.q.length < 5)     problems.push(c.id + " has only " + c.q.length + " questions");
    if (c.traps.length < 4) problems.push(c.id + " has only " + c.traps.length + " traps");
    if (c.p.length < 5)     problems.push(c.id + " has only " + c.p.length + " practice links");
  }
  test("structure", problems.length === 0,
    CONCEPTS.length + " concepts, " + CONCEPTS.reduce((a,c)=>a+c.q.length,0) + " questions" +
    (problems.length ? "   <-- " + problems.slice(0,4).join("; ") : ""));
}

/* ---------- 2. every visual renders, and no label escapes its box ---------- */
{
  let frames = 0, labels = 0;
  const spills = [], broken = [];
  const RX = /<rect [^>]*width="([0-9.]+)"[^>]*\/><text [^>]*?(?:font-size:([0-9.]+)px)?[^>]*>([^<]*)<\/text>/g;
  for (const [id, spec] of Object.entries(VIZ)) for (const f of spec.frames) {
    const svg = DRAW[spec.kind](spec, f);
    frames++;
    if (/NaN|undefined/.test(svg) || !svg.startsWith("<svg")) broken.push(id);
    let m; RX.lastIndex = 0;
    while ((m = RX.exec(svg))) {
      const w = +m[1], size = m[2] ? +m[2] : 14, label = m[3];
      if (!label.trim()) continue;
      labels++;
      if (0.62 * size * label.length > w - 2) spills.push(id + ': "' + label + '"');
    }
  }
  test("visuals", broken.length === 0 && spills.length === 0,
    Object.keys(VIZ).length + " visuals, " + frames + " frames, " + labels + " labels fitted" +
    (spills.length ? "   <-- spilling: " + spills.slice(0,3).join(", ") : "") +
    (broken.length ? "   <-- broken: " + broken.join(", ") : ""));
}

/* ---------- 3. the visuals are painted with variables the stylesheet defines ---------- */
{
  const viz = fs.readFileSync(P + "js/viz.js", "utf8");
  const css = fs.readFileSync(P + "css/learn.css", "utf8");
  const cut = css.indexOf('[data-theme="dark"]');
  const light = css.slice(0, cut), dark = css.slice(cut);
  const wanted = [...new Set([...viz.matchAll(/var\(--([a-z0-9-]+)\)/g)].map(m => m[1]))];
  const missing = wanted.filter(v => !light.includes("--" + v + ":") || !dark.includes("--" + v + ":"));
  test("viz colours", missing.length === 0,
    wanted.length + " variables, all defined in both themes" +
    (missing.length ? "   <-- undefined: " + missing.join(", ") : ""));
}

/* ---------- 4. code blocks: width, and no backtick that would end the literal ---------- */
{
  const LIMIT = 88;
  const wide = [], quoted = [];
  CONCEPTS.forEach(c => Object.entries(c.code).forEach(([lang, src]) => {
    if (src.includes("`")) quoted.push(c.id + "/" + lang);
    src.split("\n").forEach(l => { if (l.length > LIMIT) wide.push(c.id + "/" + lang + " (" + l.length + ")"); });
  }));
  const lines = CONCEPTS.reduce((a,c)=>a+Object.values(c.code).reduce((b,s)=>b+s.split("\n").length,0),0);
  test("code", wide.length === 0 && quoted.length === 0,
    lines + " lines, all within " + LIMIT + " columns" +
    (wide.length ? "   <-- too wide: " + wide.slice(0,3).join(", ") : "") +
    (quoted.length ? "   <-- stray backtick: " + quoted.join(", ") : ""));
}

/* ---------- 4b. the derivations: every step worked, and nothing wrapping ----------
   A derivation block sits in the 66ch prose column, not in the full-width code
   listing, so it wraps far earlier. It also has to actually show its working:
   a step with a title and no arithmetic under it is a claim, not a derivation. */
{
  const LIMIT = 68;
  const wide = [], empty = [], thin = [];
  let steps = 0, worked = 0;
  CONCEPTS.forEach(c => {
    if (!c.math) return;
    if (c.math.length < 3) thin.push(c.id + " (" + c.math.length + ")");
    c.math.forEach((m, i) => {
      steps++;
      if (!m.t || (!m.w && !m.d)) empty.push(c.id + " step " + (i + 1));
      if (!m.w) return;
      worked++;
      m.w.split("\n").forEach(l => {
        if (l.length > LIMIT) wide.push(c.id + " step " + (i + 1) + " (" + l.length + ")");
      });
    });
  });
  const withMath = CONCEPTS.filter(c => c.math).length;
  test("derivations", wide.length === 0 && empty.length === 0 && thin.length === 0,
    withMath + "/" + CONCEPTS.length + " concepts, " + steps + " steps, " +
    worked + " worked blocks within " + LIMIT + " columns" +
    (wide.length ? "   <-- too wide: " + wide.slice(0, 3).join(", ") : "") +
    (thin.length ? "   <-- too few steps: " + thin.slice(0, 3).join(", ") : "") +
    (empty.length ? "   <-- nothing under the title: " + empty.slice(0, 3).join(", ") : ""));
}

/* ---------- 4c. prose a first-timer can follow ----------
   The pages are read by someone meeting the idea for the first time, so the
   explanations carry a hard sentence-length ceiling. A sentence that runs past
   it is nearly always two ideas that were never separated. Headings, list
   breaks and the ends of paragraphs all count as breaks, so a bold lead-in is
   not charged to the sentence after it. */
{
  const LIMIT = 28;
  const SPLIT = /<\/p>|<p>|<br>|(?<=[.!?:])(?:["”’]|<\/[a-z]+>)*\s+/;
  const strip = t => String(t).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wc = t => { const s = strip(t); return s ? s.split(/\s+/).length : 0; };
  const over = [];
  let counted = 0;
  for (const c of CONCEPTS) {
    const parts = [["plain", c.plain], ["hing", c.hing]];
    c.why.forEach((w, i) => parts.push(["why" + i, w.d]));
    (c.math || []).forEach((m, i) => parts.push(["math" + i, m.d || ""]));
    for (const [label, text] of parts)
      String(text).split(SPLIT).forEach(sent => {
        const n = wc(sent);
        if (!n) return;
        counted++;
        if (n > LIMIT) over.push(c.id + "/" + label + " (" + n + "w)");
      });
  }
  test("plain english", over.length === 0,
    counted + " sentences across plain, why, hing and the derivations, none over " + LIMIT + " words" +
    (over.length ? "   <-- " + over.slice(0, 4).join(", ") : ""));
}

/* ---------- 5. no escape sequence may survive into the rendered text ----------
   A quoted heredoc once turned \u00b2 into a literal backslash-u-0-0-b-2, which
   the page then printed at the reader instead of a superscript two. */
{
  const hits = [];
  const scan = (obj, path) => {
    if (typeof obj === "string") {
      const m = obj.match(/\\u[0-9a-fA-F]{4}|\\n|\\t/);
      if (m) hits.push(path + ' shows "' + m[0] + '"');
    } else if (obj && typeof obj === "object") {
      for (const k in obj) scan(obj[k], path + "." + k);
    }
  };
  scan(CONCEPTS, "concept"); scan(VIZ, "visual");
  test("escapes", hits.length === 0,
    "no literal escape sequences reach the page" +
    (hits.length ? "   <-- " + hits.slice(0, 3).join("; ") : ""));
}

/* ---------- 5. house style: no em-dashes anywhere we author ---------- */
{
  const DASH = String.fromCharCode(0x2014);   // written this way so this file passes its own test
  const OURS = ["data/concept-data.js","js/viz.js","concept.html","revise.html","css/learn.css",
                "docs/CONTENT-GUIDE.md","README.md","index.html","ai.html","check.js",
                "design.html","data/design-data.js"];
  const guilty = OURS.filter(f => fs.existsSync(P + f) && fs.readFileSync(P + f, "utf8").includes(DASH));
  test("house style", guilty.length === 0,
    "no em-dashes across " + OURS.length + " files" +
    (guilty.length ? "   <-- " + guilty.join(", ") : ""));
}

/* ---------- 6. the complexity curves must leave the chart in the right order ---------- */
{
  const CURVES = ctx.CURVES || null;
  const spec = VIZ["big-o"];
  const svg = DRAW.curve(spec, spec.frames[spec.frames.length - 1]);
  const ys = [...svg.matchAll(/<text x="[0-9.]+" y="([0-9.]+)"[^>]*font-weight:600/g)].map(m => +m[1]);
  let collisions = 0;
  ys.forEach((a, i) => ys.slice(i + 1).forEach(b => { if (Math.abs(a - b) < 14) collisions++; }));
  test("curve labels", collisions === 0, ys.length + " labels on the final frame, none overlapping");
}

/* ---------- 7. the Design Lab: shape, geometry, and labels that fit ----------
   The diagrams are laid out on a grid and routed with elbows, so an edge that
   spans two columns runs straight through whatever sits between them. There is
   no clever router; there is this test instead. */
const DESIGN = (() => {
  const d = {}; vm.createContext(d);
  vm.runInContext(fs.readFileSync(P + "data/design-data.js", "utf8") + "\n;globalThis.D=DESIGN;", d);
  return d.D;
})();
{
  const BW = 178, BH = 88, CG = 72, RG = 44, PAD = 22;
  const X = c => PAD + c * (BW + CG), Y = r => PAD + r * (BH + RG);
  const problems = [];
  let stages = 0, nodes = 0, edges = 0;

  for (const p of DESIGN) {
    const FIELDS = ["id","kind","n","sub","one","brief","stagesIntro","stages",
                    "boxesIntro","boxes","flowsIntro","flows","tradeoffsIntro",
                    "tradeoffs","next","p"];
    FIELDS.filter(f => !(f in p)).forEach(f => problems.push(p.id + " missing " + f));
    p.boxes.forEach(b => ["n","r","job","why","forced","alts","pros","cons","cost","fails"]
      .filter(f => !(f in b)).forEach(f => problems.push(p.id + "/" + b.id + " missing " + f)));
    if (p.stages.length < 5) problems.push(p.id + " has only " + p.stages.length + " stages");
    if (p.boxes.length < 8)  problems.push(p.id + " has only " + p.boxes.length + " components");

    // every box on a stage has a card, and every card appears on a stage
    const cards = new Set(p.boxes.map(b => b.id)), onStage = new Set();
    p.stages.forEach(st => st.nodes.forEach(n => onStage.add(n.id)));
    [...onStage].filter(n => !cards.has(n)).forEach(n => problems.push(p.id + ": node " + n + " has no card"));
    [...cards].filter(c => !onStage.has(c)).forEach(c => problems.push(p.id + ": card " + c + " is on no stage"));

    p.stages.forEach((st, si) => {
      stages++; nodes += st.nodes.length; edges += (st.edges || []).length;
      const by = {}, cells = {};
      st.nodes.forEach(n => {
        by[n.id] = n;
        const k = n.col + "," + n.row;
        if (cells[k]) problems.push(p.id + " s" + si + ": " + cells[k] + " and " + n.id + " share a cell");
        cells[k] = n.id;
        if (n.s && n.s.length > 26) problems.push(p.id + " s" + si + ': sub label too long, "' + n.s + '"');
      });
      (st.add || []).forEach(a => { if (!by[a]) problems.push(p.id + " s" + si + ": add lists " + a); });
      (st.edges || []).forEach(e => {
        const a = by[e.a], b = by[e.b];
        if (!a || !b) { problems.push(p.id + " s" + si + ": edge " + e.a + " to " + e.b); return; }
        // Edge labels sit centred in the gutter between two columns, so however
        // the bend moves them they still have to fit without landing on a box.
        if (e.l && b.col > a.col) {
          // The renderer places a label on the longest run it has, and its
          // worst case is the full gutter, so that is the width to fit inside.
          const gap = X(b.col) - (X(a.col) + BW);
          if (e.l.length * 5.25 > gap - 8)
            problems.push(p.id + " s" + si + ': edge label too wide for its gutter, "' + e.l + '"');
        }
        const ax = X(a.col), ay = Y(a.row), bx = X(b.col), by2 = Y(b.row);
        const acx = ax + BW / 2, acy = ay + BH / 2, bcx = bx + BW / 2, bcy = by2 + BH / 2;
        let segs;
        if (b.col > a.col) {
          if (a.row === b.row) segs = [[ax + BW, acy, bx, acy]];
          else { const mx = (ax + BW) + (bx - (ax + BW)) * (e.bend != null ? e.bend : 0.5);
                 segs = [[ax + BW, acy, mx, acy], [mx, acy, mx, bcy], [mx, bcy, bx, bcy]]; }
        } else if (b.col === a.col) {
          segs = b.row > a.row ? [[acx, ay + BH, acx, by2]] : [[acx, ay, acx, by2 + BH]];
        } else {
          const lane = Math.max(ay, by2) + BH + 26;
          segs = [[acx, ay + BH, acx, lane], [acx, lane, bcx, lane], [bcx, lane, bcx, by2 + BH]];
        }
        for (const n of st.nodes) {
          if (n.id === a.id || n.id === b.id) continue;
          const nx = X(n.col), ny = Y(n.row);
          for (const [x1, y1, x2, y2] of segs) {
            const sx = Math.min(x1, x2), ex = Math.max(x1, x2);
            const sy = Math.min(y1, y2), ey = Math.max(y1, y2);
            if (ex > nx + 3 && sx < nx + BW - 3 && ey > ny + 3 && sy < ny + BH - 3)
              problems.push(p.id + " s" + si + ": edge " + e.a + " to " + e.b + " crosses " + n.id);
          }
        }
      });
    });
  }
  test("design data", problems.length === 0,
    DESIGN.length + " projects, " + stages + " stages, " + nodes + " boxes, " + edges + " arrows, none crossing" +
    (problems.length ? "   <-- " + problems.slice(0, 3).join("; ") : ""));
}

/* ---------- 7. the DOM checks, if jsdom happens to be available ---------- */
let JSDOM = null;
try { ({ JSDOM } = require("jsdom")); } catch (e) {}
if (!JSDOM) {
  console.log("  skip  dom             jsdom not installed (npm i --no-save jsdom to enable)");
} else {
  const render = (file, url) => {
    let html = fs.readFileSync(P + file, "utf8")
      .replace(/<script src="([^"]+)"><\/script>/g, (m, src) =>
        src.startsWith("http") ? "" : "<script>\n" + fs.readFileSync(P + src, "utf8") + "\n</script>")
      .replace(/<link rel="stylesheet" href="([^"]+)" \/>/g, (m, href) =>
        href.startsWith("http") ? "" : "<style>\n" + fs.readFileSync(P + href.split("?")[0], "utf8") + "\n</style>");
    const errs = [];
    const { VirtualConsole } = require("jsdom");
    const vc = new VirtualConsole();
    vc.on("jsdomError", e => errs.push(e.message.split("\n")[0]));
    const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/" + url,
      virtualConsole: vc,
      beforeParse(w) { w.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){} }); } });
    return { d: dom.window.document, w: dom.window, errs };
  };

  const problems = [];
  for (const c of CONCEPTS) {
    const { d, w, errs } = render("concept.html", "concept.html?c=" + c.id);
    const n = s => d.querySelectorAll(s).length;
    if (errs.length) problems.push(c.id + ": " + errs[0]);
    const expectSections = 9 + (c.variants ? 1 : 0) + (c.math ? 1 : 0);
    if (n(".rung") !== expectSections)
      problems.push(c.id + ": " + n(".rung") + " sections, expected " + expectSections);
    if (n(".langtabs button") !== 5) problems.push(c.id + ": " + n(".langtabs button") + " code tabs");
    if (!n(".vizstage svg")) problems.push(c.id + ": no visual rendered");
    if (n(".nav-list a") !== CONCEPTS.length) problems.push(c.id + ": sidebar out of step");
    if (n("input[type=checkbox]") || n(".ptrack")) problems.push(c.id + ": progress tracking is back");
    // inline markup inside prose must stay inline, or sentences shatter across lines
    d.querySelectorAll(".body p, .chain li div, .hing, .oneline, .traps li").forEach(host =>
      host.querySelectorAll("b, i, em, code, span").forEach(e => {
        const disp = w.getComputedStyle(e).display;
        if (disp && disp !== "inline" && disp !== "inline-block")
          problems.push(c.id + ": <" + e.tagName.toLowerCase() + "> renders as " + disp);
      }));
    const codeEl = d.querySelector("pre.code code");
    if (!codeEl || codeEl.textContent.split("\n").length < 5)
      problems.push(c.id + ": code block collapsed");
  }
  test("concept pages", problems.length === 0,
    CONCEPTS.length + " pages render, all sections present" +
    (problems.length ? "   <-- " + problems.slice(0,3).join("; ") : ""));

  {
    const problems = [];
    for (const proj of DESIGN) {
      const { d, w, errs } = render("design.html", "design.html?p=" + proj.id);
      if (errs.length) { problems.push(proj.id + ": " + errs[0]); continue; }
      const n = s => d.querySelectorAll(s).length;
      const want = 6 + ((proj.api || proj.schema) ? 1 : 0) + (proj.deep ? 1 : 0) + (proj.patterns ? 1 : 0);
      if (n("h2.pat") !== want) problems.push(proj.id + ": " + n("h2.pat") + " sections, expected " + want);
      if (n(".comp") !== proj.boxes.length + (proj.patterns || []).length)
        problems.push(proj.id + ": " + n(".comp") + " cards");
      if (n("#projNav a") !== DESIGN.length) problems.push(proj.id + ": sidebar out of step");
      if (n("input[type=checkbox]")) problems.push(proj.id + ": progress tracking is back");
      const dots = [...d.querySelectorAll(".dots button")];
      if (dots.length !== proj.stages.length) problems.push(proj.id + ": " + dots.length + " stage buttons");
      dots.forEach((btn, i) => {
        btn.dispatchEvent(new w.Event("click"));
        const stage = d.querySelector(".stagesvg");
        if (!stage.querySelector("svg")) problems.push(proj.id + " s" + i + ": no diagram");
        if (/NaN|undefined/.test(stage.innerHTML)) problems.push(proj.id + " s" + i + ": broken diagram");
        // every box must open its reasoning, or the diagram is decoration
        stage.querySelectorAll(".dnode").forEach(g => {
          g.dispatchEvent(new w.Event("click"));
          const h = d.querySelector(".pick h5");
          if (!h || !h.textContent.trim()) problems.push(proj.id + ": " + g.dataset.id + " opens nothing");
          g.dispatchEvent(new w.Event("click"));
        });
      });
      d.querySelectorAll(".note, .comp dd:not(.alts), .flow li").forEach(host =>
        host.querySelectorAll("b, i, em, code").forEach(e => {
          const disp = w.getComputedStyle(e).display;
          if (disp && disp !== "inline" && disp !== "inline-block")
            problems.push(proj.id + ": <" + e.tagName.toLowerCase() + "> renders as " + disp);
        }));
    }
    test("design pages", problems.length === 0,
      DESIGN.length + " pages render, every stage draws, every box opens" +
      (problems.length ? "   <-- " + problems.slice(0, 3).join("; ") : ""));
  }

  const { d, w, errs } = render("revise.html", "revise.html");
  const entries = d.querySelectorAll(".entry").length;
  const qs = d.querySelectorAll(".qa").length;
  d.querySelector("#toggleAll").dispatchEvent(new w.Event("click"));
  const opened = [...d.querySelectorAll(".qa")].filter(e => e.classList.contains("open")).length;
  test("revision page", entries === CONCEPTS.length && qs === opened && !errs.length,
    entries + " entries, " + qs + " questions, all open on demand");
}

console.log(fails ? "\n" + fails + " FAILED" : "\nall checks passed");
process.exit(fails ? 1 : 0);
