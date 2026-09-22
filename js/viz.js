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
     hash, keys -> hash function -> buckets       frame: { k:"key", b:bucketIndex, look?:bool, cap }
              (look: a lookup, so the key is shown but not stored in the bucket)

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
  // a short row must still leave room for its longest caption line, in either
  // language, or that line is squeezed to an unreadable size
  const longest = Math.max(0, ...spec.frames.flatMap(fr => [fr.out, fr.hi && fr.hi.out])
    .filter(Boolean).map(o => String(o).length));
  const W = Math.max(X0 * 2 + maxN * (BW + GAP), Math.ceil(X0 * 2 + longest * 0.62 * 11.5));
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
  spec.frames.slice(0, idx + 1).forEach(fr => { if (fr.k != null && !fr.look) (placed[fr.b] = placed[fr.b] || []).push(fr.k); });

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
/* One problem, three solutions: find a repeated number in a list. Each
   solution is a different growth curve, so the chart meets them in the order
   a person would write them, and only then fills in the rest of the ladder. */
"big-o": { kind: "curve", frames: [
  { scene: `<span class="kicker">Why this example</span><p>A list of <var>n</var> numbers. Does any number appear twice? There are three natural ways to check, and each one grows differently:</p><table><tr><td>the check</td><td><var>n</var> = 1,000</td><td><var>n</var> = 100,000</td></tr><tr><td>compare every pair</td><td>499,500</td><td><b>5 × 10⁹</b></td></tr><tr><td>sort, check neighbours</td><td>about 10⁴</td><td>about 1.7 × 10⁶</td></tr><tr><td>hash set</td><td>1,000</td><td>100,000</td></tr></table><p>All three are instant at 1,000. Goal: see which of them survive the 1-second limit at 100,000, without running any of them.</p>`,
    cap: "The chart below draws each solution's <b>work</b> against the input size <var>n</var>, all on one scale. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p><var>n</var> numbers ki list. Kya koi number do baar hai? Check karne ke teen natural tareeke hain, aur teeno alag tarah badhte hain:</p><table><tr><td>check</td><td><var>n</var> = 1,000</td><td><var>n</var> = 1,00,000</td></tr><tr><td>har pair compare</td><td>499,500</td><td><b>5 × 10⁹</b></td></tr><tr><td>sort, padosi check</td><td>lagbhag 10⁴</td><td>lagbhag 1.7 × 10⁶</td></tr><tr><td>hash set</td><td>1,000</td><td>1,00,000</td></tr></table><p>1,000 par teeno turant. Goal: bina chalaaye samajhna ki 1,00,000 par 1 second ki limit mein kaun kaun bachte hain.</p>`,
          cap: "Neeche ka chart har solution ka <b>kaam</b> input size <var>n</var> ke against dikhata hai, sab ek hi scale par. Next dabao." } },

  { show: ["O(n²)"],
    cap: "<b>Compare every pair: O(<var>n</var>²).</b> Across is the input size <var>n</var>, up is the work. The curve bends upward because each new number must be checked against all the others already there.",
    ask: { q: "The input grows 10 times, from 1,000 numbers to 10,000. How much more work does the pair check do?", opts: ["10 times", "100 times", "1,000 times"], a: 1,
           why: "10 times the numbers, each compared with 10 times as many others: 10 × 10 = 100." },
    hi: { cap: "<b>Har pair compare: O(<var>n</var>²).</b> Left se right input size <var>n</var>, neeche se upar kaam. Curve upar mudti hai, kyunki har naya number pehle se maujood sab numbers se check hota hai.",
          ask: { q: "Input 10 guna badha, 1,000 numbers se 10,000. Pair check kitna zyada kaam karega?", opts: ["10 guna", "100 guna", "1,000 guna"],
                 why: "10 guna numbers, aur har ek 10 guna zyada numbers se compare: 10 × 10 = 100." } } },

  { show: ["O(n log n)", "O(n²)"],
    cap: "<b>Sort, then check neighbours: O(<var>n</var> log <var>n</var>).</b> After sorting, equal numbers sit side by side, so one pass finds them. The sort costs about log₂ <var>n</var> steps per number, and log₂ 100,000 is about 17.",
    ask: { q: "At <var>n</var> = 100,000 the pair check does 5 × 10⁹ comparisons. Roughly how much does sort-then-scan do?", opts: ["about 1.7 × 10⁶", "about 5 × 10⁸", "about the same"], a: 0,
           why: "100,000 × 17 = 1.7 × 10⁶. That is about 3,000 times less work." },
    hi: { cap: "<b>Sort, phir padosi check: O(<var>n</var> log <var>n</var>).</b> Sort ke baad barabar numbers saath saath baithte hain, to ek pass mein mil jaate hain. Sort har number par lagbhag log₂ <var>n</var> steps leta hai, aur log₂ 1,00,000 lagbhag 17 hai.",
          ask: { q: "<var>n</var> = 1,00,000 par pair check 5 × 10⁹ comparisons karta hai. Sort-then-scan lagbhag kitna karega?", opts: ["lagbhag 1.7 × 10⁶", "lagbhag 5 × 10⁸", "lagbhag utna hi"],
                 why: "1,00,000 × 17 = 1.7 × 10⁶. Lagbhag 3,000 guna kam kaam." } } },

  { show: ["O(n)", "O(n log n)", "O(n²)"],
    cap: "<b>Hash set: O(<var>n</var>).</b> Each number is looked up once and inserted once, a fixed amount of work per number. So the line is straight: 10 times the input, 10 times the work. This is the one to write.",
    ask: { q: "Sorted list, one number to find. Check the middle, throw away the half it cannot be in, repeat. How many checks for 1,000,000 numbers?", opts: ["about 20", "about 1,000", "about 500,000"], a: 0,
           why: "2²⁰ is about a million, so 20 halvings leave one number." },
    hi: { cap: "<b>Hash set: O(<var>n</var>).</b> Har number ek baar dhoondha aur ek baar daala jaata hai, har number par fixed kaam. Isliye line seedhi hai: 10 guna input, 10 guna kaam. Yahi likhna hai.",
          ask: { q: "Sorted list, ek number dhoondhna hai. Beech wala check karo, jis aadhe mein woh ho hi nahi sakta use phenko, repeat. 10 lakh numbers par kitne checks?", opts: ["lagbhag 20", "lagbhag 1,000", "lagbhag 5,00,000"],
                 why: "2²⁰ lagbhag 10 lakh hai, to 20 baar aadha karne par ek number bachta hai." } } },

  { show: ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)"],
    cap: "<b>O(log <var>n</var>)</b>: halve what is left at every step, so 1,000,000 numbers need about 20 checks. At the bottom, <b>O(1)</b>: reading <code>a[0]</code> costs the same at any size. Both curves barely leave the floor.",
    ask: { q: "One more shape: trying every <b>subset</b> of the numbers. What does one extra number do to the work?", opts: ["adds a fixed amount", "doubles it"], a: 1,
           why: "Each number is either in a subset or out of it. One more number doubles the count of subsets." },
    hi: { cap: "<b>O(log <var>n</var>)</b>: har step par bacha hua aadha karo, to 10 lakh numbers ko lagbhag 20 checks. Sabse neeche <b>O(1)</b>: <code>a[0]</code> padhna har size par utna hi. Dono curves zameen se mushkil se uthti hain.",
          ask: { q: "Ek aur shape: numbers ka har <b>subset</b> try karna. Ek extra number kaam ka kya karta hai?", opts: ["fixed amount jodta hai", "double kar deta hai"],
                 why: "Har number subset mein hai ya nahi. Ek aur number subsets ki ginti double kar deta hai." } } },

  { show: ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"],
    cap: "<b>O(2ⁿ)</b>: every extra item doubles the work, so it leaves the chart before <var>n</var> = 5. At <var>n</var> = 40 it is 10¹² steps. That is why backtracking problems cap <var>n</var> at about 20.",
    hi: { cap: "<b>O(2ⁿ)</b>: har extra item kaam double karta hai, to yeh <var>n</var> = 5 se pehle hi chart se bahar. <var>n</var> = 40 par 10¹² steps. Isiliye backtracking problems <var>n</var> ko lagbhag 20 tak rakhte hain." } },

  { show: ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"],
    cap: "Back to the question: <var>n</var> = 100,000, one second, about 10⁸ steps. Every pair: 5 × 10⁹, <b>fails</b>. Sort-then-scan: 1.7 × 10⁶, passes. Hash set: 10⁵, passes. Nothing was run to find that out.",
    hi: { cap: "Wapas sawaal par: <var>n</var> = 1,00,000, ek second, lagbhag 10⁸ steps. Har pair: 5 × 10⁹, <b>fail</b>. Sort-then-scan: 1.7 × 10⁶, pass. Hash set: 10⁵, pass. Yeh jaanne ke liye kuch chalaana nahi pada." } },
]},

/* ---- dynamic array ---- */
/* Appending 3, 1, 4, 9 to a list with room for 2, then inserting 7 at the
   front. The same four values the page uses, so the one growth and the
   one front-shift happen on screen. */
"dynamic-array": { kind: "cells", arr: ["3", "·"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>A growable list must do two things at once: take new items at the end, and read <code>a[i]</code> instantly. Here is the smallest case that shows both costs:</p><table><tr><td>start</td><td>empty, room for 2</td></tr><tr><td>append</td><td>3, 1, 4, 9</td></tr><tr><td>then</td><td>insert 7 at the front</td></tr></table><p>Four appends force exactly one growth, and one front insert forces every item to move. Goal: see which operations are cheap and which are not, and why.</p>`,
    cap: "Each box is one memory slot, numbered from 0. A dot is a spare slot. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Growable list ko ek saath do kaam karne hain: end mein naye items lena, aur <code>a[i]</code> turant padhna. Dono ki cost dikhane wala sabse chhota case yeh hai:</p><table><tr><td>shuru</td><td>khaali, 2 ki jagah</td></tr><tr><td>append</td><td>3, 1, 4, 9</td></tr><tr><td>phir</td><td>aage 7 insert</td></tr></table><p>Chaar appends theek ek growth karwate hain, aur ek front insert har item ko hilata hai. Goal: dekhna kaunse operations saste hain aur kaunse nahi, aur kyun.</p>`,
          cap: "Har box ek memory slot hai, 0 se numbered. Dot matlab khaali slot. Next dabao." } },

  { arr: ["3", "·"], on: [0], dim: [1], out: "size 1 · capacity 2",
    cap: "<b>append(3)</b> writes into slot 0. The list asked for room for 2 when it was created, so slot 1 is already there, waiting. That is what a growable array keeps: <b>spare slots</b>.",
    ask: { q: "<b>append(1)</b>. What does it cost?", opts: ["one write into the spare slot", "copying the list"], a: 0,
           why: "Slot 1 is free, so 1 is written there and nothing moves." },
    hi: { out: "size 1 · capacity 2",
          cap: "<b>append(3)</b> slot 0 mein likhta hai. List ne bante waqt 2 ki jagah maangi thi, to slot 1 pehle se wahan hai, intezaar mein. Growable array yahi rakhta hai: <b>extra slots</b>.",
          ask: { q: "<b>append(1)</b>. Iski cost kya hai?", opts: ["khaali slot mein ek write", "list copy karna"],
                 why: "Slot 1 khaali hai, to 1 wahan likha jaata hai aur kuch nahi hilta." } } },

  { arr: ["3", "1"], on: [0, 1], out: "size 2 · capacity 2, full",
    cap: "<b>append(1)</b>: one write. Now the block is full. The memory right after slot 1 belongs to something else, so the list cannot just take another slot there.",
    ask: { q: "<b>append(4)</b>, and there is no room. What does the list do?", opts: ["writes past the end anyway", "gets a block twice the size and copies", "refuses"], a: 1,
           why: "Writing past the end would corrupt someone else's memory. A new, bigger block is the only safe way." },
    hi: { out: "size 2 · capacity 2, bhara hua",
          cap: "<b>append(1)</b>: ek write. Ab block bhar gaya. Slot 1 ke theek baad ki memory kisi aur ki hai, to list wahan ek aur slot nahi le sakti.",
          ask: { q: "<b>append(4)</b>, aur jagah nahi. List kya karti hai?", opts: ["phir bhi end ke paar likhti hai", "dugna bada block leti hai aur copy karti hai", "mana kar deti hai"],
                 why: "End ke paar likhna kisi aur ki memory bigaad dega. Naya, bada block hi safe raasta hai." } } },

  { arr: ["3", "1", "·", "·"], hot: [0, 1], dim: [2, 3], out: "new block of 4 · copied 2 items",
    cap: "A new block of <b>4</b> slots, and 3 and 1 are copied across. This one append costs <b>O(<var>n</var>)</b>, one copy per item already there. The old block is handed back.",
    ask: { q: "After 4 is written, how many more appends fit before the next copy?", opts: ["none", "one", "three"], a: 1,
           why: "Capacity 4, and 3, 1 and 4 fill three slots. One spare slot is left, and 9 takes it." },
    hi: { out: "4 ka naya block · 2 items copy",
          cap: "<b>4</b> slots ka naya block, aur 3 aur 1 wahan copy hote hain. Is ek append ki cost <b>O(<var>n</var>)</b> hai, pehle se maujood har item ki ek copy. Purana block wapas de diya jaata hai.",
          ask: { q: "4 likhne ke baad agli copy se pehle kitne aur appends fit honge?", opts: ["koi nahi", "ek", "teen"],
                 why: "Capacity 4, aur 3, 1 aur 4 teen slots bharte hain. Ek khaali slot bachta hai, jo 9 le leta hai." } } },

  { arr: ["3", "1", "4", "·"], on: [0, 1, 2], dim: [3], out: "size 3 · capacity 4",
    cap: "4 is written into slot 2. Doubling put the next copy twice as far away as the last one. That spacing is the whole trick.",
    hi: { out: "size 3 · capacity 4",
          cap: "4 slot 2 mein likha gaya. Doubling ne agli copy ko pichhli se dugni door kar diya. Poori trick yahi doori hai." } },

  { arr: ["3", "1", "4", "9"], on: [0, 1, 2, 3], out: "4 appends: 4 writes, 2 copies",
    cap: "<b>9</b> takes the last spare slot. Four appends cost 4 writes and 2 copies. In general, copies at sizes 1, 2, 4 and so on add to under <var>n</var>, so each append is <b>O(1) amortised</b>. And <code>a[2]</code> is still one sum: start + 2 × slot size.",
    ask: { q: "Now <b>insert(0, 7)</b>, at the front. How many items must move?", opts: ["none", "one", "all four"], a: 2,
           why: "Slot 0 is taken, and the block must stay unbroken, so 3, 1, 4 and 9 each shift one slot right." },
    hi: { out: "4 appends: 4 writes, 2 copies",
          cap: "<b>9</b> aakhri khaali slot le leta hai. Chaar appends ki cost 4 writes aur 2 copies. General rule: 1, 2, 4 aise sizes ki copies milkar <var>n</var> se kam hain, to har append <b>O(1) amortised</b> hai. Aur <code>a[2]</code> ab bhi ek jodh hai: start + 2 × slot size.",
          ask: { q: "Ab <b>insert(0, 7)</b>, aage. Kitne items hilenge?", opts: ["koi nahi", "ek", "chaaron"],
                 why: "Slot 0 bhara hai, aur block bina toote rehna chahiye, to 3, 1, 4 aur 9 har ek ek slot right khisakta hai." } } },

  { arr: ["7", "3", "1", "4", "9", "·", "·", "·"], on: [0], hot: [1, 2, 3, 4], dim: [5, 6, 7], out: "insert(0, 7): 4 items shifted, and the block grew again",
    cap: "Every item moved one slot right, and because the block was full it doubled to 8 first. Inserting at the front is <b>O(<var>n</var>)</b>, every time. That is why BFS takes from a <code>deque</code>, never from the front of a list.",
    hi: { out: "insert(0, 7): 4 items khiske, aur block phir bada hua",
          cap: "Har item ek slot right khiska, aur block bhara tha isliye pehle 8 ka ho gaya. Aage insert karna har baar <b>O(<var>n</var>)</b> hai. Isiliye BFS <code>deque</code> se leta hai, list ke aage se kabhi nahi." } },
]},

/* ---- string immutability ---- */
/* Building "abcd" one += at a time, then the same result with one join.
   Four letters are enough to show the 1 + 2 + 3 + 4 staircase. */
"string-immutable": { kind: "cells", arr: ["a"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>A loop builds its answer with <code>s += c</code>, one character per step. It passes on 1,000 characters and times out on 100,000.</p><p>Here is the same loop building a 4-letter string, so every copy is visible:</p><table><tr><td>the loop</td><td>for c in "abcd": s += c</td></tr><tr><td>the result</td><td>"abcd", 4 characters</td></tr><tr><td>characters written</td><td><b>?</b></td></tr></table><p>Goal: count how many characters actually get written, and find a way to write each one only once.</p>`,
    cap: "Each box is one character of the string object that exists after that step. Orange means copied again. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Ek loop apna answer <code>s += c</code> se banata hai, har step par ek character. 1,000 characters par pass, 100,000 par timeout.</p><p>Wahi loop 4 letter ki string banate hue, taaki har copy dikhe:</p><table><tr><td>loop</td><td>for c in "abcd": s += c</td></tr><tr><td>result</td><td>"abcd", 4 characters</td></tr><tr><td>kitne characters likhe</td><td><b>?</b></td></tr></table><p>Goal: ginna ki asal mein kitne characters likhe jaate hain, aur aisa tareeka dhoondhna jisme har ek sirf ek baar likha jaaye.</p>`,
          cap: "Har box us string object ka ek character hai jo us step ke baad maujood hai. Orange matlab dobara copy hua. Next dabao." } },

  { arr: ["a"], on: [0], out: "written so far: 1",
    cap: "<code>s = \"a\"</code>: one character written. In Python, Java and JavaScript this object can never be edited, only replaced. That is what <b>immutable</b> means.",
    ask: { q: "<code>s += \"b\"</code>. How many characters get written?", opts: ["1, just the b", "2: the a, copied, then the b"], a: 1,
           why: "The old string cannot grow, so a new 2-character string is built, and the a is copied into it." },
    hi: { out: "ab tak likhe: 1",
          cap: "<code>s = \"a\"</code>: ek character likha. Python, Java aur JavaScript mein yeh object kabhi edit nahi ho sakta, sirf badla ja sakta hai. <b>Immutable</b> ka matlab yahi hai.",
          ask: { q: "<code>s += \"b\"</code>. Kitne characters likhe jaayenge?", opts: ["1, sirf b", "2: a copy hua, phir b"],
                 why: "Purani string badh nahi sakti, to nayi 2-character string banti hai, aur a usme copy hota hai." } } },

  { arr: ["a", "b"], hot: [0], on: [1], out: "written: 1 + 2 = 3",
    cap: "<code>s += \"b\"</code> built a <b>brand new</b> 2-character string and copied the a into it. The old <code>\"a\"</code> is thrown away.",
    ask: { q: "<code>s += \"c\"</code>. What is the running total of characters written?", opts: ["4", "6"], a: 1,
           why: "The new string has 3 characters, all written: 3 + 3 = 6." },
    hi: { out: "likhe: 1 + 2 = 3",
          cap: "<code>s += \"b\"</code> ne <b>bilkul nayi</b> 2-character string banayi aur a usme copy kiya. Purani <code>\"a\"</code> phenk di gayi.",
          ask: { q: "<code>s += \"c\"</code>. Ab tak likhe characters ka total kya hoga?", opts: ["4", "6"],
                 why: "Nayi string mein 3 characters hain, sab likhe gaye: 3 + 3 = 6." } } },

  { arr: ["a", "b", "c"], hot: [0, 1], on: [2], out: "written: 3 + 3 = 6",
    cap: "Two old characters copied again, plus the new c. Every step re-copies everything that came before it.",
    ask: { q: "<code>s += \"d\"</code>. The total now?", opts: ["7", "10"], a: 1,
           why: "4 more characters written: 6 + 4 = 10." },
    hi: { out: "likhe: 3 + 3 = 6",
          cap: "Do purane characters phir copy, plus naya c. Har step pichhla sab dobara copy karta hai.",
          ask: { q: "<code>s += \"d\"</code>. Ab total?", opts: ["7", "10"],
                 why: "4 aur characters likhe: 6 + 4 = 10." } } },

  { arr: ["a", "b", "c", "d"], hot: [0, 1, 2], on: [3], out: "written: 6 + 4 = 10",
    cap: "<b>10 characters written for a 4-character result.</b> For <var>n</var> characters it is <var>n</var>(<var>n</var> + 1) / 2. At <var>n</var> = 100,000 that is 5 × 10⁹. The loop that looks O(<var>n</var>) is <b>O(<var>n</var>²)</b>.",
    ask: { q: "Instead, append each letter to a <b>list</b> and call <code>\"\".join(parts)</code> once. How many characters does the join write?", opts: ["4", "10"], a: 0,
           why: "join adds up the lengths first, allocates one 4-character buffer, and copies each letter into it once." },
    hi: { out: "likhe: 6 + 4 = 10",
          cap: "<b>4 character ke result ke liye 10 characters likhe.</b> <var>n</var> characters ke liye yeh <var>n</var>(<var>n</var> + 1) / 2 hai. <var>n</var> = 100,000 par 5 × 10⁹. Jo loop O(<var>n</var>) dikhta hai woh <b>O(<var>n</var>²)</b> hai.",
          ask: { q: "Iski jagah har letter ek <b>list</b> mein append karo aur <code>\"\".join(parts)</code> ek baar chalao. Join kitne characters likhega?", opts: ["4", "10"],
                 why: "join pehle lengths jodta hai, ek 4-character buffer leta hai, aur har letter usme ek baar copy karta hai." } } },

  { arr: ["a", "b", "c", "d"], on: [0, 1, 2, 3], out: "join: written 4",
    cap: "<b>Each character written exactly once: O(<var>n</var>).</b> At 100,000 characters that is 200,000 steps, counting the appends, instead of 5 × 10⁹. Same output. In C++, <code>std::string</code> is mutable, so <code>+=</code> there is already cheap.",
    hi: { out: "join: likhe 4",
          cap: "<b>Har character theek ek baar likha: O(<var>n</var>).</b> 100,000 characters par yeh appends milakar 200,000 steps hain, 5 × 10⁹ ki jagah. Output wahi. C++ mein <code>std::string</code> mutable hai, to wahan <code>+=</code> pehle se sasta hai." } },
]},

/* ---- hash map ---- */
/* Two Sum on [3, 10, 4, 6], target 10, in a 7-slot table. It is small enough
   to follow by hand, 3 and 10 collide in slot 3, and the answer is found by
   looking in exactly one slot. Lookup frames set look: the key is shown but
   not stored. */
"hashmap": { kind: "hash", buckets: 7, fn: "slot = x % 7", frames: [
  { scene: `<span class="kicker">Why this example</span><p>Two Sum: find two numbers that add up to the target. Walking once, each number <var>x</var> asks one question: <b>have I already seen</b> 10 − <var>x</var>?</p><table><tr><td>numbers</td><td>3, 10, 4, 6</td></tr><tr><td>target</td><td>10</td></tr><tr><td>table</td><td>7 slots, slot = <var>x</var> mod 7</td></tr></table><p>Goal: answer every “seen it?” by looking in <b>one slot</b>, never by scanning.</p>`,
    cap: "Left: the number being handled. Middle: the rule that picks its slot. Right: the 7 slots. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Two Sum: do numbers dhoondho jinka jodh target ho. Ek baar chalte hue har number <var>x</var> ek sawaal poochta hai: <b>kya 10 − <var>x</var> pehle dekha hai?</b></p><table><tr><td>numbers</td><td>3, 10, 4, 6</td></tr><tr><td>target</td><td>10</td></tr><tr><td>table</td><td>7 slots, slot = <var>x</var> mod 7</td></tr></table><p>Goal: har “dekha hai?” ka jawab <b>ek slot</b> mein dekh kar dena, kabhi scan karke nahi.</p>`,
          cap: "Left: jis number par kaam ho raha hai. Beech mein: uska slot chunne wala rule. Right: 7 slots. Next dabao." } },

  { k: "3", b: 3,
    cap: "<b>3</b> needs 7. Slot 7 mod 7 = 0 is empty, so 7 has not been seen. Store 3: 3 mod 7 = <b>slot 3</b>. No other key was looked at.",
    ask: { q: "Next is 10. It needs 0, which is not there either. Which slot does 10 go into?", opts: ["slot 3", "slot 10", "slot 0"], a: 0,
           why: "10 mod 7 = 3. There is no slot 10: the table has only 7." },
    hi: { cap: "<b>3</b> ko 7 chahiye. Slot 7 mod 7 = 0 khaali hai, to 7 nahi dekha. 3 store karo: 3 mod 7 = <b>slot 3</b>. Kisi aur key ko dekha tak nahi.",
          ask: { q: "Agla 10 hai. Use 0 chahiye, jo bhi nahi hai. 10 kis slot mein jaayega?", opts: ["slot 3", "slot 10", "slot 0"],
                 why: "10 mod 7 = 3. Slot 10 hai hi nahi: table mein sirf 7 hain." } } },

  { k: "10", b: 3,
    cap: "<b>Collision.</b> 10 also lands in slot 3, so slot 3 now holds a short list: 3, then 10. With endless possible keys and 7 slots, sharing is certain. A lookup here compares against two keys, not the whole table.",
    ask: { q: "Next, 4 needs 6. To check whether 6 was seen, how many slots do you look in?", opts: ["all 7", "one: slot 6"], a: 1,
           why: "6 mod 7 = 6, and 6 could only ever have been stored there." },
    hi: { cap: "<b>Collision.</b> 10 bhi slot 3 mein girta hai, to slot 3 mein ab chhoti list hai: 3, phir 10. Anant keys aur 7 slots mein sharing pakki hai. Yahan lookup do keys se compare karta hai, poori table se nahi.",
          ask: { q: "Agla, 4 ko 6 chahiye. 6 dekha hai ya nahi, iske liye kitne slots dekhoge?", opts: ["saare 7", "ek: slot 6"],
                 why: "6 mod 7 = 6, aur 6 store hota to sirf wahin hota." } } },

  { k: "4", b: 4,
    cap: "Slot 6 is empty, so 6 has not been seen. Store 4 in 4 mod 7 = <b>slot 4</b>. Every step so far touched one slot.",
    ask: { q: "Last, <b>6</b> needs 4. Which slot do you check?", opts: ["slot 4", "slot 6"], a: 0,
           why: "You are looking for 4, and 4 mod 7 = 4. Slot 6 is where 6 itself would go." },
    hi: { cap: "Slot 6 khaali hai, to 6 nahi dekha. 4 ko 4 mod 7 = <b>slot 4</b> mein store karo. Ab tak har step ne ek hi slot chhua.",
          ask: { q: "Aakhri, <b>6</b> ko 4 chahiye. Kaunsa slot check karoge?", opts: ["slot 4", "slot 6"],
                 why: "Aap 4 dhoondh rahe ho, aur 4 mod 7 = 4. Slot 6 woh jagah hai jahan 6 khud jaata." } } },

  { k: "4?", b: 4, look: true,
    cap: "<b>Found.</b> Slot 4 holds 4, so 4 + 6 = 10. Four numbers, four lookups, one slot each. For 10⁵ numbers that is 10⁵ lookups, not the 5 × 10⁹ pair checks.",
    hi: { cap: "<b>Mil gaya.</b> Slot 4 mein 4 hai, to 4 + 6 = 10. Chaar numbers, chaar lookups, har ek mein ek slot. 10⁵ numbers ke liye 10⁵ lookups, 5 × 10⁹ pair checks nahi." } },

  { k: "10?", b: 3, look: true,
    cap: "Why it is O(1) <i>on average</i>: finding 10 means checking slot 3's short list, 2 keys. Real tables grow before they are about three-quarters full, so lists stay about one long. If every key collided, one list would hold everything: <b>O(<var>n</var>)</b>.",
    hi: { cap: "Yeh <i>average</i> O(1) kyun hai: 10 dhoondhne ke liye slot 3 ki chhoti list check karni hai, 2 keys. Asli tables lagbhag teen-chauthai bharne se pehle badh jaati hain, to lists lagbhag ek ki rehti hain. Har key collide kare to ek list mein sab: <b>O(<var>n</var>)</b>." } },
]},

/* ---- stack ---- */
/* Checking "([{}])": the stack holds the brackets still waiting to close,
   so the top is always the one the next closer must match. */
"stack": { kind: "cells", arr: [], frames: [
  { scene: `<span class="kicker">Why this example</span><p>Check that the brackets in <code>([{}])</code> close in the right order. Counting is not enough:</p><table><tr><td><code>([{}])</code></td><td>counts balance</td><td>valid</td></tr><tr><td><code>([)]</code></td><td>counts balance</td><td><b>invalid</b></td></tr></table><p>Goal: see why the bracket that must close next is always the one opened <b>most recently</b>, and which container hands you exactly that.</p>`,
    cap: "The boxes below are the stack. The right-hand end is the top. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Check karo ki <code>([{}])</code> ke brackets sahi order mein band hote hain. Ginti kaafi nahi:</p><table><tr><td><code>([{}])</code></td><td>ginti barabar</td><td>valid</td></tr><tr><td><code>([)]</code></td><td>ginti barabar</td><td><b>invalid</b></td></tr></table><p>Goal: dekhna ki agla band hone wala bracket hamesha <b>sabse recent</b> khula kyun hota hai, aur kaunsa container theek wahi deta hai.</p>`,
          cap: "Neeche ke boxes stack hain. Right wala sira top hai. Next dabao." } },

  { arr: ["("], on: [0], ptr: { top: 0 }, out: "read ( : push",
    cap: "<b>(</b> is an opener, so push it. It now waits for its partner. A stack only lets you add or remove at the top: <b>last in, first out</b>.",
    hi: { out: "( padha: push",
          cap: "<b>(</b> opener hai, to push karo. Ab yeh apne partner ka intezaar karta hai. Stack sirf top par jodne ya hataane deta hai: <b>last in, first out</b>." } },

  { arr: ["(", "["], on: [1], ptr: { top: 1 }, out: "read [ : push",
    cap: "<b>[</b> goes on top of <b>(</b>. The stack now holds everything still unclosed, in the order it was opened.",
    hi: { out: "[ padha: push",
          cap: "<b>[</b> <b>(</b> ke upar jaata hai. Stack ab har abhi-tak-khula bracket rakhta hai, khulne ke order mein." } },

  { arr: ["(", "[", "{"], on: [2], ptr: { top: 2 }, out: "read { : push",
    cap: "<b>{</b> goes on top. Three brackets are waiting, and the one opened last sits at the top.",
    ask: { q: "Next comes <b>}</b>. Which open bracket must it close?", opts: ["{, the one on top", "(, the first one opened"], a: 0,
           why: "Whatever opened last must close first, or the brackets would cross." },
    hi: { out: "{ padha: push",
          cap: "<b>{</b> top par. Teen brackets intezaar mein, aur sabse baad khula top par baitha hai.",
          ask: { q: "Ab <b>}</b> aata hai. Use kaunsa khula bracket band karna hai?", opts: ["{, jo top par hai", "(, jo pehle khula"],
                 why: "Jo aakhri mein khula woh pehle band hoga, warna brackets ek doosre ko kaatenge." } } },

  { arr: ["(", "["], hot: [1], ptr: { top: 1 }, out: "read } : top is {, match, pop",
    cap: "<b>}</b> matches the top, <b>{</b>, so pop it. The top is now <b>[</b>: the next most recent unfinished bracket, exactly the next one due to close. In <code>([)]</code>, this is where it fails: <b>)</b> arrives while <b>[</b> is on top.",
    ask: { q: "Then <b>]</b> arrives. What is on top when it does?", opts: ["[", "("], a: 0,
           why: "{ was popped, so [ is on top again, and ] matches it." },
    hi: { out: "} padha: top {, match, pop",
          cap: "<b>}</b> top wale <b>{</b> se match karta hai, to pop. Ab top <b>[</b> hai: agla sabse recent adhoora bracket, theek wahi jo agla band hona hai. <code>([)]</code> yahin fail hota hai: <b>)</b> tab aata hai jab top par <b>[</b> hai.",
          ask: { q: "Phir <b>]</b> aata hai. Tab top par kya hai?", opts: ["[", "("],
                 why: "{ pop ho gaya, to [ phir top par hai, aur ] usse match karta hai." } } },

  { arr: ["("], hot: [0], ptr: { top: 0 }, out: "read ] : top is [, match, pop",
    cap: "<b>]</b> matches <b>[</b>. Pop. Only <b>(</b> is left, waiting for the last closer.",
    ask: { q: "Last, <b>)</b> pops the <b>(</b> and the stack is empty. Is <code>([{}])</code> valid?", opts: ["yes", "only if the counts also match"], a: 0,
           why: "Every closer matched the top, and nothing is left open. The counts add nothing." },
    hi: { out: "] padha: top [, match, pop",
          cap: "<b>]</b> <b>[</b> se match. Pop. Sirf <b>(</b> bacha, aakhri closer ke intezaar mein.",
          ask: { q: "Aakhri, <b>)</b> <b>(</b> ko pop karta hai aur stack khaali. Kya <code>([{}])</code> valid hai?", opts: ["haan", "sirf agar ginti bhi match kare"],
                 why: "Har closer ne top se match kiya, aur kuch khula nahi bacha. Ginti kuch nahi jodti." } } },

  { arr: [], out: "read ) : pop (, stack empty -> valid",
    cap: "Empty at the end means balanced. Each bracket was pushed once and popped once, so the check is <b>O(<var>n</var>)</b>, with each push and pop O(1).",
    hi: { out: ") padha: ( pop, stack khaali -> valid",
          cap: "End mein khaali matlab balanced. Har bracket ek baar push aur ek baar pop hua, to check <b>O(<var>n</var>)</b> hai, har push aur pop O(1)." } },
]},

/* The fewest steps from A to D, with a detour: A: B C, B: D, C: E, E: D.
   The queue finishes everything 1 step away before anything 2 steps away. */
"queue": { kind: "cells", arr: [], frames: [
  { scene: `<span class="kicker">Why this example</span><p>Find the fewest steps from A to D. There is a short route and a detour:</p><table><tr><td>A</td><td>links to B, C</td></tr><tr><td>B</td><td>links to D</td></tr><tr><td>C</td><td>links to E</td></tr><tr><td>E</td><td>links to D</td></tr></table><p>A B D is 2 steps. A C E D is 3. Goal: see why taking places in <b>arrival order</b> always finds the 2.</p>`,
    cap: "The boxes below are the queue: take from the front, add at the back. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>A se D tak sabse kam steps dhoondho. Ek chhota raasta hai aur ek chakkar:</p><table><tr><td>A</td><td>B, C se juda</td></tr><tr><td>B</td><td>D se juda</td></tr><tr><td>C</td><td>E se juda</td></tr><tr><td>E</td><td>D se juda</td></tr></table><p>A B D 2 steps hai. A C E D 3. Goal: dekhna ki <b>aane ke order</b> mein places lene se hamesha 2 kyun milta hai.</p>`,
          cap: "Neeche ke boxes queue hain: aage se lo, peeche jodo. Next dabao." } },

  { arr: ["A"], on: [0], ptr: { front: 0, back: 0 }, out: "start: A, 0 steps",
    cap: "Start with A in the queue. A queue is <b>first in, first out</b>: things leave in the order they arrived.",
    ask: { q: "Take A from the front. What joins the back?", opts: ["B and C, 1 step away", "D"], a: 0,
           why: "A links to B and C. D is not next to A." },
    hi: { out: "shuru: A, 0 steps",
          cap: "Queue mein A se shuru. Queue <b>first in, first out</b> hai: cheezein usi order mein nikalti hain jismein aayi.",
          ask: { q: "Aage se A lo. Peeche kya judta hai?", opts: ["B aur C, 1 step door", "D"],
                 why: "A B aur C se juda hai. D A ke paas nahi." } } },

  { arr: ["B", "C"], on: [0, 1], ptr: { front: 0, back: 1 }, out: "B = 1, C = 1",
    cap: "B and C join the back, both 1 step from A. Everything in the queue right now is at distance 1.",
    ask: { q: "Take B from the front. What joins the back?", opts: ["D", "E"], a: 0,
           why: "B links only to D." },
    hi: { out: "B = 1, C = 1",
          cap: "B aur C peeche jude, dono A se 1 step door. Abhi queue mein sab distance 1 par hai.",
          ask: { q: "Aage se B lo. Peeche kya judta hai?", opts: ["D", "E"],
                 why: "B sirf D se juda hai." } } },

  { arr: ["C", "D"], hot: [1], ptr: { front: 0, back: 1 }, out: "D = 2, queued behind C",
    cap: "D joins at distance 2, but it waits behind C, which is only 1 step away. Distance 1 always drains before distance 2 starts.",
    ask: { q: "C comes out next, not D. Why?", opts: ["C arrived first, and it is closer", "C comes first in the alphabet"], a: 0,
           why: "Arrival order is distance order here, because each place joins one step after the place that found it." },
    hi: { out: "D = 2, C ke peeche",
          cap: "D distance 2 par judta hai, par C ke peeche rukta hai, jo sirf 1 step door hai. Distance 1 hamesha distance 2 shuru hone se pehle khatam hota hai.",
          ask: { q: "Agla C nikalta hai, D nahi. Kyun?", opts: ["C pehle aaya, aur paas hai", "C alphabet mein pehle hai"],
                 why: "Yahan aane ka order hi doori ka order hai, kyunki har place use dhoondhne wale se ek step baad judta hai." } } },

  { arr: ["D", "E"], on: [0], hot: [1], ptr: { front: 0, back: 1 }, out: "C adds E = 2",
    cap: "C adds E, also at distance 2, behind D. The detour is in the queue, but it is behind the answer.",
    hi: { out: "C ne E = 2 joda",
          cap: "C ne E joda, woh bhi distance 2 par, D ke peeche. Chakkar queue mein hai, par answer ke peeche." } },

  { arr: ["E"], hot: [0], ptr: { front: 0, back: 0 }, out: "D taken: A to D in 2 steps",
    cap: "<b>D comes out at distance 2</b>, via B. A stack takes the newest first and would have gone A, C, E, D: 3 steps. Use a real deque here: <code>list.pop(0)</code> shifts every item and turns an O(<var>V</var> + <var>E</var>) search into O(<var>V</var>²).",
    hi: { out: "D nikla: A se D 2 steps mein",
          cap: "<b>D distance 2 par nikalta hai</b>, B se hokar. Stack sabse naya pehle leta aur A, C, E, D jaata: 3 steps. Yahan asli deque use karo: <code>list.pop(0)</code> har item khisakata hai aur O(<var>V</var> + <var>E</var>) search ko O(<var>V</var>²) bana deta hai." } },
]},

/* ---- heap ---- */
/* The heap 2, 5, 7, 9, 6, 8 takes a new job of urgency 1 and then hands out
   the smallest. Node g is index 6, the next free slot, hidden until the push. */
"heap": {
  kind: "tree", w: 560, h: 300,
  nodes: { a: { x: 280, y: 44, t: "2", sub: "i=0" }, b: { x: 160, y: 130, t: "5", sub: "i=1" }, c: { x: 400, y: 130, t: "7", sub: "i=2" },
           d: { x: 100, y: 216, t: "9", sub: "i=3" }, e: { x: 222, y: 216, t: "6", sub: "i=4" }, f: { x: 340, y: 216, t: "8", sub: "i=5" },
           g: { x: 460, y: 216, t: "1", sub: "i=6", hidden: true } },
  edges: [["a", "b"], ["a", "c"], ["b", "d"], ["b", "e"], ["c", "f"], ["c", "g"]],
  frames: [
    { scene: `<span class="kicker">Why this example</span><p>A scheduler keeps waiting jobs by urgency: smaller runs sooner. It needs two operations, over and over: <b>add a job</b> and <b>take the smallest</b>.</p><table><tr><td>waiting</td><td>2, 5, 7, 9, 6, 8</td></tr><tr><td>arrives</td><td>a job with urgency 1</td></tr><tr><td>then</td><td>take the smallest</td></tr></table><p>Goal: see how both work by walking <b>one path</b> of the tree, never the whole thing.</p>`,
      cap: "Each box is a job's urgency; the small label is its position in the underlying array. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Scheduler waiting jobs ko urgency se rakhta hai: chhota pehle chalta hai. Use do operations chahiye, baar baar: <b>job jodo</b> aur <b>sabse chhoti lo</b>.</p><table><tr><td>waiting</td><td>2, 5, 7, 9, 6, 8</td></tr><tr><td>aati hai</td><td>urgency 1 wali job</td></tr><tr><td>phir</td><td>sabse chhoti lo</td></tr></table><p>Goal: dekhna ki dono tree ka <b>ek raasta</b> chal kar kaise hote hain, poora tree kabhi nahi.</p>`,
            cap: "Har box ek job ki urgency hai; chhota label andar ke array mein uski position hai. Next dabao." } },

    { on: ["a"], out: "min-heap: every parent <= its children",
      cap: "The root, 2, is the minimum. That is the only thing a heap promises. It is <b>not</b> a sorted array: the array here is 2, 5, 7, 9, 6, 8.",
      ask: { q: "5 and 7 are siblings, both children of 2. Must 5 be smaller than 7?", opts: ["yes", "no: only parent ≤ child is required"], a: 1,
             why: "The rule links each parent to its own children. Siblings are never compared." },
      hi: { out: "min-heap: har parent <= uske children",
            cap: "Root, 2, minimum hai. Heap bas itna hi vaada karta hai. Yeh sorted array <b>nahi</b> hai: yahan array hai 2, 5, 7, 9, 6, 8.",
            ask: { q: "5 aur 7 siblings hain, dono 2 ke children. Kya 5 ko 7 se chhota hona zaroori hai?", opts: ["haan", "nahi: sirf parent ≤ child zaroori hai"],
                   why: "Niyam har parent ko uske apne children se jodta hai. Siblings kabhi compare nahi hote." } } },

    { on: ["a", "b", "c"], edge: [["a", "b"], ["a", "c"]], out: "2 <= 5 and 2 <= 7; 5 vs 7 does not matter",
      cap: "Check the rule locally: 2 ≤ 5 and 2 ≤ 7. Siblings are unordered, and that weaker promise is what makes repairs cheap.",
      ask: { q: "A job with urgency 1 arrives. Where is it placed first?", opts: ["at the root, since it is smallest", "at the next free slot: index 6, under 7"], a: 1,
             why: "Adding at the end keeps the tree full, with no gaps. The rule gets fixed afterwards." },
      hi: { out: "2 <= 5 aur 2 <= 7; 5 vs 7 se farak nahi",
            cap: "Niyam local check karo: 2 ≤ 5 aur 2 ≤ 7. Siblings unordered hain, aur yahi kamzor vaada repair ko sasta banata hai.",
            ask: { q: "Urgency 1 wali job aati hai. Pehle use kahan rakha jaata hai?", opts: ["root par, kyunki sabse chhoti hai", "agli khaali jagah: index 6, 7 ke neeche"],
                   why: "End mein jodne se tree bhara rehta hai, koi gap nahi. Niyam baad mein theek hota hai." } } },

    { show: ["g"], on: ["g"], edge: [["c", "g"]], out: "push(1) at index 6: 1 < its parent 7",
      cap: "1 goes to index 6, the next free slot, as a child of 7. The tree is still full, but 1 &lt; 7, so the parent rule is broken on this one edge.",
      ask: { q: "<b>Sift up</b>: 1 swaps with its parent 7. Its new parent is 2. Swap again?", opts: ["yes, 1 < 2", "no, stop there"], a: 0,
             why: "1 is still smaller than its parent, so the rule is still broken one level up." },
      hi: { out: "index 6 par push(1): 1 < parent 7",
            cap: "1 index 6 par jaata hai, agli khaali jagah, 7 ke child ki tarah. Tree ab bhi bhara hai, par 1 &lt; 7, to is ek edge par parent wala niyam toot gaya.",
            ask: { q: "<b>Sift up</b>: 1 apne parent 7 se swap hota hai. Naya parent 2 hai. Phir swap?", opts: ["haan, 1 < 2", "nahi, wahin ruko"],
                   why: "1 ab bhi apne parent se chhota hai, to ek level upar niyam ab bhi toota hai." } } },

    { show: ["g"], t: { c: "1", g: "7" }, on: ["c", "g"], edge: [["c", "g"]], out: "swap 1 and 7",
      cap: "One comparison, one swap. 7 now sits under 1, which is fine. The rest of the tree was never touched.",
      hi: { out: "1 aur 7 swap",
            cap: "Ek comparison, ek swap. 7 ab 1 ke neeche hai, jo theek hai. Baaki tree ko chhua bhi nahi." } },

    { show: ["g"], t: { a: "1", c: "2", g: "7" }, on: ["a", "c"], edge: [["a", "c"]], out: "swap 1 and 2: the new minimum is on top",
      cap: "1 &lt; 2, so swap again, and 1 reaches the root. <b>Two swaps</b>, one root-to-leaf path. In a heap of <var>n</var> items that path is about log₂ <var>n</var> long.",
      ask: { q: "Now <b>pop()</b>: take the 1. Which job moves up to the root before fixing things?", opts: ["7, the last item in the array", "2, the smaller child"], a: 0,
             why: "Moving the last item up keeps the tree full. Then it sifts down." },
      hi: { out: "1 aur 2 swap: naya minimum top par",
            cap: "1 &lt; 2, to phir swap, aur 1 root par pahunch gaya. <b>Do swaps</b>, ek root-to-leaf raasta. <var>n</var> items ki heap mein yeh raasta lagbhag log₂ <var>n</var> lamba hai.",
            ask: { q: "Ab <b>pop()</b>: 1 lo. Theek karne se pehle kaunsi job root par jaati hai?", opts: ["7, array ka aakhri item", "2, chhota child"],
                   why: "Aakhri item upar le jaane se tree bhara rehta hai. Phir woh neeche sift hota hai." } } },

    { t: { a: "7", c: "2" }, on: ["a"], out: "pop: 1 leaves, 7 moves to the root",
      cap: "1 is handed out. The last item, 7, moves to the root and index 6 is empty again. Now 7 is bigger than its children, so it must go <b>down</b>.",
      ask: { q: "7's children are 5 and 2. Which one does it swap with?", opts: ["2, the smaller child", "5, the left child"], a: 0,
             why: "Swap with the smaller child, and that child becomes the parent of the other: 2 ≤ 5 holds." },
      hi: { out: "pop: 1 gaya, 7 root par aaya",
            cap: "1 de diya gaya. Aakhri item, 7, root par aata hai aur index 6 phir khaali. Ab 7 apne children se bada hai, to use <b>neeche</b> jaana hai.",
            ask: { q: "7 ke children 5 aur 2 hain. Kiske saath swap karega?", opts: ["2, chhota child", "5, left child"],
                   why: "Chhote child se swap karo, taaki woh doosre ka parent bane: 2 ≤ 5 sach rehta hai." } } },

    { on: ["a", "c"], edge: [["a", "c"]], out: "swap 7 and 2; 7 <= 8, stop",
      cap: "7 swaps with 2, then compares with its one child, 8. 7 ≤ 8, so it stops. Back to 2, 5, 7, 9, 6, 8. Pop also walked <b>one path</b>: O(log <var>n</var>). And it is all a flat array: the children of <var>i</var> are 2<var>i</var> + 1 and 2<var>i</var> + 2.",
      hi: { out: "7 aur 2 swap; 7 <= 8, ruko",
            cap: "7, 2 se swap hota hai, phir apne ek child, 8, se compare. 7 ≤ 8, to ruk jaata hai. Wapas 2, 5, 7, 9, 6, 8. Pop ne bhi <b>ek raasta</b> chala: O(log <var>n</var>). Aur sab ek flat array hai: <var>i</var> ke children 2<var>i</var> + 1 aur 2<var>i</var> + 2." } },
  ]
},

/* ---- recursion ---- */
/* ways(4) for a 4-step staircase, climbing 1 or 2 at a time: 5 calls, 3 deep,
   and ways(2) computed twice, which is the whole case for memoising. */
"recursion-tree": {
  kind: "tree", w: 600, h: 250,
  nodes: { w4: { x: 300, y: 40, t: "ways(4)", w: 90 }, w3: { x: 180, y: 120, t: "ways(3)", w: 90 }, v2: { x: 440, y: 120, t: "ways(2)", w: 90 },
           w2: { x: 100, y: 200, t: "ways(2)", w: 90 }, w1: { x: 260, y: 200, t: "ways(1)", w: 90 } },
  edges: [["w4", "w3"], ["w4", "v2"], ["w3", "w2"], ["w3", "w1"]],
  frames: [
    { scene: `<span class="kicker">Why this example</span><p>A staircase of 4 steps, climbed 1 or 2 at a time. How many routes reach the top?</p><table><tr><td>the last move was a 1</td><td>so count the routes to step 3</td></tr><tr><td>the last move was a 2</td><td>so count the routes to step 2</td></tr><tr><td>base cases</td><td>ways(1) = 1, ways(2) = 2</td></tr></table><p>So <code>ways(4) = ways(3) + ways(2)</code>. Goal: watch the calls go down, the answers come back up, and spot the work done twice.</p>`,
      cap: "Each box is one call. Its label becomes its answer once it returns. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>4 steps ki seedhi, ek baar mein 1 ya 2 chadh kar. Top tak kitne raaste hain?</p><table><tr><td>aakhri move 1 tha</td><td>to step 3 tak ke raaste gino</td></tr><tr><td>aakhri move 2 tha</td><td>to step 2 tak ke raaste gino</td></tr><tr><td>base cases</td><td>ways(1) = 1, ways(2) = 2</td></tr></table><p>To <code>ways(4) = ways(3) + ways(2)</code>. Goal: calls ko neeche jaate, answers ko upar aate dekhna, aur do baar hua kaam pakadna.</p>`,
            cap: "Har box ek call hai. Return hone par uska label uska answer ban jaata hai. Next dabao." } },

    { on: ["w4"], dim: ["w3", "v2", "w2", "w1"], out: "ways(4) = ways(3) + ways(2)",
      cap: "<b>Trust, do not trace.</b> Assume <code>ways(3)</code> and <code>ways(2)</code> already give the right answers, and just add them. That one line is the whole function, plus the base cases.",
      ask: { q: "The machine runs the calls one at a time. Which runs first?", opts: ["ways(3), while ways(4) waits", "both at once"], a: 0,
             why: "ways(4) pauses with its frame on the call stack, and resumes when ways(3) returns." },
      hi: { out: "ways(4) = ways(3) + ways(2)",
            cap: "<b>Bharosa karo, trace nahi.</b> Maan lo <code>ways(3)</code> aur <code>ways(2)</code> sahi answers dete hain, aur bas jodo. Yahi ek line poora function hai, base cases ke saath.",
            ask: { q: "Machine calls ek ek karke chalati hai. Pehle kaunsi?", opts: ["ways(3), jab tak ways(4) rukta hai", "dono ek saath"],
                   why: "ways(4) apna frame call stack par rakh kar rukta hai, aur ways(3) ke return par phir chalta hai." } } },

    { on: ["w4", "w3", "w2", "w1"], edge: [["w4", "w3"], ["w3", "w2"], ["w3", "w1"]], dim: ["v2"], out: "3 frames deep: ways(4), ways(3), then a base case",
      cap: "<code>ways(3)</code> asks for <code>ways(2)</code> and <code>ways(1)</code>. Both are <b>base cases</b>: answered directly, with no further call. That is where the descent stops.",
      ask: { q: "What do the two base cases return?", opts: ["2 and 1", "they call ways(0) and ways(-1)"], a: 0,
             why: "Two routes reach step 2 (1+1 and 2), one route reaches step 1. No calls needed." },
      hi: { out: "3 frames gehra: ways(4), ways(3), phir base case",
            cap: "<code>ways(3)</code> <code>ways(2)</code> aur <code>ways(1)</code> maangta hai. Dono <b>base cases</b> hain: seedha answer, koi aur call nahi. Utarna yahin rukta hai.",
            ask: { q: "Dono base cases kya return karte hain?", opts: ["2 aur 1", "woh ways(0) aur ways(-1) call karte hain"],
                   why: "Step 2 tak do raaste (1+1 aur 2), step 1 tak ek. Koi call nahi chahiye." } } },

    { t: { w2: "2", w1: "1", w3: "3" }, on: ["w3", "w2", "w1"], dim: ["v2"], out: "ways(3) = 2 + 1 = 3",
      cap: "Answers return <b>upward</b>: <code>ways(3)</code> = 2 + 1 = 3. Its frame resumed exactly where it paused. Only now does <code>ways(4)</code> ask for its second part.",
      ask: { q: "<code>ways(4)</code> now asks for <code>ways(2)</code>. Has that been worked out before?", opts: ["yes, inside ways(3)", "no, it is new"], a: 0,
             why: "ways(3) already called ways(2). Without a memo, it is computed all over again." },
      hi: { out: "ways(3) = 2 + 1 = 3",
            cap: "Answers <b>upar</b> lautte hain: <code>ways(3)</code> = 2 + 1 = 3. Uska frame theek wahin se chala jahan ruka tha. Ab jaake <code>ways(4)</code> apna doosra hissa maangta hai.",
            ask: { q: "<code>ways(4)</code> ab <code>ways(2)</code> maangta hai. Kya yeh pehle nikal chuka hai?", opts: ["haan, ways(3) ke andar", "nahi, naya hai"],
                   why: "ways(3) ne pehle hi ways(2) call kiya tha. Memo ke bina yeh phir se compute hota hai." } } },

    { t: { w2: "2", w1: "1", w3: "3", v2: "2", w4: "5" }, on: ["w4", "w3", "v2"], edge: [["w4", "w3"], ["w4", "v2"]], out: "ways(4) = 3 + 2 = 5: 5 calls, 3 deep",
      cap: "<code>ways(4)</code> = 3 + 2 = <b>5</b>, matching the 5 routes. Memory is the depth: at most 3 frames at once, O(<var>n</var>). Time is the number of boxes: 5 here, about 2.5 × 10¹⁰ for 50 steps.",
      hi: { out: "ways(4) = 3 + 2 = 5: 5 calls, 3 gehra",
            cap: "<code>ways(4)</code> = 3 + 2 = <b>5</b>, 5 raaston se match. Memory depth hai: ek saath zyada se zyada 3 frames, O(<var>n</var>). Time boxes ki ginti hai: yahan 5, 50 steps par lagbhag 2.5 × 10¹⁰." } },

    { t: { w2: "2", w1: "1", w3: "3", v2: "2", w4: "5" }, on: ["w2", "v2"], dim: ["w4", "w3", "w1"], out: "ways(2) computed twice: store it",
      cap: "<b>ways(2) was worked out twice.</b> Store each answer the first time (<code>@lru_cache</code>, or a dict) and every <var>n</var> is computed once: about 50 calls for 50 steps. That is memoisation, and it is exactly what DP is.",
      hi: { out: "ways(2) do baar nikla: store karo",
            cap: "<b>ways(2) do baar nikala gaya.</b> Har answer pehli baar store karo (<code>@lru_cache</code>, ya dict) aur har <var>n</var> ek baar compute hota hai: 50 steps ke liye lagbhag 50 calls. Yahi memoisation hai, aur DP theek yahi hai." } },
  ]
},

/* ---- binary search ---- */
/* Searching for 11 in 1 3 5 7 9 11 13 15, over [lo, hi). The dim slot at
   position 8 is one past the end, so hi always has somewhere to point. */
"binary-search": { kind: "cells", arr: ["1", "3", "5", "7", "9", "11", "13", "15", "·"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>The real list holds 10⁶ sorted IDs and must answer 10⁵ lookups a second. Here it is with eight:</p><table><tr><td>sorted IDs</td><td>1 3 5 7 9 11 13 15</td></tr><tr><td>looking for</td><td>11</td></tr><tr><td>reading one by one</td><td>up to 8 looks</td></tr></table><p>Goal: find 11 in 3 looks by throwing away half the list each time, and see why that is only possible because the list is sorted.</p>`,
    cap: "The search range is <code>[lo, hi)</code>: <var>lo</var> is in, <var>hi</var> is out. The dim box is position 8, one past the end. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Asli list mein 10⁶ sorted IDs hain aur har second 10⁵ lookups ka jawab dena hai. Yahan aath ke saath:</p><table><tr><td>sorted IDs</td><td>1 3 5 7 9 11 13 15</td></tr><tr><td>dhoondhna</td><td>11</td></tr><tr><td>ek ek padhna</td><td>8 looks tak</td></tr></table><p>Goal: har baar aadhi list phenk kar 11 ko 3 looks mein dhoondhna, aur dekhna ki yeh sirf sorted hone ki wajah se possible hai.</p>`,
          cap: "Search range <code>[lo, hi)</code> hai: <var>lo</var> andar, <var>hi</var> bahar. Dheema box position 8 hai, end se ek aage. Next dabao." } },

  { band: [0, 7], hot: [4], dim: [8], ptr: { lo: 0, mid: 4, hi: 8 }, out: "[0, 8): mid = 4, a[4] = 9",
    cap: "Look at the middle: <code>mid = lo + (hi - lo) / 2</code> = 4, which holds 9. One comparison with 11 decides which half survives.",
    ask: { q: "9 &lt; 11. Which part can be thrown away?", opts: ["9 and everything left of it", "everything right of 9"], a: 0,
           why: "The list is sorted, so 1, 3, 5 and 7 are even smaller than 9. None of them can be 11." },
    hi: { out: "[0, 8): mid = 4, a[4] = 9",
          cap: "Beech dekho: <code>mid = lo + (hi - lo) / 2</code> = 4, jahan 9 hai. 11 se ek comparison tay karta hai kaunsa aadha bachega.",
          ask: { q: "9 &lt; 11. Kaunsa hissa phenka ja sakta hai?", opts: ["9 aur uske left ka sab", "9 ke right ka sab"],
                 why: "List sorted hai, to 1, 3, 5 aur 7 9 se bhi chhote hain. Inme se koi 11 nahi ho sakta." } } },

  { band: [5, 7], hot: [6], dim: [0, 1, 2, 3, 4, 8], ptr: { lo: 5, mid: 6, hi: 8 }, out: "lo = 5; [5, 8): mid = 6, a[6] = 13",
    cap: "<code>lo = mid + 1</code> = 5. Five items gone in one comparison, because the list is sorted. The new middle is position 6, holding 13.",
    ask: { q: "13 is bigger than 11. Where can 11 still be?", opts: ["left of 13, at position 5", "right of 13"], a: 0,
           why: "Everything right of 13 is bigger still. Only position 5 is left." },
    hi: { out: "lo = 5; [5, 8): mid = 6, a[6] = 13",
          cap: "<code>lo = mid + 1</code> = 5. Ek comparison mein paanch items gaye, kyunki list sorted hai. Naya beech position 6 hai, jahan 13 hai.",
          ask: { q: "13, 11 se bada hai. 11 ab kahan ho sakta hai?", opts: ["13 ke left, position 5 par", "13 ke right"],
                 why: "13 ke right ka sab aur bhi bada hai. Sirf position 5 bachi." } } },

  { band: [5, 5], hot: [5], dim: [0, 1, 2, 3, 4, 6, 7, 8], ptr: { lo: 5, mid: 5, hi: 6 }, out: "hi = 6; [5, 6): mid = 5, a[5] = 11",
    cap: "<code>hi = mid</code> = 6. One position left, and the middle is that position: 5, holding 11. Since 11 ≥ 11, <code>hi = mid</code> again, and the range becomes [5, 5).",
    ask: { q: "<var>lo</var> = <var>hi</var> = 5, so the loop stops. What is at position 5?", opts: ["11: found", "nothing: 11 is missing"], a: 0,
           why: "The loop ends at the first position holding a value ≥ 11, and that value is exactly 11." },
    hi: { out: "hi = 6; [5, 6): mid = 5, a[5] = 11",
          cap: "<code>hi = mid</code> = 6. Ek position bachi, aur beech wahi hai: 5, jahan 11 hai. 11 ≥ 11, to phir <code>hi = mid</code>, aur range [5, 5) ban jaati hai.",
          ask: { q: "<var>lo</var> = <var>hi</var> = 5, to loop rukta hai. Position 5 par kya hai?", opts: ["11: mil gaya", "kuch nahi: 11 hai hi nahi"],
                 why: "Loop pehli aisi position par rukta hai jiski value ≥ 11 ho, aur woh value theek 11 hai." } } },

  { hot: [5], dim: [0, 1, 2, 3, 4, 6, 7, 8], ptr: { found: 5 }, out: "3 looks: 8 -> 3 -> 1 -> 0 left",
    cap: "<b>Found in 3 looks</b>, not 6. Each look cut the range to half or less: 8, then 3, then 1, then 0 left to search. That count is log₂ <var>n</var>, so 10⁶ IDs need about 20 looks. Searching for 10 takes the same 3 looks and stops at 11: where 10 would go.",
    hi: { out: "3 looks: 8 -> 3 -> 1 -> 0 bache",
          cap: "<b>3 looks mein mila</b>, 6 mein nahi. Har look ne range aadhi ya usse kam ki: 8, phir 3, phir 1, phir search ke liye 0. Yeh ginti log₂ <var>n</var> hai, to 10⁶ IDs ko lagbhag 20 looks. 10 ki search bhi wahi 3 looks leti hai aur 11 par rukti hai: jahan 10 jaata." } },

  { band: [5, 5], bad: [5], dim: [0, 1, 2, 3, 4, 6, 7, 8], ptr: { lo: 5, mid: 5, hi: 6 }, out: "[5, 6): lo = mid would never move",
    cap: "<b>The bug lives here.</b> In a range of one, <var>mid</var> equals <var>lo</var>. A branch that does <code>lo = mid</code> changes nothing, and the loop spins forever. Every branch must move past <var>mid</var> (<code>lo = mid + 1</code>) or pin <var>hi</var> to it (<code>hi = mid</code>).",
    hi: { out: "[5, 6): lo = mid kabhi nahi hilega",
          cap: "<b>Bug yahin rehta hai.</b> Ek ki range mein <var>mid</var> <var>lo</var> ke barabar hai. <code>lo = mid</code> karne wali branch kuch nahi badalti, aur loop hamesha ghoomta hai. Har branch ya to <var>mid</var> ke paar jaaye (<code>lo = mid + 1</code>) ya <var>hi</var> ko us par roke (<code>hi = mid</code>)." } },
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

/* The grid bug, [[0] * 3] * 3, is the example. The walk first shows one
   address copied once (b = a), so that the grid, the same move three times,
   needs no new idea. Every node starts hidden and each frame names what shows. */
"aliasing": {
  kind: "tree", w: 600, h: 290, arrows: true,
  nodes: {
    a:   { x: 90,  y: 60,  t: "a",  w: 54, hidden: true },
    b:   { x: 90,  y: 170, t: "b",  w: 54, hidden: true },
    obj: { x: 400, y: 115, t: "[0, 0, 0]", w: 150, hidden: true },
    g0:  { x: 100, y: 50,  t: "grid[0]", w: 96, hidden: true },
    g1:  { x: 100, y: 135, t: "grid[1]", w: 96, hidden: true },
    g2:  { x: 100, y: 220, t: "grid[2]", w: 96, hidden: true },
    row: { x: 420, y: 135, t: "[0, 0, 0]", w: 150, hidden: true },
    r0:  { x: 420, y: 50,  t: "[0, 0, 0]", w: 150, hidden: true },
    r1:  { x: 420, y: 135, t: "[0, 0, 0]", w: 150, hidden: true },
    r2:  { x: 420, y: 220, t: "[0, 0, 0]", w: 150, hidden: true },
  },
  edges: [],
  frames: [
    { scene: `<span class="kicker">Why this example</span><p>You need a 3 × 3 board of zeros. The short way in Python is <code>grid = [[0] * 3] * 3</code>. Then you place one piece with <code>grid[0][0] = 9</code>.</p><table><tr><td></td><td>row 0</td><td>row 1</td><td>row 2</td></tr><tr><td>what you meant</td><td>9 0 0</td><td>0 0 0</td><td>0 0 0</td></tr><tr><td>what prints</td><td>9 0 0</td><td><b>9 0 0</b></td><td><b>9 0 0</b></td></tr></table><p>Every language with objects has some version of this bug. Goal: see why one write changed three rows, using nothing but arrows.</p>`,
      cap: "The walk starts with a single list, then builds the grid from the same idea. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Zeros ka 3 × 3 board chahiye. Python mein chhota tareeka hai <code>grid = [[0] * 3] * 3</code>. Phir <code>grid[0][0] = 9</code> se ek piece rakho.</p><table><tr><td></td><td>row 0</td><td>row 1</td><td>row 2</td></tr><tr><td>aap chahte the</td><td>9 0 0</td><td>0 0 0</td><td>0 0 0</td></tr><tr><td>print hua</td><td>9 0 0</td><td><b>9 0 0</b></td><td><b>9 0 0</b></td></tr></table><p>Objects wali har language mein is bug ka koi version hai. Goal: sirf arrows se samajhna ki ek write ne teen rows kyun badli.</p>`,
            cap: "Walk ek akeli list se shuru hoti hai, phir usi idea se grid banti hai. Next dabao." } },

    { show: ["a", "obj"], edges: [["a", "obj"]], on: ["a", "obj"], edge: [["a", "obj"]],
      out: "a holds an address; the list lives elsewhere",
      cap: "Start with one list. <code>a = [0, 0, 0]</code> does two things. It builds the list <b>somewhere in memory</b>, and it stores that list's <b>address</b> in <code>a</code>. The arrow is the address.",
      ask: { q: "Now <code>b = a</code>. How many lists exist?", opts: ["one", "two"], a: 0,
             why: "Assignment copies what is inside the variable, and that is an address." },
      hi: { out: "a mein address hai; list kahin aur hai",
            cap: "Ek list se shuru karo. <code>a = [0, 0, 0]</code> do kaam karta hai. List ko <b>memory mein kahin</b> banata hai, aur us list ka <b>address</b> <code>a</code> mein rakhta hai. Arrow hi address hai.",
            ask: { q: "Ab <code>b = a</code>. Kitni lists hain?", opts: ["ek", "do"],
                   why: "Assignment variable ke andar ki cheez copy karta hai, aur woh ek address hai." } } },

    { show: ["a", "b", "obj"], edges: [["a", "obj"], ["b", "obj"]], on: ["a", "b", "obj"], edge: [["a", "obj"], ["b", "obj"]],
      out: "one list, two names",
      cap: "<code>b = a</code> copied the <b>address, not the list</b>. Nothing new was built. One list now has two names. This is called <b>aliasing</b>.",
      ask: { q: "Now <code>b[0] = 9</code>. What does <code>print(a)</code> show?", opts: ["[0, 0, 0]", "[9, 0, 0]"], a: 1,
             why: "Both arrows lead to the same list." },
      hi: { out: "ek list, do naam",
            cap: "<code>b = a</code> ne <b>address copy kiya, list nahi</b>. Kuch naya nahi bana. Ek list ke ab do naam hain. Ise <b>aliasing</b> kehte hain.",
            ask: { q: "Ab <code>b[0] = 9</code>. <code>print(a)</code> kya dikhayega?", opts: ["[0, 0, 0]", "[9, 0, 0]"],
                   why: "Dono arrows usi ek list tak jaate hain." } } },

    { show: ["a", "b", "obj"], edges: [["a", "obj"], ["b", "obj"]], t: { obj: "[9, 0, 0]" }, on: ["a", "b", "obj"], edge: [["a", "obj"], ["b", "obj"]],
      out: "b[0] = 9, and a sees it",
      cap: "Writing through <code>b</code> changed the one list, so <code>a</code> sees the 9. The language did nothing odd. There was only ever one list.",
      hi: { out: "b[0] = 9, aur a ko dikhta hai",
            cap: "<code>b</code> se likhne par wahi ek list badli, to <code>a</code> ko bhi 9 dikhta hai. Language ne kuch ajeeb nahi kiya. List shuru se ek hi thi." } },

    { show: ["g0", "g1", "g2", "row"], edges: [["g0", "row"], ["g1", "row"], ["g2", "row"]],
      on: ["g0", "g1", "g2", "row"], edge: [["g0", "row"], ["g1", "row"], ["g2", "row"]],
      out: "[[0] * 3] * 3: three slots, one row",
      cap: "Now the grid. <code>[0] * 3</code> builds <b>one</b> row. The outer <code>* 3</code> copies what it holds three times, and what it holds is that row's <b>address</b>. So the grid has three slots, all pointing at one row.",
      ask: { q: "<code>grid[0][0] = 9</code>. How many rows show the 9?", opts: ["one", "all three"], a: 1,
             why: "grid[0], grid[1] and grid[2] all lead to the same row." },
      hi: { out: "[[0] * 3] * 3: teen slots, ek row",
            cap: "Ab grid. <code>[0] * 3</code> <b>ek</b> row banata hai. Bahar wala <code>* 3</code> jo rakha hai use teen baar copy karta hai, aur rakha hai us row ka <b>address</b>. To grid mein teen slots hain, teeno ek hi row ko point karte hue.",
            ask: { q: "<code>grid[0][0] = 9</code>. Kitni rows mein 9 dikhega?", opts: ["ek", "teeno"],
                   why: "grid[0], grid[1] aur grid[2] teeno usi ek row tak jaate hain." } } },

    { show: ["g0", "g1", "g2", "row"], edges: [["g0", "row"], ["g1", "row"], ["g2", "row"]], t: { row: "[9, 0, 0]" },
      on: ["g0", "g1", "g2", "row"], edge: [["g0", "row"], ["g1", "row"], ["g2", "row"]],
      out: "one write, seen through all three slots",
      cap: "That is the bug from the start: one row, reached three ways. Copying with <code>grid[:]</code> does not help. It copies the three addresses, and they still lead here.",
      ask: { q: "The fix builds each row separately: <code>[[0] * 3 for _ in range(3)]</code>. After <code>grid[0][0] = 9</code>, how many rows change?", opts: ["one", "all three"], a: 0,
             why: "The loop runs <code>[0] * 3</code> three times, so there are three rows." },
      hi: { out: "ek write, teeno slots se dikhta hai",
            cap: "Shuru wala bug yahi hai: ek row, teen raaston se. <code>grid[:]</code> se copy karna kaam nahi aata. Woh teen address copy karta hai, aur woh ab bhi yahin aate hain.",
            ask: { q: "Fix har row alag banata hai: <code>[[0] * 3 for _ in range(3)]</code>. <code>grid[0][0] = 9</code> ke baad kitni rows badlengi?", opts: ["ek", "teeno"],
                   why: "Loop <code>[0] * 3</code> teen baar chalata hai, to teen rows banti hain." } } },

    { show: ["g0", "g1", "g2", "r0", "r1", "r2"], edges: [["g0", "r0"], ["g1", "r1"], ["g2", "r2"]], t: { r0: "[9, 0, 0]" },
      on: ["g0", "r0"], edge: [["g0", "r0"]],
      out: "three rows, three different addresses",
      cap: "The comprehension builds <b>three</b> rows, so each slot holds a different address. Now one write changes one row. That is the whole fix.",
      hi: { out: "teen rows, teen alag address",
            cap: "Comprehension <b>teen</b> rows banata hai, to har slot mein alag address hai. Ab ek write ek hi row badalta hai. Poora fix bas itna hai." } },

    { show: ["g0", "g1", "g2", "r0", "r1", "r2"], edges: [["g0", "r0"], ["g1", "r1"], ["g2", "r2"]], t: { r0: "[9, 0, 0]" },
      on: ["g0", "g1", "g2", "r0", "r1", "r2"], edge: [["g0", "r0"], ["g1", "r1"], ["g2", "r2"]],
      out: "copy an address: O(1). copy the cells: one step each",
      cap: "The rule: <b>if you did not ask for a copy, you are sharing</b>. Copying an address costs one step. Copying what it points at costs a step per cell: 9 here, 10⁶ for a 1,000 × 1,000 board.",
      hi: { out: "address copy: O(1). cells copy: har cell ek step",
            cap: "Rule: <b>agar copy nahi maangi, to aap share kar rahe ho</b>. Address copy karna ek step hai. Jo woh point karta hai use copy karna har cell par ek step: yahan 9, aur 1,000 × 1,000 board par 10⁶." } },
  ]
},

/* ---- two's complement, and why a big number can go negative ---- */
/* The midpoint bug in miniature: 8 bits instead of 32, so every bit fits
   on screen. lo = 100, hi = 120 plays the part of the two billions. */
"int-overflow": { kind: "cells", arr: ["0","1","1","1","1","1","1","1"], idx: false, frames: [
  { scene: `<span class="kicker">Why this example</span><p>Binary search takes the middle of a range with <code>mid = (lo + hi) / 2</code>. In Java, with <var>lo</var> = 2,000,000,000 and <var>hi</var> = 2,100,000,000, that gives a <b>negative</b> index.</p><p>Here is the same bug shrunk to an 8-bit integer, whose largest value is 127, so every bit fits on screen:</p><table><tr><td>lo</td><td>100</td></tr><tr><td>hi</td><td>120</td></tr><tr><td>the middle you want</td><td><b>110</b></td></tr><tr><td>lo + hi</td><td>220, bigger than 127</td></tr></table><p>Goal: see where the sum goes, and why <code>lo + (hi - lo) / 2</code> never goes there.</p>`,
    cap: "Each box below is one bit, one on/off switch. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Binary search range ka beech <code>mid = (lo + hi) / 2</code> se leta hai. Java mein <var>lo</var> = 2,000,000,000 aur <var>hi</var> = 2,100,000,000 par yeh <b>negative</b> index deta hai.</p><p>Yahi bug 8-bit integer mein chhota karke dekho, jiski sabse badi value 127 hai, taaki har bit screen par aa jaaye:</p><table><tr><td>lo</td><td>100</td></tr><tr><td>hi</td><td>120</td></tr><tr><td>jo beech chahiye</td><td><b>110</b></td></tr><tr><td>lo + hi</td><td>220, 127 se bada</td></tr></table><p>Goal: dekhna ki jodh kahan jaata hai, aur <code>lo + (hi - lo) / 2</code> wahan kabhi kyun nahi jaata.</p>`,
          cap: "Neeche har box ek bit hai, ek on/off switch. Next dabao." } },

  { on: [1,2,3,4,5,6,7], hot: [0], out: "0111 1111 = 127, the largest 8-bit value",
    cap: "Bit values from the right are 1, 2, 4 and so on up to 64. The leftmost bit is the <b>sign</b>: 0 means positive. So the most this can hold is 64 + 32 + … + 1 = <b>127</b>. A 32-bit <code>int</code> is the same idea, and stops at 2,147,483,647.",
    ask: { q: "Add 1 to 127. What does the 8-bit integer hold?", opts: ["128", "−128", "an error"], a: 1,
           why: "The carry runs into the sign bit, and a sign bit of 1 means negative." },
    hi: { out: "0111 1111 = 127, sabse badi 8-bit value",
          cap: "Right se bits ki value 1, 2, 4, aise hi 64 tak. Sabse left wala bit <b>sign</b> hai: 0 matlab positive. To yeh zyada se zyada 64 + 32 + … + 1 = <b>127</b> rakh sakta hai. 32-bit <code>int</code> bhi aisa hi hai, aur 2,147,483,647 par rukta hai.",
          ask: { q: "127 mein 1 jodo. 8-bit integer mein kya hoga?", opts: ["128", "−128", "error"],
                 why: "Carry sign bit mein chala jaata hai, aur sign bit 1 matlab negative." } } },

  { arr: ["1","0","0","0","0","0","0","0"], bad: [0], out: "127 + 1 = 1000 0000 = -128",
    cap: "No error, no stop at 127. The carry flips the sign bit, and the value <b>wraps</b> to the most negative number. Java does this silently, and in C++ it is not even defined behaviour.",
    ask: { q: "Now <var>lo</var> = 100, <var>hi</var> = 120. The true sum is 220. What does 8-bit <code>lo + hi</code> hold?", opts: ["220", "127", "−36"], a: 2,
           why: "220 needs a 9th bit. Dropping it subtracts 256: 220 − 256 = −36." },
    hi: { out: "127 + 1 = 1000 0000 = -128",
          cap: "Na error, na 127 par rukna. Carry sign bit palat deta hai, aur value <b>wrap</b> hokar sabse negative number ban jaati hai. Java yeh chupchaap karta hai, aur C++ mein yeh defined behaviour bhi nahi.",
          ask: { q: "Ab <var>lo</var> = 100, <var>hi</var> = 120. Asli jodh 220 hai. 8-bit <code>lo + hi</code> mein kya hoga?", opts: ["220", "127", "−36"],
                 why: "220 ko 9th bit chahiye. Use girane se 256 ghat-ta hai: 220 − 256 = −36." } } },

  { arr: ["1","1","0","1","1","1","0","0"], bad: [0], out: "100 + 120 = 1101 1100 = -36",
    cap: "There it is. 220 in binary is 1101 1100, and with a sign bit that reads as <b>−36</b>. Then <code>mid = -36 / 2 = -18</code>. The search reads <code>a[-18]</code>: a crash in Java, garbage in C++.",
    ask: { q: "The fix is <code>lo + (hi - lo) / 2</code>. What is the biggest number it ever builds?", opts: ["220", "120", "110"], a: 2,
           why: "hi − lo = 20, half is 10, and 100 + 10 = 110. Nothing along the way passes 127." },
    hi: { out: "100 + 120 = 1101 1100 = -36",
          cap: "Yeh raha. 220 binary mein 1101 1100 hai, aur sign bit ke saath yeh <b>−36</b> padha jaata hai. Phir <code>mid = -36 / 2 = -18</code>. Search <code>a[-18]</code> padhta hai: Java mein crash, C++ mein kachra.",
          ask: { q: "Fix hai <code>lo + (hi - lo) / 2</code>. Yeh sabse bada kaunsa number banata hai?", opts: ["220", "120", "110"],
                 why: "hi − lo = 20, aadha 10, aur 100 + 10 = 110. Raste mein kuch bhi 127 ke paar nahi jaata." } } },

  { arr: ["0","1","1","0","1","1","1","0"], on: [1,2,4,5,6], out: "lo + (hi - lo) / 2 = 100 + 10 = 110",
    cap: "<b>110, the right middle.</b> The gap <code>hi - lo</code> is never bigger than <var>hi</var>, so it always fits. Adding half of it to <var>lo</var> lands between the two bounds, so that fits too. The big sum is simply never built.",
    hi: { out: "lo + (hi - lo) / 2 = 100 + 10 = 110",
          cap: "<b>110, sahi beech.</b> Gap <code>hi - lo</code> kabhi <var>hi</var> se bada nahi, to hamesha fit hota hai. Uska aadha <var>lo</var> mein jodo to dono bounds ke beech girta hai, to woh bhi fit hota hai. Bada jodh kabhi banta hi nahi." } },

  { arr: ["0","1","1","0","1","1","1","0"], on: [1,2,4,5,6], out: "32-bit: 2,000,000,000 + 2,100,000,000 -> -194,967,296",
    cap: "Scale back up to 32 bits and it is the same story. The sum 4,100,000,000 loses 2³², leaving −194,967,296, and half of that is the −97,483,648 from the top. Python never wraps, so the bug only appears when the code is ported.",
    hi: { out: "32-bit: 2,000,000,000 + 2,100,000,000 -> -194,967,296",
          cap: "32 bits par wapas jao, kahani wahi. Jodh 4,100,000,000 mein se 2³² girta hai, bachta hai −194,967,296, aur uska aadha upar wala −97,483,648. Python kabhi wrap nahi karta, to bug tabhi dikhta hai jab code port ho." } },
]},

/* The same midpoint line once the bounds go negative: lo = -7, hi = 0.
   The number line shows where each language's answer lands. */
"division-rounding": { kind: "cells", arr: ["-4","-3","-2","-1","0","1","2","3"], idx: false, frames: [
  { scene: `<span class="kicker">Why this example</span><p>Same line, <code>mid = (lo + hi) / 2</code>, but now the search range is negative: <var>lo</var> = −7, <var>hi</var> = 0. The sum is −7, and −7 / 2 is <b>−3.5</b>, which is not a whole number.</p><p>Every language has to round it, and they do not agree. Goal: see which way each one goes, and what that does to the remainder <code>%</code>.</p>`,
    cap: "The boxes below are a number line from −4 to 3. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Wahi line, <code>mid = (lo + hi) / 2</code>, par ab search range negative hai: <var>lo</var> = −7, <var>hi</var> = 0. Jodh −7 hai, aur −7 / 2 = <b>−3.5</b>, jo whole number nahi hai.</p><p>Har language ko ise round karna padta hai, aur woh agree nahi karti. Goal: dekhna ki kaun kis taraf jaata hai, aur remainder <code>%</code> ka kya hota hai.</p>`,
          cap: "Neeche ke boxes −4 se 3 tak number line hain. Next dabao." } },

  { on: [0, 1], out: "-7 / 2 = -3.5, between -4 and -3",
    cap: "−3.5 sits exactly between −4 and −3. Integer division has to pick one of the two neighbours.",
    ask: { q: "Java and C++ <b>cut the fraction off</b>, moving towards zero. Which box?", opts: ["−3", "−4"], a: 0,
           why: "Zero is to the right, and −3 is the neighbour on that side." },
    hi: { out: "-7 / 2 = -3.5, -4 aur -3 ke beech",
          cap: "−3.5 theek −4 aur −3 ke beech hai. Integer division ko in do padosiyon mein se ek chunna padta hai.",
          ask: { q: "Java aur C++ <b>fraction kaat dete hain</b>, zero ki taraf. Kaunsa box?", opts: ["−3", "−4"],
                 why: "Zero right mein hai, aur us taraf ka padosi −3 hai." } } },

  { hot: [1], ptr: { "truncate": 1 }, out: "C, C++, Java: -7 / 2 = -3",
    cap: "Truncating gives <b>−3</b>. On positive numbers, cutting towards zero and rounding down are the same thing, so this looks like ordinary division until a value goes negative.",
    ask: { q: "Python's <code>//</code> always <b>rounds down</b>, towards minus infinity. Which box?", opts: ["−3", "−4"], a: 1,
           why: "Down means left on this line, and −4 is the neighbour on the left." },
    hi: { out: "C, C++, Java: -7 / 2 = -3",
          cap: "Truncate karne se <b>−3</b>. Positive numbers par zero ki taraf kaatna aur neeche round karna ek hi baat hai, to yeh normal division jaisa lagta hai jab tak value negative na ho.",
          ask: { q: "Python ka <code>//</code> hamesha <b>neeche round</b> karta hai, minus infinity ki taraf. Kaunsa box?", opts: ["−3", "−4"],
                 why: "Is line par neeche matlab left, aur left wala padosi −4 hai." } } },

  { hot: [0], ptr: { "floor": 0 }, out: "Python: -7 // 2 = -4",
    cap: "Flooring gives <b>−4</b>. Same expression, same inputs, different <code>mid</code>. A search that ported from Python to Java now probes a different element.",
    ask: { q: "Quotient and remainder must satisfy <code>q × 2 + r = −7</code>. In Java <var>q</var> = −3. What is the remainder?", opts: ["1", "−1"], a: 1,
           why: "−3 × 2 = −6, and −6 + (−1) = −7." },
    hi: { out: "Python: -7 // 2 = -4",
          cap: "Floor karne se <b>−4</b>. Wahi expression, wahi inputs, alag <code>mid</code>. Python se Java mein port hui search ab alag element check karti hai.",
          ask: { q: "Quotient aur remainder ko <code>q × 2 + r = −7</code> satisfy karna hai. Java mein <var>q</var> = −3. Remainder kya hai?", opts: ["1", "−1"],
                 why: "−3 × 2 = −6, aur −6 + (−1) = −7." } } },

  { hot: [3, 5], out: "-7 % 2  ->  Java -1, Python 1",
    cap: "So the remainder splits too. Java: <b>−1</b>, the sign of −7. Python: <var>q</var> = −4, so −8 + <b>1</b> = −7, the sign of 2. Use −1 as an array index and Java crashes.",
    hi: { out: "-7 % 2  ->  Java -1, Python 1",
          cap: "To remainder bhi bant jaata hai. Java: <b>−1</b>, −7 ka sign. Python: <var>q</var> = −4, to −8 + <b>1</b> = −7, 2 ka sign. −1 ko array index banao to Java crash." } },

  { on: [5], hot: [0], out: "both safe forms agree: 1 and -4",
    cap: "Two safe forms. <code>((x % n) + n) % n</code> turns −1 into (−1 + 2) % 2 = <b>1</b> in every language. And <code>lo + (hi - lo) / 2</code> is −7 + 7 / 2 = <b>−4</b> in every language, because 7 / 2 is positive.",
    hi: { out: "dono safe forms same: 1 aur -4",
          cap: "Do safe forms. <code>((x % n) + n) % n</code> −1 ko har language mein (−1 + 2) % 2 = <b>1</b> bana deta hai. Aur <code>lo + (hi - lo) / 2</code> har language mein −7 + 7 / 2 = <b>−4</b> hai, kyunki 7 / 2 positive hai." } },
]},

/* ---- the half-open range, and why it removes off-by-one errors ---- */
/* a to f at positions 0 to 5, plus the slot one past the end, drawn dim, so
   that hi always has somewhere to point. The range [2, 5) = c, d, e is the
   one the page keeps coming back to. */
"half-open": { kind: "cells", arr: ["a","b","c","d","e","f","·"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>Six items shown in pages of 3, and split in half the way binary search and merge sort do. Every range is a chance to show an item twice or skip one.</p><table><tr><td>items</td><td>a b c d e f</td></tr><tr><td>positions</td><td>0 1 2 3 4 5</td></tr><tr><td>pages wanted</td><td>a b c, then d e f</td></tr></table><p>Goal: one rule for writing ranges, <code>[lo, hi)</code>, under which every size, split and empty range needs no +1 or −1.</p>`,
    cap: "The dim box at the end is position 6: one past the last item. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Chhe items 3-3 ke pages mein, aur binary search aur merge sort ki tarah aadhe mein toote hue. Har range ek item do baar dikhane ya chhodne ka mauka hai.</p><table><tr><td>items</td><td>a b c d e f</td></tr><tr><td>positions</td><td>0 1 2 3 4 5</td></tr><tr><td>chahiye pages</td><td>a b c, phir d e f</td></tr></table><p>Goal: ranges likhne ka ek niyam, <code>[lo, hi)</code>, jismein har size, split aur khaali range ko koi +1 ya −1 nahi chahiye.</p>`,
          cap: "End wala dheema box position 6 hai: aakhri item se ek aage. Next dabao." } },

  { band: [0, 5], dim: [6], ptr: { lo: 0, hi: 6 }, out: "[0, 6): all six, size 6 - 0 = 6",
    cap: "<b>[lo, hi)</b>: <var>lo</var> is included, <var>hi</var> is not. So [0, 6) is all six items, and <var>hi</var> points at the empty slot past the end. The size is simply <var>hi</var> − <var>lo</var>.",
    ask: { q: "Which items are in <b>[2, 5)</b>?", opts: ["c, d, e", "c, d, e, f"], a: 0,
           why: "Position 2 is in, position 5 is out: that leaves 2, 3 and 4." },
    hi: { out: "[0, 6): saare chhe, size 6 - 0 = 6",
          cap: "<b>[lo, hi)</b>: <var>lo</var> andar, <var>hi</var> bahar. To [0, 6) saare chhe items hain, aur <var>hi</var> end ke paar khaali slot ko point karta hai. Size bas <var>hi</var> − <var>lo</var> hai.",
          ask: { q: "<b>[2, 5)</b> mein kaunse items hain?", opts: ["c, d, e", "c, d, e, f"],
                 why: "Position 2 andar, position 5 bahar: bachte hain 2, 3 aur 4." } } },

  { band: [2, 4], dim: [0, 1, 5, 6], ptr: { lo: 2, hi: 5 }, out: "[2, 5) = c d e, size 5 - 2 = 3",
    cap: "Three items, and 5 − 2 says three. Written with both ends included, the same range is [2, 4], and its size needs 4 − 2 + 1. That missing +1 is most off-by-one bugs.",
    ask: { q: "What is <b>[3, 3)</b>?", opts: ["just d", "empty"], a: 1,
           why: "3 is in and 3 is out, so nothing is left. Size 3 − 3 = 0." },
    hi: { out: "[2, 5) = c d e, size 5 - 2 = 3",
          cap: "Teen items, aur 5 − 2 bhi teen kehta hai. Dono sire andar rakh kar yahi range [2, 4] hai, aur uske size ko 4 − 2 + 1 chahiye. Wahi gum +1 zyadatar off-by-one bugs hai.",
          ask: { q: "<b>[3, 3)</b> kya hai?", opts: ["sirf d", "khaali"],
                 why: "3 andar aur 3 bahar, to kuch nahi bachta. Size 3 − 3 = 0." } } },

  { band: [3, 2], dim: [0, 1, 2, 3, 4, 5, 6], ptr: { lo: 3, hi: 3 }, out: "[3, 3): empty, size 0",
    cap: "An empty range needs no special case: <var>lo</var> == <var>hi</var>. With both ends included, “empty” has to be written as [3, 2], a range that runs backwards.",
    ask: { q: "Split [0, 6) at <var>mid</var> = 3. Which two ranges do you get?", opts: ["[0, 3) and [3, 6)", "[0, 3) and [4, 6)"], a: 0,
           why: "The first half stops just before 3, and the second starts at 3. They meet exactly." },
    hi: { out: "[3, 3): khaali, size 0",
          cap: "Khaali range ko special case nahi chahiye: <var>lo</var> == <var>hi</var>. Dono sire andar rakh kar “khaali” ko [3, 2] likhna padta hai, ulti chalti range.",
          ask: { q: "[0, 6) ko <var>mid</var> = 3 par todo. Kaunsi do ranges milti hain?", opts: ["[0, 3) aur [3, 6)", "[0, 3) aur [4, 6)"],
                 why: "Pehla aadha 3 se theek pehle rukta hai, aur doosra 3 se shuru. Dono theek milte hain." } } },

  { band: [0, 2], hot: [3, 4, 5], dim: [6], ptr: { lo: 0, mid: 3, hi: 6 }, out: "[0, 3) = a b c and [3, 6) = d e f",
    cap: "The two pages, a b c and d e f. Nothing is shared and nothing is skipped, with no adjustment on either side. Binary search and merge sort split this way for exactly this reason.",
    hi: { out: "[0, 3) = a b c aur [3, 6) = d e f",
          cap: "Do pages, a b c aur d e f. Kuch shared nahi, kuch chhoota nahi, kisi taraf koi adjustment nahi. Binary search aur merge sort isi wajah se aise todte hain." } },

  { band: [3, 5], dim: [0, 1, 2, 6], ptr: { lo: 3, hi: 6 }, out: "invariant: [0, lo) shown, [lo, n) not yet",
    cap: "The paging loop, with its <b>invariant</b>: positions [0, <var>lo</var>) are shown and [<var>lo</var>, <var>n</var>) are not. Each pass shows [<var>lo</var>, <var>lo</var> + 3) and adds 3 to <var>lo</var>, which keeps it true. <var>n</var> − <var>lo</var> shrinks every pass, so the loop must end.",
    hi: { out: "invariant: [0, lo) dikh chuka, [lo, n) abhi nahi",
          cap: "Paging loop, apne <b>invariant</b> ke saath: positions [0, <var>lo</var>) dikh chuki hain aur [<var>lo</var>, <var>n</var>) nahi. Har pass [<var>lo</var>, <var>lo</var> + 3) dikhata hai aur <var>lo</var> mein 3 jodta hai, jo ise sach rakhta hai. <var>n</var> − <var>lo</var> har pass ghat-ta hai, to loop ko khatam hona hi hai." } },
]},

});

/* ---- grids, bits, and the ordering contract ---- */
Object.assign(VIZ, {

/* The 3 x 3 grid of 1 to 9 from the blur filter. The centre cell has all
   four neighbours and the corner has two, which is exactly where the bugs
   live. The last frame rotates the same grid. */
"grid-basics": {
  kind: "grid",
  arr: [["1","2","3"],["4","5","6"],["7","8","9"]],
  frames: [
    { scene: `<span class="kicker">Why this example</span><p>A blur filter replaces each cell with the average of itself and its four neighbours: up, down, left, right. The test image:</p><table><tr><td>1</td><td>2</td><td>3</td></tr><tr><td>4</td><td>5</td><td>6</td></tr><tr><td>7</td><td>8</td><td>9</td></tr></table><p>The centre cell, 5, has all four neighbours. The corner cell, 1, has only two. Goal: find each cell's neighbours with one loop, and never read a cell that is not there.</p>`,
      cap: "Row numbers run down the left, column numbers across the top. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Blur filter har cell ko uske aur uske chaar padosiyon ke average se badalta hai: upar, neeche, left, right. Test image:</p><table><tr><td>1</td><td>2</td><td>3</td></tr><tr><td>4</td><td>5</td><td>6</td></tr><tr><td>7</td><td>8</td><td>9</td></tr></table><p>Beech wale cell, 5, ke chaaron padosi hain. Corner cell, 1, ke sirf do. Goal: ek loop se har cell ke padosi dhoondhna, aur kabhi aisa cell na padhna jo hai hi nahi.</p>`,
            cap: "Row numbers left mein neeche ki taraf, column numbers upar. Next dabao." } },

    { on: [[1,1]], out: "grid[1][1] = 5: row 1, then column 1",
      cap: "<code>grid[r][c]</code> is <b>row first</b>: <code>grid[1]</code> is the whole row 4, 5, 6, and <code>[1]</code> inside it is 5. On a square grid, getting the order backwards gives a wrong cell rather than an error.",
      ask: { q: "What is <code>grid[1][2]</code>?", opts: ["6", "8"], a: 0,
             why: "Row 1 is 4, 5, 6, and column 2 of it is 6. The 8 is grid[2][1]." },
      hi: { out: "grid[1][1] = 5: row 1, phir column 1",
            cap: "<code>grid[r][c]</code> mein <b>row pehle</b>: <code>grid[1]</code> poori row 4, 5, 6 hai, aur uske andar <code>[1]</code> 5 hai. Square grid par order ulta karo to error nahi, galat cell milta hai.",
            ask: { q: "<code>grid[1][2]</code> kya hai?", opts: ["6", "8"],
                   why: "Row 1 hai 4, 5, 6, aur uska column 2 hai 6. 8 grid[2][1] hai." } } },

    { on: [[1,2]], dim: [[2,1]], out: "grid[1][2] = 6; the 8 is grid[2][1]",
      cap: "Swap the two indexes and you land on 8 instead. Both are real cells, so nothing complains. That is why this bug survives every square test.",
      ask: { q: "The centre cell 5 is at (1, 1). Which values are its four neighbours?", opts: ["2, 8, 4, 6", "1, 3, 7, 9"], a: 0,
             why: "Up, down, left and right. 1, 3, 7 and 9 are the diagonals." },
      hi: { out: "grid[1][2] = 6; 8 hai grid[2][1]",
            cap: "Dono indexes ulta karo to 8 par pahunchte ho. Dono asli cells hain, to koi shikayat nahi karta. Isiliye yeh bug har square test se bach jaata hai.",
            ask: { q: "Beech wala cell 5 (1, 1) par hai. Uske chaar padosi kaunsi values hain?", opts: ["2, 8, 4, 6", "1, 3, 7, 9"],
                   why: "Upar, neeche, left aur right. 1, 3, 7 aur 9 diagonals hain." } } },

    { on: [[1,1]], hot: [[0,1],[2,1],[1,0],[1,2]], dirs: [[1,1,-1,0],[1,1,1,0],[1,1,0,-1],[1,1,0,1]],
      out: "DIRS = [(-1,0), (1,0), (0,-1), (0,1)]",
      cap: "The four neighbours are four <b>(row change, column change)</b> pairs. Keep them in one list and loop: (1, 1) plus each pair gives 2, 8, 4 and 6. One loop, one range check, no copy-pasted branches.",
      ask: { q: "Now the corner cell 1, at (0, 0). How many of its four neighbours exist?", opts: ["4", "2"], a: 1,
             why: "Up is row −1 and left is column −1. Only down (4) and right (2) are on the board." },
      hi: { out: "DIRS = [(-1,0), (1,0), (0,-1), (0,1)]",
            cap: "Chaar padosi chaar <b>(row change, column change)</b> pairs hain. Unhe ek list mein rakho aur loop chalao: (1, 1) mein har pair jodo to 2, 8, 4 aur 6. Ek loop, ek range check, koi copy-paste branch nahi.",
            ask: { q: "Ab corner cell 1, (0, 0) par. Uske chaar mein se kitne padosi hain?", opts: ["4", "2"],
                   why: "Upar row −1 hai aur left column −1. Sirf neeche (4) aur right (2) board par hain." } } },

    { on: [[0,0]], hot: [[1,0],[0,1]], dirs: [[0,0,1,0],[0,0,0,1]],
      out: "0 <= nr < 3 and 0 <= nc < 3 keeps only 4 and 2",
      cap: "The range check <code>0 &lt;= nr &lt; rows and 0 &lt;= nc &lt; cols</code> throws out up and left <b>before</b> indexing. The blur for cell 1 is (1 + 4 + 2) / 3 ≈ 2.33.",
      ask: { q: "Forget the check. In Python, what does <code>grid[-1][0]</code>, the missing “up” neighbour, give you?", opts: ["an IndexError", "7, from the bottom row"], a: 1,
             why: "−1 counts from the end, so row −1 is the last row, and its column 0 holds 7." },
      hi: { out: "0 <= nr < 3 and 0 <= nc < 3 sirf 4 aur 2 rakhta hai",
            cap: "Range check <code>0 &lt;= nr &lt; rows and 0 &lt;= nc &lt; cols</code> index karne se <b>pehle</b> upar aur left ko hata deta hai. Cell 1 ka blur (1 + 4 + 2) / 3 ≈ 2.33.",
            ask: { q: "Check bhool jao. Python mein <code>grid[-1][0]</code>, jo “upar” wala padosi hai hi nahi, kya dega?", opts: ["IndexError", "7, neeche wali row se"],
                   why: "−1 end se ginta hai, to row −1 aakhri row hai, aur uske column 0 mein 7 hai." } } },

    { on: [[0,0]], hot: [[1,0],[0,1]], bad: [[2,0],[0,2]],
      out: "no check: blur = (1 + 7 + 4 + 3 + 2) / 5 = 3.4",
      cap: "Python wraps: up gives 7 and left gives 3, both from the far side. The blur becomes 3.4 instead of 2.33, <b>with no error</b>. Java would crash here, which is kinder.",
      hi: { out: "check nahi: blur = (1 + 7 + 4 + 3 + 2) / 5 = 3.4",
            cap: "Python wrap karta hai: upar 7 deta hai aur left 3, dono doosri taraf se. Blur 2.33 ki jagah 3.4 ban jaata hai, <b>bina kisi error ke</b>. Java yahan crash karta, jo zyada meharbaan hai." } },

    { arr: [["7","4","1"],["8","5","2"],["9","6","3"]], on: [[0,0],[0,1],[0,2]],
      out: "rotate 90 = transpose, then reverse each row",
      cap: "One more classic on the same grid. Rotating 90 degrees clockwise looks like it needs a spiral. It needs two boring steps: <b>transpose</b> (swap <code>grid[r][c]</code> with <code>grid[c][r]</code> where <code>c &gt; r</code>), then <b>reverse each row</b>. O(1) extra space.",
      hi: { out: "90 rotate = transpose, phir har row reverse",
            cap: "Isi grid par ek aur classic. 90 degree clockwise ghumaana spiral jaisa lagta hai. Chahiye bas do boring steps: <b>transpose</b> (jahan <code>c &gt; r</code> wahan <code>grid[r][c]</code> ko <code>grid[c][r]</code> se swap), phir <b>har row reverse</b>. O(1) extra space." } },
  ]
},

/* Single Number on [4, 1, 2, 1, 2]. Three bits are enough to hold every
   value, so the running XOR is drawn as three switches that flip. */
/* Single Number on [4, 1, 2, 1, 2]. Each value is one bit, so the running
   XOR is drawn as an 8-bit integer whose last three switches flip. */
"bits": { kind: "cells", arr: ["0","0","0","0","0","0","0","0"], idx: false, frames: [
  { scene: `<span class="kicker">Why this example</span><p>Every value in <code>[4, 1, 2, 1, 2]</code> appears twice except one. Find it using <b>one integer</b> of extra memory, however long the array is.</p><p>Each value is a single bit, so the whole walk fits in three switches:</p><table><tr><td>4</td><td>100</td></tr><tr><td>2</td><td>010</td></tr><tr><td>1</td><td>001</td></tr></table><p>Goal: XOR every value into one running number <var>x</var>, and watch the pairs switch themselves off.</p>`,
    cap: "The boxes below are <var>x</var>, written as 8 bits. Only the last three matter here: they are worth 4, 2 and 1. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p><code>[4, 1, 2, 1, 2]</code> mein har value do baar hai, sirf ek nahi. Use <b>ek integer</b> extra memory se dhoondho, array kitna bhi lamba ho.</p><p>Har value ek hi bit hai, to poori walk teen switches mein aa jaati hai:</p><table><tr><td>4</td><td>100</td></tr><tr><td>2</td><td>010</td></tr><tr><td>1</td><td>001</td></tr></table><p>Goal: har value ko ek running number <var>x</var> mein XOR karo, aur dekho jodiyan khud ko kaise off karti hain.</p>`,
          cap: "Neeche ke boxes <var>x</var> hain, 8 bits mein. Yahan sirf aakhri teen kaam ke hain: unki value 4, 2 aur 1 hai. Next dabao." } },

  { arr: ["0","0","0","0","0","0","0","0"], dim: [0,1,2,3,4,5,6,7], out: "x = 000 = 0",
    cap: "Start with <var>x</var> = 0, all switches off. XOR compares two bits: <b>1 if they differ, 0 if they match</b>. So <code>x ^ v</code> flips exactly the switches where <var>v</var> has a 1, and leaves the rest alone.",
    ask: { q: "<code>x ^= 4</code>, and 4 is <code>100</code>. What is <var>x</var> now?", opts: ["100", "000", "011"], a: 0,
           why: "4 has a 1 only in the 4s switch, so only that one flips." },
    hi: { out: "x = 000 = 0",
          cap: "<var>x</var> = 0 se shuru, saare switches off. XOR do bits compare karta hai: <b>alag hon to 1, same hon to 0</b>. To <code>x ^ v</code> theek wahi switches palat-ta hai jahan <var>v</var> mein 1 hai, baaki ko nahi chhoota.",
          ask: { q: "<code>x ^= 4</code>, aur 4 hai <code>100</code>. Ab <var>x</var> kya hai?", opts: ["100", "000", "011"],
                 why: "4 mein 1 sirf 4 wale switch mein hai, to sirf woh palat-ta hai." } } },

  { arr: ["0","0","0","0","0","1","0","0"], dim: [0,1,2,3,4], hot: [5], out: "x ^= 4  ->  x = 100 = 4",
    cap: "The 4s switch turned on. Nothing else moved, because 4 had nothing else to say.",
    ask: { q: "<code>x ^= 1</code>, and 1 is <code>001</code>. What is <var>x</var>?", opts: ["101", "001", "100"], a: 0,
           why: "Only the 1s switch flips. The 4 stays on." },
    hi: { out: "x ^= 4  ->  x = 100 = 4",
          cap: "4 wala switch on ho gaya. Aur kuch nahi hila, kyunki 4 ke paas aur kuch kehne ko nahi tha.",
          ask: { q: "<code>x ^= 1</code>, aur 1 hai <code>001</code>. <var>x</var> kya hai?", opts: ["101", "001", "100"],
                 why: "Sirf 1 wala switch palat-ta hai. 4 on rehta hai." } } },

  { arr: ["0","0","0","0","0","1","0","1"], dim: [0,1,2,3,4], on: [5], hot: [7], out: "x ^= 1  ->  x = 101 = 5",
    cap: "Now two switches are on: <var>x</var> = 5. Then <code>x ^= 2</code> flips the 2s switch the same way.",
    hi: { out: "x ^= 1  ->  x = 101 = 5",
          cap: "Ab do switches on hain: <var>x</var> = 5. Phir <code>x ^= 2</code> 2 wale switch ko isi tarah palat-ta hai." } },

  { arr: ["0","0","0","0","0","1","1","1"], dim: [0,1,2,3,4], on: [5,7], hot: [6], out: "x ^= 2  ->  x = 111 = 7",
    cap: "All three are on: <var>x</var> = 7. Every value has now been seen once. The second 1 and the second 2 are still to come.",
    ask: { q: "<code>x ^= 1</code> a second time. What happens to the 1s switch?", opts: ["it turns off", "it stays on"], a: 0,
           why: "It flips again, back to where it started before the first 1." },
    hi: { out: "x ^= 2  ->  x = 111 = 7",
          cap: "Teeno on: <var>x</var> = 7. Har value ek baar dikh chuki. Doosra 1 aur doosra 2 abhi aane hain.",
          ask: { q: "<code>x ^= 1</code> doosri baar. 1 wale switch ka kya hoga?", opts: ["off ho jaayega", "on rahega"],
                 why: "Woh phir palat-ta hai, pehle 1 se pehle jaisa tha waisa." } } },

  { arr: ["0","0","0","0","0","1","1","0"], dim: [0,1,2,3,4], on: [5,6], bad: [7], out: "x ^= 1  ->  x = 110 = 6, the 1s cancelled",
    cap: "<b>The pair of 1s cancelled.</b> The first one switched the 1s bit on, the second switched it off. That is <code>a ^ a = 0</code>, seen one switch at a time.",
    ask: { q: "Last, <code>x ^= 2</code>. What is left in <var>x</var>?", opts: ["100 = 4", "110 = 6", "000 = 0"], a: 0,
           why: "The 2s switch flips off, the same way the 1s did." },
    hi: { out: "x ^= 1  ->  x = 110 = 6, dono 1 kat gaye",
          cap: "<b>1 ki jodi kat gayi.</b> Pehle ne 1 wala bit on kiya, doosre ne off. Yahi <code>a ^ a = 0</code> hai, ek switch par dekha hua.",
          ask: { q: "Aakhri, <code>x ^= 2</code>. <var>x</var> mein kya bachega?", opts: ["100 = 4", "110 = 6", "000 = 0"],
                 why: "2 wala switch off hota hai, bilkul 1 ki tarah." } } },

  { arr: ["0","0","0","0","0","1","0","0"], dim: [0,1,2,3,4], hot: [5], bad: [6], out: "x ^= 2  ->  x = 100 = 4, the answer",
    cap: "<b><var>x</var> = 4, the unpaired value.</b> Every paired value flipped its switch twice, which is the same as never flipping it. Only the 4 was flipped once.",
    hi: { out: "x ^= 2  ->  x = 100 = 4, yahi answer",
          cap: "<b><var>x</var> = 4, akeli value.</b> Har jodi wali value ne apna switch do baar palta, jo kabhi na palatne jaisa hai. Sirf 4 ek baar palta." } },

  { arr: ["0","0","0","0","0","1","0","0"], dim: [0,1,2,3,4], on: [5], out: "5 XORs, 1 integer: O(n) time, O(1) space",
    cap: "Order never mattered: 4 ^ (1 ^ 1) ^ (2 ^ 2) is the same walk. For 10⁷ numbers it is 10⁷ XORs and one integer. No map, no sort, and nothing to undo afterwards.",
    hi: { out: "5 XOR, 1 integer: O(n) time, O(1) space",
          cap: "Order kabhi maayne nahi rakhta tha: 4 ^ (1 ^ 1) ^ (2 ^ 2) wahi walk hai. 10⁷ numbers ke liye 10⁷ XOR aur ek integer. Na map, na sort, aur baad mein kuch undo nahi karna." } },
]},

/* The records B2, A1, B1, A2: a letter and a number each. The tags make
   the old order visible, so you can see exactly what a stable sort keeps. */
"ordering": { kind: "cells", arr: ["B2","A1","B1","A2"], idx: false, frames: [
  { scene: `<span class="kicker">Why this example</span><p>Four records, each a letter and a number. The goal is letter order, and number order within a letter:</p><table><tr><td>input</td><td>B2, A1, B1, A2</td></tr><tr><td>wanted</td><td>A1, A2, B1, B2</td></tr></table><p>The numbers also act as tags: they show where each record started. Goal: see what a <b>stable</b> sort keeps, and why sorting twice only works when it is stable.</p>`,
    cap: "Each box is one record. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Chaar records, har ek mein ek letter aur ek number. Chahiye letter ka order, aur ek letter ke andar number ka order:</p><table><tr><td>input</td><td>B2, A1, B1, A2</td></tr><tr><td>chahiye</td><td>A1, A2, B1, B2</td></tr></table><p>Numbers tags ka kaam bhi karte hain: dikhate hain ki har record kahan se shuru hua. Goal: dekhna ki <b>stable</b> sort kya bachata hai, aur do baar sort karna sirf stable hone par kyun chalta hai.</p>`,
          cap: "Har box ek record hai. Next dabao." } },

  { on: [], out: "the input",
    cap: "First, sort by <b>letter only</b>. To this sort, B2 and B1 are a tie: same letter, and it never looks at the number.",
    ask: { q: "A <b>stable</b> sort keeps tied items in their input order. After sorting by letter, how do the two Bs come out?", opts: ["B2, B1: as they were", "B1, B2: by number"], a: 0,
           why: "B2 was before B1 in the input, and a stable sort never swaps a tie." },
    hi: { out: "input",
          cap: "Pehle <b>sirf letter</b> se sort. Is sort ke liye B2 aur B1 tie hain: same letter, aur yeh number dekhta hi nahi.",
          ask: { q: "<b>Stable</b> sort tie wale items ko input order mein rakhta hai. Letter se sort ke baad dono B kaise aayenge?", opts: ["B2, B1: jaise the", "B1, B2: number se"],
                 why: "Input mein B2 B1 se pehle tha, aur stable sort tie ko kabhi swap nahi karta." } } },

  { arr: ["A1","A2","B2","B1"], on: [0,1], hot: [2,3], out: "stable, by letter",
    cap: "Letters are right, and each tie kept its input order: A1 before A2, B2 before B1. Not wrong: it was never told about numbers. So how do you get both keys right with sorts like this one?",
    ask: { q: "You will sort twice, both times stably. Which key goes <b>first</b>?", opts: ["the number, then the letter", "the letter, then the number"], a: 0,
           why: "The last sort decides the main order. Earlier sorts only survive inside its ties." },
    hi: { out: "stable, letter se",
          cap: "Letters sahi, aur har tie ne apna input order rakha: A1 A2 se pehle, B2 B1 se pehle. Galat nahi: use numbers ke baare mein bataya hi nahi. To aise sorts se dono keys sahi kaise karein?",
          ask: { q: "Do baar sort karoge, dono baar stable. <b>Pehle</b> kaunsi key?", opts: ["number, phir letter", "letter, phir number"],
                 why: "Aakhri sort main order tay karta hai. Pehle wale sorts sirf uske ties ke andar bachte hain." } } },

  { arr: ["A1","B1","B2","A2"], on: [0,1,2,3], out: "step 1: by number",
    cap: "Step 1: stable sort by <b>number</b>, the less important key. The 1s come first, A1 then B1 in input order. Then the 2s, B2 then A2.",
    ask: { q: "Step 2: stable sort by <b>letter</b>. What comes out?", opts: ["A1 A2 B1 B2", "A2 A1 B2 B1"], a: 0,
           why: "Among the As, A1 was before A2 after step 1, and a stable sort keeps that. Same for B1 and B2." },
    hi: { out: "step 1: number se",
          cap: "Step 1: <b>number</b> se stable sort, kam zaroori key. Pehle 1 wale, input order mein A1 phir B1. Phir 2 wale, B2 phir A2.",
          ask: { q: "Step 2: <b>letter</b> se stable sort. Kya niklega?", opts: ["A1 A2 B1 B2", "A2 A1 B2 B1"],
                 why: "As mein step 1 ke baad A1 A2 se pehle tha, aur stable sort yeh rakhta hai. B1 aur B2 ke saath bhi yahi." } } },

  { arr: ["A1","A2","B1","B2"], on: [0,1,2,3], out: "step 2: by letter",
    cap: "<b>Both keys right.</b> The letter sort decided the main order, and stability carried the number order through each tie.",
    ask: { q: "Same two steps, but step 2 uses C++ <code>std::sort</code>, which is <b>not</b> stable. Is A1 A2 B1 B2 guaranteed?", opts: ["yes", "no"], a: 1,
           why: "An unstable sort may reorder ties, so step 1's work inside each letter can be lost." },
    hi: { out: "step 2: letter se",
          cap: "<b>Dono keys sahi.</b> Letter sort ne main order tay kiya, aur stability ne har tie ke andar number ka order bachaya.",
          ask: { q: "Wahi do steps, par step 2 C++ ka <code>std::sort</code> use karta hai, jo stable <b>nahi</b> hai. Kya A1 A2 B1 B2 pakka hai?", opts: ["haan", "nahi"],
                 why: "Unstable sort ties ka order badal sakta hai, to har letter ke andar step 1 ka kaam kho sakta hai." } } },

  { arr: ["A1","A2","B2","B1"], on: [0,1], bad: [2,3], out: "unstable step 2: maybe",
    cap: "It may work on your test data and fail in production. The dependable fix: <b>one comparator</b> that compares the letter, and only on a tie compares the number. Then stability stops mattering.",
    hi: { out: "unstable step 2: shayad",
          cap: "Test data par chal sakta hai aur production mein fail. Pakka fix: <b>ek comparator</b> jo letter compare kare, aur sirf tie par number. Phir stability ka koi matlab nahi rehta." } },
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

/* The primes from 2 to 16: the same fifteen numbers the page uses
   throughout. Small enough that every crossing is visible, and 16 is a
   perfect square, so the stop at p x p > n happens on screen. */
"sieve": { kind: "cells", arr: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"], idx: false, frames: [
  { scene: `<span class="kicker">Why this example</span><p>The real job is counting primes below 5 × 10⁶. Testing each number by division costs about 6.5 × 10⁸ divisions, even with the square-root stop.</p><p>Here is the same job on the numbers 2 to 16, so every step fits on screen:</p><table><tr><td>testing each number</td><td>divide, divide, divide</td></tr><tr><td>the sieve</td><td>cross out, never divide</td></tr><tr><td>the answer</td><td>2, 3, 5, 7, 11, 13</td></tr></table><p>Goal: find all six primes without a single division, and see why the work stops at 4, the square root of 16.</p>`,
    cap: "The boxes below are the numbers 2 to 16. Red means crossed out. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Asli kaam hai 5 × 10⁶ se chhote primes ginna. Har number ko division se test karna lagbhag 6.5 × 10⁸ divisions hai, square-root par rukne ke baad bhi.</p><p>Yahi kaam 2 se 16 tak ke numbers par, taaki har step screen par aa jaaye:</p><table><tr><td>har number test karna</td><td>divide, divide, divide</td></tr><tr><td>sieve</td><td>kaat do, kabhi divide nahi</td></tr><tr><td>answer</td><td>2, 3, 5, 7, 11, 13</td></tr></table><p>Goal: bina ek bhi division ke chhe ke chhe primes dhoondhna, aur dekhna ki kaam 4 par kyun rukta hai, jo 16 ka square root hai.</p>`,
          cap: "Neeche ke boxes 2 se 16 tak ke numbers hain. Red matlab kat gaya. Next dabao." } },

  { on: [0], bad: [2,4,6,8,10,12,14], out: "2 is prime: cross 4, 6, 8, 10, 12, 14, 16",
    cap: "Take the first number nobody has crossed: 2. Nothing smaller divides it, so it is <b>prime</b>. Every other multiple of 2 is not, so cross them all out. Seven numbers gone, and nothing was divided.",
    ask: { q: "The next uncrossed number is 3, so it is prime. Where should crossing its multiples <b>start</b>?", opts: ["at 6", "at 9"], a: 1,
           why: "6 = 2 × 3 was already crossed by 2. The first multiple of 3 with no smaller factor is 3 × 3 = 9." },
    hi: { out: "2 prime hai: 4, 6, 8, 10, 12, 14, 16 kaato",
          cap: "Pehla number lo jise kisi ne nahi kaata: 2. Usse chhota koi use divide nahi karta, to yeh <b>prime</b> hai. 2 ka har doosra multiple prime nahi, to sab kaat do. Saat numbers gaye, aur ek bhi division nahi hua.",
          ask: { q: "Agla bina kata number 3 hai, to woh prime hai. Uske multiples kaatna <b>kahan se</b> shuru ho?", opts: ["6 se", "9 se"],
                 why: "6 = 2 × 3 ko 2 pehle hi kaat chuka. 3 ka pehla multiple jisme chhota factor nahi, woh 3 × 3 = 9 hai." } } },

  { on: [0,1], bad: [2,4,6,7,8,10,12,13,14], out: "3 is prime: cross 9, 12, 15, starting at 3 x 3",
    cap: "Start at <b><var>p</var> × <var>p</var></b>, not at 2<var>p</var>. Every smaller multiple of 3 has a smaller prime factor, which crossed it already. 12 gets crossed a second time, which is harmless.",
    ask: { q: "4 is already crossed. Do you need to cross out the multiples of 4?", opts: ["yes", "no"], a: 1,
           why: "Every multiple of 4 is also a multiple of 2, and those are gone." },
    hi: { out: "3 prime hai: 9, 12, 15 kaato, 3 x 3 se shuru",
          cap: "<b><var>p</var> × <var>p</var></b> se shuru karo, 2<var>p</var> se nahi. 3 ke har chhote multiple mein ek chhota prime factor hai, jo use pehle kaat chuka. 12 doosri baar kat-ta hai, koi nuksaan nahi.",
          ask: { q: "4 pehle se kata hai. Kya 4 ke multiples kaatne padenge?", opts: ["haan", "nahi"],
                 why: "4 ka har multiple 2 ka bhi multiple hai, aur woh ja chuke." } } },

  { on: [0,1,3], bad: [2,4,6,7,8,10,12,13,14], out: "4 is crossed, so skip it. 5 is prime.",
    cap: "Crossed numbers are skipped entirely, so the outer loop only ever stops on primes. The next one is <b>5</b>.",
    ask: { q: "5 × 5 = 25, which is past 16. Is anything left for 5 to cross?", opts: ["yes, 10 and 15", "no, stop here"], a: 1,
           why: "10 and 15 already fell to 2 and 3. Any multiple of 5 below 25 has a smaller factor." },
    hi: { out: "4 kata hai, to chhod do. 5 prime hai.",
          cap: "Kate hue numbers poori tarah chhod diye jaate hain, to outer loop sirf primes par rukta hai. Agla hai <b>5</b>.",
          ask: { q: "5 × 5 = 25, jo 16 ke paar hai. Kya 5 ke kaatne ke liye kuch bacha hai?", opts: ["haan, 10 aur 15", "nahi, yahin ruko"],
                 why: "10 aur 15 pehle hi 2 aur 3 se gir chuke. 25 se neeche 5 ke har multiple mein chhota factor hai." } } },

  { on: [0,1,3,5,9,11], bad: [2,4,6,7,8,10,12,13,14], out: "5 x 5 = 25 > 16, so stop: 2, 3, 5, 7, 11, 13",
    cap: "Once <b><var>p</var> × <var>p</var></b> passes the limit, there is nothing left to cross, so the loop stops at the square root. Everything uncrossed is prime: <b>2, 3, 5, 7, 11, 13</b>. Ten crossings, zero divisions.",
    hi: { out: "5 x 5 = 25 > 16, to ruko: 2, 3, 5, 7, 11, 13",
          cap: "Jaise hi <b><var>p</var> × <var>p</var></b> limit ke paar gaya, kaatne ko kuch nahi bacha, to loop square root par rukta hai. Jo bhi bina kata hai woh prime hai: <b>2, 3, 5, 7, 11, 13</b>. Das crossings, zero divisions." } },

  { on: [0,1,3,5,9,11], out: "O(n log log n): about 1.1 x 10^7 crossings for n = 5 x 10^6",
    cap: "At full size the sieve makes about 1.1 × 10⁷ crossings, against 6.5 × 10⁸ divisions for testing each number. The cost is <b>O(<var>n</var> log log <var>n</var>)</b>: quote it, do not derive it. Space is O(<var>n</var>), and that is what runs out first.",
    hi: { out: "O(n log log n): n = 5 x 10^6 par lagbhag 1.1 x 10^7 crossings",
          cap: "Poore size par sieve lagbhag 1.1 × 10⁷ crossings karta hai, har number test karne ke 6.5 × 10⁸ divisions ke against. Cost <b>O(<var>n</var> log log <var>n</var>)</b> hai: bol do, derive mat karo. Space O(<var>n</var>) hai, aur wahi pehle khatam hota hai." } },
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
