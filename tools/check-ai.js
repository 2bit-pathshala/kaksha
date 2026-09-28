#!/usr/bin/env node
/* check-ai.js - the guard rails for the AI concept and design pages, the same
   idea as check.js but pointed at data/ai-concept-data.js and
   data/ai-design-data.js, with one deliberate difference: those concepts carry
   `code: {pseudo, py}` only, not five languages, because AI engineering happens
   in Python. Every other bar (sentence length, math width, code width, no
   em-dash, design geometry) is identical to check.js.

   Run it with: node tools/check-ai.js
   The em-dash and SEO/sitemap checks already cover these files from check.js
   itself (it globs data/*.js and every root *.html), so they are not repeated
   here. */

const fs = require("fs"), vm = require("vm"), path = require("path");
const P = path.join(__dirname, "..") + path.sep;
let fails = 0;
const ok  = (name, detail) => console.log("  ok    " + name.padEnd(16) + detail);
const bad = (name, detail) => { fails++; console.log("  FAIL  " + name.padEnd(16) + detail); };
const test = (name, pass, detail) => (pass ? ok : bad)(name, detail);

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(P + "assets/js/viz.js", "utf8") + "\n;globalThis.V=VIZ;globalThis.D=DRAW;", ctx);
vm.runInContext(fs.readFileSync(P + "data/ai-concept-data.js", "utf8") + "\n;globalThis.C=CONCEPTS;", ctx);
const CONCEPTS = ctx.C, VIZ = ctx.V, DRAW = ctx.D;

/* ---------- 1. every concept has every field, and points at real visuals ---------- */
{
  const FIELDS = ["id", "n", "group", "one", "plain", "why", "hing", "viz",
                  "costs", "traps", "code", "q", "p"];
  const problems = [];
  const ids = new Set();
  for (const c of CONCEPTS) {
    const missing = FIELDS.filter(f => !(f in c) || (Array.isArray(c[f]) && !c[f].length));
    if (missing.length) problems.push(c.id + " missing " + missing.join("/"));
    if (ids.has(c.id)) problems.push("duplicate id " + c.id);
    ids.add(c.id);
    const langs = Object.keys(c.code || {});
    if (!langs.includes("pseudo") || !langs.includes("py"))
      problems.push(c.id + " code needs at least pseudo + py, has " + langs.join(","));
    if (langs.some(l => !["pseudo", "py"].includes(l)))
      problems.push(c.id + " code has a non pseudo/py key: " + langs.join(","));
    (c.viz || []).forEach(v => { if (!VIZ[v]) problems.push(c.id + " points at missing visual " + v); });
    if (c.why.length < 5)   problems.push(c.id + " has only " + c.why.length + " reasoning steps");
    if (c.q.length < 5)     problems.push(c.id + " has only " + c.q.length + " questions");
    if (c.traps.length < 4) problems.push(c.id + " has only " + c.traps.length + " traps");
    if (c.p.length < 5)     problems.push(c.id + " has only " + c.p.length + " practice links");
    // why you need this: the problem, at least two fixes that fail, then the idea
    if (c.need && (!c.need.ask || !c.need.so || (c.need.tries || []).length < 2))
      problems.push(c.id + " has a thin 'why you need this'");
    if (c.hi && c.hi.need && c.need && (c.hi.need.tries || []).length !== (c.need.tries || []).length)
      problems.push(c.id + " hi.need.tries out of step with the English");
    // the Hinglish mirrors the English one for one, or the switch shows a mismatch
    if (c.hi) for (const k of ["why", "math", "costs", "traps", "impl", "q", "variants"]) {
      if (c.hi[k] && c.hi[k].length !== (c[k] || []).length)
        problems.push(c.id + " hi." + k + " has " + c.hi[k].length + " entries, English has " + (c[k] || []).length);
    }
  }
  test("structure", problems.length === 0,
    CONCEPTS.length + " concepts, " + CONCEPTS.reduce((a,c)=>a+c.q.length,0) + " questions" +
    (problems.length ? "   <-- " + problems.slice(0,6).join("; ") : ""));
}

/* ---------- 2. every visual renders, and no label escapes its box ---------- */
{
  let frames = 0, labels = 0;
  const spills = [], broken = [];
  const RX = /<rect [^>]*width="([0-9.]+)"[^>]*\/><text [^>]*?(?:font-size:([0-9.]+)px)?[^>]*>([^<]*)<\/text>/g;
  for (const [id, spec] of Object.entries(VIZ)) {
    if (!spec.frames) continue;
    for (const f of spec.frames) {
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
  }
  test("visuals", broken.length === 0 && spills.length === 0,
    Object.keys(VIZ).length + " visuals total (DSA + AI), " + frames + " frames, " + labels + " labels fitted" +
    (spills.length ? "   <-- spilling: " + spills.slice(0,3).join(", ") : "") +
    (broken.length ? "   <-- broken: " + broken.join(", ") : ""));
}

/* ---------- 3. code blocks: width, and no backtick that would end the literal ---------- */
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
    (wide.length ? "   <-- too wide: " + wide.slice(0, 3).join(", ") : "") +
    (quoted.length ? "   <-- stray backtick: " + quoted.join(", ") : ""));
}

/* ---------- 4. the derivations: every step worked, and nothing wrapping ---------- */
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

/* ---------- 5. prose a first-timer can follow ---------- */
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
    for (const [pre, n] of [["", c.need], ["hi.", c.hi && c.hi.need]]) if (n) {
      parts.push([pre + "need.ask", n.ask], [pre + "need.so", n.so]);
      (n.tries || []).forEach((t, i) => parts.push([pre + "need.try" + i, t[1]]));
    }
    if (c.hi) {
      parts.push(["hi.plain", c.hi.plain]);
      (c.hi.why || []).forEach((w, i) => parts.push(["hi.why" + i, w.d]));
      (c.hi.math || []).forEach((m, i) => parts.push(["hi.math" + i, m.d || ""]));
    }
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
    (over.length ? "   <-- " + over.slice(0, 6).join(", ") : ""));
}

/* ---------- 6. the Design Lab: shape, geometry, and labels that fit ---------- */
const DESIGN = (() => {
  const d = {}; vm.createContext(d);
  vm.runInContext(fs.readFileSync(P + "data/ai-design-data.js", "utf8") + "\n;globalThis.D=DESIGN;", d);
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

    // the Hinglish mirrors the English positionally, or the switch shows a mismatch
    if (p.hi) {
      for (const k of ["stages", "boxes", "flows", "tradeoffs", "next", "patterns"]) {
        if (p.hi[k] && p.hi[k].length !== (p[k] || []).length)
          problems.push(p.id + " hi." + k + " has " + p.hi[k].length + " entries, English has " + (p[k] || []).length);
      }
      (p.hi.flows || []).forEach((f, i) => {
        const steps = p.flows[i] && p.flows[i].steps;
        if (f.steps && steps && f.steps.length !== steps.length)
          problems.push(p.id + " hi.flows[" + i + "].steps out of step with the English");
      });
    }

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
        if (e.l && b.col > a.col) {
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
    (problems.length ? "   <-- " + problems.slice(0, 6).join("; ") : ""));
}

console.log(fails ? "\n" + fails + " FAILED" : "\nall checks passed");
process.exit(fails ? 1 : 0);
