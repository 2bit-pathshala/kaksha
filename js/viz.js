/* viz.js, hand-authored, step-through visuals for the concept pages.
   Why not GIFs: these follow the site's dark mode, never 404, stay in git as text,
   and can be paused / stepped frame-by-frame, which is the part that actually teaches.

   A visual is VIZ[id] = { title, kind, ...spec, frames:[ {..., cap:"caption"} ] }.

   kinds:
     cells, a row of boxes (arrays, windows, two pointers, stack, queue, binary search)
              spec: { arr:[...], idx?:bool }
              frame: { arr?, band?:[l,r], on?:[i], hot?:[i], bad?:[i], dim?:[i],
                       ptr?:{LABEL:index}, out?:"running value", cap }
     curve, growth curves for complexity          frame: { show:[names], mark?:n, cap }
     tree, nodes + edges, optional array strip    frame: { on:[ids], dim:[ids], edge:[[a,b]], cap }
     hash, keys -> hash function -> buckets       frame: { k:"key", b:bucketIndex, cap }

   any frame, any kind:
     scene:"<html>"   a text card drawn instead of the diagram. The opening frame
                      uses it to state the problem before any mechanics appear.
     ask:{ q, opts:[...], a:index, why? }
                      a question about what the NEXT frame will show. The player
                      holds there until it is answered or skipped. Nothing is
                      remembered past the page, so this is practice, not a score.
     hi:{ cap?, out?, scene?, ask:{ q, opts, why? }? }
                      the Hinglish for this frame; missing parts fall back to English.
*/

const VIZ = {};

/* ============================ renderers ============================ */

/* --vw carries a legibility floor to the stylesheet, which uses it as the
   SVG's min-width. A drawing scales with its box, so a 15-cell diagram in a
   300px phone renders its 14px labels at about 5px. 0.72 of natural width
   puts them at 10px, the smallest that is still readable; below that the
   stage scrolls sideways instead of shrinking further. Small drawings still
   fit a phone outright, so only the wide ones ever scroll. */
const svgWrap = (w, h, inner) =>
  `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Diagram for this step, described in the caption" ` +
  `style="--vw:${Math.min(Math.round(w * 0.72), 620)}px">${inner}</svg>`;

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* Shrink a label until it fits the shape it sits in.
   Monospace glyphs run about 0.62em wide, so this is a close enough estimate
   to keep long labels (a hash formula, a multi-digit value) inside their box. */
const fit = (text, boxW, base, pad) => {
  const room = boxW - (pad == null ? 10 : pad);
  const chars = Math.max(1, String(text).length);
  return Math.max(8, Math.min(base == null ? 14 : base, room / (0.62 * chars)));
};

function drawCells(spec, f) {
  const arr = f.arr || spec.arr;
  const maxN = Math.max(...spec.frames.map(fr => (fr.arr || spec.arr).length));
  const BW = 46, GAP = 6, X0 = 34, Y = 46, H = 46;
  const W = X0 * 2 + maxN * (BW + GAP);
  const cx = i => X0 + i * (BW + GAP) + BW / 2;
  const has = (list, i) => Array.isArray(list) && list.includes(i);
  let s = "";

  // window band behind the boxes
  if (f.band) {
    const [l, r] = f.band;
    if (r >= l) {
      const x = X0 + l * (BW + GAP) - 4, w = (r - l + 1) * (BW + GAP) - GAP + 8;
      s += `<rect class="v-band" x="${x}" y="${Y - 10}" width="${w}" height="${H + 20}" rx="10"/>`;
    }
  }

  arr.forEach((v, i) => {
    let cls = "v-box";
    if (has(f.bad, i)) cls += " bad";
    else if (has(f.hot, i)) cls += " hot";
    else if (has(f.on, i) || (f.band && i >= f.band[0] && i <= f.band[1])) cls += " on";
    if (has(f.dim, i)) cls += " dim";
    const tcls = "v-txt" + (has(f.dim, i) ? " dim" : "");
    const x = X0 + i * (BW + GAP);
    s += `<rect class="${cls}" x="${x}" y="${Y}" width="${BW}" height="${H}" rx="9"/>`;
    s += `<text class="${tcls}" x="${cx(i)}" y="${Y + H / 2 + 1}" ` +
         `style="font-size:${fit(v, BW).toFixed(1)}px">${esc(v)}</text>`;
    if (spec.idx !== false) s += `<text class="v-idx" x="${cx(i)}" y="${Y - 12}">${i}</text>`;
  });

  // pointers below, stacked when two land on the same cell
  const seen = {};
  Object.entries(f.ptr || {}).forEach(([label, i], k) => {
    if (i == null || i < 0 || i >= arr.length) return;
    const row = seen[i] = (seen[i] || 0);
    seen[i]++;
    const yTop = Y + H + 8 + row * 20, x = cx(i);
    s += `<path class="v-line on" d="M${x} ${yTop + 9} l-5 7 h10 z" fill="var(--accent)" stroke="none"/>`;
    s += `<text class="v-lab${k % 2 ? " b" : ""}" x="${x}" y="${yTop + 30}">${esc(label)}</text>`;
  });

  if (f.out) s += `<text class="v-note" x="${X0}" y="${Y + H + 62}" ` +
    `style="font-weight:700;fill:var(--accent);font-size:${fit(f.out, W - X0 * 2, 13, 0).toFixed(1)}px">${esc(f.out)}</text>`;
  return svgWrap(W, Y + H + 80, s);
}

/* Real functions on shared axes: n runs from 1 to 20 and the chart tops out at
   20 units of work. No curve is scaled to fit on its own, so what you see IS the
   true ordering, which is the entire point of the picture. Curves that leave the
   top are clipped there, and leaving early is the lesson. */
const N_MAX = 20, Y_MAX = 20;
const nAt = x => 1 + x * (N_MAX - 1);
const CURVES = {
  "O(1)":        { f: () => 1 / Y_MAX,                              c: "var(--vz1)" },
  "O(log n)":    { f: x => Math.log2(nAt(x)) / Y_MAX,               c: "var(--vz2)" },
  "O(n)":        { f: x => nAt(x) / Y_MAX,                          c: "var(--vz3)" },
  "O(n log n)":  { f: x => nAt(x) * Math.log2(nAt(x)) / Y_MAX,      c: "var(--vz4)" },
  "O(n²)":       { f: x => Math.pow(nAt(x), 2) / Y_MAX,             c: "var(--vz5)" },
  "O(2ⁿ)":       { f: x => Math.pow(2, nAt(x)) / Y_MAX,             c: "var(--vz6)" },
};

function drawCurve(spec, f) {
  const W = 560, H = 300, L = 52, B = 250, T = 24, R = 500;
  // steep curves all leave the chart near the top, so their labels would pile up
  // in the same corner. Keep a list of used heights and nudge each new one clear.
  const used = [];
  const clearOf = y => {
    let v = Math.max(Math.min(y, B), T + 10);
    while (used.some(u => Math.abs(u - v) < 15)) v += 15;
    used.push(v);
    return v;
  };
  let s = `<line class="v-line" x1="${L}" y1="${T}" x2="${L}" y2="${B}"/>` +
          `<line class="v-line" x1="${L}" y1="${B}" x2="${R}" y2="${B}"/>` +
          `<text class="v-note" x="${R - 60}" y="${B + 24}">input size n →</text>` +
          `<text class="v-note" x="6" y="${T + 6}">work</text>`;
  (f.show || []).forEach(name => {
    const cv = CURVES[name]; if (!cv) return;
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const x = i / 60;
      const y = Math.min(cv.f(x), 1.02);
      pts.push(`${(L + x * (R - L)).toFixed(1)},${(B - y * (B - T)).toFixed(1)}`);
      if (y >= 1.02) break;
    }
    s += `<polyline class="v-curve" points="${pts.join(" ")}" style="stroke:${cv.c}"/>`;
    const last = pts[pts.length - 1].split(",");
    s += `<text x="${Math.min(+last[0] + 7, R - 4)}" y="${clearOf(+last[1])}" ` +
         `style="fill:${cv.c};font-family:'JetBrains Mono','JetBrains Mono Fallback',monospace;font-size:12px;font-weight:600">${esc(name)}</text>`;
  });
  return svgWrap(W, H, s);
}

function drawTree(spec, f) {
  const on = f.on || [], dim = f.dim || [], eon = (f.edge || []).map(e => e.join(">"));
  let s = "";
  const visible = id => {
    const n = spec.nodes[id];
    return n && (!n.hidden || (f.show || []).includes(id));
  };
  // a frame may replace the edge list entirely, which is how a union or a
  // removed node is drawn without inventing a second diagram
  ((f.edges || spec.edges) || []).forEach(([a, b]) => {
    const A = spec.nodes[a], B = spec.nodes[b]; if (!A || !B) return;
    if (!visible(a) || !visible(b)) return;      // no edges to nodes that are not there
    const hot = eon.includes(a + ">" + b) || eon.includes(b + ">" + a);
    const faded = dim.includes(a) || dim.includes(b);
    // trim the line back to each box edge along the line joining the centres
    const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1;
    const t = (hw, hh) => Math.min(len / 2, Math.abs(dx) / len > Math.abs(dy) / len
      ? hw / (Math.abs(dx) / len) : hh / (Math.abs(dy) / len));
    const cutA = t((A.w || 52) / 2 + 2, 22), cutB = t((B.w || 52) / 2 + 2, 22);
    const x1 = A.x + dx / len * cutA, y1 = A.y + dy / len * cutA;
    const x2 = B.x - dx / len * cutB, y2 = B.y - dy / len * cutB;
    s += `<line class="v-line${hot ? " on" : ""}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" ` +
         `x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"` + (faded ? ` opacity=".3"` : "") + `/>`;
    if (spec.arrows) {                          // a pointer has a direction; show it
      const ang = Math.atan2(dy, dx) * 180 / Math.PI;
      s += `<path d="M${x2.toFixed(1)} ${y2.toFixed(1)} l-7 -4 v8 z" fill="var(--accent)" ` +
           `transform="rotate(${ang.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)})"` +
           (faded ? ` opacity=".3"` : "") + `/>`;
    }
    if (spec.weights && spec.weights[a + ">" + b] != null)
      s += `<text class="v-idx" x="${((x1 + x2) / 2).toFixed(1)}" y="${((y1 + y2) / 2 - 5).toFixed(1)}">` +
           `${esc(spec.weights[a + ">" + b])}</text>`;
  });
  Object.entries(spec.nodes).forEach(([id, n]) => {
    if (n.hidden && !(f.show || []).includes(id)) return;
    let cls = "v-box" + (on.includes(id) ? " on" : "") + (dim.includes(id) ? " dim" : "");
    // frame.t lets a frame relabel a node. That is how a swap or a return value is shown.
    const label = (f.t && f.t[id] != null) ? f.t[id] : n.t;
    const w = n.w || 52;                       // wide enough for a real label
    s += `<rect class="${cls}" x="${n.x - w / 2}" y="${n.y - 20}" width="${w}" height="40" rx="10"/>`;
    s += `<text class="v-txt${dim.includes(id) ? " dim" : ""}" x="${n.x}" y="${n.y + 1}" ` +
         `style="font-size:${fit(label, w).toFixed(1)}px">${esc(label)}</text>`;
    if (n.sub) s += `<text class="v-idx" x="${n.x}" y="${n.y + 33}">${esc(n.sub)}</text>`;
  });
  if (f.out) s += `<text class="v-note" x="12" y="${spec.h - 8}" ` +
    `style="font-weight:700;fill:var(--accent);font-size:${fit(f.out, spec.w - 24, 13, 0).toFixed(1)}px">${esc(f.out)}</text>`;
  return svgWrap(spec.w, spec.h, s);
}

function drawHash(spec, f) {
  const idx = spec.frames.indexOf(f);
  const placed = {};
  spec.frames.slice(0, idx + 1).forEach(fr => { if (fr.k != null) (placed[fr.b] = placed[fr.b] || []).push(fr.k); });

  const nb = spec.buckets;
  const KX = 20,  KW = 130;                 // key box
  const FX = 196, FW = 190;                 // hash-function box (widened: the
  const BX = 424, BW = 44;                  // formula is the longest label here)
  const IX = 480, IW = 78;                  // items chained in a bucket
  const W = 660, H = 60 + nb * 40;
  const MY = H / 2;

  let s = `<rect class="v-box on" x="${FX}" y="${MY - 26}" width="${FW}" height="52" rx="11"/>` +
          `<text class="v-txt" x="${FX + FW / 2}" y="${MY}" style="font-size:${fit(spec.fn, FW, 13).toFixed(1)}px">${esc(spec.fn)}</text>` +
          `<text class="v-note" x="${KX}" y="22">keys</text>` +
          `<text class="v-note" x="${BX}" y="22">buckets</text>`;

  if (f.k != null) {
    s += `<rect class="v-box hot" x="${KX}" y="${MY - 22}" width="${KW}" height="44" rx="10"/>` +
         `<text class="v-txt" x="${KX + KW / 2}" y="${MY}" style="font-size:${fit(f.k, KW).toFixed(1)}px">${esc(f.k)}</text>` +
         `<line class="v-line on" x1="${KX + KW + 6}" y1="${MY}" x2="${FX - 6}" y2="${MY}"/>` +
         `<path d="M${FX - 6} ${MY} l-7 -5 v10 z" fill="var(--accent)"/>`;
  }

  for (let b = 0; b < nb; b++) {
    const y = 40 + b * 40, hit = f.b === b;
    s += `<rect class="v-box${hit ? " hot" : ""}" x="${BX}" y="${y}" width="${BW}" height="32" rx="8"/>` +
         `<text class="v-txt" x="${BX + BW / 2}" y="${y + 16}" style="font-size:11px">${b}</text>`;
    const items = placed[b] || [];
    items.forEach((k, j) => {
      const x = IX + j * (IW + 6);
      s += `<rect class="v-box${hit && j === items.length - 1 ? " hot" : " on"}" x="${x}" y="${y}" width="${IW}" height="32" rx="8"/>` +
           `<text class="v-txt" x="${x + IW / 2}" y="${y + 16}" style="font-size:${fit(k, IW, 12).toFixed(1)}px">${esc(k)}</text>`;
    });
    if (hit) s += `<line class="v-line on" x1="${FX + FW}" y1="${MY}" x2="${BX - 6}" y2="${y + 16}"/>` +
                  `<path d="M${BX - 6} ${y + 16} l-7 -5 v10 z" fill="var(--accent)"/>`;
  }
  return svgWrap(W, H, s);
}

/* chain, a linked list. Boxes hold a value, the gaps hold the pointers, and a
   frame can point any gap left, right, or nowhere. Reversal is exactly the act of
   flipping those arrows one at a time, so the arrow has to be a first-class thing. */
function drawChain(spec, f) {
  const arr = f.arr || spec.arr;
  const maxN = Math.max(...spec.frames.map(fr => (fr.arr || spec.arr).length));
  const BW = 52, H = 42, GAP = 40, X0 = 26, Y = 44;
  const W = X0 * 2 + maxN * (BW + GAP) + 34;
  const left = i => X0 + i * (BW + GAP);
  const cx = i => left(i) + BW / 2;
  const has = (l, i) => Array.isArray(l) && l.includes(i);
  let s = "";

  arr.forEach((v, i) => {
    let cls = "v-box";
    if (has(f.bad, i)) cls += " bad";
    else if (has(f.hot, i)) cls += " hot";
    else if (has(f.on, i)) cls += " on";
    if (has(f.dim, i)) cls += " dim";
    s += `<rect class="${cls}" x="${left(i)}" y="${Y}" width="${BW}" height="${H}" rx="8"/>`;
    s += `<text class="v-txt${has(f.dim, i) ? " dim" : ""}" x="${cx(i)}" y="${Y + H / 2 + 1}" ` +
         `style="font-size:${fit(v, BW).toFixed(1)}px">${esc(v)}</text>`;
  });

  // one arrow per gap: 1 points right, -1 points left, 0 is a severed link
  const links = f.links || arr.slice(0, -1).map(() => 1);
  links.forEach((dir, i) => {
    const a = left(i) + BW + 6, b = left(i + 1) - 6, mid = Y + H / 2;
    if (dir === 0) {
      s += `<line class="v-line" x1="${a}" y1="${mid}" x2="${b}" y2="${mid}" ` +
           `stroke-dasharray="3 3" opacity=".45"/>`;
      return;
    }
    const rightwards = dir === 1;
    s += `<line class="v-line on" x1="${a}" y1="${mid}" x2="${b}" y2="${mid}"/>`;
    s += rightwards
      ? `<path d="M${b} ${mid} l-7 -5 v10 z" fill="var(--accent)"/>`
      : `<path d="M${a} ${mid} l7 -5 v10 z" fill="var(--accent)"/>`;
  });

  // the terminating null, when the list ends where you would expect it to
  if (f.nullEnd !== false && arr.length) {
    const a = left(arr.length - 1) + BW + 6;
    s += `<line class="v-line" x1="${a}" y1="${Y + H / 2}" x2="${a + 22}" y2="${Y + H / 2}"/>`;
    s += `<text class="v-idx" x="${a + 30}" y="${Y + H / 2 + 4}">null</text>`;
  }

  const seen = {};
  Object.entries(f.ptr || {}).forEach(([label, i], k) => {
    if (i == null || i < 0 || i >= arr.length) return;
    const row = seen[i] = (seen[i] || 0); seen[i]++;
    const yTop = Y + H + 8 + row * 20, x = cx(i);
    s += `<path class="v-line on" d="M${x} ${yTop + 9} l-5 7 h10 z" fill="var(--accent)" stroke="none"/>`;
    s += `<text class="v-lab${k % 2 ? " b" : ""}" x="${x}" y="${yTop + 30}">${esc(label)}</text>`;
  });

  if (f.out) s += `<text class="v-note" x="${X0}" y="${Y + H + 66}" ` +
    `style="font-weight:700;fill:var(--accent);font-size:${fit(f.out, W - X0 * 2, 13, 0).toFixed(1)}px">${esc(f.out)}</text>`;
  return svgWrap(W, Y + H + 84, s);
}

/* grid - a 2-D board. Rows and columns, highlighted cells, and direction arrows
   out of a cell, because "the four neighbours" is a picture, not a sentence. */
function drawGrid(spec, f) {
  const g = f.arr || spec.arr;
  const R = g.length, C = g[0].length;
  const S = 44, GAP = 4, X0 = 30, Y0 = 34;
  const W = X0 * 2 + C * (S + GAP), H = Y0 + R * (S + GAP) + 56;
  const x = c => X0 + c * (S + GAP), y = r => Y0 + r * (S + GAP);
  const inList = (l, r, c) => Array.isArray(l) && l.some(p => p[0] === r && p[1] === c);
  let s = "";

  for (let c = 0; c < C; c++) s += `<text class="v-idx" x="${x(c) + S / 2}" y="${Y0 - 8}">${c}</text>`;
  for (let r = 0; r < R; r++) s += `<text class="v-idx" x="${X0 - 12}" y="${y(r) + S / 2 + 4}">${r}</text>`;

  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    let cls = "v-box";
    if (inList(f.bad, r, c)) cls += " bad";
    else if (inList(f.hot, r, c)) cls += " hot";
    else if (inList(f.on, r, c)) cls += " on";
    if (inList(f.dim, r, c)) cls += " dim";
    s += `<rect class="${cls}" x="${x(c)}" y="${y(r)}" width="${S}" height="${S}" rx="7"/>`;
    const v = String(g[r][c]);
    if (v !== "") s += `<text class="v-txt${inList(f.dim, r, c) ? " dim" : ""}" ` +
      `x="${x(c) + S / 2}" y="${y(r) + S / 2 + 1}" style="font-size:${fit(v, S).toFixed(1)}px">${esc(v)}</text>`;
  }

  // arrows out of a cell: the four (or eight) directions, drawn rather than described
  (f.dirs || []).forEach(([r, c, dr, dc]) => {
    const cxs = x(c) + S / 2, cys = y(r) + S / 2;
    const len = (S + GAP) * 0.78;
    const nx = cxs + dc * len, ny = cys + dr * len;
    const sx = cxs + dc * S * 0.45, sy = cys + dr * S * 0.45;
    const ang = Math.atan2(dr, dc) * 180 / Math.PI;
    s += `<line class="v-line on" x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" ` +
         `x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}"/>`;
    s += `<path d="M${nx.toFixed(1)} ${ny.toFixed(1)} l-7 -4 v8 z" fill="var(--accent)" ` +
         `transform="rotate(${ang.toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)})"/>`;
  });

  if (f.out) s += `<text class="v-note" x="${X0}" y="${H - 20}" ` +
    `style="font-weight:700;fill:var(--accent);font-size:${fit(f.out, W - X0 * 2, 13, 0).toFixed(1)}px">${esc(f.out)}</text>`;
  return svgWrap(W, H, s);
}

const DRAW = { cells: drawCells, curve: drawCurve, tree: drawTree, hash: drawHash,
               chain: drawChain, grid: drawGrid };

/* ============================ player ============================ */

function mountViz(id, host, lang, start) {
  const spec = VIZ[id];
  if (!spec) { host.innerHTML = `<div class="vizcap">Visual "${esc(id)}" not authored yet.</div>`; return; }
  const n = spec.frames.length;
  const hi = lang === "hi";
  // a frame as it should be read: its Hinglish laid over the English, the ask merged
  // so the answer index is authored once
  const view = f => {
    if (!hi || !f.hi) return f;
    const v = Object.assign({}, f, f.hi);
    if (f.ask) v.ask = Object.assign({}, f.ask, f.hi.ask || {});
    return v;
  };
  const W = hi
    ? { guess: "Pehle guess karo", right: "Sahi!", wrong: "Nahi.", show: "Aage dekho" }
    : { guess: "Guess first", right: "Right.", wrong: "Not quite.", show: "See it" };
  const answered = new Set();
  let i = Math.min(Math.max(0, start | 0), n - 1), timer = null;
  host.className = "viz";
  host.innerHTML =
    `<div class="vizstage"></div>` +
    `<div class="vizcap"></div>` +
    `<div class="vizbar">` +
      `<button data-a="play">Play</button>` +
      `<button data-a="prev">Back</button>` +
      `<button data-a="next">Next</button>` +
      `<input type="range" min="0" max="${n - 1}" value="0" aria-label="step"/>` +
      `<span class="step"></span>` +
    `</div>`;

  const stage = host.querySelector(".vizstage"),
        cap   = host.querySelector(".vizcap"),
        box   = document.createElement("div"),
        range = host.querySelector("input"),
        play  = host.querySelector('[data-a="play"]'),
        step  = host.querySelector(".step");

  box.className = "vizask";
  box.setAttribute("aria-live", "polite");
  cap.after(box);

  function draw() {
    const f = view(spec.frames[i]);
    stage.innerHTML = f.scene
      ? `<div class="vizscene">${f.scene}</div>`
      : (DRAW[spec.kind] || drawCells)(spec, f);
    cap.innerHTML = f.cap || "";
    range.value = i;
    step.textContent = `${i + 1} / ${n}`;
    host.dataset.i = i;               // lets a redraw of the page come back to this step
    ask(f);
  }

  // predict before reveal: the options, then the verdict, then a way on
  function ask(f) {
    box.innerHTML = "";
    box.hidden = !f.ask || i === n - 1;
    if (box.hidden) return;
    const a = f.ask, done = answered.has(i);
    box.innerHTML =
      `<div class="aq"><span class="tag">${W.guess}</span>${a.q}</div>` +
      `<div class="aopts">` + a.opts.map((o, k) =>
        `<button data-k="${k}"${done ? " disabled" : ""}>${o}</button>`).join("") + `</div>` +
      `<div class="averdict"></div>`;
    const verdict = box.querySelector(".averdict");
    const settle = picked => {
      answered.add(i);
      box.querySelectorAll(".aopts button").forEach(b => {
        const k = +b.dataset.k;
        b.disabled = true;
        if (k === a.a) b.classList.add("right");
        else if (k === picked) b.classList.add("wrong");
      });
      verdict.innerHTML =
        (picked == null ? "" : `<b>${picked === a.a ? W.right : W.wrong}</b> `) +
        (a.why || "") + ` <button class="go">${W.show}</button>`;
      verdict.querySelector(".go").addEventListener("click", () => go(1));
    };
    box.querySelectorAll(".aopts button").forEach(b =>
      b.addEventListener("click", () => settle(+b.dataset.k)));
    if (done) settle(null);
  }
  function go(d) { i = (i + d + n) % n; draw(); }
  function stop() { clearInterval(timer); timer = null; play.textContent = "Play"; }

  play.addEventListener("click", () => {
    if (timer) return stop();
    play.textContent = "Pause";
    // a question is a place to stop and think, so the player waits there,
    // unless Play was pressed on that very question, which reads as "skip it"
    const from = i;
    timer = setInterval(() => {
      if (i === n - 1) { stop(); i = 0; draw(); }
      else if (spec.frames[i].ask && !answered.has(i) && i !== from) stop();
      else go(1);
    }, 1400);
  });
  host.querySelector('[data-a="prev"]').addEventListener("click", () => { stop(); go(-1); });
  host.querySelector('[data-a="next"]').addEventListener("click", () => { stop(); go(1); });
  range.addEventListener("input", () => { stop(); i = +range.value; draw(); });
  draw();
}

/* ============================ the visuals ============================ */

Object.assign(VIZ, {

/* ---- complexity ---- */
"big-o": { kind: "curve", frames: [
  { show: ["O(1)"], cap: "<b>O(1)</b>, the work does not care how big the input is. A dict lookup, an array index, arithmetic." },
  { show: ["O(1)", "O(log n)"], cap: "<b>O(log n)</b>, each step throws away half the remaining input. n = 1,000,000 needs only ~20 steps." },
  { show: ["O(1)", "O(log n)", "O(n)"], cap: "<b>O(n)</b>. You touch every element once. A single loop, a single scan." },
  { show: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], cap: "<b>O(n log n)</b>, a full scan repeated log n times. Sorting lives here; it is the practical ceiling for large n." },
  { show: ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)"], cap: "<b>O(n²)</b>, a loop inside a loop. Fine at n = 1,000; dead at n = 1,000,000. Notice how fast it leaves the chart." },
  { show: ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"], cap: "<b>O(2ⁿ)</b>, every element doubles the work. n = 40 is already hopeless. This is why we memoise." },
]},

/* ---- dynamic array ---- */
"dynamic-array": { kind: "cells", arr: ["3", "·"], frames: [
  { arr: ["3", "·"], on: [0], dim: [1], out: "size 1 · capacity 2", cap: "A growable array (Python <code>list</code>, Java <code>ArrayList</code>, C++ <code>vector</code>, JS <code>Array</code>) is a block of memory with spare room. <b>append</b> writes into the next free slot, <b>O(1)</b>." },
  { arr: ["3", "1"], on: [0, 1], out: "size 2 · capacity 2", cap: "<b>append(1)</b> → written. The block is now full." },
  { arr: ["3", "1"], bad: [0, 1], out: "no free slot", cap: "<b>append(4)</b> has nowhere to go. Memory blocks are fixed. You cannot ask for \"two more bytes on the end\"." },
  { arr: ["3", "1", "·", "·"], hot: [0, 1], dim: [2, 3], out: "copied 2 elements", cap: "So it allocates a <b>new block of double the size</b> and copies everything across. <b>This single append costs O(n).</b>" },
  { arr: ["3", "1", "4", "·"], on: [0, 1, 2], dim: [3], out: "size 3 · capacity 4", cap: "Then 4 is written. But doubling means the next resize is twice as far away." },
  { arr: ["3", "1", "4", "9"], on: [0, 1, 2, 3], out: "cost pattern: 1,1,2,1,4,1,1,1,8…", cap: "Over n appends the copies sum to 1+2+4+…+n &lt; 2n. Spread over n appends that is <b>O(1) amortised</b>, the answer you give in an interview." },
  { arr: ["3", "1", "4", "9"], bad: [0], hot: [1, 2, 3], out: "insert(0, x) → shift everything", cap: "The flip side: inserting or popping at the <b>front</b> shifts every element right. <b>O(n)</b>. That is why BFS uses a <code>deque</code>, not a list." },
]},

/* ---- string immutability ---- */
"string-immutable": { kind: "cells", arr: ["a"], frames: [
  { arr: ["a"], on: [0], out: "chars written: 1", cap: "<code>s = \"a\"</code>. In most languages a string is <b>immutable</b>. This object can never be edited, only replaced." },
  { arr: ["a", "b"], hot: [0], on: [1], out: "chars written: 1 + 2 = 3", cap: "<code>s += \"b\"</code> does <b>not</b> append. It builds a brand-new object and <b>copies the old 'a' in</b> (orange = copied again)." },
  { arr: ["a", "b", "c"], hot: [0, 1], on: [2], out: "chars written: 3 + 3 = 6", cap: "<code>s += \"c\"</code> re-copies 2 old characters. Every step re-copies everything that came before it." },
  { arr: ["a", "b", "c", "d"], hot: [0, 1, 2], on: [3], out: "chars written: 6 + 4 = 10", cap: "1+2+3+4 = n(n+1)/2 → a loop that <i>looks</i> O(n) is really <b>O(n²)</b>. This is the classic hidden TLE." },
  { arr: ["a", "b", "c", "d"], on: [0, 1, 2, 3], out: "chars written: 4", cap: "Fix: collect pieces in a list and <code>\"\".join(parts)</code> once, one allocation, each char written exactly once → <b>O(n)</b>." },
]},

/* ---- hash map ---- */
"hashmap": { kind: "hash", buckets: 6, fn: "index = hash(k) % 6", frames: [
  { k: "'cat'", b: 4, cap: "<b>hash('cat')</b> turns the key into a huge integer, <code>% 6</code> folds it into a slot. One computation → we know exactly where to write. <b>O(1)</b>." },
  { k: "'dog'", b: 1, cap: "<b>'dog'</b> lands in slot 1. Nothing was searched, nothing was compared. The key itself computed its own address." },
  { k: "'bat'", b: 4, cap: "<b>Collision.</b> 'bat' hashes into slot 4 too. Both live there in a small list; a lookup compares within that tiny chain only." },
  { k: "'owl'", b: 2, cap: "Runtimes keep the table &lt; ~2/3 full, so chains stay ~1 long on average. That average is where \"O(1)\" comes from. It is not a guarantee." },
  { k: "'bat'?", b: 4, cap: "<b>Lookup</b> repeats the same one computation, jumps to slot 4, compares the short chain. Not a scan of the table. That is the whole trick." },
]},

/* ---- stack ---- */
"stack": { kind: "cells", arr: [], frames: [
  { arr: ["("], on: [0], ptr: { top: 0 }, cap: "<b>push('(')</b> → goes on the end. A stack is <b>LIFO</b>: last in, first out." },
  { arr: ["(", "["], on: [1], ptr: { top: 1 }, cap: "<b>push('[')</b>. Only the top is ever reachable. That restriction is the feature, not a limitation." },
  { arr: ["(", "[", "{"], on: [2], ptr: { top: 2 }, cap: "<b>push('{')</b>. The stack now remembers the exact order of everything still unclosed." },
  { arr: ["(", "["], hot: [1], ptr: { top: 1 }, cap: "Input <code>'}'</code> → <b>pop()</b> gives '{'. It matches, so we discard it. The most recent unclosed bracket is always the one that must close first." },
  { arr: ["("], hot: [0], ptr: { top: 0 }, cap: "Input <code>']'</code> → pop gives '['. Matches again. This is why bracket matching is a stack and not a counter." },
  { arr: [], out: "stack empty → valid", cap: "Input <code>')'</code> → pop '(' and the stack empties. Empty at the end = balanced. Push/pop are <b>O(1)</b>; total <b>O(n)</b>." },
]},

/* ---- queue ---- */
"queue": { kind: "cells", arr: [], frames: [
  { arr: ["A"], on: [0], ptr: { front: 0, back: 0 }, cap: "<b>append(A)</b>. A queue is <b>FIFO</b>: first in, first out, the order BFS needs to visit level by level." },
  { arr: ["A", "B", "C"], on: [1, 2], ptr: { front: 0, back: 2 }, cap: "A's neighbours B and C join the <b>back</b>. They are one level deeper, so they must wait." },
  { arr: ["B", "C"], hot: [0], ptr: { front: 0, back: 1 }, cap: "<b>popleft()</b> takes A from the <b>front</b>, the oldest, i.e. the shallowest node. B is next." },
  { arr: ["C", "D"], on: [1], ptr: { front: 0, back: 1 }, cap: "Process B, push its neighbour D. Level 1 drains before level 2 starts. That is exactly why BFS finds the <b>shortest</b> path in an unweighted graph." },
  { arr: ["D"], hot: [0], ptr: { front: 0, back: 0 }, cap: "Use <code>collections.deque</code>: popleft is <b>O(1)</b>. <code>list.pop(0)</code> shifts every element and is O(n), an O(V+E) BFS silently becomes O(V²)." },
]},

/* ---- heap ---- */
"heap": {
  kind: "tree", w: 560, h: 300,
  nodes: { a: { x: 280, y: 44, t: "2", sub: "i=0" }, b: { x: 160, y: 130, t: "5", sub: "i=1" }, c: { x: 400, y: 130, t: "7", sub: "i=2" },
           d: { x: 100, y: 216, t: "9", sub: "i=3" }, e: { x: 222, y: 216, t: "6", sub: "i=4" }, f: { x: 340, y: 216, t: "8", sub: "i=5" } },
  edges: [["a", "b"], ["a", "c"], ["b", "d"], ["b", "e"], ["c", "f"]],
  frames: [
    { on: ["a"], out: "min-heap: every parent ≤ its children", cap: "A heap is <b>not</b> a sorted array. It only promises one thing: <b>the root is the minimum</b>. That weaker promise is what makes it cheap." },
    { on: ["a", "b", "c"], edge: [["a", "b"], ["a", "c"]], cap: "Check the rule locally: 2 ≤ 5 and 2 ≤ 7. Nothing says 5 &lt; 7, <b>siblings are unordered</b>, and that is fine." },
    { t: { f: "1" }, on: ["f"], out: "push(1) at index 5 = the next free slot", cap: "<b>push(1)</b>. It goes at the end of the array so the tree stays complete (no gaps). But 1 &lt; its parent 7, so the rule is broken." },
    { t: { c: "1", f: "7" }, on: ["c", "f"], edge: [["c", "f"]], out: "swap with parent", cap: "<b>Sift up</b>: swap with the parent. One comparison, one swap. The rest of the tree is untouched." },
    { t: { a: "1", c: "2", f: "7" }, on: ["a", "c"], edge: [["a", "c"]], out: "swap again → new min at the root", cap: "1 &lt; 2, so swap again. It stops here. You only ever walk one root-to-leaf path → <b>O(log n)</b>, not O(n)." },
    { t: { a: "1", c: "2", f: "7" }, on: ["a"], dim: ["b", "c", "d", "e", "f"], out: "heap[0] is the answer · no children pointers needed", cap: "<b>pop</b> is the mirror: take the root, move the last element up, sift <i>down</i>. And it is all one flat array, children of <code>i</code> are <code>2i+1</code> and <code>2i+2</code>." },
  ]
},

/* ---- recursion ---- */
"recursion-tree": {
  kind: "tree", w: 640, h: 320,
  nodes: { n4: { x: 320, y: 40, t: "f(4)" }, n3: { x: 200, y: 118, t: "f(3)" }, m2: { x: 470, y: 118, t: "f(2)" },
           n2: { x: 120, y: 196, t: "f(2)" }, n1: { x: 280, y: 196, t: "f(1)" },
           m1: { x: 410, y: 196, t: "f(1)" }, m0: { x: 530, y: 196, t: "f(0)" },
           k1: { x: 70, y: 274, t: "f(1)" }, k0: { x: 176, y: 274, t: "f(0)" } },
  edges: [["n4", "n3"], ["n4", "m2"], ["n3", "n2"], ["n3", "n1"], ["n2", "k1"], ["n2", "k0"], ["m2", "m1"], ["m2", "m0"]],
  frames: [
    { on: ["n4"], dim: ["n3", "m2", "n2", "n1", "m1", "m0", "k1", "k0"], cap: "<code>fib(4)</code>. Recursion is a <b>promise</b>: assume fib(3) and fib(2) already work, and just add them. You never trace the whole thing in your head." },
    { on: ["n4", "n3"], edge: [["n4", "n3"]], dim: ["m2", "m1", "m0"], cap: "The machine goes depth-first: fib(4) pauses (its frame sits on the call stack) and asks fib(3) first." },
    { on: ["n3", "n2", "k1", "k0"], edge: [["n3", "n2"], ["n2", "k1"], ["n2", "k0"]], dim: ["m2", "m1", "m0"], cap: "Down to <b>f(1)</b> and <b>f(0)</b>, the <b>base cases</b>. They return without calling anything. No base case = infinite descent = RecursionError." },
    { t: { k1: "1", k0: "0", n2: "1" }, on: ["n2", "k1", "k0"], dim: ["m2", "m1", "m0"], out: "returns bubble back up", cap: "Values return <b>upward</b>: 1 + 0 = 1. Each frame resumes exactly where it paused, with its own local variables intact." },
    { t: { k1: "1", k0: "0", n2: "1", n1: "1", n3: "2" }, on: ["n3"], dim: ["m2", "m1", "m0"], cap: "fib(3) = fib(2) + fib(1) = 1 + 1 = <b>2</b>. Only now does fib(4) get to ask for its second branch." },
    { t: { k1: "1", k0: "0", n2: "1", n1: "1", n3: "2", m1: "1", m0: "0", m2: "1", n4: "3" }, on: ["n4", "n3", "m2"], cap: "fib(4) = 2 + 1 = <b>3</b>. Depth = stack space = O(n). Nodes = work = O(2ⁿ)." },
    { t: { k1: "1", k0: "0", n2: "1", n1: "1", n3: "2", m1: "1", m0: "0", m2: "1", n4: "3" }, on: ["n2", "m2"], dim: ["k1", "k0", "m1", "m0"], out: "f(2) computed twice, memoise it", cap: "Look: <b>f(2) was computed twice</b>. Cache each answer (<code>@lru_cache</code>) and the tree collapses to a line → O(n). <b>That is literally what DP is.</b>" },
  ]
},

/* ---- binary search ---- */
"binary-search": { kind: "cells", arr: ["1", "3", "5", "7", "9", "11", "13", "15"], frames: [
  { on: [], out: "target = 11", cap: "The array is <b>sorted</b>. That is the whole precondition. It means one comparison tells you about a <i>whole half</i>, not just one element." },
  { band: [0, 7], ptr: { lo: 0, mid: 3, hi: 7 }, out: "a[mid] = 7 < 11", cap: "Look at the middle. 7 &lt; 11, and everything left of it is even smaller, so <b>the entire left half is eliminated by one comparison</b>." },
  { band: [4, 7], dim: [0, 1, 2, 3], ptr: { lo: 4, mid: 5, hi: 7 }, out: "a[mid] = 11 = target", cap: "Search only 4..7. New middle is 11, found, in <b>2 steps</b> instead of 6." },
  { band: [4, 7], dim: [0, 1, 2, 3], hot: [5], ptr: { mid: 5 }, out: "8 → 4 → 2 → 1", cap: "Each step halves what is left. How many halvings until 1? <b>log₂n</b>. n = 1,000,000 → about 20 comparisons." },
  { arr: ["1", "3", "5", "7", "9", "11", "13", "15"], bad: [3, 4], ptr: { lo: 3, hi: 4 }, out: "while lo < hi · mid = (lo+hi)//2", cap: "<b>The bug lives here.</b> Use <code>lo &lt; hi</code> with <code>lo = mid+1</code> / <code>hi = mid</code> so the range always shrinks. If a branch can leave lo and hi unchanged, you loop forever." },
]},

/* ---- sliding window, fixed ---- */
"sliding-window": { kind: "cells", arr: ["2", "1", "5", "1", "3", "2"], frames: [
  { on: [], out: "k = 3 · brute force = re-add 3 numbers per window", cap: "Max sum of any 3 in a row. The obvious way recomputes each window from scratch: <b>O(n·k)</b>. Look at what it wastes." },
  { band: [0, 2], out: "sum = 2+1+5 = 8", cap: "First window, computed once and honestly: 8." },
  { band: [1, 3], bad: [0], hot: [3], out: "sum = 8 − 2 + 1 = 7", cap: "Slide right. Windows 1 and 2 <b>share</b> 1 and 5, so don't re-add them. <b>Subtract the leaver, add the joiner.</b> Two operations, not three." },
  { band: [2, 4], bad: [1], hot: [4], out: "sum = 7 − 1 + 3 = 9  ← best", cap: "That reuse is the entire pattern. Sum = 9, the best so far." },
  { band: [3, 5], bad: [2], hot: [5], out: "sum = 9 − 5 + 2 = 6", cap: "Last window: 6. Answer = 9." },
  { on: [0, 1, 2, 3, 4, 5], out: "each element joins once, leaves once → O(n)", cap: "Every element is added exactly once and removed exactly once. <b>O(n·k) → O(n)</b>, using O(1) extra space." },
]},

/* ---- sliding window, variable ---- */
"sliding-window-var": { kind: "cells", arr: ["a", "b", "c", "a", "b", "b"], frames: [
  { on: [], out: "longest substring with no repeated character", cap: "Now the window has <b>no fixed size</b>. The rule: grow greedily on the right; when the window becomes invalid, shrink from the left." },
  { band: [0, 2], ptr: { L: 0, R: 2 }, out: "window = {a,b,c} · len 3", cap: "R walks right, adding letters. Still no duplicate → keep growing. Best = 3." },
  { band: [0, 3], ptr: { L: 0, R: 3 }, bad: [0, 3], out: "'a' repeats → invalid", cap: "R hits 'a', which is already inside. The window is now <b>invalid</b>, so we stop growing and start shrinking." },
  { band: [1, 3], ptr: { L: 1, R: 3 }, out: "window = {b,c,a} · len 3", cap: "Move L past the earlier 'a'. Valid again. <b>L never moves backwards</b>. That is why this is O(n) and not O(n²)." },
  { band: [1, 4], ptr: { L: 1, R: 4 }, bad: [1, 4], out: "'b' repeats → shrink", cap: "R adds 'b', duplicate again. Shrink from the left until it is legal." },
  { band: [2, 4], ptr: { L: 2, R: 4 }, out: "window = {c,a,b} · len 3 (best)", cap: "Valid, length 3. Answer stays 3." },
  { on: [0, 1, 2, 3, 4, 5], out: "L moves ≤ n times · R moves ≤ n times → O(n)", cap: "Two pointers, each crossing the array at most once, <b>2n moves total = O(n)</b>, even though the window bounces around." },
]},

/* ---- two pointers ---- */
"two-pointers": { kind: "cells", arr: ["1", "3", "4", "6", "8", "11"], frames: [
  { on: [], out: "sorted · find a pair summing to 10", cap: "Brute force tries every pair: O(n²). But the array is <b>sorted</b>. That ordering is information we can spend." },
  { ptr: { L: 0, R: 5 }, on: [0, 5], out: "1 + 11 = 12 > 10", cap: "Start at both ends. Sum is <b>too big</b>. 11 is the largest number left, so no partner can make it smaller, <b>11 can be dropped entirely</b>." },
  { ptr: { L: 0, R: 4 }, on: [0, 4], dim: [5], out: "1 + 8 = 9 < 10", cap: "Too small now. By the same logic 1 is the smallest left, so 1 can never be part of the answer → drop it." },
  { ptr: { L: 1, R: 4 }, on: [1, 4], dim: [0, 5], out: "3 + 8 = 11 > 10", cap: "Too big → move R in. Each comparison eliminates an entire row/column of the O(n²) table." },
  { ptr: { L: 1, R: 3 }, on: [1, 3], dim: [0, 4, 5], out: "3 + 6 = 9 < 10", cap: "Too small → move L in. The pointers only ever move toward each other." },
  { ptr: { L: 2, R: 3 }, hot: [2, 3], dim: [0, 1, 4, 5], out: "4 + 6 = 10", cap: "Found. The pointers met after <b>n moves total</b>: <b>O(n)</b> time, O(1) space, and the sort that enables it is O(n log n)." },
]},

});

/* ---- linked list: walking it, and the reversal that everyone gets wrong ---- */
Object.assign(VIZ, {

"linked-list": { kind: "chain", arr: ["3", "1", "4", "9"], frames: [
  { on: [0], ptr: { head: 0 }, cap: "A node holds a value and <b>the address of the next node</b>. Nothing else. The nodes can sit anywhere in memory, the arrows are the only structure." },
  { on: [0], ptr: { curr: 0 }, out: "step 1", cap: "There is no arithmetic that jumps to index 2. To go anywhere you <b>follow arrows from the head</b>, one at a time." },
  { on: [1], dim: [0], ptr: { curr: 1 }, out: "step 2", cap: "Reaching position i costs i steps. That is why indexing is <b>O(n)</b> and binary search is impossible here." },
  { on: [2], dim: [0, 1], ptr: { curr: 2 }, out: "step 3", cap: "Every hop is also a jump to an unrelated place in memory, so the cache cannot help, a linked list is slower than its Big-O suggests." },
  { arr: ["3", "1", "7", "4", "9"], on: [2], hot: [1, 3], ptr: { curr: 2 }, out: "insert: 2 pointers rewritten", cap: "But <b>insert</b> is where it wins. Point the new node at 4, point 1 at the new node. <b>Two writes, O(1)</b>. Nothing shifts, unlike an array." },
]},

"linked-list-reverse": { kind: "chain", arr: ["3", "1", "4"], frames: [
  { links: [1, 1], ptr: { prev: -1, curr: 0 }, out: "prev = null", cap: "Reversing means <b>turning every arrow around</b>. Walk the list once, flipping one arrow per step." },
  { links: [1, 1], on: [0], hot: [1], ptr: { curr: 0, next: 1 }, out: "next = curr.next   <-- save it FIRST", cap: "Here is the trap: the moment you flip curr's arrow, you have destroyed your only way forward. <b>Save <code>next</code> before touching anything.</b>" },
  { links: [-1, 1], on: [0, 1], ptr: { prev: 0, curr: 1 }, out: "curr.next = prev", cap: "Now flip it. Node 3 points backwards at null, and prev and curr both shuffle one step right." },
  { links: [-1, -1], on: [1, 2], ptr: { prev: 1, curr: 2 }, out: "repeat", cap: "Same three moves again: save next, flip, advance. This is why the loop needs <b>three</b> pointers, not two." },
  { links: [-1, -1], on: [2], ptr: { head: 2 }, nullEnd: false, out: "return prev", cap: "curr falls off the end, and <b>prev is the new head</b>. One pass, <b>O(n) time and O(1) space</b>, returning curr is the other classic bug." },
]},

/* ---- binary tree: the same three lines, in three different orders ---- */
"tree-traversal": {
  kind: "tree", w: 560, h: 290,
  nodes: { a: { x: 280, y: 44, t: "1" }, b: { x: 170, y: 130, t: "2" }, c: { x: 400, y: 130, t: "3" },
           d: { x: 110, y: 216, t: "4" }, e: { x: 232, y: 216, t: "5" }, f: { x: 400, y: 216, t: "6" } },
  edges: [["a", "b"], ["a", "c"], ["b", "d"], ["b", "e"], ["c", "f"]],
  frames: [
    { on: ["a"], dim: ["b", "c", "d", "e", "f"], out: "every node is the root of a smaller tree", cap: "A tree <b>is</b> recursion made of data. Node 1 is a root; so is node 2, of its own little tree. That is why nearly every tree solution is three lines." },
    { on: ["a", "b", "d"], dim: ["c", "e", "f"], edge: [["a", "b"], ["b", "d"]], out: "pre-order: 1, 2, 4 …", cap: "<b>Pre-order</b> visits the node <i>before</i> its children. Use it when the parent's answer must be known first, copying a tree, printing structure." },
    { on: ["d", "b", "e"], dim: ["a", "c", "f"], out: "in-order: 4, 2, 5 …", cap: "<b>In-order</b> visits left, then the node, then right. On a search tree this prints the values <b>in sorted order</b>, the invariant read out loud." },
    { on: ["d", "e", "b"], dim: ["a", "c", "f"], out: "post-order: 4, 5, 2 …", cap: "<b>Post-order</b> visits the node <i>after</i> its children. Use it when your answer is built from theirs, height, sums, deleting a tree." },
    { on: ["a", "b", "c"], dim: ["d", "e", "f"], out: "BFS by level: 1 | 2, 3 | 4, 5, 6", cap: "Those three are all depth-first, driven by the call stack. Swap in a <b>queue</b> and you get level order instead, the shape you need for 'shortest' and 'per level' questions." },
    { on: ["a", "b", "d"], dim: ["c", "e", "f"], out: "height 3 balanced ≈ log n · skewed = n", cap: "Everything costs <b>O(h)</b>. That is O(log n) only while the tree stays bushy. Degenerate it into a line and every operation is O(n), a linked list wearing a tree costume." },
  ]
},

/* ---- merge sort: why the bound is n log n, drawn ---- */
"merge-sort": { kind: "cells", arr: ["5", "2", "8", "1"], frames: [
  { arr: ["5", "2", "8", "1"], out: "n! possible orders to choose between", cap: "Sorting is the job of picking one arrangement out of <b>n!</b>. Each comparison can only halve the possibilities, so you need about <b>log₂(n!) ≈ n log n</b> of them. That is a proof, not a lack of cleverness." },
  { arr: ["5", "2", "8", "1"], on: [0, 1], dim: [2, 3], out: "split", cap: "Merge sort splits in half, then halves again. <b>log n levels</b> of splitting. That is where the log comes from." },
  { arr: ["5", "2", "8", "1"], on: [0], hot: [1], dim: [2, 3], out: "compare 5 and 2", cap: "At the bottom every piece is one element, which is sorted by definition. The work is all in putting them back together." },
  { arr: ["2", "5", "8", "1"], on: [0, 1], dim: [2, 3], out: "merged: [2, 5]", cap: "Merging two sorted runs is one walk with two fingers, take the smaller front element each time. <b>O(n) per level.</b>" },
  { arr: ["2", "5", "1", "8"], on: [2, 3], dim: [0, 1], out: "merged: [1, 8]", cap: "The right half merges the same way, independently." },
  { arr: ["1", "2", "5", "8"], on: [0, 1, 2, 3], out: "log n levels × O(n) per level = O(n log n)", cap: "Final merge. <b>log n levels, O(n) work each</b>, and it is <b>stable</b>, so equal elements keep their original order. The cost is O(n) scratch space." },
  { arr: ["3", "7", "1", "9"], hot: [1], on: [0], dim: [2, 3], out: "quicksort: partition around a pivot", cap: "Quicksort hits the same bound with <b>O(1) extra space</b> by partitioning around a pivot instead, but a bad pivot every time gives <b>O(n²)</b>, which is why real libraries randomise or bail out to heapsort." },
  { arr: ["a", "b", "a", "c"], on: [0, 2], out: "counting sort: O(n + k), no comparisons", cap: "And the n log n floor only binds <b>comparison</b> sorts. Use the values themselves as array indices and you sidestep it entirely, <b>O(n + k)</b>, worth it only when the range of values k is small." },
]},

});

/* ---- what a variable actually holds, and what `b = a` copies ---- */
Object.assign(VIZ, {

"aliasing": {
  kind: "tree", w: 600, h: 250, arrows: true,
  nodes: {
    a:   { x: 80,  y: 60,  t: "a",  w: 54 },
    b:   { x: 80,  y: 140, t: "b",  w: 54 },
    c:   { x: 80,  y: 140, t: "c",  w: 54, hidden: true },
    obj: { x: 380, y: 60,  t: "[1, 2, 3]", w: 150 },
    obj2:{ x: 380, y: 160, t: "[1, 2, 3]", w: 150, hidden: true },
  },
  edges: [["a", "obj"], ["b", "obj"], ["c", "obj2"]],
  frames: [
    { on: ["a", "obj"], dim: ["b"], show: ["a", "obj"], edge: [["a", "obj"]],
      out: "the variable is a label, not a box holding the list",
      cap: "<code>a = [1, 2, 3]</code> does two things: it builds a list <b>somewhere in memory</b>, and it makes <code>a</code> point at it. The name and the object are separate." },
    { on: ["a", "b", "obj"], show: ["a", "b", "obj"], edge: [["a", "obj"], ["b", "obj"]],
      out: "one object, two names",
      cap: "<code>b = a</code> copies the <b>arrow, not the list</b>. Nothing was duplicated. There is still exactly one list, now with two names for it. This is <b>aliasing</b>." },
    { t: { obj: "[1, 2, 3, 4]" }, hot: ["obj"], on: ["a", "b"], show: ["a", "b", "obj"],
      edge: [["a", "obj"], ["b", "obj"]],
      out: "b.append(4)  ->  a changed too",
      cap: "So mutating through <code>b</code> is visible through <code>a</code>. Not a bug in the language. There was only ever one list. <b>This is the single most common silent bug in interview code.</b>" },
    { on: ["a", "obj"], show: ["a", "c", "obj", "obj2"], edge: [["a", "obj"], ["c", "obj2"]],
      out: "c = copy of a  ->  a second object",
      cap: "To get a real second list you must <b>ask for a copy</b>, <code>a[:]</code>, <code>list(a)</code>, <code>new ArrayList&lt;&gt;(a)</code>. Now there are two objects and two arrows." },
    { t: { obj2: "[1, 2, 3, 9]" }, hot: ["obj2"], on: ["c"], dim: ["a", "obj"],
      show: ["a", "c", "obj", "obj2"], edge: [["a", "obj"], ["c", "obj2"]],
      out: "shallow copy: the OUTER list is new",
      cap: "Careful though: that copy is <b>shallow</b>. If the list held other lists, the inner ones are still shared, which is exactly why <code>[[0]*3]*3</code> gives you one row, three times." },
  ]
},

/* ---- two's complement, and why a big number can go negative ---- */
"int-overflow": { kind: "cells", arr: ["0","1","1","1","1","1","1","1"], idx: false, frames: [
  { on: [0], out: "8-bit signed: the first bit is the SIGN", cap: "A fixed-width integer is a fixed number of bits. Shown here as 8 for legibility; a real <code>int</code> is 32. The leading bit carries the sign." },
  { arr: ["0","1","1","1","1","1","1","1"], on: [1,2,3,4,5,6,7], out: "0111 1111 = 127 = the largest value", cap: "With 8 bits the largest positive value is <b>127</b>. With 32 bits it is <b>2,147,483,647</b>, the number you have seen in every overflow bug." },
  { arr: ["1","0","0","0","0","0","0","0"], bad: [0], hot: [1,2,3,4,5,6,7], out: "+1  ->  1000 0000 = -128", cap: "Add one and the carry rolls into the sign bit. The value does not saturate and does not raise an error. It <b>wraps around to the most negative number</b>. Java and C++ do this silently." },
  { arr: ["1","0","0","0","0","0","0","0"], bad: [0], out: "(lo + hi) / 2 can overflow", cap: "This is the famous binary-search bug: <code>lo + hi</code> exceeds the range even though the answer would not. Write <code>lo + (hi - lo) / 2</code> instead." },
  { arr: ["0","0","0","0","0","0","0","0"], on: [0,1,2,3,4,5,6,7], out: "Python: no fixed width, no overflow", cap: "Python integers grow as large as memory allows, so none of this can happen, but the arithmetic stops being O(1) on huge values, and any solution you port to Java or C++ inherits the problem." },
]},

/* ---- where a negative number lands when you divide it ---- */
"division-rounding": { kind: "cells", arr: ["-4","-3","-2","-1","0","1","2","3"], idx: false, frames: [
  { on: [], out: "-7 / 2 = -3.5   ...so which way?", cap: "Integer division has to land on a whole number. <b>Languages disagree about which direction</b>, and the disagreement only shows up on negative numbers." },
  { hot: [1], ptr: { "truncate": 1 }, out: "C, C++, Java, JavaScript: -3", cap: "Most languages <b>truncate toward zero</b>: they drop the fraction, so -3.5 becomes <b>-3</b>." },
  { hot: [0], ptr: { "floor": 0 }, out: "Python: -7 // 2 = -4", cap: "Python <b>floors</b>: it rounds toward negative infinity, so -3.5 becomes <b>-4</b>. Same expression, different answer." },
  { on: [4,5,6,7], dim: [0,1,2,3], out: "-7 % 3  ->  Python 2, Java/C++ -1", cap: "Modulo inherits the same split. Python's result takes the sign of the <b>divisor</b> (always 0..n-1, which is why hashing works cleanly); Java and C++ take the sign of the <b>dividend</b>." },
  { on: [4,5,6], hot: [4], out: "((x % n) + n) % n  ->  always non-negative", cap: "So when an index must be non-negative (a circular buffer, a hash bucket), write it defensively. <b>This one line is worth memorising.</b>" },
]},

/* ---- the half-open range, and why it removes off-by-one errors ---- */
"half-open": { kind: "cells", arr: ["a","b","c","d","e","f"], frames: [
  { band: [0, 5], ptr: { lo: 0, hi: 5 }, out: "[0, 6)  ->  size 6 - 0 = 6", cap: "Write ranges as <b>[lo, hi)</b>: lo is included, hi is not. The size is then simply <b>hi − lo</b>, with no +1 to remember or forget." },
  { band: [2, 4], dim: [0,1,5], ptr: { lo: 2, hi: 4 }, out: "[2, 5)  ->  size 5 - 2 = 3", cap: "Three elements, and the arithmetic says three. With an inclusive [2, 4] you would have to write hi − lo + 1, and that missing +1 is most off-by-one bugs." },
  { band: [3, 2], dim: [0,1,2,4,5], ptr: { lo: 3, hi: 3 }, out: "[3, 3)  ->  size 0 = empty", cap: "Empty ranges are expressible without a special case: <code>lo == hi</code> means empty. An inclusive range has no honest way to say 'nothing'." },
  { band: [0, 2], dim: [3,4,5], ptr: { lo: 0, mid: 2, hi: 5 }, out: "split: [lo, mid) and [mid, hi)", cap: "Splitting needs no adjustment either, the two halves meet exactly at <code>mid</code>, with nothing shared and nothing skipped. This is why binary search and merge sort are written this way." },
  { band: [0, 5], on: [0,1,2,3,4,5], out: "invariant: the answer is always inside [lo, hi)", cap: "State the <b>invariant</b> before writing the loop, and every branch must keep it true. Once it is written down, the off-by-one questions answer themselves." },
]},

});

/* ---- grids, bits, and the ordering contract ---- */
Object.assign(VIZ, {

"grid-basics": {
  kind: "grid",
  arr: [["1","2","3"],["4","5","6"],["7","8","9"]],
  frames: [
    { on: [[1,1]], out: "grid[r][c] : row first, then column",
      cap: "A 2-D array is rows of rows. <b>grid[1][1]</b> means row 1, column 1. Half of all grid bugs are just this order swapped, and they fail loudly only when the grid is square, which it is in every example you practised on." },
    { on: [[1,1]], hot: [[0,1],[1,0],[1,2],[2,1]], dirs: [[1,1,-1,0],[1,1,1,0],[1,1,0,-1],[1,1,0,1]],
      out: "DIRS = [(-1,0),(1,0),(0,-1),(0,1)]",
      cap: "The four neighbours are just four <b>(dr, dc)</b> pairs. Keep them in one list and loop over it, instead of writing the same bounds check four times and getting the third one wrong." },
    { on: [[0,0]], bad: [[0,1]], dirs: [[0,0,-1,0],[0,0,0,-1]],
      out: "r-1 = -1 and c-1 = -1 are OFF the board",
      cap: "At an edge, two of those neighbours do not exist. Check bounds <b>before</b> you index, not after. In Python a negative index politely wraps to the far side of the grid and gives you a confidently wrong answer." },
    { arr: [["1","4","7"],["2","5","8"],["3","6","9"]], on: [[0,1],[1,0]],
      out: "transpose: swap grid[r][c] with grid[c][r]",
      cap: "<b>Transpose</b> flips across the diagonal. Only swap where <code>c &gt; r</code>. Loop over the whole grid and you will swap every pair twice, arriving neatly back where you started." },
    { arr: [["7","4","1"],["8","5","2"],["9","6","3"]], on: [[0,0],[0,1],[0,2]],
      out: "rotate 90 = transpose, then reverse each row",
      cap: "Rotating in place looks like it needs cleverness. It needs two boring steps: transpose, then reverse each row. <b>O(1) extra space</b>, and nobody has to reason about a spiral." },
  ]
},

"bits": { kind: "cells", arr: ["0","0","0","0","1","0","1","1"], idx: false, frames: [
  { on: [4,6,7], out: "0000 1011 = 8 + 2 + 1 = 11",
    cap: "A number is already a row of switches. Bit i is worth 2<sup>i</sup>. Bit operations just stop pretending otherwise." },
  { on: [4,6,7], hot: [5], out: "x | (1 << 2)  ->  set bit 2",
    cap: "<b>Shift to build a mask, then combine.</b> <code>1 &lt;&lt; 2</code> is a single 1 in position 2. OR it in to <b>set</b>, AND with its inverse to <b>clear</b>, XOR to <b>flip</b>." },
  { on: [4,6,7], hot: [6], out: "(x >> 1) & 1  ->  is bit 1 on?",
    cap: "To <b>test</b> a bit, shift it down to the end and mask off everything else. Every one of these is a single machine instruction, which is why bitmask DP is fast enough to be worth the headache." },
  { arr: ["0","0","0","0","1","0","1","1"], on: [4,6,7], hot: [7], out: "x & 1  ->  odd or even",
    cap: "The last bit alone answers odd or even, and <code>x &gt;&gt; 1</code> halves. Every integer already carries its own binary representation. You were just never introduced." },
  { arr: ["0","0","0","1","0","0","0","0"], on: [3], out: "16 = 0001 0000  ->  exactly one bit set",
    cap: "A power of two has exactly one bit on. Subtract one and every lower bit flips on instead: <code>16 &amp; 15 == 0</code>. That is the whole trick behind <code>x &amp; (x-1) == 0</code>." },
  { arr: ["0","0","0","0","1","1","1","1"], hot: [4,5,6,7], out: "x & (x-1) clears the LOWEST set bit",
    cap: "And repeatedly clearing the lowest set bit counts the ones in <b>O(number of set bits)</b> rather than O(32). Neat, occasionally useful, and asked about far more often than it is needed." },
  { arr: ["0","1","0","1","0","1","0","1"], on: [1,3,5,7], out: "a ^ a = 0   and   a ^ 0 = a",
    cap: "<b>XOR is the one worth actually remembering.</b> A value cancels itself and leaves zero. So XOR the whole array together and every number that appears twice vanishes, leaving the one that does not. <b>O(n) time, O(1) space, no hash map.</b>" },
]},

"ordering": { kind: "cells", arr: ["B2","A1","B1","A2"], idx: false, frames: [
  { on: [], out: "sort these by LETTER only",
    cap: "Four items, tagged so you can see where they started. We will sort by the letter and watch what happens to the numbers." },
  { arr: ["A1","A2","B2","B1"], on: [0,1], hot: [2,3], out: "unstable: B2 before B1",
    cap: "An <b>unstable</b> sort is free to reorder items it considers equal. Both Bs compare the same, so it shuffled them. Not a bug. It never promised otherwise." },
  { arr: ["A1","A2","B1","B2"], on: [0,1,2,3], out: "stable: original order kept within each group",
    cap: "A <b>stable</b> sort leaves equal items in the order it found them. That sounds like a detail until you want to sort by two things." },
  { arr: ["A1","B1","A2","B2"], on: [0,1,2,3], out: "step 1: sort by the SECONDARY key",
    cap: "Multi-key sorting, the cheap way. Sort by the less important key first." },
  { arr: ["A1","A2","B1","B2"], on: [0,1,2,3], out: "step 2: sort by the primary key. Stability carries the rest.",
    cap: "Then sort by the primary key. Stability preserves the first ordering inside each group, so you get both. Do this with an unstable sort and it works perfectly on your test data and wrongly in production." },
]},

});

/* ---- search trees, graphs, and shortest paths ---- */
Object.assign(VIZ, {

"bst": {
  kind: "tree", w: 600, h: 300,
  nodes: {
    a: { x: 300, y: 44,  t: "8",  hidden: true },
    b: { x: 170, y: 130, t: "3",  hidden: true },
    c: { x: 430, y: 130, t: "10", hidden: true },
    d: { x: 100, y: 216, t: "1",  hidden: true },
    e: { x: 240, y: 216, t: "6",  hidden: true },
    f: { x: 490, y: 216, t: "14", hidden: true },
    s1: { x: 90,  y: 44,  t: "1", hidden: true },
    s2: { x: 190, y: 106, t: "3", hidden: true },
    s3: { x: 290, y: 168, t: "6", hidden: true },
    s4: { x: 390, y: 230, t: "8", hidden: true },
  },
  edges: [["a","b"],["a","c"],["b","d"],["b","e"],["c","f"],
          ["s1","s2"],["s2","s3"],["s3","s4"]],
  frames: [
    { show: ["a","b","c","d","e","f"], on: ["a"],
      out: "everything left < 8 < everything right",
      cap: "A search tree adds one rule to a binary tree: <b>every value in the left subtree is smaller, every value on the right is larger</b>. Not just the children. The entire subtree." },
    { show: ["a","b","c","d","e","f"], on: ["a"], dim: ["c","f"],
      out: "looking for 6:  6 < 8, so go left",
      cap: "That rule is what makes searching cheap. 6 is less than 8, so it cannot be anywhere on the right. <b>Half the tree is gone after one comparison</b>, which should sound familiar." },
    { show: ["a","b","c","d","e","f"], on: ["b"], dim: ["c","f","d"],
      out: "6 > 3, so go right",
      cap: "Same decision again, on a tree half the size. This is binary search, except the halving is built into the shape instead of computed from indices." },
    { show: ["a","b","c","d","e","f"], hot: ["e"], dim: ["c","f","d"],
      out: "found in 3 comparisons, not 6",
      cap: "Found. Insert and delete follow the identical path, which is why all three cost <b>O(h)</b>." },
    { show: ["a","b","c","d","e","f"], on: ["d","b","e","a","c","f"],
      out: "in-order walk:  1, 3, 6, 8, 10, 14",
      cap: "Walk it in-order (left, node, right) and the values come out <b>sorted</b>. That is not a happy accident, it is the invariant being read aloud." },
    { show: ["s1","s2","s3","s4"], bad: ["s1","s2","s3","s4"],
      out: "insert 1, 3, 6, 8 in order  ->  h = n",
      cap: "And here is the catch nobody mentions until it is too late. Insert <b>sorted</b> data and every value goes right, giving you a linked list with extra steps. Every O(log n) claim becomes <b>O(n)</b>. Self-balancing trees exist entirely to prevent this picture." },
  ]
},

"graph-basics": {
  kind: "tree", w: 580, h: 300,
  nodes: {
    A: { x: 90,  y: 70,  t: "A" }, B: { x: 250, y: 50,  t: "B" },
    C: { x: 410, y: 80,  t: "C" }, D: { x: 160, y: 200, t: "D" },
    E: { x: 330, y: 210, t: "E" }, F: { x: 500, y: 190, t: "F" },
  },
  edges: [["A","B"],["A","D"],["B","C"],["B","E"],["D","E"],["C","F"],["E","F"]],
  frames: [
    { on: ["A","B","C","D","E","F"],
      out: "6 nodes, 7 edges. No root, no order, no promises.",
      cap: "A graph is just things and connections. Unlike a tree there is no root, no parent, and nothing stopping a path from looping back on itself. Every structure so far has been a graph with rules removed." },
    { on: ["B"], hot: ["A","C","E"], edge: [["A","B"],["B","C"],["B","E"]],
      out: "adj[B] = [A, C, E]",
      cap: "Store it as an <b>adjacency list</b>: for each node, the list of its neighbours. Space is O(V + E), and asking \"who is next to B\" is immediate. This is the right answer roughly always." },
    { on: ["A"], hot: ["B","D"], dim: ["C","E","F"], edge: [["A","B"],["A","D"]],
      out: "DFS from A:  A, B, C, F, E, D",
      cap: "<b>Depth-first search</b> commits: walk as far as possible, then back up. It is recursion, or an explicit stack, and it answers questions about paths and connectivity." },
    { on: ["A","B","D"], hot: ["C","E"], dim: ["F"],
      out: "BFS from A:  A | B, D | C, E | F",
      cap: "<b>Breadth-first search</b> hedges: everything one step away, then everything two steps away. Same code, queue instead of stack, and now the first time you reach a node is by the <b>fewest edges</b>." },
    { bad: ["A","B","E","D"], edge: [["A","B"],["B","E"],["D","E"],["A","D"]],
      out: "A -> B -> E -> D -> A  (and around again, forever)",
      cap: "Here is what a tree never made you worry about: <b>cycles</b>. Without a visited set this walk never ends. In a tree you can be careless. In a graph, carelessness is an infinite loop." },
    { on: ["A","B","C","D","E","F"],
      out: "O(V + E) once you mark on push",
      cap: "Mark a node visited when you <b>enqueue</b> it, not when you dequeue it. Otherwise the same node is queued once per neighbour, and your linear traversal quietly stops being linear." },
  ]
},

"dijkstra": {
  kind: "tree", w: 600, h: 290, arrows: false,
  weights: { "A>B": 4, "A>C": 1, "C>B": 2, "B>D": 5, "C>D": 8, "D>E": 3 },
  nodes: {
    A: { x: 70,  y: 150, t: "0", sub: "A" },
    B: { x: 250, y: 60,  t: "\u221e", sub: "B" },
    C: { x: 250, y: 230, t: "\u221e", sub: "C" },
    D: { x: 430, y: 150, t: "\u221e", sub: "D" },
    E: { x: 560, y: 150, t: "\u221e", sub: "E" },
  },
  edges: [["A","B"],["A","C"],["C","B"],["B","D"],["C","D"],["D","E"]],
  frames: [
    { on: ["A"], out: "start: source is 0, everything else is unknown",
      cap: "Now the edges have <b>costs</b>, and BFS is no longer enough: fewest edges stops meaning cheapest. Each node holds the best distance found <i>so far</i>, which starts at infinity because we have not looked yet." },
    { t: { B: "4", C: "1" }, on: ["A"], hot: ["B","C"], edge: [["A","B"],["A","C"]],
      out: "settle A, relax its edges: B = 4, C = 1",
      cap: "Take the cheapest unsettled node (A, at 0) and <b>relax</b> its edges: if going through A beats the current best, write down the better number. That is the whole algorithm." },
    { t: { B: "4", C: "1" }, on: ["C"], dim: ["E"],
      out: "cheapest unsettled is C at 1, not B at 4",
      cap: "Always take the cheapest unsettled node next. That is the greedy choice, and it is exactly what the priority queue is for." },
    { t: { B: "3", C: "1", D: "9" }, on: ["C"], hot: ["B","D"], edge: [["C","B"],["C","D"]],
      out: "B improves: 1 + 2 = 3, which beats 4",
      cap: "And here is the payoff. The direct road to B cost 4, but going <b>through C</b> costs 1 + 2 = 3. The old answer is overwritten. BFS could never have noticed, because it counts edges rather than cost." },
    { t: { B: "3", C: "1", D: "8" }, on: ["B"], hot: ["D"], edge: [["B","D"]],
      out: "settle B at 3, D improves to 3 + 5 = 8",
      cap: "Settle B. Its edge to D offers 8, beating the 9 we had through C. D is still not settled, so it can still improve again." },
    { t: { B: "3", C: "1", D: "8", E: "11" }, on: ["A","B","C","D","E"],
      out: "final: A0 B3 C1 D8 E11",
      cap: "Once a node is settled its distance is final, because every remaining route starts from something more expensive. <b>O((V + E) log V)</b> with a heap." },
    { t: { B: "3", C: "1", D: "8", E: "11" }, bad: ["C","B"], edge: [["C","B"]],
      out: "negative edge  ->  the greedy promise breaks",
      cap: "That \"already settled, therefore final\" reasoning assumes edges only ever <b>add</b> cost. Allow a negative edge and a cheaper route can appear after you have committed. Dijkstra does not detect this, it just returns the wrong answer. That is what Bellman-Ford is for." },
  ]
},

"adjacency": {
  kind: "grid",
  arr: [["", "A", "B", "C", "D"],
        ["A", "0", "1", "0", "1"],
        ["B", "1", "0", "1", "0"],
        ["C", "0", "1", "0", "0"],
        ["D", "1", "0", "0", "0"]],
  frames: [
    { on: [[1,2],[2,1]], out: "matrix[A][B] = 1  ->  there is an edge",
      cap: "The other representation: a <b>V x V matrix</b> where a 1 means an edge. Checking whether two nodes are connected is one lookup, which sounds great until you see the bill." },
    { on: [[1,2],[2,1],[1,4],[4,1],[2,3],[3,2]], out: "symmetric, because the graph is undirected",
      cap: "Undirected means the matrix mirrors across the diagonal. A directed graph does not, and forgetting to add both entries is one of the top two graph bugs." },
    { dim: [[1,1],[1,3],[2,2],[2,4],[3,1],[3,3],[3,4],[4,2],[4,3],[4,4]],
      hot: [[1,2],[1,4],[2,1],[2,3],[3,2],[4,1]],
      out: "6 ones, 10 zeros. And this graph is tiny.",
      cap: "Here is the bill: <b>O(V²) space no matter how few edges exist</b>. Real graphs are sparse, so you would be storing mostly zeros. A million users means a trillion cells." },
    { on: [[1,1],[2,2],[3,3],[4,4]], out: "adjacency list: O(V + E) instead",
      cap: "So use an <b>adjacency list</b> unless the graph is genuinely dense or you need constant-time edge lookups. Listing a node's neighbours is also O(V) in a matrix and O(degree) in a list, and listing neighbours is what traversal does all day." },
  ]
},

});

/* ---- prefix sums, backtracking, and dynamic programming ---- */
Object.assign(VIZ, {

"prefix-sums": { kind: "cells", arr: ["3","1","4","1","5"], frames: [
  { band: [1, 3], out: "sum of a[1..3] = 1 + 4 + 1 = 6",
    cap: "One range sum is easy. The trouble starts when you are asked for a thousand of them, because each one costs another walk. <b>O(n) per query</b> adds up quickly." },
  { arr: ["0","3","4","8","9","14"], on: [0], idx: true, out: "pre[0] = 0, and that zero matters",
    cap: "So pay once instead. Build <b>pre[i] = the sum of the first i elements</b>. Starting with a zero looks fussy and is the entire reason the arithmetic never needs a special case." },
  { arr: ["0","3","4","8","9","14"], on: [0,1,2,3,4,5], out: "one pass, pre[i+1] = pre[i] + a[i]",
    cap: "Filling it is a single scan. <b>O(n) once</b>, and now every question about a contiguous range is a subtraction." },
  { arr: ["0","3","4","8","9","14"], hot: [4], bad: [1], ptr: { "pre[4]": 4, "pre[1]": 1 },
    out: "sum a[1..3] = pre[4] - pre[1] = 9 - 3 = 6",
    cap: "Everything up to index 4, minus everything up to index 1, leaves exactly the middle. <b>O(1) per query</b>, no matter how wide the range." },
  { arr: ["0","3","4","8","9","14"], on: [1,4], out: "half-open again: [l, r) means pre[r] - pre[l]",
    cap: "The indices work because <code>pre</code> holds counts, not positions. If ranges make you nervous here, that is the half-open convention asking to be used." },
  { arr: ["3","1","4","1","5"], band: [1, 3], hot: [0],
    out: "sum(l..r) = k  ->  pre[r+1] - pre[l] = k  ->  look up pre[r+1] - k",
    cap: "And the version that actually shows up in interviews. Counting subarrays that sum to k is this identity rearranged: as you scan, ask a <b>hash map</b> how many earlier prefixes had the value you need. <b>O(n) instead of O(n squared)</b>, and it handles negative numbers, which a sliding window cannot." },
]},

"backtracking": {
  kind: "tree", w: 640, h: 300,
  nodes: {
    r:   { x: 320, y: 34,  t: "[]",     w: 60 },
    a1:  { x: 170, y: 108, t: "[1]",    w: 60 },
    a0:  { x: 470, y: 108, t: "[]",     w: 60 },
    b11: { x: 95,  y: 182, t: "[1,2]",  w: 74 },
    b10: { x: 245, y: 182, t: "[1]",    w: 60 },
    b01: { x: 395, y: 182, t: "[2]",    w: 60 },
    b00: { x: 545, y: 182, t: "[]",     w: 60 },
    c1:  { x: 95,  y: 256, t: "[1,2,3]", w: 88 },
    c2:  { x: 245, y: 256, t: "[1,3]",  w: 74 },
    c3:  { x: 395, y: 256, t: "[2,3]",  w: 74 },
    c4:  { x: 545, y: 256, t: "[3]",    w: 60 },
  },
  edges: [["r","a1"],["r","a0"],["a1","b11"],["a1","b10"],["a0","b01"],["a0","b00"],
          ["b11","c1"],["b10","c2"],["b01","c3"],["b00","c4"]],
  frames: [
    { on: ["r"], dim: ["a1","a0","b11","b10","b01","b00","c1","c2","c3","c4"],
      out: "at each item: take it, or skip it",
      cap: "Backtracking is a walk over a tree of <b>decisions</b>, not over data. For subsets the decision is take-or-skip, so three items give 2 x 2 x 2 = <b>8 leaves</b>. The tree is the answer space." },
    { on: ["r","a1","b11","c1"], dim: ["a0","b01","b00","c3","c4"],
      edge: [["r","a1"],["a1","b11"],["b11","c1"]],
      out: "choose, choose, choose  ->  [1,2,3]",
      cap: "Go down the left edge taking everything. At the bottom you have a complete answer, so record it. <b>Record a copy</b>, because the list you are holding is about to change under you." },
    { on: ["b11"], hot: ["c1"], dim: ["a0","b01","b00","c3","c4"],
      out: "un-choose: remove 3, step back up",
      cap: "Now the part that gives the technique its name. Undo the last choice and step back up. Without the undo, the next branch inherits your leftovers and every answer after this one is wrong." },
    { on: ["r","a1","b10","c2"], dim: ["a0","b01","b00","c3","c4","b11","c1"],
      edge: [["a1","b10"],["b10","c2"]],
      out: "explore the sibling: skip 2, take 3  ->  [1,3]",
      cap: "Same three moves for the sibling branch: choose, recurse, un-choose. One shared list, walked depth-first, restored on the way out." },
    { on: ["r","a1","a0","b11","b10","b01","b00","c1","c2","c3","c4"],
      out: "8 leaves for 3 items. 2^n, and it is not negotiable.",
      cap: "Every leaf is one subset, so the work is the <b>size of the answer space</b>. Subsets are O(2ⁿ), permutations O(n!). No amount of cleverness shrinks that, which is why n is always small in these questions." },
    { on: ["r","a1"], bad: ["a0","b01","b00","c3","c4"],
      edge: [["r","a0"]],
      out: "prune: if this branch cannot work, do not enter it",
      cap: "The one lever you do have is <b>pruning</b>: check before recursing whether the branch can still lead anywhere. Cutting a node near the top removes everything beneath it, and that is the difference between N-Queens finishing and N-Queens running until you close the tab." },
  ]
},

"dp-fill": { kind: "cells", arr: ["1","1","?","?","?","?","?"], frames: [
  { on: [0,1], dim: [2,3,4,5,6], out: "ways to climb i stairs, taking 1 or 2 at a time",
    cap: "Start from the recursion: to reach step i you came from i-1 or i-2, so <b>ways(i) = ways(i-1) + ways(i-2)</b>. Written recursively that recomputes the same steps endlessly." },
  { arr: ["1","1","2","?","?","?","?"], on: [0,1], hot: [2], dim: [3,4,5,6],
    out: "dp[2] = dp[1] + dp[0] = 2",
    cap: "So write each answer down the first time. That is <b>memoisation</b> if you compute it top-down, and <b>tabulation</b> if you fill the table bottom-up. Same numbers, same table, opposite direction." },
  { arr: ["1","1","2","3","?","?","?"], on: [1,2], hot: [3], dim: [4,5,6],
    out: "dp[3] = dp[2] + dp[1] = 3",
    cap: "Each cell is filled once, from cells that are already final. Nothing is recomputed, and nothing is guessed." },
  { arr: ["1","1","2","3","5","8","13"], on: [0,1,2,3,4,5,6],
    out: "n cells, O(1) work each  ->  O(n) instead of O(2ⁿ)",
    cap: "The whole table costs <b>O(n)</b>. The naive recursion for the same answer is O(2ⁿ). This is the entire trade: a little memory to stop repeating yourself." },
  { arr: ["1","1","2","3","5","8","13"], hot: [4,5], dim: [0,1,2],
    out: "dp[i] only ever reads dp[i-1] and dp[i-2]",
    cap: "Now look at what each cell actually reads. Only the last two. So the table can be thrown away and replaced with <b>two variables</b>: O(n) time, <b>O(1) space</b>. That reduction is the standard follow-up question." },
]},

"dp-grid": {
  kind: "grid",
  arr: [["1","1","1","1"],
        ["1","2","3","4"],
        ["1","3","6","10"]],
  frames: [
    { on: [[0,0]], dim: [[0,1],[0,2],[0,3],[1,1],[1,2],[1,3],[2,1],[2,2],[2,3]],
      out: "how many paths to each cell, moving only right or down?",
      cap: "Two dimensions now. The recurrence is the same shape: a cell's answer is built from the cells it can be reached from." },
    { on: [[0,0],[0,1],[0,2],[0,3],[1,0],[2,0]], dim: [[1,1],[1,2],[1,3],[2,1],[2,2],[2,3]],
      out: "the first row and column are the base case: one path each",
      cap: "Along the top edge you can only ever have come from the left, so there is exactly one route. Same down the left edge. <b>The base case is the boundary</b>, which is true of most grid DP." },
    { hot: [[1,1]], on: [[0,1],[1,0]], dim: [[0,2],[0,3],[1,2],[1,3],[2,1],[2,2],[2,3]],
      out: "grid[1][1] = above + left = 1 + 1 = 2",
      cap: "Every other cell reads the one above and the one to its left, both already final. Fill row by row and each cell is computed exactly once." },
    { on: [[0,0],[0,1],[0,2],[0,3],[1,0],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2]], hot: [[2,3]],
      out: "rows x cols cells, O(1) each  ->  O(rows x cols)",
      cap: "The bottom-right cell is the answer, and the cost is one pass over the grid. Recursion on the same problem would revisit the same cells an exponential number of times." },
    { hot: [[1,0],[1,1],[1,2],[1,3]], dim: [[0,0],[0,1],[0,2],[0,3]],
      out: "a row only ever reads the row above it",
      cap: "And again the space reduction falls out of looking at what a cell reads. Only the previous row is needed, so <b>O(cols) space</b> instead of O(rows x cols). Same answer, one row of memory." },
  ]
},

});

/* ---- a trie: the shared prefix IS the shared path ---- */
Object.assign(VIZ, {
"trie": {
  kind: "tree", w: 570, h: 330,
  nodes: {
    root: { x: 300, y: 34,  t: "\u25cf", w: 44, hidden: true },
    c:    { x: 205, y: 100, t: "c", hidden: true },
    a:    { x: 205, y: 166, t: "a", hidden: true },
    r:    { x: 205, y: 232, t: "r", sub: "end", hidden: true },
    t:    { x: 130, y: 296, t: "t", sub: "end", hidden: true },
    e:    { x: 280, y: 296, t: "e", sub: "end", hidden: true },
    d:    { x: 430, y: 100, t: "d", hidden: true },
    o:    { x: 430, y: 166, t: "o", hidden: true },
    g:    { x: 430, y: 232, t: "g", sub: "end", hidden: true },
  },
  edges: [["root","c"],["c","a"],["a","r"],["r","t"],["r","e"],
          ["root","d"],["d","o"],["o","g"]],
  frames: [
    { show: ["root","c","a","r"], on: ["c","a","r"],
      out: "insert \"car\": one node per character",
      cap: "Each <b>edge</b> is a character, so a node is not a letter, it is the whole prefix spelled by the path that reached it. The node marked <i>end</i> says a real word finishes here." },
    { show: ["root","c","a","r","t"], on: ["c","a","r"], hot: ["t"],
      out: "insert \"cart\": one new node, not four",
      cap: "\"cart\" already agrees with \"car\" for three characters, so it reuses that path and adds a single node. <b>Shared prefixes cost nothing twice.</b>" },
    { show: ["root","c","a","r","t","e"], on: ["c","a","r"], hot: ["e"],
      out: "insert \"care\": again, one new node",
      cap: "Three words, one spine. The overlap that a hash table deliberately destroys is exactly what this structure is built out of." },
    { show: ["root","c","a","r","t","e","d","o","g"], on: ["d","o","g"], dim: ["c","a","r","t","e"],
      out: "insert \"dog\": nothing in common, so nothing shared",
      cap: "No shared prefix means a separate branch. A trie is only compact when the words actually overlap, which is the honest limit of the idea." },
    { show: ["root","c","a","r","t","e","d","o","g"], on: ["c","a"], bad: ["a"],
      dim: ["r","t","e","d","o","g"],
      out: "search \"ca\": the node exists, but it is not an end",
      cap: "Walking to a node only proves the <b>prefix</b> exists. Without the end flag the trie would happily claim it contains \"ca\", which is the first bug everyone writes." },
    { show: ["root","c","a","r","t","e","d","o","g"], on: ["c","a","r"], hot: ["t","e"],
      dim: ["d","o","g"],
      out: "prefix \"car\" -> everything below is a match",
      cap: "Autocomplete is this: walk the prefix, then collect whatever hangs beneath. Cost is <b>the length of the prefix</b> plus the number of answers, and crucially not the number of words stored." },
  ]
},
});

/* ---- greedy, union-find, topological order, monotonic stack ---- */
Object.assign(VIZ, {

"greedy": {
  kind: "grid",
  arr: [["A","A","","","","",""],
        ["","B","B","B","","",""],
        ["","","","C","C","",""],
        ["D","D","D","D","D","D",""],
        ["","","","","","E","E"]],
  frames: [
    { on: [[0,0],[0,1],[1,1],[1,2],[1,3],[2,3],[2,4],[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[4,5],[4,6]],
      out: "five bookings, one room. Fit as many as possible.",
      cap: "Each row is a booking and the columns are time. They overlap, so some must be refused. The greedy question is which rule to refuse them by." },
    { on: [[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[4,5],[4,6]],
      bad: [[0,0],[0,1],[1,1],[1,2],[1,3],[2,3],[2,4]],
      out: "rule: take whatever starts earliest  ->  2 bookings",
      cap: "\"Start earliest\" sounds reasonable and is wrong. D starts first, hogs six slots, and blocks three shorter bookings. A plausible rule is not a correct one." },
    { on: [[0,0],[0,1]], hot: [[0,0],[0,1]], dim: [[1,1],[1,2],[1,3],[2,3],[2,4],[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[4,5],[4,6]],
      out: "rule: take whatever FINISHES earliest  ->  A, ends at 2",
      cap: "The rule that works: finish earliest. It leaves the room free as soon as possible, which leaves the most room for everything after it." },
    { on: [[0,0],[0,1],[2,3],[2,4]], hot: [[2,3],[2,4]],
      bad: [[1,1],[1,2],[1,3],[3,0],[3,1],[3,2],[3,3],[3,4],[3,5]],
      out: "B and D overlap A, so skip them. C starts at 3, take it.",
      cap: "Walk the list in finish order and take anything that starts after the last one ended. No lookahead, no backtracking, one pass." },
    { on: [[0,0],[0,1],[2,3],[2,4],[4,5],[4,6]], hot: [[4,5],[4,6]],
      bad: [[1,1],[1,2],[1,3],[3,0],[3,1],[3,2],[3,3],[3,4],[3,5]],
      out: "A, C, E  ->  3 bookings, and this is optimal",
      cap: "Three instead of two. The proof is an <b>exchange argument</b>: take any optimal schedule, swap its first booking for the earliest-finishing one, and it is still valid and still the same size. So a greedy first choice is never a mistake." },
    { bad: [[0,0],[0,1],[1,1],[1,2],[1,3],[2,3],[2,4],[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[4,5],[4,6]],
      out: "coins {1,3,4}, target 6: greedy says 4+1+1, optimal is 3+3",
      cap: "And the warning. Change the problem slightly and the same style of reasoning collapses: biggest-coin-first gives three coins where two suffice. <b>Greedy is easy to write and hard to justify</b>, and the writing is not the part that matters." },
  ]
},

"union-find": {
  kind: "tree", w: 580, h: 260, arrows: true,
  nodes: {
    n0: { x: 80,  y: 60, t: "0" }, n1: { x: 180, y: 60, t: "1" },
    n2: { x: 280, y: 60, t: "2" }, n3: { x: 380, y: 60, t: "3" },
    n4: { x: 480, y: 60, t: "4" },
    p0: { x: 80,  y: 170, t: "0" }, p1: { x: 200, y: 170, t: "1" },
    p2: { x: 320, y: 170, t: "2" }, p3: { x: 440, y: 170, t: "3" },
  },
  frames: [
    { show: ["n0","n1","n2","n3","n4"], on: ["n0","n1","n2","n3","n4"], edges: [],
      out: "five nodes, five sets, everyone is their own boss",
      cap: "Forget the edges. Store only <b>which group each node belongs to</b>, as one representative per group. \"Are these connected\" becomes \"do these two report to the same boss\"." },
    { show: ["n0","n1","n2","n3","n4"], on: ["n0"], hot: ["n1"], edges: [["n1","n0"]],
      out: "union(0,1): point one root at the other",
      cap: "A union is one write. Point 1's representative at 0 and the two sets are now one. No edge list, no traversal, no rebuilding anything." },
    { show: ["n0","n1","n2","n3","n4"], on: ["n0","n2"], hot: ["n3"],
      edges: [["n1","n0"],["n3","n2"]],
      out: "union(2,3): a second set forms",
      cap: "Sets grow independently. Nothing here knows or cares about the graph the edges came from." },
    { show: ["n0","n1","n2","n3","n4"], on: ["n0"], hot: ["n2"],
      edges: [["n1","n0"],["n3","n2"],["n2","n0"]],
      out: "union(1,3): merge the two ROOTS, never the two nodes",
      cap: "To merge, find each node's root first and link those. Linking the nodes directly is the classic bug: it appears to work and quietly builds a structure that answers wrongly later." },
    { show: ["n0","n1","n2","n3","n4"], on: ["n0"], bad: ["n3","n2"],
      edges: [["n1","n0"],["n3","n2"],["n2","n0"]],
      out: "find(3) now walks 3 -> 2 -> 0. Do that a million times.",
      cap: "Left alone, the chains grow and <b>find</b> degrades to O(n). Two independent repairs fix it, and both are two lines." },
    { show: ["n0","n1","n2","n3","n4"], on: ["n0"], hot: ["n2","n3"],
      edges: [["n1","n0"],["n2","n0"],["n3","n0"]],
      out: "path compression: on the way back, point everyone at the root",
      cap: "<b>Path compression</b> flattens the path you just walked, so the next find is one hop. Add <b>union by size</b>, which always hangs the smaller tree under the larger, and the amortised cost drops to effectively constant: under 5 for any n you will ever meet." },
    { show: ["p0","p1","p2","p3"], on: ["p0","p1","p2","p3"], edges: [],
      out: "parent = [0, 0, 0, 0]  ->  it was always just an array",
      cap: "And there is no tree in memory. The whole structure is one <b>parent array</b>, where a node pointing at itself is a root. That is why it is fast, and why it cannot un-union or list a set's members." },
  ]
},

"toposort": {
  kind: "tree", w: 580, h: 280, arrows: true,
  nodes: {
    a: { x: 80,  y: 70,  t: "A", sub: "0" },
    b: { x: 230, y: 40,  t: "B", sub: "1" },
    c: { x: 230, y: 150, t: "C", sub: "1" },
    d: { x: 390, y: 90,  t: "D", sub: "2" },
    e: { x: 520, y: 90,  t: "E", sub: "1" },
  },
  edges: [["a","b"],["a","c"],["b","d"],["c","d"],["d","e"]],
  frames: [
    { on: ["a"], out: "the number under each node is its in-degree",
      cap: "Arrows mean \"must come first\". A course, a build step, a spreadsheet cell. The number below each node counts how many things still block it." },
    { on: ["a"], hot: ["a"], dim: ["b","c","d","e"],
      out: "only A has in-degree 0, so only A can go first",
      cap: "Anything with in-degree zero is unblocked and may be emitted now. Start a queue with all of them, which here is just A." },
    { t: { b: "B", c: "C" }, on: ["b","c"], dim: ["a"],
      edges: [["b","d"],["c","d"],["d","e"]],
      out: "emit A, decrement its targets  ->  B and C both hit 0",
      cap: "Remove A and decrement whatever it pointed at. Two nodes drop to zero at once, which is why the order is usually <b>not unique</b>: either may go next." },
    { on: ["d"], dim: ["a","b","c"], edges: [["d","e"]],
      out: "emit B and C, then D unblocks",
      cap: "D was waiting on two things, so it only becomes available after both. Ask for the lexicographically smallest order and you swap the queue for a min-heap, and change nothing else." },
    { on: ["e"], dim: ["a","b","c","d"], edges: [],
      out: "A, B, C, D, E: 5 emitted, 5 nodes. Valid order.",
      cap: "Everything came out, so a valid order exists. <b>O(V + E)</b>, one pass, no recursion." },
    { bad: ["b","c","d"], dim: ["a","e"],
      edges: [["b","d"],["d","c"],["c","b"]],
      out: "emitted 2 of 5  ->  the leftovers ARE the cycle",
      cap: "Now the useful half. If the count you emitted is short, the nodes you never reached are exactly those stuck in a cycle, because a cycle can never reach in-degree zero. <b>Topological sort and cycle detection are the same computation</b>, which is why so many questions are cycle detection in a costume." },
  ]
},

"monotonic-stack": { kind: "cells", arr: ["2","1","5","6","2","3"], frames: [
  { on: [], out: "for each element, find the next one bigger than it",
    cap: "The naive answer scans right from every position: <b>O(n squared)</b>. Watch what that repeated scanning is actually re-reading." },
  { on: [0], ptr: { i: 0 }, out: "stack: [2]",
    cap: "Keep a stack of elements <b>still waiting for an answer</b>. 2 has not been beaten yet, so it waits." },
  { on: [0,1], ptr: { i: 1 }, out: "stack: [2, 1]",
    cap: "1 is smaller, so it cannot resolve 2 and joins the queue of the unanswered. The stack is now decreasing, and nobody sorted it." },
  { hot: [2], bad: [0,1], ptr: { i: 2 }, out: "5 beats 1 and 2  ->  both answered, both popped",
    cap: "5 arrives and settles everything smaller in one go. Here is the key: <b>2 and 1 can never be an answer for anything further right</b>, because 5 blocks them and is a better candidate. So they leave permanently." },
  { on: [2], hot: [3], ptr: { i: 3 }, out: "6 beats 5  ->  answered. stack: [6]",
    cap: "Same again. Each index enters the stack once and leaves once, which is the whole complexity argument: <b>at most 2n operations, so O(n)</b>, despite the nested while loop." },
  { on: [3,4,5], hot: [5], ptr: { i: 5 }, out: "3 answers 2. stack: [6, 3]. 6 never gets an answer.",
    cap: "Whatever is left on the stack at the end never found a bigger element, so those get the default answer. Forgetting to handle the leftovers is the most common bug in this pattern." },
  { on: [0,1,2,3,4,5], out: "next greater = [5, 5, 6, -1, 3, -1]",
    cap: "Four questions share this one shape: next greater, next smaller, previous greater, previous smaller. You change the scan direction and the comparison, and nothing else." },
]},

});

/* ---- primes, range trees, intervals, spanning trees, cyclic sort ---- */
Object.assign(VIZ, {

"sieve": { kind: "cells", arr: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"], idx: false, frames: [
  { on: [], out: "which of these are prime?",
    cap: "Testing each number on its own means dividing it by everything up to its square root. Doing that fifteen times repeats an enormous amount of work." },
  { on: [0], bad: [2,4,6,8,10,12,14], out: "2 is prime, so cross out every multiple of 2",
    cap: "So work the other way round. Take the first uncrossed number, declare it <b>prime</b>, and cross out everything it divides. Nothing is ever tested, only marked." },
  { on: [0,1], bad: [2,4,6,7,8,10,12,13,14],
    out: "3 is next uncrossed, so prime. Cross 9 and 15, starting at 3×3.",
    cap: "Start crossing at <b>p × p</b>, not at 2p. Every smaller multiple of 3 has a smaller prime factor and was already crossed out by it. That single detail is most of the speed." },
  { on: [0,1,3], bad: [2,4,6,7,8,10,12,13,14],
    out: "4 is already crossed, so skip it. 5 is prime.",
    cap: "Crossed numbers are skipped entirely, so the outer loop only ever stops on primes." },
  { on: [0,1,3,5,9,11], bad: [2,4,6,7,8,10,12,13,14],
    out: "next prime is 5, and 5×5 = 25 is past the end, so stop",
    cap: "Once <b>p × p</b> exceeds the limit there is nothing left to cross, so the loop stops at the square root. Everything still uncrossed is prime: 2, 3, 5, 7, 11, 13." },
  { on: [0,1,3,5,9,11], out: "O(n log log n), and no, you do not derive that in an interview",
    cap: "The cost is famously <b>O(n log log n)</b>. Quote it, do not attempt to prove it, and move on. Space is O(n), which is the real constraint when the limit is large." },
]},

/* One example carries the whole walk: 24 / 2 = 12, which is 5 mod 7. The
   reader sees the problem first, predicts at each turn, and meets the clock
   only once they know what it is being used to find. */
"mod-inverse": { kind: "cells", arr: ["0", "1", "2", "3", "4", "5", "6"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>Contest answers are huge, so problems ask for them <b>mod 10⁹ + 7</b>: keep only the remainder. Then a formula like <code>nCr = n! / (r! (n−r)!)</code> needs a <b>division</b>, but all you kept were remainders.</p><p>Here is the same problem in miniature. It uses 7 instead of 10⁹ + 7, so every remainder fits on screen:</p><table><tr><td>the real maths</td><td>24 / 2 = 12</td><td>12 mod 7 = <b>5</b></td></tr><tr><td>all you stored</td><td>24 → 3, 2 → 2</td><td>3 / 2 = <b>?</b></td></tr></table><p>Goal: get <b>5</b> using only the remainders 3 and 2.</p>`,
    cap: "Every step below answers one question: <b>how do you divide when all you kept were remainders?</b> Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Contest ke answers bahut bade hote hain, isliye problem kehti hai <b>mod 10⁹ + 7</b> do, yaani sirf remainder rakho. Phir <code>nCr = n! / (r! (n−r)!)</code> jaise formula mein <b>division</b> aata hai. Par aapke paas to sirf remainders hain.</p><p>Yahi problem chhote size mein dekho. 10⁹ + 7 ki jagah 7 liya hai, taaki saare remainders screen par aa jaayein:</p><table><tr><td>asli maths</td><td>24 / 2 = 12</td><td>12 mod 7 = <b>5</b></td></tr><tr><td>aapne kya rakha</td><td>24 → 3, 2 → 2</td><td>3 / 2 = <b>?</b></td></tr></table><p>Goal: sirf remainders 3 aur 2 se <b>5</b> nikaalna.</p>`,
          cap: "Neeche ka har step ek hi sawaal ka jawab hai: <b>jab sirf remainders bache hain, to divide kaise karein?</b> Next dabao." } },

  { hot: [3], on: [2], out: "24 lands in box 3, and 2 in box 2",
    cap: "Mod 7, every whole number lands in one of these <b>7 boxes</b>: its remainder after dividing by 7. 24 = 3 × 7 + 3, so 24 lands in box 3. The 2 stays in box 2.",
    ask: { q: "Can you just work out 3 / 2 and land in box 5?", opts: ["Yes, 3 / 2 is box 5", "No, 3 / 2 = 1.5 is not a box"], a: 1 },
    hi: { out: "24 dabba 3 mein, aur 2 dabba 2 mein",
          cap: "Mod 7 mein har whole number in <b>7 dabbon</b> mein se ek mein jaata hai: 7 se divide karne par jo remainder bache. 24 = 3 × 7 + 3, to 24 dabba 3 mein. 2 dabba 2 mein hi rehta hai.",
          ask: { q: "Kya seedha 3 / 2 karke dabba 5 mil jaayega?", opts: ["Haan, 3 / 2 dabba 5 hai", "Nahi, 3 / 2 = 1.5 koi dabba nahi"] } } },

  { hot: [3], bad: [2], out: "3 / 2 = 1.5, not one of the 7 boxes",
    cap: "Division breaks. <b>+, − and × always land back in a box</b>: 3 × 2 = 6 is box 6. But 3 / 2 = 1.5, and there is no box 1.5. Box 5 needs a different route.",
    ask: { q: "Dividing by 2 normally means multiplying by ½, because 2 × ½ = 1. Which box <var>x</var> makes <code>2 × x</code> leave remainder 1?",
           opts: ["<var>x</var> = 3  (2 × 3 = 6)", "<var>x</var> = 4  (2 × 4 = 8)", "<var>x</var> = 5  (2 × 5 = 10)"], a: 1, why: "8 = 7 + 1, so the remainder is 1." },
    hi: { out: "3 / 2 = 1.5, 7 dabbon mein nahi",
          cap: "Division toot jaata hai. <b>+, − aur × hamesha kisi dabbe mein hi girte hain</b>: 3 × 2 = 6, dabba 6. Par 3 / 2 = 1.5, aur 1.5 ka koi dabba nahi. Dabba 5 tak koi aur raasta chahiye.",
          ask: { q: "Normal maths mein 2 se divide matlab ½ se multiply, kyunki 2 × ½ = 1. Kaunsa dabba <var>x</var> aisa hai jisme <code>2 × x</code> ka remainder 1 aaye?",
                 why: "8 = 7 + 1, to remainder 1." } } },

  { hot: [4], ptr: { "inv(2)": 4 }, out: "2 × 4 = 8 = 7 + 1, remainder 1",
    cap: "Box <b>4</b> is the whole-number stand-in for ½ under mod 7. It is called the <b>inverse of 2</b>, written <code>inv(2) = 4</code>. Multiplying by 4 undoes multiplying by 2, just as ½ would.",
    ask: { q: "So 3 / 2 should become 3 × 4 = 12. Which box is 12 in?", opts: ["box 5", "box 12", "box 1"], a: 0, why: "12 = 7 + 5." },
    hi: { cap: "Mod 7 mein dabba <b>4</b> hi ½ ka kaam karta hai, aur woh whole number bhi hai. Isse <b>2 ka inverse</b> kehte hain, likhte hain <code>inv(2) = 4</code>. 4 se multiply karna, 2 se multiply ko undo kar deta hai, bilkul ½ ki tarah.",
          ask: { q: "To 3 / 2 ban jaata hai 3 × 4 = 12. 12 kaunse dabbe mein hai?", opts: ["dabba 5", "dabba 12", "dabba 1"] } } },

  { hot: [3], on: [5], out: "3 × inv(2) = 3 × 4 = 12, box 5",
    cap: "<b>Box 5, the same answer</b> as the real 24 / 2 = 12. Dividing by 2 has become multiplying by 4. Check it backwards: 5 × 2 = 10, which is box 3. The 3 we started from came back.",
    hi: { out: "3 × inv(2) = 3 × 4 = 12, dabba 5",
          cap: "<b>Dabba 5, wahi answer</b> jo asli 24 / 2 = 12 se aata. 2 se divide ab 4 se multiply ban gaya. Ulta check karo: 5 × 2 = 10, jo dabba 3 hai. Jis 3 se shuru kiya tha, wahi wapas aa gaya." } },

  { arr: ["0", "2", "4", "6", "1", "3", "5"], on: [0, 1, 2, 3, 4, 5, 6],
    out: "cell k = where you are after k jumps of 2",
    cap: "Guessing 4 worked, but with 10⁹ + 7 you cannot guess. So here is <b>why the inverse exists</b>. Jump 2 hours at a time around a 7-hour clock, starting at 0. Cell <var>k</var> shows where you stand after <var>k</var> jumps. You visit <b>every hour</b> before repeating.",
    hi: { out: "cell k = k chhalaang (2-2 ki) ke baad kahan ho",
          cap: "4 guess karke mil gaya, par 10⁹ + 7 mein guess nahi kar sakte. To dekho <b>inverse exist kyun karta hai</b>. 7 ghante ki ghadi par 0 se 2-2 ghante koodo. Cell <var>k</var> batata hai <var>k</var> chhalaang ke baad aap kahan ho. Repeat hone se pehle <b>har ghanta</b> aa jaata hai." } },

  { arr: ["0", "2", "4", "6", "1", "3", "5"], hot: [4], ptr: { "inv(2)": 4 },
    out: "1 is reached after 4 jumps, so inv(2) = 4",
    cap: "The walk visits every hour, so it must stand on <b>1</b>, exactly once. The number of jumps it took is the inverse: 4 jumps of 2 is 8, and 8 is one more than 7.",
    ask: { q: "Same jumps of 2, but on a <b>6-hour</b> clock. Will you ever stand on 1?", opts: ["Yes, after enough jumps", "No, never"], a: 1 },
    hi: { out: "4 chhalaang mein 1 aaya, to inv(2) = 4",
          cap: "Walk har ghante par rukti hai, to <b>1</b> par bhi theek ek baar rukegi. Wahan tak jitni chhalaang lagi, wahi inverse hai: 4 chhalaang × 2 = 8, aur 8 = 7 + 1.",
          ask: { q: "Wahi 2-2 ki chhalaang, par ab <b>6 ghante</b> ki ghadi. Kya kabhi 1 par pahunchoge?", opts: ["Haan, kaafi chhalaang ke baad", "Nahi, kabhi nahi"] } } },

  { arr: ["0", "2", "4", "0", "2", "4"], bad: [0, 1, 2, 3, 4, 5],
    out: "6-hour clock, jumps of 2: 0, 2, 4, 0, 2, 4",
    cap: "You only ever land on <b>even</b> hours, because 2 and 6 are both even. 1 is odd, so you never reach it. <b>No inverse exists.</b> The rule: inv(<var>b</var>) exists only when <var>b</var> and <var>m</var> share no common factor, that is, gcd(<var>b</var>, <var>m</var>) = 1.",
    hi: { out: "6 ghante ki ghadi: 0, 2, 4, 0, 2, 4",
          cap: "Aap sirf <b>even</b> ghanton par rukte ho, kyunki 2 bhi even hai aur 6 bhi. 1 odd hai, to kabhi nahi aayega. <b>Inverse exist hi nahi karta.</b> Rule: inv(<var>b</var>) tabhi hota hai jab <var>b</var> aur <var>m</var> ka koi common factor na ho, yaani gcd(<var>b</var>, <var>m</var>) = 1." } },

  { arr: ["0", "2", "4", "6", "1", "3", "5"], on: [4],
    out: "prime m: inv(b) = b^(m-2) mod m, O(log m)",
    cap: "This is why problems use <b>10⁹ + 7</b>. It is prime, so it shares no factor with any smaller <var>b</var>, and every <var>b</var> has an inverse. Nobody walks a billion-hour clock: Fermat's shortcut <code>inv(b) = b^(m−2) mod m</code> takes about 30 squarings. Try it here: 2⁵ = 32, which is box 4.",
    hi: { cap: "Isiliye problems <b>10⁹ + 7</b> lete hain. Yeh prime hai, to kisi bhi chhote <var>b</var> ke saath common factor nahi, aur har <var>b</var> ka inverse milta hai. Arab ghante ki ghadi koi nahi ghoomta: Fermat ka shortcut <code>inv(b) = b^(m−2) mod m</code> lagbhag 30 squaring mein ho jaata hai. Yahan try karo: 2⁵ = 32, jo dabba 4 hai." } },
]},

"segment-tree": {
  kind: "tree", w: 600, h: 260,
  nodes: {
    root: { x: 300, y: 34,  t: "9", sub: "[0,3]", w: 60 },
    l:    { x: 170, y: 116, t: "4", sub: "[0,1]", w: 60 },
    r:    { x: 430, y: 116, t: "5", sub: "[2,3]", w: 60 },
    a:    { x: 100, y: 198, t: "3", sub: "[0]" },
    b:    { x: 240, y: 198, t: "1", sub: "[1]" },
    c:    { x: 360, y: 198, t: "4", sub: "[2]" },
    d:    { x: 500, y: 198, t: "1", sub: "[3]" },
  },
  edges: [["root","l"],["root","r"],["l","a"],["l","b"],["r","c"],["r","d"]],
  frames: [
    { on: ["root"], out: "array [3, 1, 4, 1]. Each node stores its range's total.",
      cap: "Split the array in half, then in half again, and store an aggregate at every node. The leaves are the elements, the root covers everything." },
    { on: ["b","r"], hot: ["b","r"], dim: ["a","c","d"],
      out: "query [1,3] = node [1] + node [2,3] = 1 + 5 = 6",
      cap: "A query does not walk the leaves. It <b>tiles the range with whole nodes</b>, and any range needs at most O(log n) of them. Two nodes here instead of three elements, and the gap widens fast." },
    { t: { c: "6", r: "7", root: "11" }, hot: ["c"], on: ["r","root"], dim: ["a","b","d"],
      out: "update a[2] = 6: fix the leaf, then every ancestor",
      cap: "An update changes one leaf and every node above it, which is one root-to-leaf path: <b>O(log n)</b>. Both operations are logarithmic, which is the whole reason to build this." },
    { on: ["root","l","r","a","b","c","d"],
      out: "the operation only has to be ASSOCIATIVE",
      cap: "Nothing here assumed addition. Swap in min, max or gcd and the same tree answers those instead. That generality is what justifies the code, because a prefix array can only ever do sums." },
    { bad: ["root","l","r"], dim: ["a","b","c","d"],
      out: "if the array never changes, do not build this",
      cap: "Static data means prefix sums: O(1) queries, ten lines, no tree. Reach for a segment tree only when the array is <b>changing between queries</b>." },
  ]
},

"intervals": {
  kind: "grid",
  arr: [["A","A","A","","","","",""],
        ["","B","B","B","","","",""],
        ["","","","","C","C","",""],
        ["","","","","","D","D","D"]],
  frames: [
    { on: [[0,0],[0,1],[0,2],[1,1],[1,2],[1,3],[2,4],[2,5],[3,5],[3,6],[3,7]],
      out: "four intervals. Merge everything that touches.",
      cap: "Unsorted, you would have to compare every pair to know what overlaps: <b>O(n squared)</b>. Sorting is what removes that, which is why the sort key is the real decision." },
    { on: [[0,0],[0,1],[0,2]], hot: [[1,1],[1,2],[1,3]], dim: [[2,4],[2,5],[3,5],[3,6],[3,7]],
      out: "sorted by START. A ends at 2, B starts at 1, so they overlap.",
      cap: "Sorted by start, you only ever compare against the interval you are currently building. B begins before A ended, so extend rather than start afresh." },
    { on: [[0,0],[0,1],[0,2],[1,1],[1,2],[1,3]], dim: [[2,4],[2,5],[3,5],[3,6],[3,7]],
      out: "merged into [0,3]",
      cap: "Extending means taking the <b>later of the two ends</b>. Taking B's end blindly is the classic bug when B sits entirely inside A." },
    { on: [[0,0],[0,1],[0,2],[1,1],[1,2],[1,3]], hot: [[2,4],[2,5]], dim: [[3,5],[3,6],[3,7]],
      out: "C starts at 4, after 3, so it opens a new interval",
      cap: "No overlap means close the current interval and start a new one. One pass, and the O(n log n) is entirely the sort." },
    { on: [[0,0],[0,1],[0,2],[1,1],[1,2],[1,3],[2,4],[2,5],[3,5],[3,6],[3,7]],
      out: "result: [0,3] and [4,7]",
      cap: "Two intervals out of four. The overlap test worth memorising is <b>a ≤ d and c ≤ b</b>, which you get by negating the only two ways they can miss each other." },
    { hot: [[0,1],[1,1],[1,2],[2,4],[3,5],[3,6]],
      dim: [[0,0],[0,2],[1,3],[2,5],[3,7]],
      out: "as events: +1 at each start, -1 at each end, then sweep",
      cap: "The generalisation: stop thinking about intervals and think about <b>events</b>. Sort all the starts and ends together, sweep left to right with a running count, and the maximum that counter reaches is the answer to \"how many rooms\". Same loop solves the skyline problem." },
  ]
},

"mst": {
  kind: "tree", w: 580, h: 280,
  weights: { "A>B": 1, "B>C": 2, "A>C": 4, "C>D": 3, "B>D": 5, "D>E": 6 },
  nodes: {
    A: { x: 80,  y: 80,  t: "A" }, B: { x: 240, y: 45,  t: "B" },
    C: { x: 240, y: 190, t: "C" }, D: { x: 400, y: 120, t: "D" },
    E: { x: 530, y: 190, t: "E" },
  },
  edges: [["A","B"],["B","C"],["A","C"],["C","D"],["B","D"],["D","E"]],
  frames: [
    { on: ["A","B","C","D","E"],
      out: "connect everything, as cheaply as possible",
      cap: "Six roads, five towns. Keep just enough to connect them all, for the least total cost. Enough means exactly <b>V-1 edges</b> and no cycles, which is why the answer is a tree." },
    { on: ["A","B"], hot: ["A","B"], dim: ["C","D","E"], edge: [["A","B"]],
      out: "Kruskal: sort edges, take the cheapest. A-B costs 1.",
      cap: "Sort every edge by weight and take them in order, skipping any that would close a cycle. The cycle test is \"are these two already in the same component\", which is precisely <b>union-find</b>." },
    { on: ["A","B","C"], hot: ["B","C"], dim: ["D","E"], edge: [["A","B"],["B","C"]],
      out: "take B-C at 2",
      cap: "Second cheapest, different components, so take it. Three towns joined with two roads." },
    { on: ["A","B","C"], bad: ["A","C"], dim: ["D","E"],
      edge: [["A","B"],["B","C"],["A","C"]],
      out: "A-C costs 4, but A and C are already connected. Skip.",
      cap: "This edge would close a cycle and buy nothing, so union-find rejects it in near constant time. Without that test you would be running a traversal per edge." },
    { on: ["A","B","C","D","E"], hot: ["D","E"],
      edge: [["A","B"],["B","C"],["C","D"],["D","E"]],
      out: "take C-D at 3 and D-E at 6. Four edges, five nodes, total 12.",
      cap: "V-1 edges taken, so stop. The proof it is optimal is the <b>cut property</b>: for any way of splitting the towns in two, the lightest road crossing that split is safe to take." },
    { on: ["A","B","C","D","E"], bad: ["A","C"],
      edge: [["A","B"],["B","C"],["C","D"],["D","E"],["A","C"]],
      out: "total weight is minimised. Individual distances are not.",
      cap: "One warning worth carrying. An MST is <b>not</b> a shortest-path tree. It minimises the <b>sum of all edges kept</b>, which is a different objective from minimising each distance from a source. Drop the direct A-C road because it is expensive, and the MST route between them is whatever the tree happens to offer. Interviewers ask about exactly this confusion." },
  ]
},

"cyclic-sort": { kind: "cells", arr: ["3","1","5","4","2"], frames: [
  { on: [], out: "the values are exactly 1..n, in some order",
    cap: "The constraint is the algorithm. When the values are a permutation of 1 to n, every value <b>already knows where it belongs</b>: value v goes to index v-1." },
  { hot: [0,2], ptr: { i: 0 }, out: "a[0] = 3, so it belongs at index 2. Swap.",
    cap: "Do not advance. Look at what is sitting here, send it home, and see what got swapped in." },
  { arr: ["5","1","3","4","2"], hot: [0,4], ptr: { i: 0 }, out: "now a[0] = 5, which belongs at index 4. Swap again.",
    cap: "Still index 0, because the swap brought a new stranger. You only move on once the current slot is correct." },
  { arr: ["2","1","3","4","5"], hot: [0,1], ptr: { i: 0 }, out: "a[0] = 2 belongs at index 1. Swap.",
    cap: "Each swap puts at least one value permanently in its final place, which is the whole complexity argument." },
  { arr: ["1","2","3","4","5"], on: [0,1,2,3,4], ptr: { i: 0 },
    out: "a[0] = 1 is home. Now advance.",
    cap: "At most n swaps happen in total, so the nested loop is still <b>O(n) time and O(1) space</b>, with no sorting and no hash set." },
  { arr: ["1","2","4","4","5"], bad: [2], on: [0,1,3,4],
    out: "index 2 holds 4, not 3, so 3 is missing and 4 is the duplicate",
    cap: "And here is why anyone cares. After the pass, <b>any index holding the wrong value names the answer</b>. Missing number, duplicate number, first missing positive: all the same loop, all in O(1) space." },
]},

});

/* ==================================================================== */
/* Four concepts added later: the keep-or-restart decision, the LCA
   bubble-up, the two structures an LRU cache is made of, and why KMP
   never re-reads a character.                                          */
/* ==================================================================== */
Object.assign(VIZ, {

/* ---- Kadane: the whole algorithm is one comparison ---- */
"kadane": { kind: "cells", arr: ["-2", "3", "-1", "4", "-3", "2"], frames: [
  { on: [], out: "find the contiguous block with the largest sum",
    cap: "Contiguous, so you cannot cherry-pick. There are <b>n(n+1)/2</b> blocks and re-adding each one is O(n<sup>3</sup>). Carrying a running sum gets that to O(n<sup>2</sup>), which is still a nested loop." },
  { band: [1, 3], out: "the answer is 3 + (-1) + 4 = 6",
    cap: "Notice the answer <b>contains a negative number</b>. So 'skip the negatives' is not the rule, and neither is 'take the positives'. Something has to decide when a negative is worth carrying." },
  { hot: [0], ptr: { i: 0 }, out: "best block ENDING at index 0 = -2",
    cap: "Change the question. Instead of the best block anywhere, ask for the best block that <b>ends exactly here</b>. There is only one of those per index, so there are only n answers to find." },
  { hot: [1], dim: [0], ptr: { i: 1 }, out: "carry: -2 + 3 = 1   ·   start fresh: 3   ->  RESTART",
    cap: "At each index there are exactly <b>two</b> candidates: extend the block that ended one step back, or begin a new block here. Nothing else can end at this index. Here the carried total drags 3 down, so drop it." },
  { band: [1, 2], ptr: { i: 2 }, out: "carry: 3 + (-1) = 2   ·   start fresh: -1   ->  EXTEND",
    cap: "Now the negative is worth carrying, because 3 more than pays for it. This is the comparison the whole algorithm is: <b>keep the past only while it is still an asset</b>." },
  { band: [1, 3], ptr: { i: 3 }, out: "carry: 2 + 4 = 6   ·   start fresh: 4   ->  EXTEND   ·   best = 6",
    cap: "6 is the best block ending at index 3, and also the best seen so far. Keep two numbers apart: the running block, and the best any block has ever reached." },
  { band: [1, 3], dim: [5], hot: [4], ptr: { i: 4 }, out: "carry: 6 + (-3) = 3   ->  EXTEND, but best stays 6",
    cap: "Still worth extending, and still not a record. Forgetting to keep <code>best</code> separate is the single most common way to get this wrong: you return the running total and it has already decayed." },
  { on: [0, 1, 2, 3, 4, 5], out: "one pass, two variables: O(n) time, O(1) space",
    cap: "Every index answers its own question in O(1) from the previous one, so the whole array is <b>one pass</b>. It is dynamic programming with the table thrown away, because each cell only ever reads the one before it." },
]},

/* ---- LCA: one post-order pass, and what each subtree reports back ---- */
"lca": {
  kind: "tree", w: 600, h: 336,
  nodes: {
    r: { x: 300, y: 44,  t: "3" },
    a: { x: 180, y: 120, t: "5" },
    b: { x: 430, y: 120, t: "1" },
    c: { x: 110, y: 196, t: "6" },
    d: { x: 255, y: 196, t: "2" },
    e: { x: 370, y: 196, t: "0" },
    f: { x: 490, y: 196, t: "8" },
    g: { x: 205, y: 272, t: "7" },
    h: { x: 300, y: 272, t: "4" },
  },
  edges: [["r","a"],["r","b"],["a","c"],["a","d"],["b","e"],["b","f"],["d","g"],["d","h"]],
  frames: [
    { on: ["c", "h"], dim: ["r", "b", "e", "f", "g"], out: "LCA(6, 4) = the LOWEST node with both of them below it",
      cap: "Every node above the answer also has both targets below it, so 'an ancestor of both' is not enough. The word doing the work is <b>lowest</b>: the last node where the two paths are still the same path." },
    { on: ["r", "a", "c", "d", "h"], edge: [["r","a"],["a","c"],["a","d"],["d","h"]], dim: ["b", "e", "f", "g"],
      out: "root to 6 is [3, 5, 6] · root to 4 is [3, 5, 2, 4]",
      cap: "The obvious method: record both root-to-target paths, walk them side by side, and the <b>last node they agree on</b> is the answer. Correct, and it costs O(n) extra space plus two full searches." },
    { on: ["c", "h"], t: { g: "nil", e: "nil", f: "nil" }, dim: ["r", "a", "b", "d", "e", "f", "g"],
      out: "ask every node one question: did you find either target below you?",
      cap: "Now do it in one pass. Recurse to the bottom first, and have each node <b>report upward</b>. A node that is a target reports itself. A node that found nothing reports nothing." },
    { on: ["c", "h", "d"], t: { g: "nil", e: "nil", f: "nil", d: "4" }, dim: ["r", "b", "e", "f", "g"],
      out: "node 2 heard from ONE side only, so it forwards 4 unchanged",
      cap: "Node 2 got 4 from the right and nothing from the left. One report means the other target is somewhere else entirely, so 2 is not the answer. It <b>passes the one report up</b> and stays out of the way." },
    { on: ["a"], t: { g: "nil", e: "nil", f: "nil", d: "4", a: "5 LCA", b: "nil" }, dim: ["r", "b", "e", "f", "g"],
      out: "node 5 heard from BOTH sides. That is the answer, and there is only one such node.",
      cap: "Two non-empty reports means the targets are in different subtrees of this node, so the paths split <b>here</b> and nowhere lower. Report yourself upward instead of either child." },
    { on: ["a", "r"], t: { g: "nil", e: "nil", f: "nil", d: "4", a: "5 LCA", b: "nil", r: "5" }, dim: ["b", "e", "f", "g"],
      out: "everything above just forwards the single non-empty report",
      cap: "The root hears 5 from the left and nothing from the right, so by the same rule it forwards 5. <b>The answer floats to the top on its own</b>, which is why the whole thing is one post-order function with no extra storage." },
    { on: ["a", "d", "h"], edge: [["a","d"],["d","h"]], t: { a: "5 LCA" }, dim: ["r", "b", "c", "e", "f", "g"],
      out: "LCA(5, 4): the recursion stops AT 5, and that is correct",
      cap: "The case people try to special-case. When one target is an ancestor of the other, the walk hits 5, returns it immediately, and never looks below. <b>A node is its own ancestor</b>, so no extra branch is needed. Adding one usually breaks it." },
    { on: ["r", "a", "b"], dim: ["c", "d", "e", "f", "g", "h"],
      out: "O(n) per query, O(1) space. For many queries: O(n log n) build, O(log n) each.",
      cap: "One query is a single traversal. Thousands of queries on the same tree are not: then you precompute, for every node, its ancestor 1, 2, 4, 8 steps up, and each query becomes a handful of jumps. That table is <b>binary lifting</b>." },
  ]
},

/* ---- LRU: two structures, each covering the other's blind spot ---- */
"lru": {
  kind: "tree", w: 620, h: 300, arrows: true,
  nodes: {
    m1: { x: 90,  y: 62,  t: "key A", w: 76 },
    m2: { x: 240, y: 62,  t: "key B", w: 76 },
    m3: { x: 390, y: 62,  t: "key C", w: 76 },
    m4: { x: 540, y: 62,  t: "key D", w: 76, hidden: true },
    n1: { x: 90,  y: 200, t: "A:1", w: 76 },
    n2: { x: 240, y: 200, t: "B:2", w: 76 },
    n3: { x: 390, y: 200, t: "C:3", w: 76 },
    n4: { x: 540, y: 200, t: "D:4", w: 76, hidden: true },
  },
  edges: [["m1","n1"],["m2","n2"],["m3","n3"],["n1","n2"],["n2","n3"]],
  frames: [
    { on: ["m1", "m2", "m3"], dim: ["n1", "n2", "n3"], edges: [],
      out: "a hash map: O(1) get, and no idea which entry is oldest",
      cap: "Start with what a cache obviously needs. A map answers <b>get</b> in O(1) and that is the easy half. When it fills up it cannot tell you what to throw away, because a hash map has no order at all." },
    { on: ["n1", "n2", "n3"], dim: ["m1", "m2", "m3"], edges: [["n1","n2"],["n2","n3"]],
      out: "a list in recency order: head = just used, tail = evict this one",
      cap: "So add the missing half. Keep the same entries in a list ordered by <b>when they were last touched</b>. Now eviction is free: it is whatever sits at the tail. But finding a key in a list is O(n), which undoes the map." },
    { on: ["m2", "n2"], edge: [["m2","n2"]], dim: ["m1", "m3", "n1", "n3"],
      out: "get(B): the map stores the NODE, not the value",
      cap: "The join that makes both halves work: the map's value is a <b>pointer to the list node</b>. One lookup and you are standing on the node itself, with no walking. Store the plain value instead and you are back to an O(n) search." },
    { on: ["n2", "n1", "n3"], dim: ["m1", "m2", "m3"],
      edges: [["m1","n1"],["m2","n2"],["m3","n3"],["n2","n1"],["n1","n3"]],
      out: "unlink B, relink it at the head: 4 pointer writes, O(1)",
      cap: "To unlink a node you must reach the one <b>before</b> it, and in a singly linked list that means walking from the head. This single requirement is the entire reason the list is <b>doubly</b> linked. Nothing moved in memory; only links changed." },
    { show: ["m4", "n4"], dim: ["m3", "n3"],
      edges: [["m1","n1"],["m2","n2"],["m4","n4"],["n4","n2"],["n2","n1"]],
      out: "put(D) while full: C was the tail, so C is evicted",
      cap: "Insert at the head, then drop the tail. The half people forget: the evicted node must be deleted from <b>both</b> structures. Leave the key in the map and it points at a node no longer in the list, and get returns a value the cache no longer holds." },
    { show: ["m4", "n4"], on: ["m1", "m2", "m4", "n1", "n2", "n4"], dim: ["m3", "n3"],
      edges: [["m1","n1"],["m2","n2"],["m4","n4"],["n4","n2"],["n2","n1"]],
      out: "get and put are both O(1), worst case, not amortised",
      cap: "Nothing here is searched, sorted or scanned. That is the pattern worth taking away: when one structure is fast at exactly what another is slow at, <b>hold the same objects in both</b> and keep the two in step on every write." },
  ]
},

/* ---- KMP: the text pointer never goes backwards ---- */
"kmp": { kind: "cells", arr: ["a", "b", "a", "b", "a", "b", "c", "a"], frames: [
  { on: [], out: "text n = 8 · pattern = a b a b c",
    cap: "Line the pattern up at index 0, compare left to right, and on any mismatch slide one place right and start over. That is the naive scan, and it is <b>O(n·m)</b>." },
  { band: [0, 3], bad: [4], out: "matched a b a b, then text 'a' vs pattern 'c'",
    cap: "Four characters matched, the fifth did not. The naive rule now throws away everything it just learned and restarts one place to the right." },
  { band: [1, 5], dim: [0], out: "naive: restart at index 1 and re-read a b a b",
    cap: "Look at what that costs. <b>The text pointer moved backwards</b>, and characters 1 to 3 get read a second time. On a text like aaaa...aab, every position pays for the whole pattern again." },
  { arr: ["a", "b", "a", "b", "c"], on: [0, 1], hot: [2, 3], out: "the matched part was a b a b",
    cap: "But the four characters that matched are not a mystery: they are the pattern's own first four. And <b>a b a b</b> begins and ends with the same <b>a b</b>. That overlap is knowledge the naive scan is throwing away." },
  { arr: ["0", "0", "1", "2", "0"], on: [0, 1, 2, 3, 4], out: "lps[i] = longest proper prefix of pattern[0..i] that is also a suffix",
    cap: "Precompute that overlap once, for every prefix of the <b>pattern only</b>, never the text. lps[3] = 2 says: after matching 4 characters, 2 of them are still usable. Building this table is the pattern matched against itself, <b>O(m)</b>." },
  { arr: ["a", "b", "a", "b", "a", "b", "c", "a"], band: [2, 5], dim: [0, 1], hot: [2, 3],
    out: "shift by 4 - lps[3] = 2, and a b is already known to match",
    cap: "So slide the pattern by <b>matched minus lps</b>, not by one. The two characters now under the pattern's start were already checked, so comparing resumes at pattern index 2 and text index 4." },
  { arr: ["a", "b", "a", "b", "a", "b", "c", "a"], band: [2, 6], hot: [6], dim: [0, 1, 7],
    out: "text index 4, 5, 6 all match: found at index 2",
    cap: "The text index went 4, 5, 6. It <b>never went back to 1</b>. Only the pattern index jumped, and it only ever jumps backwards, which is why the fallback loop cannot cost more than the forward progress already paid for." },
  { arr: ["a", "b", "a", "b", "a", "b", "c", "a"], on: [0, 1, 2, 3, 4, 5, 6, 7],
    out: "O(n + m) time, O(m) space, and n was read once",
    cap: "Each text character is looked at a constant number of times, so the scan is <b>O(n)</b> after an <b>O(m)</b> table. Rabin-Karp reaches the same bound differently, by comparing rolling hashes and verifying only on a hit." },
]},

});
