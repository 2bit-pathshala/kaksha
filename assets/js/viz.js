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
     tree, nodes + edges, optional array strip    frame: { on:[ids], hot:[ids], bad:[ids], dim:[ids], edge:[[a,b]], cap }
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
const SVG_NS = "http://www.w3.org/2000/svg";

/* ============================ renderers ============================ */

/* --vw carries a legibility floor to the stylesheet, which uses it as the
   SVG's min-width. A drawing scales with its box, so a 15-cell diagram in a
   300px phone renders its 14px labels at about 5px. 0.72 of natural width
   puts them at 10px, the smallest that is still readable; below that the
   stage scrolls sideways instead of shrinking further. Small drawings still
   fit a phone outright, so only the wide ones ever scroll. */
const svgWrap = (w, h, inner) =>
  // the namespace is not decoration: the player re-parses this markup as XML to
  // step a frame, and without it every element comes back in no namespace at
  // all, which makes it an unknown tag the browser will not render or style
  `<svg xmlns="${SVG_NS}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Diagram for this step, described in the caption" ` +
  `style="--vw:${Math.min(Math.round(w * 0.72), 620)}px">${inner}</svg>`;

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* Every drawn element carries a key that identifies the same thing across
   frames: cell 3 is "box-3" in every frame of the visual, the pointer called
   "lo" is "ptr-lo" wherever it happens to be standing. The player uses these
   to update the drawing in place instead of throwing it away, which is what
   lets a pointer slide to its new cell rather than blink to it. Keys have to
   be unique within one drawing and stable across the frames of one visual. */
const k = name => ` data-k="${name}"`;

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
      s += `<rect class="v-band"${k("band")} x="${x}" y="${Y - 10}" width="${w}" height="${H + 20}" rx="10"/>`;
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
    s += `<rect class="${cls}"${k("box-" + i)} x="${x}" y="${Y}" width="${BW}" height="${H}" rx="9"/>`;
    s += `<text class="${tcls}"${k("txt-" + i)} x="${cx(i)}" y="${Y + H / 2 + 1}" ` +
         `style="font-size:${fit(v, BW).toFixed(1)}px">${esc(v)}</text>`;
    if (spec.idx !== false) s += `<text class="v-idx"${k("idx-" + i)} x="${cx(i)}" y="${Y - 12}">${i}</text>`;
  });

  // pointers below, stacked when two land on the same cell
  const seen = {};
  Object.entries(f.ptr || {}).forEach(([label, i], n) => {
    if (i == null || i < 0 || i >= arr.length) return;
    const row = seen[i] = (seen[i] || 0);
    seen[i]++;
    const yTop = Y + H + 8 + row * 20, x = cx(i);
    // Drawn at the origin and placed with a transform, so the pointer slides to
    // its new cell instead of jumping there. It has to be an inline style and
    // not a transform attribute: the attribute is geometry to the browser, not
    // a CSS property, so a transition on it never runs. Measured, not assumed.
    const at = `style="transform:translate(${x}px,${yTop}px)"`;
    s += `<path class="v-line on"${k("ptr-" + label)} d="M0 9 l-5 7 h10 z" fill="var(--accent)" stroke="none" ${at}/>`;
    s += `<text class="v-lab${n % 2 ? " b" : ""}"${k("ptrlab-" + label)} x="0" y="30" ${at}>${esc(label)}</text>`;
  });

  if (f.out) s += `<text class="v-note"${k("out")} x="${X0}" y="${Y + H + 62}" ` +
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
  let s = `<line class="v-line"${k("axis-y")} x1="${L}" y1="${T}" x2="${L}" y2="${B}"/>` +
          `<line class="v-line"${k("axis-x")} x1="${L}" y1="${B}" x2="${R}" y2="${B}"/>` +
          `<text class="v-note"${k("axlab-x")} x="${R - 60}" y="${B + 24}">input size n →</text>` +
          `<text class="v-note"${k("axlab-y")} x="6" y="${T + 6}">work</text>`;
  (f.show || []).forEach(name => {
    const cv = CURVES[name]; if (!cv) return;
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const x = i / 60;
      const y = Math.min(cv.f(x), 1.02);
      pts.push(`${(L + x * (R - L)).toFixed(1)},${(B - y * (B - T)).toFixed(1)}`);
      if (y >= 1.02) break;
    }
    s += `<polyline class="v-curve"${k("curve-" + name)} points="${pts.join(" ")}" style="stroke:${cv.c}"/>`;
    const last = pts[pts.length - 1].split(",");
    s += `<text${k("curvelab-" + name)} x="${Math.min(+last[0] + 7, R - 4)}" y="${clearOf(+last[1])}" ` +
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
    s += `<line class="v-line${hot ? " on" : ""}"${k("edge-" + a + "-" + b)} x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" ` +
         `x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"` + (faded ? ` opacity=".3"` : "") + `/>`;
    if (spec.arrows) {                          // a pointer has a direction; show it
      const ang = Math.atan2(dy, dx) * 180 / Math.PI;
      s += `<path${k("arrow-" + a + "-" + b)} d="M${x2.toFixed(1)} ${y2.toFixed(1)} l-7 -4 v8 z" fill="var(--accent)" ` +
           `transform="rotate(${ang.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)})"` +
           (faded ? ` opacity=".3"` : "") + `/>`;
    }
    if (spec.weights && spec.weights[a + ">" + b] != null)
      s += `<text class="v-idx"${k("w-" + a + "-" + b)} x="${((x1 + x2) / 2).toFixed(1)}" y="${((y1 + y2) / 2 - 5).toFixed(1)}">` +
           `${esc(spec.weights[a + ">" + b])}</text>`;
  });
  Object.entries(spec.nodes).forEach(([id, n]) => {
    if (n.hidden && !(f.show || []).includes(id)) return;
    // bad and hot outrank on, the same order the cells renderer uses
    const bad = f.bad || [], hot = f.hot || [];
    let cls = "v-box" + (bad.includes(id) ? " bad" : hot.includes(id) ? " hot" : on.includes(id) ? " on" : "") +
              (dim.includes(id) ? " dim" : "");
    // frame.t lets a frame relabel a node. That is how a swap or a return value is shown.
    const label = (f.t && f.t[id] != null) ? f.t[id] : n.t;
    const w = n.w || 52;                       // wide enough for a real label
    s += `<rect class="${cls}"${k("node-" + id)} x="${n.x - w / 2}" y="${n.y - 20}" width="${w}" height="40" rx="10"/>`;
    s += `<text class="v-txt${dim.includes(id) ? " dim" : ""}"${k("nodetxt-" + id)} x="${n.x}" y="${n.y + 1}" ` +
         `style="font-size:${fit(label, w).toFixed(1)}px">${esc(label)}</text>`;
    if (n.sub) s += `<text class="v-idx"${k("sub-" + id)} x="${n.x}" y="${n.y + 33}">${esc(n.sub)}</text>`;
  });
  if (f.out) s += `<text class="v-note"${k("out")} x="12" y="${spec.h - 8}" ` +
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

  let s = `<rect class="v-box on"${k("fnbox")} x="${FX}" y="${MY - 26}" width="${FW}" height="52" rx="11"/>` +
          `<text class="v-txt"${k("fntxt")} x="${FX + FW / 2}" y="${MY}" style="font-size:${fit(spec.fn, FW, 13).toFixed(1)}px">${esc(spec.fn)}</text>` +
          `<text class="v-note"${k("lab-keys")} x="${KX}" y="22">keys</text>` +
          `<text class="v-note"${k("lab-buckets")} x="${BX}" y="22">buckets</text>`;

  if (f.k != null) {
    s += `<rect class="v-box hot"${k("keybox")} x="${KX}" y="${MY - 22}" width="${KW}" height="44" rx="10"/>` +
         `<text class="v-txt"${k("keytxt")} x="${KX + KW / 2}" y="${MY}" style="font-size:${fit(f.k, KW).toFixed(1)}px">${esc(f.k)}</text>` +
         `<line class="v-line on"${k("keyline")} x1="${KX + KW + 6}" y1="${MY}" x2="${FX - 6}" y2="${MY}"/>` +
         `<path${k("keyarrow")} d="M${FX - 6} ${MY} l-7 -5 v10 z" fill="var(--accent)"/>`;
  }

  for (let b = 0; b < nb; b++) {
    const y = 40 + b * 40, hit = f.b === b;
    s += `<rect class="v-box${hit ? " hot" : ""}"${k("bkt-" + b)} x="${BX}" y="${y}" width="${BW}" height="32" rx="8"/>` +
         `<text class="v-txt"${k("bkttxt-" + b)} x="${BX + BW / 2}" y="${y + 16}" style="font-size:11px">${b}</text>`;
    const items = placed[b] || [];
    items.forEach((key, j) => {
      const x = IX + j * (IW + 6);
      s += `<rect class="v-box${hit && j === items.length - 1 ? " hot" : " on"}"${k("item-" + b + "-" + j)} x="${x}" y="${y}" width="${IW}" height="32" rx="8"/>` +
           `<text class="v-txt"${k("itemtxt-" + b + "-" + j)} x="${x + IW / 2}" y="${y + 16}" style="font-size:${fit(key, IW, 12).toFixed(1)}px">${esc(key)}</text>`;
    });
    if (hit) s += `<line class="v-line on"${k("hitline")} x1="${FX + FW}" y1="${MY}" x2="${BX - 6}" y2="${y + 16}"/>` +
                  `<path${k("hitarrow")} d="M${BX - 6} ${y + 16} l-7 -5 v10 z" fill="var(--accent)"/>`;
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
    s += `<rect class="${cls}"${k("box-" + i)} x="${left(i)}" y="${Y}" width="${BW}" height="${H}" rx="8"/>`;
    s += `<text class="v-txt${has(f.dim, i) ? " dim" : ""}"${k("txt-" + i)} x="${cx(i)}" y="${Y + H / 2 + 1}" ` +
         `style="font-size:${fit(v, BW).toFixed(1)}px">${esc(v)}</text>`;
  });

  // one arrow per gap: 1 points right, -1 points left, 0 is a severed link
  const links = f.links || arr.slice(0, -1).map(() => 1);
  links.forEach((dir, i) => {
    const a = left(i) + BW + 6, b = left(i + 1) - 6, mid = Y + H / 2;
    if (dir === 0) {
      s += `<line class="v-line"${k("link-" + i)} x1="${a}" y1="${mid}" x2="${b}" y2="${mid}" ` +
           `stroke-dasharray="3 3" opacity=".45"/>`;
      return;
    }
    const rightwards = dir === 1;
    s += `<line class="v-line on"${k("link-" + i)} x1="${a}" y1="${mid}" x2="${b}" y2="${mid}"/>`;
    // the arrowhead flips end for end when a link reverses, which is the whole
    // lesson of list reversal, so it is keyed by gap and not by direction
    s += rightwards
      ? `<path${k("linkarrow-" + i)} d="M${b} ${mid} l-7 -5 v10 z" fill="var(--accent)"/>`
      : `<path${k("linkarrow-" + i)} d="M${a} ${mid} l7 -5 v10 z" fill="var(--accent)"/>`;
  });

  // the terminating null, when the list ends where you would expect it to
  if (f.nullEnd !== false && arr.length) {
    const a = left(arr.length - 1) + BW + 6;
    s += `<line class="v-line"${k("nullline")} x1="${a}" y1="${Y + H / 2}" x2="${a + 22}" y2="${Y + H / 2}"/>`;
    s += `<text class="v-idx"${k("nulltxt")} x="${a + 30}" y="${Y + H / 2 + 4}">null</text>`;
  }

  const seen = {};
  Object.entries(f.ptr || {}).forEach(([label, i], n) => {
    if (i == null || i < 0 || i >= arr.length) return;
    const row = seen[i] = (seen[i] || 0); seen[i]++;
    const yTop = Y + H + 8 + row * 20, x = cx(i);
    const at = `style="transform:translate(${x}px,${yTop}px)"`;
    s += `<path class="v-line on"${k("ptr-" + label)} d="M0 9 l-5 7 h10 z" fill="var(--accent)" stroke="none" ${at}/>`;
    s += `<text class="v-lab${n % 2 ? " b" : ""}"${k("ptrlab-" + label)} x="0" y="30" ${at}>${esc(label)}</text>`;
  });

  if (f.out) s += `<text class="v-note"${k("out")} x="${X0}" y="${Y + H + 66}" ` +
    `style="font-weight:700;fill:var(--accent);font-size:${fit(f.out, W - X0 * 2, 13, 0).toFixed(1)}px">${esc(f.out)}</text>`;
  return svgWrap(W, Y + H + 84, s);
}

/* grid - a 2-D board. Rows and columns, highlighted cells, and direction arrows
   out of a cell, because "the four neighbours" is a picture, not a sentence. */
function drawGrid(spec, f) {
  const g = f.arr || spec.arr;
  const R = g.length, C = g[0].length;
  const S = 44, GAP = 4, X0 = 30, Y0 = 34;
  // widen for the longest note, the same allowance the cells renderer makes
  const longest = Math.max(0, ...spec.frames.flatMap(fr => [fr.out, fr.hi && fr.hi.out]).filter(Boolean).map(o => String(o).length));
  const W = Math.max(X0 * 2 + C * (S + GAP), Math.ceil(X0 * 2 + longest * 0.62 * 11.5)), H = Y0 + R * (S + GAP) + 56;
  const x = c => X0 + c * (S + GAP), y = r => Y0 + r * (S + GAP);
  const inList = (l, r, c) => Array.isArray(l) && l.some(p => p[0] === r && p[1] === c);
  let s = "";

  for (let c = 0; c < C; c++) s += `<text class="v-idx"${k("col-" + c)} x="${x(c) + S / 2}" y="${Y0 - 8}">${c}</text>`;
  for (let r = 0; r < R; r++) s += `<text class="v-idx"${k("row-" + r)} x="${X0 - 12}" y="${y(r) + S / 2 + 4}">${r}</text>`;

  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    let cls = "v-box";
    if (inList(f.bad, r, c)) cls += " bad";
    else if (inList(f.hot, r, c)) cls += " hot";
    else if (inList(f.on, r, c)) cls += " on";
    if (inList(f.dim, r, c)) cls += " dim";
    s += `<rect class="${cls}"${k("cell-" + r + "-" + c)} x="${x(c)}" y="${y(r)}" width="${S}" height="${S}" rx="7"/>`;
    const v = String(g[r][c]);
    if (v !== "") s += `<text class="v-txt${inList(f.dim, r, c) ? " dim" : ""}"${k("celltxt-" + r + "-" + c)} ` +
      `x="${x(c) + S / 2}" y="${y(r) + S / 2 + 1}" style="font-size:${fit(v, S).toFixed(1)}px">${esc(v)}</text>`;
  }

  // arrows out of a cell: the four (or eight) directions, drawn rather than described
  (f.dirs || []).forEach(([r, c, dr, dc]) => {
    const cxs = x(c) + S / 2, cys = y(r) + S / 2;
    const len = (S + GAP) * 0.78;
    const nx = cxs + dc * len, ny = cys + dr * len;
    const sx = cxs + dc * S * 0.45, sy = cys + dr * S * 0.45;
    const ang = Math.atan2(dr, dc) * 180 / Math.PI;
    const dk = r + "-" + c + "-" + dr + "-" + dc;
    s += `<line class="v-line on"${k("dir-" + dk)} x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" ` +
         `x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}"/>`;
    s += `<path${k("dirarrow-" + dk)} d="M${nx.toFixed(1)} ${ny.toFixed(1)} l-7 -4 v8 z" fill="var(--accent)" ` +
         `transform="rotate(${ang.toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)})"/>`;
  });

  if (f.out) s += `<text class="v-note"${k("out")} x="${X0}" y="${H - 20}" ` +
    `style="font-weight:700;fill:var(--accent);font-size:${fit(f.out, W - X0 * 2, 13, 0).toFixed(1)}px">${esc(f.out)}</text>`;
  return svgWrap(W, H, s);
}

const DRAW = { cells: drawCells, curve: drawCurve, tree: drawTree, hash: drawHash,
               chain: drawChain, grid: drawGrid };

/* ============================ player ============================ */

/* Stepping used to be `stage.innerHTML = draw(frame)`: the whole drawing thrown
   away and built again. Correct, and it taught less than it could. A pointer
   moving from cell 3 to cell 4 blinked from one to the other, so the reader had
   to work out what changed instead of watching it change, and that reading is
   the point of stepping a visual at all.

   So the drawing is now updated in place. Every element carries a data-k that
   names the same thing across frames, and morph() walks the new drawing against
   the old one: things in both are updated attribute by attribute and let CSS
   carry them to their new position or colour, things only in the new drawing
   fade in, things only in the old one fade out. Nothing here decides how long
   any of that takes; the durations live in tokens.css and go to zero for a
   reader who asked for less movement.

   The fallback is the old behaviour: if a drawing has no keys, or the browser
   cannot parse it, the stage is simply replaced. */

function morph(stage, markup) {
  const old = stage.firstElementChild;
  let next;
  try {
    next = new DOMParser().parseFromString(markup, "image/svg+xml").documentElement;
  } catch (e) { next = null; }
  // a scene card is a div and a drawing is an svg: moving between them is a swap
  if (!old || !next || next.nodeName === "parsererror" || !next.querySelector("[data-k]") ||
      old.nodeName.toLowerCase() !== next.nodeName.toLowerCase()) {
    stage.innerHTML = markup;
    return;
  }

  // the viewBox can change between frames (an array that grows); let it animate
  for (const a of ["viewBox", "style"]) {
    const v = next.getAttribute(a);
    if (v != null && old.getAttribute(a) !== v) old.setAttribute(a, v);
  }

  const was = new Map();
  old.querySelectorAll("[data-k]").forEach(el => was.set(el.getAttribute("data-k"), el));

  const seen = new Set();
  const arriving = [];
  let after = null;                       // keeps the new paint order
  next.querySelectorAll("[data-k]").forEach(el => {
    const key = el.getAttribute("data-k");
    seen.add(key);
    const prev = was.get(key);
    if (prev) {
      sync(prev, el);
      prev.classList.remove("v-exit");
      after = place(old, prev, after);
    } else {
      const node = document.importNode(el, true);
      node.classList.add("v-enter");
      after = place(old, node, after);
      arriving.push([node, node.classList.contains("v-curve") ? dashOn(node) : null]);
    }
  });

  /* An element has to be seen in its arriving state before it can be animated
     out of it. Reading a layout value forces that, once for the whole batch,
     which is both cheaper and more dependable than waiting for animation
     frames: a page in a background tab gets no frames, and anything left
     holding .v-enter would be left holding opacity 0 with it. */
  if (arriving.length) {
    void old.getBoundingClientRect();
    arriving.forEach(([node, undash]) => {
      node.classList.remove("v-enter");
      if (undash) undash();
    });
  }

  was.forEach((el, key) => {
    if (seen.has(key)) return;
    if (el.classList.contains("v-exit")) return;
    el.classList.add("v-exit");
    el.removeAttribute("data-k");          // it is leaving; do not match it again
    const done = () => el.remove();
    el.addEventListener("transitionend", done, { once: true });
    setTimeout(done, 600);                 // in case the transition never runs
  });
}

/* A growth curve is introduced by drawing it rather than by having it appear.
   Hide the whole stroke behind a dash as long as its own length, then run the
   offset back to zero and the line grows out of the origin, which is the shape
   of the idea. Returns the function that starts it, or null when the browser
   cannot measure the path (then it just fades in like everything else). */
function dashOn(node) {
  let len;
  try { len = node.getTotalLength(); } catch (e) { return null; }
  if (!len || !isFinite(len)) return null;
  node.style.strokeDasharray = len;
  node.style.strokeDashoffset = len;
  return () => {
    node.style.strokeDashoffset = "0";
    // let go of the dash once it has run, so a later frame styling this curve
    // is not fighting an inline stroke-dasharray that no longer means anything
    setTimeout(() => { node.style.strokeDasharray = ""; node.style.strokeDashoffset = ""; }, 800);
  };
}

/* copy the new element's attributes onto the old one, touching only what
   actually differs so an unchanged element never restarts its transition */
function sync(prev, el) {
  for (const { name, value } of el.attributes) {
    if (prev.getAttribute(name) !== value) prev.setAttribute(name, value);
  }
  for (const { name } of [...prev.attributes]) {
    if (!el.hasAttribute(name)) prev.removeAttribute(name);
  }
  if (!el.children.length && prev.textContent !== el.textContent) prev.textContent = el.textContent;
}

/* put node directly after `after` inside root, without moving it if it is
   already there: reordering a node restarts its transitions */
function place(root, node, after) {
  const want = after ? after.nextSibling : root.firstChild;
  if (node !== want) root.insertBefore(node, want);
  return node;
}

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

  function draw(first) {
    const f = view(spec.frames[i]);
    const markup = f.scene
      ? `<div class="vizscene">${f.scene}</div>`
      : (DRAW[spec.kind] || drawCells)(spec, f);
    if (first) stage.innerHTML = markup; else morph(stage, markup);
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
  function stop() { clearInterval(timer); timer = null; play.textContent = "Play"; play.setAttribute("aria-label", "Play"); }

  /* Autoplay holds each frame long enough to read its caption, and the hold
     starts after the movement rather than during it, so a step never begins
     before the last one has finished arriving. */
  const HOLD = 1400;
  const moveMs = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--t-slow").trim();
    const ms = v.endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000;
    return isFinite(ms) ? ms : 0;
  };

  play.addEventListener("click", () => {
    if (timer) return stop();
    play.textContent = "Pause";
    play.setAttribute("aria-label", "Pause");
    // a question is a place to stop and think, so the player waits there,
    // unless Play was pressed on that very question, which reads as "skip it"
    const from = i;
    timer = setInterval(() => {
      if (i === n - 1) { stop(); i = 0; draw(); }
      else if (spec.frames[i].ask && !answered.has(i) && i !== from) stop();
      else go(1);
    }, HOLD + moveMs());
  });
  host.querySelector('[data-a="prev"]').addEventListener("click", () => { stop(); go(-1); });
  host.querySelector('[data-a="next"]').addEventListener("click", () => { stop(); go(1); });
  range.addEventListener("input", () => { stop(); i = +range.value; draw(); });
  draw(true);
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
  { scene: `<span class="kicker">Why this example</span><p>Six minutes of server load: <code>2, 1, 5, 1, 3, 2</code>. Find the busiest 3 minutes in a row.</p><table><tr><td>windows of 3</td><td>4</td></tr><tr><td>their totals</td><td>8, 7, 9, 6</td></tr><tr><td>shared by neighbours</td><td>2 of every 3 numbers</td></tr></table><p>Goal: get every total after the first with one subtraction and one addition, however wide the window.</p>`,
    cap: "The boxes are the minutes, with positions underneath. The band is the window. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Chhe minute ka server load: <code>2, 1, 5, 1, 3, 2</code>. Lagaataar sabse busy 3 minute dhoondho.</p><table><tr><td>3 ki windows</td><td>4</td></tr><tr><td>unke totals</td><td>8, 7, 9, 6</td></tr><tr><td>padosiyon mein common</td><td>har 3 mein se 2 numbers</td></tr></table><p>Goal: pehle ke baad har total ek ghataav aur ek jod se nikaalna, window kitni bhi chaudi.</p>`,
          cap: "Boxes minute hain, neeche positions. Band window hai. Next dabao." } },

  { band: [0, 2], out: "first window: 2 + 1 + 5 = 8",
    cap: "The first window is added up honestly, once: 8. Scoring every window like this costs <b>O(<var>n</var>·<var>k</var>)</b>.",
    ask: { q: "The window slides one step right, to 1, 5, 1. Which numbers change the total?", opts: ["the 2 leaving and the 1 joining", "all three in the new window"], a: 0,
           why: "The 1 and the 5 are in both windows, so they cancel out. Only the edges matter." },
    hi: { out: "pehli window: 2 + 1 + 5 = 8",
          cap: "Pehli window imaandaari se, ek baar judti hai: 8. Har window aise ginna <b>O(<var>n</var>·<var>k</var>)</b> hai.",
          ask: { q: "Window ek step right khiskti hai, 1, 5, 1 par. Kaunse numbers total badalte hain?", opts: ["jaata 2 aur aata 1", "nayi window ke teeno"],
                 why: "1 aur 5 dono windows mein hain, to kat jaate hain. Sirf kinaare maayne rakhte hain." } } },

  { band: [1, 3], bad: [0], hot: [3], out: "8 - 2 + 1 = 7",
    cap: "<b>Subtract the leaver, add the joiner.</b> Two operations, not three, and still two when the window is 1,000 wide.",
    ask: { q: "Next window, 5, 1, 3: 7 − 1 + 3 = ?", opts: ["9", "8"], a: 0,
           why: "7 − 1 = 6, and 6 + 3 = 9. The same as 5 + 1 + 3." },
    hi: { out: "8 - 2 + 1 = 7",
          cap: "<b>Jaane wala ghatao, aane wala jodo.</b> Teen nahi, do kaam, aur window 1,000 chaudi ho tab bhi do.",
          ask: { q: "Agli window, 5, 1, 3: 7 − 1 + 3 = ?", opts: ["9", "8"],
                 why: "7 − 1 = 6, aur 6 + 3 = 9. 5 + 1 + 3 jitna hi." } } },

  { band: [2, 4], bad: [1], hot: [4], out: "7 - 1 + 3 = 9: best so far",
    cap: "That reuse is the entire pattern. 9 is the best so far.",
    ask: { q: "Last window, 1, 3, 2: 9 − 5 + 2 = ?", opts: ["6", "11"], a: 0,
           why: "The 5 leaves and the 2 joins: 9 − 5 + 2 = 6." },
    hi: { out: "7 - 1 + 3 = 9: ab tak ka best",
          cap: "Yahi dobara use poora pattern hai. 9 ab tak ka best.",
          ask: { q: "Aakhri window, 1, 3, 2: 9 − 5 + 2 = ?", opts: ["6", "11"],
                 why: "5 jaata hai aur 2 aata hai: 9 − 5 + 2 = 6." } } },

  { band: [3, 5], bad: [2], hot: [5], out: "9 - 5 + 2 = 6. Answer: 9",
    cap: "The last window is 6, so the answer is 9, from 5, 1, 3.",
    hi: { out: "9 - 5 + 2 = 6. Answer: 9",
          cap: "Aakhri window 6 hai, to answer 9, 5, 1, 3 se." } },

  { on: [0, 1, 2, 3, 4, 5], out: "each number joins once and leaves once: O(n)",
    cap: "Every number is added once and removed once. <b>O(<var>n</var>·<var>k</var>) becomes O(<var>n</var>)</b>, with O(1) extra space: 2 × 10⁶ steps instead of 10⁹ for a 1,000-minute window over 10⁶ minutes.",
    hi: { out: "har number ek baar aata, ek baar jaata: O(n)",
          cap: "Har number ek baar judta hai aur ek baar hat-ta hai. <b>O(<var>n</var>·<var>k</var>) O(<var>n</var>) ban jaata hai</b>, O(1) extra space ke saath: 10⁶ minutes par 1,000-minute window ke liye 10⁹ ki jagah 2 × 10⁶ steps." } },
]},

/* ---- sliding window, variable ---- */
/* The same six minutes with a budget instead of a width: the longest stretch
   whose total is at most 7. Adding the 3 at R = 4 forces two removals, which
   is why the shrink is a while loop. */
"sliding-window-var": { kind: "cells", arr: ["2", "1", "5", "1", "3", "2"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>The same six minutes, <code>2, 1, 5, 1, 3, 2</code>, and a new question: the longest stretch whose total stays at most 7.</p><table><tr><td>longest</td><td>3 minutes: 1, 5, 1 or 1, 3, 2</td></tr><tr><td>stretches to check naively</td><td>21</td></tr></table><p>Now the width is not given. Goal: find the 3 with two edges that only ever move right.</p>`,
    cap: "L and R mark the ends of the window. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Wahi chhe minute, <code>2, 1, 5, 1, 3, 2</code>, aur naya sawaal: sabse lamba hissa jiska total zyada se zyada 7 rahe.</p><table><tr><td>sabse lamba</td><td>3 minute: 1, 5, 1 ya 1, 3, 2</td></tr><tr><td>seedhe check karne ko hisse</td><td>21</td></tr></table><p>Ab chaudai nahi di gayi. Goal: aise do kinaaron se 3 dhoondhna jo sirf right hilte hain.</p>`,
          cap: "L aur R window ke sire hain. Next dabao." } },

  { band: [0, 1], ptr: { L: 0, R: 1 }, out: "grow R: 2 + 1 = 3 <= 7, length 2",
    cap: "Push R out greedily while the total fits. Here 2, 1 totals 3: valid, length 2.",
    ask: { q: "R adds the 5, making 8. What now?", opts: ["pull L in until the total is at most 7", "throw the window away and restart after the 5"], a: 0,
           why: "Restarting loses stretches that begin inside this one, such as 1, 5, 1. Shrinking from the left keeps them." },
    hi: { out: "R badhao: 2 + 1 = 3 <= 7, length 2",
          cap: "Jab tak total fit ho, R laalach se badhao. Yahan 2, 1 ka total 3: valid, length 2.",
          ask: { q: "R 5 jodta hai, total 8. Ab kya?", opts: ["L andar kheecho jab tak total 7 ya kam na ho", "window phenko aur 5 ke baad naya shuru"],
                 why: "Naya shuru is hisse ke andar shuru hone wale hisse kho deta hai, jaise 1, 5, 1. Left se ghataana unhe bachata hai." } } },

  { band: [1, 3], bad: [0], ptr: { L: 1, R: 3 }, out: "drop the 2: 6. add the 1: 7 <= 7, length 3",
    cap: "8 is over budget, so the 2 leaves: 6. Then R takes the next 1: 7, still within budget. Length 3, the best so far.",
    ask: { q: "R adds the 3, making 10. How many minutes must leave before the total is at most 7?", opts: ["two: the 1 and the 5", "one"], a: 0,
           why: "10 − 1 = 9, still over. 9 − 5 = 4. That is why the shrink is a while loop, not an if." },
    hi: { out: "2 hatao: 6. 1 jodo: 7 <= 7, length 3",
          cap: "8 budget se upar, to 2 jaata hai: 6. Phir R agla 1 leta hai: 7, ab bhi budget mein. Length 3, ab tak ka best.",
          ask: { q: "R 3 jodta hai, total 10. Total 7 ya kam hone se pehle kitne minute nikalne padenge?", opts: ["do: 1 aur 5", "ek"],
                 why: "10 − 1 = 9, ab bhi upar. 9 − 5 = 4. Isiliye shrink while loop hai, if nahi." } } },

  { band: [3, 4], bad: [1, 2], ptr: { L: 3, R: 4 }, out: "add 3: 10. drop 1: 9. drop 5: 4",
    cap: "Two removals for one addition. It looks expensive, but each minute can only leave once in the whole run.",
    ask: { q: "Across the whole run, how many times can L move right?", opts: ["at most 6, once per minute", "up to 6 for every step of R"], a: 0,
           why: "L starts at 0, only moves right, and cannot pass the end. Its moves are shared across all steps of R." },
    hi: { out: "3 jodo: 10. 1 hatao: 9. 5 hatao: 4",
          cap: "Ek jod ke liye do hataav. Mehenga lagta hai, par har minute poore run mein sirf ek baar nikal sakta hai.",
          ask: { q: "Poore run mein L kitni baar right khisak sakta hai?", opts: ["zyada se zyada 6, har minute ek baar", "R ke har step par 6 tak"],
                 why: "L 0 se shuru, sirf right hilta hai, aur end paar nahi kar sakta. Uske moves R ke saare steps mein bante hain." } } },

  { band: [3, 5], ptr: { L: 3, R: 5 }, out: "add 2: total 6, length 3. Answer: 3",
    cap: "1, 3, 2 totals 6: valid, length 3, tying the best. R has reached the end, so the answer is 3.",
    hi: { out: "2 jodo: total 6, length 3. Answer: 3",
          cap: "1, 3, 2 ka total 6: valid, length 3, best ke barabar. R end tak pahunch gaya, to answer 3." } },

  { on: [0, 1, 2, 3, 4, 5], out: "L and R each cross once: at most 2n moves, O(n)",
    cap: "R visited all 6 positions and L moved 3 times, never backwards. Two pointers, each crossing the array at most once: <b>at most 2<var>n</var> moves, O(<var>n</var>)</b>, even though the window grows and shrinks.",
    hi: { out: "L aur R har ek ek baar paar: zyada se zyada 2n moves, O(n)",
          cap: "R saari 6 positions par gaya aur L 3 baar hila, kabhi peeche nahi. Do pointers, har ek array ko zyada se zyada ek baar paar karta: <b>zyada se zyada 2<var>n</var> moves, O(<var>n</var>)</b>, bhale window badhe aur ghate." } },
]},

/* ---- two pointers ---- */
"two-pointers": { kind: "cells", arr: ["1", "3", "4", "6", "8", "11"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>Six prices, sorted: <code>1, 3, 4, 6, 8, 11</code>. Find two that add up to exactly 10.</p><table><tr><td>pairs to try naively</td><td>15</td></tr><tr><td>the answer</td><td>4 + 6</td></tr><tr><td>comparisons with two pointers</td><td>5</td></tr></table><p>Goal: see why each comparison may throw a price away for good, so that the pointers only ever move inward.</p>`,
    cap: "The boxes are the prices, with positions underneath. L and R are the two pointers. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Chhe prices, sorted: <code>1, 3, 4, 6, 8, 11</code>. Do dhoondho jo theek 10 banayein.</p><table><tr><td>seedhe try karne ko pairs</td><td>15</td></tr><tr><td>answer</td><td>4 + 6</td></tr><tr><td>two pointers ke comparisons</td><td>5</td></tr></table><p>Goal: dekhna ki har comparison ek price ko hamesha ke liye kyun phenk sakta hai, taaki pointers sirf andar hilein.</p>`,
          cap: "Boxes prices hain, neeche positions. L aur R do pointers hain. Next dabao." } },

  { ptr: { L: 0, R: 5 }, on: [0, 5], out: "1 + 11 = 12 > 10",
    cap: "Start at both ends. The sum is <b>too big</b>.",
    ask: { q: "Which price can be dropped for good?", opts: ["11: even with the smallest partner, 1, it is too big", "1"], a: 0,
           why: "Every other partner is at least 1, so 11 plus anything left is at least 12." },
    hi: { out: "1 + 11 = 12 > 10",
          cap: "Dono siron se shuru. Sum <b>zyada</b> hai.",
          ask: { q: "Kaunsi price hamesha ke liye hata sakte hain?", opts: ["11: sabse chhote partner, 1, ke saath bhi zyada", "1"],
                 why: "Har doosra partner kam se kam 1 hai, to 11 plus bacha kuch bhi kam se kam 12." } } },

  { ptr: { L: 0, R: 4 }, on: [0, 4], dim: [5], out: "1 + 8 = 9 < 10",
    cap: "Now the sum is <b>too small</b>. The same argument runs the other way.",
    ask: { q: "Which price is dropped now?", opts: ["1: even with the biggest partner left, 8, it is too small", "8"], a: 0,
           why: "8 is the largest price still in play, so 1 plus anything left is at most 9." },
    hi: { out: "1 + 8 = 9 < 10",
          cap: "Ab sum <b>kam</b> hai. Wahi argument ulti taraf chalta hai.",
          ask: { q: "Ab kaunsi price hatti hai?", opts: ["1: bache sabse bade partner, 8, ke saath bhi kam", "8"],
                 why: "8 ab bhi khel mein sabse badi price hai, to 1 plus bacha kuch bhi zyada se zyada 9." } } },

  { ptr: { L: 1, R: 4 }, on: [1, 4], dim: [0, 5], out: "3 + 8 = 11 > 10",
    cap: "Each comparison removes a whole row or column of the pair table, not a single pair.",
    ask: { q: "Too big again. Which pointer moves?", opts: ["R, dropping the 8", "L, dropping the 3"], a: 0,
           why: "3 is the smallest price left, so 8 is too big with every remaining partner." },
    hi: { out: "3 + 8 = 11 > 10",
          cap: "Har comparison pair table ki poori row ya column hataata hai, ek pair nahi.",
          ask: { q: "Phir zyada. Kaunsa pointer hilta hai?", opts: ["R, 8 hata kar", "L, 3 hata kar"],
                 why: "3 bachi sabse chhoti price hai, to 8 har bache partner ke saath zyada hai." } } },

  { ptr: { L: 1, R: 3 }, on: [1, 3], dim: [0, 4, 5], out: "3 + 6 = 9 < 10",
    cap: "Too small, so the 3 goes. The pointers only ever move towards each other.",
    ask: { q: "After L moves in, what is the next sum?", opts: ["4 + 6 = 10", "3 + 4 = 7"], a: 0,
           why: "L moves from 3 to 4, and R stays on 6." },
    hi: { out: "3 + 6 = 9 < 10",
          cap: "Kam, to 3 jaata hai. Pointers sirf ek doosre ki taraf hilte hain.",
          ask: { q: "L andar hilne ke baad agla sum kya hai?", opts: ["4 + 6 = 10", "3 + 4 = 7"],
                 why: "L 3 se 4 par jaata hai, aur R 6 par rehta hai." } } },

  { ptr: { L: 2, R: 3 }, hot: [2, 3], dim: [0, 1, 4, 5], out: "4 + 6 = 10: found after 5 comparisons",
    cap: "Found, after 5 comparisons instead of 15 pairs. The pointers meet within <var>n</var> moves: <b>O(<var>n</var>) time, O(1) space</b>. If the input arrives unsorted, the sort costs O(<var>n</var> log <var>n</var>) first.",
    hi: { out: "4 + 6 = 10: 5 comparisons ke baad mila",
          cap: "Mil gaya, 15 pairs ki jagah 5 comparisons ke baad. Pointers <var>n</var> moves ke andar milte hain: <b>O(<var>n</var>) time, O(1) space</b>. Input unsorted aaye, to pehle sort ki keemat O(<var>n</var> log <var>n</var>)." } },
]},

});

/* ---- linked list: walking it, and the reversal that everyone gets wrong ---- */
Object.assign(VIZ, {

/* The play queue 3 -> 1 -> 4 -> 9, song 1 playing. Reaching a node costs
   hops; inserting where you stand costs two writes, in the right order. */
"linked-list": { kind: "chain", arr: ["3", "1", "4", "9"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>A play queue, with song 1 playing. “Play next” on song 7 must slot it straight after 1:</p><table><tr><td>before</td><td>3 → 1 → 4 → 9</td></tr><tr><td>after</td><td>3 → 1 → 7 → 4 → 9</td></tr><tr><td>in an array</td><td>4 and 9 shift right</td></tr></table><p>With 10⁵ songs and 10⁵ taps, the shifting is 5 × 10⁹ moves. Goal: see why a linked list does each tap in two writes, and what it pays for that.</p>`,
    cap: "Each box is a node: a song plus an arrow to the next node. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Ek play queue, song 1 chal raha hai. Song 7 par “play next” use 1 ke theek baad rakhe:</p><table><tr><td>pehle</td><td>3 → 1 → 4 → 9</td></tr><tr><td>baad mein</td><td>3 → 1 → 7 → 4 → 9</td></tr><tr><td>array mein</td><td>4 aur 9 right khisakte</td></tr></table><p>10⁵ songs aur 10⁵ taps par khisakna 5 × 10⁹ moves hai. Goal: dekhna ki linked list har tap do writes mein kyun karti hai, aur iske badle kya deti hai.</p>`,
          cap: "Har box ek node hai: ek song plus agle node ka arrow. Next dabao." } },

  { on: [0], ptr: { head: 0 }, out: "head -> 3",
    cap: "All you hold is the <b>head</b>, node 3. The nodes can sit anywhere in memory; the arrows are the only order there is.",
    ask: { q: "Song 4 is at position 2. How do you get to it?", opts: ["compute its address, like a[2]", "follow arrows from the head: 2 hops"], a: 1,
           why: "Nothing is packed side by side, so there is no address to compute. Only the arrows lead there." },
    hi: { out: "head -> 3",
          cap: "Aapke haath mein sirf <b>head</b> hai, node 3. Nodes memory mein kahin bhi ho sakte hain; order sirf arrows mein hai.",
          ask: { q: "Song 4 position 2 par hai. Wahan kaise pahunchoge?", opts: ["a[2] ki tarah address nikaalo", "head se arrows follow karo: 2 hops"],
                 why: "Kuch saath saath packed nahi, to calculate karne ko koi address nahi. Sirf arrows wahan le jaate hain." } } },

  { on: [1], dim: [0], ptr: { curr: 1 }, out: "hop 1: at song 1, now playing",
    cap: "One hop reaches song 1, the one playing. Position <var>i</var> costs <var>i</var> hops: that is the price of the whole design.",
    ask: { q: "Now “play next” on 7: put it right after 1. How many existing nodes move?", opts: ["none: two arrows change", "4 and 9 shift right"], a: 0,
           why: "Nodes are not packed, so there is nothing to shift. Only arrows are rewritten." },
    hi: { out: "hop 1: song 1 par, jo chal raha hai",
          cap: "Ek hop song 1 tak le jaata hai, jo chal raha hai. Position <var>i</var> ki keemat <var>i</var> hops: poore design ki yahi keemat hai.",
          ask: { q: "Ab 7 par “play next”: use 1 ke theek baad rakho. Kitne maujooda nodes hilenge?", opts: ["koi nahi: do arrows badlenge", "4 aur 9 right khisakenge"],
                 why: "Nodes packed nahi, to khisakane ko kuch nahi. Sirf arrows dobara likhe jaate hain." } } },

  { arr: ["3", "1", "7", "4", "9"], links: [1, 0, 1, 1], on: [2], hot: [3], ptr: { curr: 1, new: 2 }, out: "write 1: 7.next = 1.next (song 4)",
    cap: "First, point the new node 7 at 4, the node after 1. The dotted gap means 1 does not point at 7 yet: it still points past it, at 4.",
    ask: { q: "Could you have written <code>1.next = 7</code> first?", opts: ["no: 1's arrow is the only way to reach 4", "yes, the order does not matter"], a: 0,
           why: "Overwrite 1.next first and nothing points at 4 any more. 7.next = 1.next would then make 7 point at itself." },
    hi: { out: "write 1: 7.next = 1.next (song 4)",
          cap: "Pehle naye node 7 ko 4 par point karo, jo 1 ke baad hai. Dotted gap ka matlab 1 abhi 7 ko point nahi karta: woh ab bhi uske paar, 4 ko point karta hai.",
          ask: { q: "Kya pehle <code>1.next = 7</code> likh sakte the?", opts: ["nahi: 4 tak ka ek hi raasta 1 ka arrow hai", "haan, order se farak nahi"],
                 why: "Pehle 1.next mitaya to 4 ko koi point nahi karta. Phir 7.next = 1.next 7 ko khud par point kara dega." } } },

  { arr: ["3", "1", "7", "4", "9"], on: [1, 2], hot: [2], ptr: { curr: 1 }, out: "write 2: 1.next = 7. Done: 2 writes",
    cap: "Then point 1 at 7. <b>Two writes, nothing moved</b>, whether the queue holds 4 songs or 10⁵. For 10⁵ taps that is 2 × 10⁵ writes, against 5 × 10⁹ moves in an array.",
    hi: { out: "write 2: 1.next = 7. Ho gaya: 2 writes",
          cap: "Phir 1 ko 7 par point karo. <b>Do writes, kuch nahi hila</b>, queue mein 4 songs hon ya 10⁵. 10⁵ taps ke liye 2 × 10⁵ writes, array ke 5 × 10⁹ moves ke against." } },

  { arr: ["3", "1", "7", "4", "9"], on: [4], dim: [0, 1, 2, 3], ptr: { curr: 4 }, out: "reaching song 9: 4 hops",
    cap: "The price, stated plainly: the O(1) insert only holds while you already stand on the node. Reaching the last song from the head takes 4 hops, and each hop lands somewhere unrelated in memory.",
    hi: { out: "song 9 tak: 4 hops",
          cap: "Keemat, seedhe shabdon mein: O(1) insert tabhi hai jab aap pehle se node par khade ho. Head se aakhri song tak 4 hops lagte hain, aur har hop memory mein kahin door girta hai." } },
]},

/* Reversing the same queue, 3 -> 1 -> 4 -> 9. Links are the gaps between
   neighbours: 1 points right, -1 left, 0 severed. */
"linked-list-reverse": { kind: "chain", arr: ["3", "1", "4", "9"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>Reverse the queue, so it plays backwards:</p><table><tr><td>before</td><td>3 → 1 → 4 → 9</td></tr><tr><td>after</td><td>9 → 4 → 1 → 3</td></tr></table><p>Every arrow must turn round, in one pass, with no extra list. Goal: see why that takes <b>three</b> pointers, and which one you return.</p>`,
    cap: "prev starts as null, before the list. curr starts at the head. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Queue ulti karo, taaki peeche se baje:</p><table><tr><td>pehle</td><td>3 → 1 → 4 → 9</td></tr><tr><td>baad mein</td><td>9 → 4 → 1 → 3</td></tr></table><p>Har arrow ko palatna hai, ek pass mein, bina extra list ke. Goal: dekhna ki isme <b>teen</b> pointers kyun lagte hain, aur kaunsa return hota hai.</p>`,
          cap: "prev null se shuru hota hai, list se pehle. curr head par. Next dabao." } },

  { ptr: { curr: 0 }, out: "prev = null, curr = 3",
    cap: "To reverse, node 3 must point back at prev, which is null. But 3's arrow is also the only way to reach 1.",
    ask: { q: "Before flipping 3's arrow, what must you save?", opts: ["next = 3.next, which is node 1", "nothing"], a: 0,
           why: "The flip overwrites 3.next. Without a saved copy, 1, 4 and 9 are unreachable." },
    hi: { out: "prev = null, curr = 3",
          cap: "Reverse karne ke liye node 3 ko prev, yaani null, par point karna hai. Par 3 ka arrow hi 1 tak ka ek matra raasta hai.",
          ask: { q: "3 ka arrow palatne se pehle kya save karna hai?", opts: ["next = 3.next, yaani node 1", "kuch nahi"],
                 why: "Palatna 3.next ko mita deta hai. Saved copy ke bina 1, 4 aur 9 pahunch ke bahar." } } },

  { hot: [1], ptr: { curr: 0, next: 1 }, out: "next = curr.next  (save it first)",
    cap: "<b>Save <code>next</code> before touching anything.</b> Now the rest of the list is safe, whatever happens to 3's arrow.",
    hi: { out: "next = curr.next  (pehle save)",
          cap: "<b>Kuch bhi chhoone se pehle <code>next</code> save karo.</b> Ab 3 ke arrow ka kuch bhi ho, baaki list safe hai." } },

  { links: [0, 1, 1], on: [0], nullEnd: false, ptr: { prev: 0, curr: 1 }, out: "3.next = null; prev = 3, curr = 1",
    cap: "Flip: 3 now points at null, the new end of the list. Then advance: prev moves to 3, and curr to the saved node 1.",
    ask: { q: "Same three moves for node 1: save next (4), flip, advance. Where does 1's arrow point after the flip?", opts: ["back at 3", "at null"], a: 0,
           why: "The flip always points curr at prev, and prev is now 3." },
    hi: { out: "3.next = null; prev = 3, curr = 1",
          cap: "Palto: 3 ab null ko point karta hai, list ka naya end. Phir aage badho: prev 3 par, aur curr saved node 1 par.",
          ask: { q: "Node 1 ke liye wahi teen moves: next (4) save, palto, aage. Palatne ke baad 1 ka arrow kahan point karega?", opts: ["wapas 3 par", "null par"],
                 why: "Palatna hamesha curr ko prev par point karta hai, aur prev ab 3 hai." } } },

  { links: [-1, 1, 1], on: [0, 1], nullEnd: false, ptr: { prev: 1, curr: 2 }, out: "1.next = 3; prev = 1, curr = 4",
    cap: "1 points back at 3. Save, flip, advance, the same three moves every time. Two pointers are not enough: without <code>next</code>, the flip strands the rest.",
    hi: { out: "1.next = 3; prev = 1, curr = 4",
          cap: "1 wapas 3 ko point karta hai. Save, palto, aage, har baar wahi teen moves. Do pointers kaafi nahi: <code>next</code> ke bina palatna baaki ko akela chhod deta hai." } },

  { links: [-1, -1, -1], on: [0, 1, 2, 3], nullEnd: false, ptr: { prev: 3 }, out: "4.next = 1, 9.next = 4; curr = null",
    cap: "Two more rounds flip 4 and 9. curr steps past 9 and becomes null, so the loop stops.",
    ask: { q: "curr is null now. Which pointer is the new head?", opts: ["prev, on 9", "curr, which is null"], a: 0,
           why: "prev is the last node the loop visited, and 9 now starts the reversed list." },
    hi: { out: "4.next = 1, 9.next = 4; curr = null",
          cap: "Do aur round 4 aur 9 ko palat-te hain. curr 9 ke paar jaakar null ho jaata hai, to loop rukta hai.",
          ask: { q: "Ab curr null hai. Naya head kaunsa pointer hai?", opts: ["prev, 9 par", "curr, jo null hai"],
                 why: "prev loop ka aakhri dekha node hai, aur 9 ab ulti list shuru karta hai." } } },

  { links: [-1, -1, -1], on: [3], nullEnd: false, ptr: { head: 3 }, out: "return prev: 9 -> 4 -> 1 -> 3",
    cap: "<b>Return prev.</b> One pass, four flips: <b>O(<var>n</var>) time, O(1) extra space</b>. Returning curr hands back null, the other classic bug.",
    hi: { out: "prev return karo: 9 -> 4 -> 1 -> 3",
          cap: "<b>prev return karo.</b> Ek pass, chaar flips: <b>O(<var>n</var>) time, O(1) extra space</b>. curr return kiya to null milta hai, doosra classic bug." } },
]},

/* ---- binary tree: the same three lines, in three different orders ---- */
/* The six-person org chart: 1 over 2 and 3, 4 and 5 under 2, 6 under 3.
   Labels become "person:headcount" as the post-order walk fills them in. */
"tree-traversal": {
  kind: "tree", w: 560, h: 290,
  nodes: { a: { x: 280, y: 44, t: "1" }, b: { x: 170, y: 130, t: "2" }, c: { x: 400, y: 130, t: "3" },
           d: { x: 110, y: 216, t: "4" }, e: { x: 232, y: 216, t: "5" }, f: { x: 460, y: 216, t: "6" } },
  edges: [["a", "b"], ["a", "c"], ["b", "d"], ["b", "e"], ["c", "f"]],
  frames: [
    { scene: `<span class="kicker">Why this example</span><p>An org chart where each manager has at most two direct reports. For every person, count everyone under them, themselves included.</p><table><tr><td>1</td><td>runs the company</td></tr><tr><td>2, 3</td><td>report to 1</td></tr><tr><td>4, 5</td><td>report to 2</td></tr><tr><td>6</td><td>reports to 3</td></tr></table><p>Goal: get every count while visiting each person <b>once</b>, and meet the traversal orders on the way.</p>`,
      cap: "Each box is a person. Lines join a manager to their reports. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Ek org chart jahan har manager ke zyada se zyada do direct reports hain. Har insaan ke liye unke neeche sabko gino, khud ko milakar.</p><table><tr><td>1</td><td>company chalata hai</td></tr><tr><td>2, 3</td><td>1 ko report karte hain</td></tr><tr><td>4, 5</td><td>2 ko report karte hain</td></tr><tr><td>6</td><td>3 ko report karta hai</td></tr></table><p>Goal: har insaan ko <b>ek baar</b> dekh kar har ginti nikaalna, aur raaste mein traversal orders se milna.</p>`,
            cap: "Har box ek insaan hai. Lines manager ko uske reports se jodti hain. Next dabao." } },

    { on: ["a"], dim: ["b", "c", "d", "e", "f"], out: "count(p) = 1 + count(left) + count(right)",
      cap: "Person 1's count needs the counts of 2's group and 3's group. Trust that those are solvable, and add 1 for person 1.",
      ask: { q: "Person 2 together with 4 and 5: is that a tree too?", opts: ["yes, with 2 as its root", "no, only a piece of one"], a: 0,
             why: "It has a root and branches of the same shape, so the same function works on it." },
      hi: { out: "count(p) = 1 + count(left) + count(right)",
            cap: "Insaan 1 ki ginti ko 2 ke group aur 3 ke group ki ginti chahiye. Bharosa karo ki woh solve ho sakte hain, aur insaan 1 ke liye 1 jodo.",
            ask: { q: "Insaan 2, 4 aur 5 ke saath: kya yeh bhi tree hai?", opts: ["haan, 2 uska root hai", "nahi, bas ek ka tukda"],
                   why: "Iska root hai aur usi shape ki branches, to wahi function is par chalta hai." } } },

    { t: { d: "4:1", e: "5:1" }, on: ["d", "e"], dim: ["a", "c", "f"], out: "leaves: 1 + 0 + 0 = 1 each",
      cap: "The walk goes down to the <b>leaves</b>, 4 and 5, which have no reports. Each counts 1: themselves, plus 0 for each empty spot below.",
      ask: { q: "count(2) = 1 + count(4) + count(5). What is it?", opts: ["3", "2"], a: 0,
             why: "1 for person 2, plus 1 and 1 for the two leaves." },
      hi: { out: "leaves: 1 + 0 + 0 = 1 har ek",
            cap: "Walk <b>leaves</b> tak neeche jaati hai, 4 aur 5, jinke koi report nahi. Har ek 1 gina jaata hai: khud, plus neeche ki har khaali jagah ka 0.",
            ask: { q: "count(2) = 1 + count(4) + count(5). Kya hai?", opts: ["3", "2"],
                   why: "Insaan 2 ka 1, plus dono leaves ka 1 aur 1." } } },

    { t: { d: "4:1", e: "5:1", b: "2:3" }, on: ["b", "d", "e"], edge: [["b", "d"], ["b", "e"]], dim: ["a", "c", "f"], out: "count(2) = 1 + 1 + 1 = 3",
      cap: "Person 2 is finished only <i>after</i> both reports. Handling a node after its children is <b>post-order</b>, the order any “built from the children” answer needs.",
      ask: { q: "On the right, 6 is a leaf and 3 has only 6 under it. What is count(3)?", opts: ["2", "3"], a: 0,
             why: "1 for person 3, 0 for the empty left spot, 1 for person 6." },
      hi: { out: "count(2) = 1 + 1 + 1 = 3",
            cap: "Insaan 2 dono reports ke <i>baad</i> hi poora hota hai. Node ko children ke baad sambhalna <b>post-order</b> hai, har “children se bana” answer ko yahi order chahiye.",
            ask: { q: "Right side par 6 leaf hai aur 3 ke neeche sirf 6. count(3) kya hai?", opts: ["2", "3"],
                   why: "Insaan 3 ka 1, khaali left jagah ka 0, insaan 6 ka 1." } } },

    { t: { d: "4:1", e: "5:1", b: "2:3", f: "6:1", c: "3:2" }, on: ["c", "f"], edge: [["c", "f"]], dim: ["a", "d", "e"], out: "count(3) = 1 + 0 + 1 = 2",
      cap: "The empty left spot under 3 counts 0. That base case is why every tree function starts by checking for null.",
      hi: { out: "count(3) = 1 + 0 + 1 = 2",
            cap: "3 ke neeche khaali left jagah 0 gini jaati hai. Isi base case ki wajah se har tree function null check se shuru hota hai." } },

    { t: { d: "4:1", e: "5:1", b: "2:3", f: "6:1", c: "3:2", a: "1:6" }, on: ["a", "b", "c"], edge: [["a", "b"], ["a", "c"]], out: "count(1) = 1 + 3 + 2 = 6: each person visited once",
      cap: "<b>count(1) = 6.</b> Six people, six calls, O(<var>n</var>). Walking down from every person separately would repeat work; on a chain of 10⁵ that is 5 × 10⁹ steps.",
      ask: { q: "To print the chart top-down, every boss before their reports, which order?", opts: ["pre-order: a node before its children", "post-order: a node after its children"], a: 0,
             why: "A boss must appear before the people under them." },
      hi: { out: "count(1) = 1 + 3 + 2 = 6: har insaan ek baar",
            cap: "<b>count(1) = 6.</b> Chhe log, chhe calls, O(<var>n</var>). Har insaan se alag neeche chalna kaam dohraata; 10⁵ ki chain par yeh 5 × 10⁹ steps.",
            ask: { q: "Chart upar se neeche print karna hai, har boss apne reports se pehle. Kaunsa order?", opts: ["pre-order: node apne children se pehle", "post-order: node apne children ke baad"],
                   why: "Boss ko apne neeche ke logon se pehle aana chahiye." } } },

    { on: ["a", "b", "d", "e", "c", "f"], out: "pre: 1 2 4 5 3 6 · in: 4 2 5 1 3 6 · post: 4 5 2 6 3 1",
      cap: "The same walk, recorded at three moments. <b>Pre-order</b> writes a node on arrival, <b>in-order</b> between its children, <b>post-order</b> on leaving. Only the position of one line in the code changes.",
      hi: { out: "pre: 1 2 4 5 3 6 · in: 4 2 5 1 3 6 · post: 4 5 2 6 3 1",
            cap: "Wahi walk, teen palon par likhi hui. <b>Pre-order</b> node ko aate hi likhta hai, <b>in-order</b> uske children ke beech, <b>post-order</b> jaate waqt. Code mein sirf ek line ki jagah badalti hai." } },

    { on: ["b", "c"], dim: ["d", "e", "f"], out: "by level, with a queue: 1 | 2, 3 | 4, 5, 6",
      cap: "Swap the call stack for a <b>queue</b> and the walk goes level by level: 1, then 2 and 3, then 4, 5 and 6. Every cost here is <b>O(<var>h</var>)</b> per path: 2 levels below the root in this chart, but <var>n</var> if every manager had one report.",
      hi: { out: "level by level, queue ke saath: 1 | 2, 3 | 4, 5, 6",
            cap: "Call stack ki jagah <b>queue</b> lagao aur walk level by level chalti hai: 1, phir 2 aur 3, phir 4, 5 aur 6. Yahan har path ki cost <b>O(<var>h</var>)</b> hai: is chart mein root ke neeche 2 levels, par <var>n</var> agar har manager ka ek hi report hota." } },
  ]
},

/* ---- merge sort: why the bound is n log n, drawn ---- */
"merge-sort": { kind: "cells", arr: ["5", "2", "8", "1"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>Four scores, <code>5, 2, 8, 1</code>, to be put in order. Four is the smallest size where the counting argument is not obvious, and every step still fits on screen.</p><table><tr><td>possible orders</td><td>4! = 24</td></tr><tr><td>comparisons any sort needs</td><td>at least 5</td></tr><tr><td>merge sort uses</td><td>exactly 5</td></tr></table><p>Goal: see where the floor comes from, watch merge sort meet it, then see the two other ways: quicksort's pivot, and counting sort, which never compares.</p>`,
    cap: "The boxes are the array, with positions underneath. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Chaar scores, <code>5, 2, 8, 1</code>, jinhe order mein lagana hai. Chaar sabse chhota size hai jahan ginti wala argument obvious nahi, aur har step phir bhi screen par aata hai.</p><table><tr><td>possible orders</td><td>4! = 24</td></tr><tr><td>kisi bhi sort ko chahiye</td><td>kam se kam 5 comparisons</td></tr><tr><td>merge sort leta hai</td><td>theek 5</td></tr></table><p>Goal: dekhna farsh kahan se aata hai, merge sort ko us par pahunchte dekhna, phir baaki do raaste: quicksort ka pivot, aur counting sort, jo kabhi compare nahi karta.</p>`,
          cap: "Boxes array hain, neeche positions. Next dabao." } },

  { arr: ["5", "2", "8", "1"], out: "24 possible orders, and one is correct",
    cap: "Sorting means picking one arrangement out of <b>4! = 24</b>. A comparison answers yes or no, so at best it rules out half of the orders still possible.",
    ask: { q: "At least how many comparisons can single out 1 order from 24?", opts: ["4", "5"], a: 1,
           why: "4 answers tell apart at most 2⁴ = 16 orders, fewer than 24. 5 answers reach 32." },
    hi: { out: "24 possible orders, aur ek sahi",
          cap: "Sorting matlab <b>4! = 24</b> mein se ek arrangement chunna. Comparison haan ya na batata hai, to zyada se zyada bache orders mein se aadhe hataata hai.",
          ask: { q: "24 mein se 1 order alag karne ko kam se kam kitne comparisons?", opts: ["4", "5"],
                 why: "4 answers zyada se zyada 2⁴ = 16 orders alag karte hain, 24 se kam. 5 answers 32 tak pahunchte hain." } } },

  { arr: ["5", "2", "8", "1"], on: [0, 1], hot: [2, 3], out: "split: [5, 2] | [8, 1], then [5] [2] [8] [1]",
    cap: "Merge sort splits in half, then halves again, until every piece is one item. One item is sorted by definition, so no work happens on the way down.",
    ask: { q: "How many levels of halving does it take to get from 4 items to single items?", opts: ["2", "4"], a: 0,
           why: "4 → 2 → 1: two halvings, which is log₂ 4. For 10⁶ items it is 20." },
    hi: { out: "todo: [5, 2] | [8, 1], phir [5] [2] [8] [1]",
          cap: "Merge sort aadha karta hai, phir phir se aadha, jab tak har tukda ek item na ho. Ek item apne aap sorted hai, to neeche jaate waqt koi kaam nahi hota.",
          ask: { q: "4 items se akele items tak kitne levels aadha karna padta hai?", opts: ["2", "4"],
                 why: "4 → 2 → 1: do baar aadha, yaani log₂ 4. 10⁶ items ke liye 20." } } },

  { arr: ["2", "5", "1", "8"], on: [0, 1], hot: [2, 3], out: "[5]+[2] -> [2, 5], [8]+[1] -> [1, 8]: 1 comparison each",
    cap: "Now merge back up. Two single items need one comparison: 5 vs 2 puts 2 first, and 8 vs 1 puts 1 first. Two comparisons so far.",
    ask: { q: "Merging [2, 5] with [1, 8], always taking the smaller front item: how many comparisons?", opts: ["3", "4"], a: 0,
           why: "2 vs 1, then 2 vs 8, then 5 vs 8. The left side is now empty, so 8 is copied with no comparison." },
    hi: { out: "[5]+[2] -> [2, 5], [8]+[1] -> [1, 8]: har ek 1 comparison",
          cap: "Ab upar jodte jao. Do akele items ko ek comparison chahiye: 5 vs 2 se 2 pehle, aur 8 vs 1 se 1 pehle. Ab tak do comparisons.",
          ask: { q: "[2, 5] aur [1, 8] ko hamesha chhota aage wala item lekar jodo: kitne comparisons?", opts: ["3", "4"],
                 why: "2 vs 1, phir 2 vs 8, phir 5 vs 8. Left side ab khaali, to 8 bina comparison copy hota hai." } } },

  { arr: ["1", "2", "5", "8"], on: [0, 1, 2, 3], out: "1, 2, 5, 8 after 1 + 1 + 3 = 5 comparisons",
    cap: "Five comparisons, exactly the floor. In general: <b>log <var>n</var> levels, at most <var>n</var> comparisons each</b>, so O(<var>n</var> log <var>n</var>) even in the worst case. It is stable, and the price is an O(<var>n</var>) scratch buffer.",
    ask: { q: "Quicksort instead picks 5 as pivot, and moves smaller values left and larger ones right. Where does 5 land?", opts: ["position 2, its final place", "position 0, where it started"], a: 0,
           why: "Exactly two values, 2 and 1, are smaller than 5. So 5 sits at position 2, which is where it belongs in 1, 2, 5, 8." },
    hi: { out: "1 + 1 + 3 = 5 comparisons ke baad 1, 2, 5, 8",
          cap: "Paanch comparisons, theek farsh. General mein: <b>log <var>n</var> levels, har ek mein zyada se zyada <var>n</var> comparisons</b>, to worst case mein bhi O(<var>n</var> log <var>n</var>). Yeh stable hai, aur keemat O(<var>n</var>) scratch buffer hai.",
          ask: { q: "Quicksort iski jagah 5 ko pivot chunta hai, aur chhote values left, bade right karta hai. 5 kahan girta hai?", opts: ["position 2, apni final jagah", "position 0, jahan shuru hua"],
                 why: "Theek do values, 2 aur 1, 5 se chhoti hain. To 5 position 2 par baithta hai, jo 1, 2, 5, 8 mein uski jagah hai." } } },

  { arr: ["2", "1", "5", "8"], hot: [2], on: [0, 1], dim: [3], out: "pivot 5: [2, 1] 5 [8], and 5 never moves again",
    cap: "One pass puts the pivot in its final place, with no scratch buffer. Then each side is sorted the same way. A pivot near the middle halves the work, which gives <var>n</var> log <var>n</var> on average.",
    ask: { q: "If quicksort always picked the smallest item as pivot, how much would each pass remove?", opts: ["one item", "half the items"], a: 0,
           why: "Everything else lands on one side, so the next call has <var>n</var> − 1 items. That totals about <var>n</var>² / 2: 5 × 10¹¹ for 10⁶ items." },
    hi: { out: "pivot 5: [2, 1] 5 [8], aur 5 phir kabhi nahi hilta",
          cap: "Ek pass pivot ko uski final jagah rakh deta hai, bina scratch buffer ke. Phir har taraf isi tarah sort hoti hai. Beech ke paas ka pivot kaam aadha karta hai, jisse average par <var>n</var> log <var>n</var> milta hai.",
          ask: { q: "Agar quicksort hamesha sabse chhota item pivot chune, to har pass kitna hataayega?", opts: ["ek item", "aadhe items"],
                 why: "Baaki sab ek taraf girta hai, to agli call mein <var>n</var> − 1 items. Kul lagbhag <var>n</var>² / 2: 10⁶ items par 5 × 10¹¹." } } },

  { arr: ["0", "1", "1", "0", "0", "1", "0", "0", "1", "0"], on: [1, 2, 5, 8], out: "count[v] for v = 0..9, read back: 1, 2, 5, 8",
    cap: "Counting sort never compares. Each value <b>is</b> a position: add 1 at count[5], count[2], count[8] and count[1], then read the slots left to right. O(<var>n</var> + <var>k</var>) for <var>k</var> possible values, so it only pays when <var>k</var> is small.",
    hi: { out: "v = 0..9 ke liye count[v], wapas padho: 1, 2, 5, 8",
          cap: "Counting sort kabhi compare nahi karta. Har value <b>khud</b> ek position hai: count[5], count[2], count[8] aur count[1] mein 1 jodo, phir slots left se right padho. <var>k</var> possible values ke liye O(<var>n</var> + <var>k</var>), to faayda tabhi jab <var>k</var> chhota ho." } },
]},

/* Divide and conquer, told through counting inversions in 4, 2, 1, 3: the
   halves report 1 and 0, and the merge counts the 3 cross pairs. */
"inversions": { kind: "cells", arr: ["4", "2", "1", "3"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>Two people rank the same four films. The first ranks them 1, 2, 3, 4. The second's ranking, in the first person's numbering, is <code>4, 2, 1, 3</code>.</p><table><tr><td>pairs of films</td><td>6</td></tr><tr><td>pairs in opposite order</td><td>4: (4,2) (4,1) (4,3) (2,1)</td></tr><tr><td>at 10⁶ songs, every pair</td><td>5 × 10¹¹ checks</td></tr></table><p>Four items is enough for both halves and the cross pairs to matter. Goal: count the 4 without checking pairs one by one, and see that the combine step is where the method lives.</p>`,
    cap: "The boxes are the second person's ranking. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Do log same chaar films rank karte hain. Pehla unhe 1, 2, 3, 4 rank karta hai. Doosre ki ranking, pehle ki numbering mein, hai <code>4, 2, 1, 3</code>.</p><table><tr><td>films ke pairs</td><td>6</td></tr><tr><td>ulte order wale pairs</td><td>4: (4,2) (4,1) (4,3) (2,1)</td></tr><tr><td>10⁶ songs par har pair</td><td>5 × 10¹¹ checks</td></tr></table><p>Chaar items kaafi hain ki dono halves aur paar wale pairs maayne rakhein. Goal: pairs ek ek check kiye bina 4 ginna, aur dekhna ki method combine step mein rehta hai.</p>`,
          cap: "Boxes doosre insaan ki ranking hain. Next dabao." } },

  { arr: ["4", "2", "1", "3"], out: "divide: find the middle, nothing else",
    cap: "Checking all 6 pairs works here, and is 5 × 10¹¹ checks at 10⁶ songs. So divide instead. Dividing costs nothing: it is just the middle.",
    ask: { q: "Split into [4, 2] and [1, 3]. Which inversions can neither half see on its own?", opts: ["the ones with one film in each half", "none: the halves see everything"], a: 0,
           why: "A half only knows its own two items. (4,1), (4,3) and (2,1) each have one item on each side." },
    hi: { out: "baanto: beech dhoondho, aur kuch nahi",
          cap: "Yahan saare 6 pairs check karna chalta hai, aur 10⁶ songs par 5 × 10¹¹ checks hai. To baanto. Baantna muft hai: bas beech hai.",
          ask: { q: "[4, 2] aur [1, 3] mein todo. Kaunsi inversions koi half akele nahi dekh sakta?", opts: ["jinme har half mein ek film ho", "koi nahi: halves sab dekhte hain"],
                 why: "Half ko sirf apne do items pata hain. (4,1), (4,3) aur (2,1) har ek ka ek item har taraf hai." } } },

  { arr: ["4", "2", "1", "3"], on: [0, 1], hot: [2, 3], out: "conquer: left [4, 2] has 1, right [1, 3] has 0",
    cap: "Conquer: each half counts its own inversions by the same method, calling itself. The left finds 1, the pair (4,2). The right finds 0. Each half also hands back its items <b>sorted</b>.",
    ask: { q: "Does sorting inside each half change the number of pairs that cross the middle in the wrong order?", opts: ["no", "yes"], a: 0,
           why: "Sorting within a half keeps every item on its own side. Which left items beat which right items is unchanged." },
    hi: { out: "hal karo: left [4, 2] mein 1, right [1, 3] mein 0",
          cap: "Hal karo: har half isi method se, khud ko bula kar, apni inversions ginta hai. Left 1 paata hai, pair (4,2). Right 0. Har half apne items <b>sorted</b> bhi lautata hai.",
          ask: { q: "Kya har half ke andar sort karna beech ke paar galat order wale pairs ki ginti badalta hai?", opts: ["nahi", "haan"],
                 why: "Half ke andar sort karna har item ko uski taraf hi rakhta hai. Kaunsa left item kaunse right item se bada hai, woh wahi rehta hai." } } },

  { arr: ["2", "4", "1", "3"], on: [0, 1], hot: [2, 3], out: "combine: merge [2, 4] with [1, 3]",
    cap: "Now the combine step, which is the whole method. Merge the sorted halves with two fingers, always taking the smaller front item. The first comparison is 2 against 1.",
    ask: { q: "1 is smaller, so it is taken from the right. How many left items does 1 form an inversion with?", opts: ["2: both 2 and 4", "1: just 2"], a: 0,
           why: "The left half is sorted, so everything from 2 onward is bigger than 1. Add 2 in one step, without looking at 4." },
    hi: { out: "jodo: [2, 4] ko [1, 3] ke saath merge",
          cap: "Ab combine step, jo poori method hai. Sorted halves ko do ungliyon se merge karo, hamesha chhota aage wala item lekar. Pehla comparison 2 vs 1.",
          ask: { q: "1 chhota hai, to right se liya jaata hai. 1 kitne left items ke saath inversion banata hai?", opts: ["2: dono 2 aur 4", "1: sirf 2"],
                 why: "Left half sorted hai, to 2 se aage sab 1 se bada hai. 4 ko dekhe bina ek step mein 2 jodo." } } },

  { arr: ["1", "2", "3", "4"], on: [0, 1, 2, 3], out: "take 1 (+2), 2, 3 (+1), 4: cross = 3, total 1 + 0 + 3 = 4",
    cap: "Then 2 against 3 takes 2 from the left: nothing to add. 4 against 3 takes 3 from the right, with 4 still waiting: add 1. Total 1 + 0 + 3 = 4, matching the brute-force count, in one walk.",
    ask: { q: "Every level of splitting does one such walk over all <var>n</var> items. How many levels for 10⁶ songs?", opts: ["about 20", "about 10⁶"], a: 0,
           why: "Halving 10⁶ reaches 1 after about 20 steps. 20 walks of 10⁶ is 2 × 10⁷, against 5 × 10¹¹." },
    hi: { out: "1 lo (+2), 2, 3 (+1), 4: paar = 3, kul 1 + 0 + 3 = 4",
          cap: "Phir 2 vs 3 left se 2 leta hai: jodne ko kuch nahi. 4 vs 3 right se 3 leta hai, 4 abhi intezaar mein: 1 jodo. Kul 1 + 0 + 3 = 4, brute force ki ginti se mel, ek walk mein.",
          ask: { q: "Todne ka har level saare <var>n</var> items par aisi ek walk karta hai. 10⁶ songs ke liye kitne levels?", opts: ["lagbhag 20", "lagbhag 10⁶"],
                 why: "10⁶ ko aadha karte karte lagbhag 20 steps mein 1 aata hai. 10⁶ ki 20 walks 2 × 10⁷ hai, 5 × 10¹¹ ke saamne." } } },

  { arr: ["2", "1", "3", "4"], hot: [2], on: [0, 1], dim: [3], out: "quickselect, 2nd smallest: pivot 3 gives [2, 1] 3 [4]",
    cap: "The same shape can drop a side. For the 2nd smallest, partition around 3: two items are smaller, so the answer is among them, and [4] is never looked at again. Work <var>n</var> + <var>n</var>/2 + … adds up to about 2<var>n</var>.",
    hi: { out: "quickselect, 2nd smallest: pivot 3 se [2, 1] 3 [4]",
          cap: "Yahi shakal ek taraf chhod sakti hai. 2nd smallest ke liye 3 ke around partition karo: do items chhote hain, to answer unhi mein hai, aur [4] ko phir kabhi nahi dekha jaata. Kaam <var>n</var> + <var>n</var>/2 + … jud kar lagbhag 2<var>n</var>." } },
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

/* Booking start times 1, 3, 6, 8, 10, 14, with 8 at the root. The last two
   frames build a second tree from 1, 3, 6, 8 inserted in order: a line. */
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
    { scene: `<span class="kicker">Why this example</span><p>Six booking start times, and the system's favourite question: <b>what is the first booking at or after time t?</b></p><table><tr><td>bookings</td><td>1, 3, 6, 8, 10, 14</td></tr><tr><td>find</td><td>6</td></tr><tr><td>first at or after 7</td><td>8</td></tr></table><p>A sorted array answers fast but inserts slowly. Goal: keep the fast answers <i>and</i> cheap inserts, by storing the halving in the shape of a tree.</p>`,
      cap: "The tree below holds the six times, with 8 at the root. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Chhe booking start times, aur system ka pasandeeda sawaal: <b>time t par ya uske baad pehli booking kaunsi?</b></p><table><tr><td>bookings</td><td>1, 3, 6, 8, 10, 14</td></tr><tr><td>dhoondho</td><td>6</td></tr><tr><td>7 par ya baad pehli</td><td>8</td></tr></table><p>Sorted array jaldi answer deta hai par insert dheere. Goal: tez answers <i>aur</i> saste inserts dono, aadha karne ko tree ki shape mein rakh kar.</p>`,
            cap: "Neeche ka tree chhe times rakhta hai, root par 8. Next dabao." } },

    { show: ["a","b","c","d","e","f"], on: ["a"], out: "everything left < 8 < everything right",
      cap: "One rule: <b>every value in the left subtree is smaller, every value in the right subtree is larger</b>. Not just the children: the whole subtree. 1, 3 and 6 are all below 8; 10 and 14 are all above.",
      ask: { q: "Looking for 6. Compare with 8 first. Where can 6 be?", opts: ["only on the left: 6 < 8", "on either side"], a: 0,
             why: "Everything on the right is larger than 8, so 6 cannot be there." },
      hi: { out: "left mein sab < 8 < right mein sab",
            cap: "Ek niyam: <b>left subtree ki har value chhoti, right subtree ki har value badi</b>. Sirf children nahi: poora subtree. 1, 3 aur 6 sab 8 se neeche; 10 aur 14 sab upar.",
            ask: { q: "6 dhoondh rahe ho. Pehle 8 se compare. 6 kahan ho sakta hai?", opts: ["sirf left mein: 6 < 8", "kisi bhi taraf"],
                   why: "Right mein sab 8 se bada hai, to 6 wahan nahi ho sakta." } } },

    { show: ["a","b","c","d","e","f"], on: ["a", "b"], edge: [["a","b"]], dim: ["c","f"], out: "6 < 8: the whole right side is gone",
      cap: "One comparison removed half the tree. That is binary search again, except the halving is built into the shape instead of worked out from indexes.",
      ask: { q: "Now compare with 3. Which way?", opts: ["right: 6 > 3", "left: 6 < 3"], a: 0,
             why: "6 is bigger than 3, and 3's right subtree holds the values between 3 and 8." },
      hi: { out: "6 < 8: poori right side gayi",
            cap: "Ek comparison ne aadha tree hata diya. Yeh phir binary search hai, bas aadha karna indexes se nikaalne ki jagah shape mein bana hai.",
            ask: { q: "Ab 3 se compare. Kidhar?", opts: ["right: 6 > 3", "left: 6 < 3"],
                   why: "6, 3 se bada hai, aur 3 ka right subtree 3 aur 8 ke beech ki values rakhta hai." } } },

    { show: ["a","b","c","d","e","f"], hot: ["e"], on: ["a","b"], edge: [["a","b"],["b","e"]], dim: ["c","f","d"], out: "found 6 in 3 comparisons",
      cap: "Found. “First booking at or after 7” walks the same path: 8 is a candidate, go left; 3 and 6 are too small, go right; nothing there, so the answer is 8. Inserting 7 also ends here, as 6's right child. Each is <b>O(<var>h</var>)</b>.",
      ask: { q: "Walk the whole tree in-order: left, node, right. What order do the values come out in?", opts: ["sorted: 1, 3, 6, 8, 10, 14", "the order they were inserted"], a: 0,
             why: "At every node, smaller things come out before it and larger things after it." },
      hi: { out: "3 comparisons mein 6 mila",
            cap: "Mil gaya. “7 par ya baad pehli booking” yahi raasta chalti hai: 8 candidate hai, left jao; 3 aur 6 chhote hain, right jao; wahan kuch nahi, to answer 8. 7 insert karna bhi yahin khatam hota hai, 6 ke right child ki tarah. Har ek <b>O(<var>h</var>)</b>.",
            ask: { q: "Poora tree in-order chalo: left, node, right. Values kis order mein aayengi?", opts: ["sorted: 1, 3, 6, 8, 10, 14", "jis order mein insert hui"],
                   why: "Har node par chhoti cheezein usse pehle aur badi baad mein aati hain." } } },

    { show: ["a","b","c","d","e","f"], on: ["d","b","e","a","c","f"], out: "in-order: 1, 3, 6, 8, 10, 14",
      cap: "<b>Sorted.</b> Not an accident: it is the rule read aloud. The <var>k</var>-th smallest booking is this walk, stopped after <var>k</var> values.",
      ask: { q: "Now build a new tree by inserting 1, 3, 6, 8 in that order. What shape do you get?", opts: ["a bushy tree like this one", "a straight line going right"], a: 1,
             why: "Each new value is larger than everything before it, so it always goes right." },
      hi: { out: "in-order: 1, 3, 6, 8, 10, 14",
            cap: "<b>Sorted.</b> Ittefaq nahi: yeh niyam zor se padha gaya hai. <var>k</var>-th sabse chhoti booking yahi walk hai, <var>k</var> values ke baad roki hui.",
            ask: { q: "Ab 1, 3, 6, 8 isi order mein insert karke naya tree banao. Kya shape milegi?", opts: ["is jaisa ghana tree", "right ki taraf seedhi line"],
                   why: "Har nayi value pehle wali sab se badi hai, to hamesha right jaati hai." } } },

    { show: ["s1","s2","s3","s4"], bad: ["s1","s2","s3","s4"], edge: [["s1","s2"],["s2","s3"],["s3","s4"]], out: "insert 1, 3, 6, 8 in order: h = n - 1",
      cap: "A linked list with extra steps. Times usually arrive in order, so this is the common case, not a trick. Every O(log <var>n</var>) becomes <b>O(<var>n</var>)</b>. Self-balancing trees, like Java's TreeMap, exist to prevent exactly this picture.",
      hi: { out: "1, 3, 6, 8 order mein insert: h = n - 1",
            cap: "Extra steps wali linked list. Times aksar order mein aate hain, to yeh common case hai, chaal nahi. Har O(log <var>n</var>) <b>O(<var>n</var>)</b> ban jaata hai. Self-balancing trees, jaise Java ka TreeMap, theek isi tasveer ko rokne ke liye hain." } },
  ]
},

/* The six-person network: A-B, A-D, B-C, B-E, D-E, C-F, E-F. It has a loop
   (A-B-E-D), and DFS reaches D the long way round, which is the whole case
   for BFS when you want the fewest steps. */
"graph-basics": {
  kind: "tree", w: 580, h: 300,
  nodes: {
    A: { x: 90,  y: 70,  t: "A" }, B: { x: 250, y: 50,  t: "B" },
    C: { x: 410, y: 80,  t: "C" }, D: { x: 160, y: 200, t: "D" },
    E: { x: 330, y: 210, t: "E" }, F: { x: 500, y: 190, t: "F" },
  },
  edges: [["A","B"],["A","D"],["B","C"],["B","E"],["D","E"],["C","F"],["E","F"]],
  frames: [
    { scene: `<span class="kicker">Why this example</span><p>Six people and who knows whom. The question: <b>fewest introductions</b> from A to anyone.</p><table><tr><td>A</td><td>knows B, D</td></tr><tr><td>B</td><td>knows A, C, E</td></tr><tr><td>C, D, E, F</td><td>C–F, D–E, E–F</td></tr></table><p>It is small, but it has a loop (A, B, E, D), and one friend, D, who is easy to reach the long way round. Goal: a walk that ends, and that finds each person by the fewest steps.</p>`,
      cap: "Circles are people; lines are friendships, which go both ways. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Chhe log aur kaun kisko jaanta hai. Sawaal: A se kisi tak <b>sabse kam introductions</b>.</p><table><tr><td>A</td><td>B, D ko jaanta hai</td></tr><tr><td>B</td><td>A, C, E ko jaanta hai</td></tr><tr><td>C, D, E, F</td><td>C–F, D–E, E–F</td></tr></table><p>Chhota hai, par isme ek loop hai (A, B, E, D), aur ek dost, D, jis tak lambe raaste se pahunchna aasaan hai. Goal: aisi walk jo khatam ho, aur har insaan tak sabse kam steps mein pahunche.</p>`,
            cap: "Circles log hain; lines dostiyan, jo dono taraf hain. Next dabao." } },

    { on: ["A","B","C","D","E","F"], out: "6 nodes, 7 edges: no root, no order",
      cap: "A <b>graph</b>: things and connections. Unlike a tree there is no root, and nothing stops a path from coming back to where it started.",
      ask: { q: "Walk A → B → E → D, just following friends. Where can you go next?", opts: ["back to A, and round again", "nowhere: the walk ends"], a: 0,
             why: "D knows A. Without a record of where you have been, the walk circles forever." },
      hi: { out: "6 nodes, 7 edges: na root, na order",
            cap: "<b>Graph</b>: cheezein aur connections. Tree ke ulat koi root nahi, aur raaste ko wapas shuru ki jagah aane se kuch nahi rokta.",
            ask: { q: "A → B → E → D chalo, bas dost follow karke. Aage kahan ja sakte ho?", opts: ["wapas A, aur phir ghoom", "kahin nahi: walk khatam"],
                   why: "D, A ko jaanta hai. Kahan gaye iska record na ho, to walk hamesha ghoomti hai." } } },

    { bad: ["A","B","E","D"], edge: [["A","B"],["B","E"],["D","E"],["A","D"]], out: "A -> B -> E -> D -> A, forever",
      cap: "A <b>loop</b>, which a tree never had. The fix is a <b>visited</b> set: never process a person twice. It is not a speed-up. It is what makes the program finish.",
      hi: { out: "A -> B -> E -> D -> A, hamesha",
            cap: "Ek <b>loop</b>, jo tree mein kabhi nahi tha. Fix hai <b>visited</b> set: kisi ko do baar process mat karo. Yeh speed-up nahi. Isi se program khatam hota hai." } },

    { on: ["B"], hot: ["A","C","E"], edge: [["A","B"],["B","C"],["B","E"]], out: "adj[B] = [A, C, E]",
      cap: "Store it as an <b>adjacency list</b>: for each person, their friends. Space is O(<var>V</var> + <var>E</var>), and “who does B know?” is immediate. Now walk it.",
      ask: { q: "Recursive DFS goes as deep as it can before backing up. From A it visits B, C, F, E, then D. How many steps is that route to D?", opts: ["1", "5"], a: 1,
             why: "A-B-C-F-E-D is 5 steps, though D is A's own friend." },
      hi: { out: "adj[B] = [A, C, E]",
            cap: "Ise <b>adjacency list</b> ki tarah rakho: har insaan ke liye uske dost. Space O(<var>V</var> + <var>E</var>), aur “B kisko jaanta hai?” turant. Ab chalo.",
            ask: { q: "Recursive DFS peeche aane se pehle jitna gehra ho sake jaata hai. A se woh B, C, F, E, phir D dekhta hai. D tak us raaste mein kitne steps?", opts: ["1", "5"],
                   why: "A-B-C-F-E-D 5 steps hai, jabki D A ka apna dost hai." } } },

    { on: ["A","B","C","F","E","D"], edge: [["A","B"],["B","C"],["C","F"],["E","F"],["D","E"]], out: "recursive DFS from A: A, B, C, F, E, D",
      cap: "<b>Depth-first search</b>, written recursively, commits to one path and backs up only at dead ends. Every person is found, but its first route to D is 5 steps. DFS answers “can I reach?”, not “how close?”.",
      ask: { q: "BFS takes people in the order they were found: A, then all of A's friends, then theirs. At what distance does it first find D?", opts: ["1 step", "5 steps"], a: 0,
             why: "D is one of A's friends, so it is found in the first ring." },
      hi: { out: "A se recursive DFS: A, B, C, F, E, D",
            cap: "<b>Depth-first search</b>, recursive roop mein, ek raaste par tik jaata hai aur sirf band gali par peeche aata hai. Har insaan milta hai, par D tak uska pehla raasta 5 steps. DFS batata hai “pahunch sakte hain?”, “kitna paas?” nahi.",
            ask: { q: "BFS logon ko us order mein leta hai jismein mile: A, phir A ke saare dost, phir unke. D pehli baar kis doori par milta hai?", opts: ["1 step", "5 steps"],
                   why: "D A ke doston mein hai, to pehli ring mein milta hai." } } },

    { on: ["A","B","D"], hot: ["C","E"], dim: ["F"], out: "BFS from A: A | B, D | C, E | F",
      cap: "<b>Breadth-first search</b>: everyone 1 step away (B, D), then 2 steps (C, E), then 3 (F). Same code with a queue instead of a stack, and now the first arrival is by the <b>fewest edges</b>.",
      ask: { q: "E is a friend of both B and D. When should E be marked visited?", opts: ["when it is added to the queue", "when it is taken out"], a: 0,
             why: "Marking on the way out lets D add E a second time, since E is still waiting in the queue." },
      hi: { out: "A se BFS: A | B, D | C, E | F",
            cap: "<b>Breadth-first search</b>: 1 step door sab (B, D), phir 2 steps (C, E), phir 3 (F). Stack ki jagah queue wala wahi code, aur ab pehli pahunch <b>sabse kam edges</b> se.",
            ask: { q: "E, B aur D dono ka dost hai. E ko visited kab mark karna chahiye?", opts: ["jab queue mein jode", "jab bahar nikaale"],
                   why: "Nikaalte waqt mark karne se D, E ko doosri baar jod deta hai, kyunki E abhi queue mein intezaar kar raha hai." } } },

    { on: ["A","B","C","D","E","F"], out: "mark on push: O(V + E)",
      cap: "Mark a node visited when you <b>add</b> it. Then everyone is queued once and every edge looked at twice: <b>O(<var>V</var> + <var>E</var>)</b>. Mark on removal and E is queued twice here, and far more on dense graphs.",
      hi: { out: "jodte waqt mark: O(V + E)",
            cap: "Node ko <b>jodte</b> waqt visited mark karo. Tab har koi ek baar queue hota hai aur har edge do baar dekha jaata hai: <b>O(<var>V</var> + <var>E</var>)</b>. Nikaalte waqt mark karo to yahan E do baar queue hota hai, aur dense graphs par kahin zyada." } },
  ]
},

/* The five-stop map: A-B 4, A-C 1, C-B 2, B-D 5, C-D 8, D-E 3. B improves
   from 4 to 3 through C, and D from 9 to 8 through B: both things BFS cannot
   do. Each box shows the best time known so far. */
"dijkstra": {
  kind: "tree", w: 600, h: 290, arrows: false,
  weights: { "A>B": 4, "A>C": 1, "C>B": 2, "B>D": 5, "C>D": 8, "D>E": 3 },
  nodes: {
    A: { x: 70,  y: 150, t: "0", sub: "A" },
    B: { x: 250, y: 60,  t: "∞", sub: "B" },
    C: { x: 250, y: 230, t: "∞", sub: "C" },
    D: { x: 430, y: 150, t: "∞", sub: "D" },
    E: { x: 560, y: 150, t: "∞", sub: "E" },
  },
  edges: [["A","B"],["A","C"],["C","B"],["B","D"],["C","D"],["D","E"]],
  frames: [
    { scene: `<span class="kicker">Why this example</span><p>A delivery van leaves depot A. Roads have travel times in minutes, and the question is the <b>fastest time</b> to every stop.</p><table><tr><td>roads</td><td>A–B 4, A–C 1, C–B 2</td></tr><tr><td></td><td>B–D 5, C–D 8, D–E 3</td></tr><tr><td>fewest roads to B</td><td>1 road, 4 minutes</td></tr><tr><td>fastest to B</td><td>A–C–B, 3 minutes</td></tr></table><p>Goal: find every fastest time, including the ones that beat the direct road.</p>`,
      cap: "The big number in each circle is the best time known so far; the letter is the stop. Numbers on lines are road times. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Ek delivery van depot A se nikalti hai. Sadkon ke travel times minutes mein hain, aur sawaal har stop tak <b>sabse tez time</b> ka hai.</p><table><tr><td>sadkein</td><td>A–B 4, A–C 1, C–B 2</td></tr><tr><td></td><td>B–D 5, C–D 8, D–E 3</td></tr><tr><td>B tak sabse kam sadkein</td><td>1 sadak, 4 minute</td></tr><tr><td>B tak sabse tez</td><td>A–C–B, 3 minute</td></tr></table><p>Goal: har sabse tez time nikaalna, un samet jo seedhi sadak ko haraate hain.</p>`,
            cap: "Har circle ka bada number ab tak ka best time hai; letter stop hai. Lines par numbers sadak ke times hain. Next dabao." } },

    { on: ["A"], out: "start: A is 0 minutes, the rest unknown",
      cap: "Every stop holds the best time found <i>so far</i>, starting at ∞ because nothing has been looked at. The depot is 0.",
      ask: { q: "Finish A: check each road out of it. What are B and C now?", opts: ["B = 4, C = 1", "B = 1, C = 4"], a: 0,
             why: "0 + 4 = 4 for B and 0 + 1 = 1 for C, each beating ∞." },
      hi: { out: "shuru: A 0 minute, baaki pata nahi",
            cap: "Har stop ab tak mila best time rakhta hai, ∞ se shuru kyunki kuch dekha nahi gaya. Depot 0 hai.",
            ask: { q: "A khatam karo: usse nikalti har sadak check karo. Ab B aur C kya hain?", opts: ["B = 4, C = 1", "B = 1, C = 4"],
                   why: "B ke liye 0 + 4 = 4 aur C ke liye 0 + 1 = 1, dono ∞ se behtar." } } },

    { t: { B: "4", C: "1" }, on: ["A"], hot: ["B","C"], edge: [["A","B"],["A","C"]], out: "finish A: B = 4, C = 1",
      cap: "That check, “does going through A beat the current best?”, is <b>relaxation</b>. It is the whole algorithm, repeated.",
      ask: { q: "Which stop is finished next?", opts: ["C, the cheapest unfinished at 1", "B, since it was found first"], a: 0,
             why: "Always take the cheapest unfinished stop. That is what the heap is for." },
      hi: { out: "A khatam: B = 4, C = 1",
            cap: "Yeh check, “kya A se hokar jaana current best se behtar hai?”, <b>relaxation</b> hai. Poora algorithm yahi, baar baar.",
            ask: { q: "Agla kaunsa stop khatam hoga?", opts: ["C, sabse sasta adhoora, 1 par", "B, kyunki pehle mila"],
                   why: "Hamesha sabse sasta adhoora stop lo. Heap isi ke liye hai." } } },

    { t: { B: "4", C: "1" }, on: ["A","C"], dim: ["E"], out: "take C at 1, not B at 4",
      cap: "C is the cheapest unfinished stop. Nothing can reach C more cheaply later, because every other route starts from something that already costs at least 1.",
      ask: { q: "C has a road to B taking 2 minutes. Does B change?", opts: ["yes: 1 + 2 = 3 beats 4", "no: B already has a time"], a: 0,
             why: "A value is only a best-so-far. A cheaper route overwrites it." },
      hi: { out: "C lo, 1 par, B nahi, 4 par",
            cap: "C sabse sasta adhoora stop hai. Baad mein C tak isse sasta koi nahi pahunch sakta. Har doosra raasta aisi jagah se shuru hota hai jo pehle hi kam se kam 1 ki hai.",
            ask: { q: "C se B tak 2 minute ki sadak hai. Kya B badlega?", opts: ["haan: 1 + 2 = 3, 4 se behtar", "nahi: B ka time pehle se hai"],
                   why: "Value sirf ab tak ki best hai. Sasta raasta use mita deta hai." } } },

    { t: { B: "3", C: "1", D: "9" }, on: ["C"], hot: ["B","D"], edge: [["C","B"],["C","D"]], out: "B improves: 1 + 2 = 3, beating 4. D = 1 + 8 = 9",
      cap: "<b>The payoff.</b> The direct road said 4; going through C says 3, and the old value is overwritten. BFS could never notice, because it counts roads, not minutes.",
      ask: { q: "Next, B is finished at 3. Its road to D takes 5. What is D now?", opts: ["8: 3 + 5 beats 9", "9: it stays"], a: 0,
             why: "3 + 5 = 8, which is better than the 9 found through C." },
      hi: { out: "B sudhra: 1 + 2 = 3, 4 se behtar. D = 1 + 8 = 9",
            cap: "<b>Fayda yahi hai.</b> Seedhi sadak ne 4 kaha; C se jaana 3 kehta hai, aur purani value mit jaati hai. BFS yeh kabhi nahi dekh sakta, kyunki woh sadkein ginta hai, minute nahi.",
            ask: { q: "Agla B 3 par khatam hota hai. Uski D tak ki sadak 5 ki hai. D ab kya hai?", opts: ["8: 3 + 5, 9 se behtar", "9: waisa hi"],
                   why: "3 + 5 = 8, jo C se mile 9 se behtar hai." } } },

    { t: { B: "3", C: "1", D: "8" }, on: ["B"], hot: ["D"], edge: [["B","D"]], out: "finish B at 3: D improves to 3 + 5 = 8",
      cap: "D improved a second time. It is still unfinished, so it could improve again; it is final only when it is the cheapest one left.",
      hi: { out: "B 3 par khatam: D sudhar kar 3 + 5 = 8",
            cap: "D doosri baar sudhra. Woh abhi adhoora hai, to phir sudhar sakta hai; final tabhi jab bache hue mein sabse sasta ho." } },

    { t: { B: "3", C: "1", D: "8", E: "11" }, on: ["A","B","C","D","E"], out: "final: A 0, B 3, C 1, D 8, E 11",
      cap: "D is finished at 8, and E becomes 8 + 3 = 11. Every stop is final. With a heap this is <b>O((<var>V</var> + <var>E</var>) log <var>V</var>)</b>: about 8.5 × 10⁶ steps for a city of 10⁵ junctions.",
      hi: { out: "final: A 0, B 3, C 1, D 8, E 11",
            cap: "D 8 par khatam, aur E 8 + 3 = 11 ban jaata hai. Har stop final. Heap ke saath yeh <b>O((<var>V</var> + <var>E</var>) log <var>V</var>)</b> hai: 10⁵ junctions ke shehar ke liye lagbhag 8.5 × 10⁶ steps." } },

    { t: { B: "3", C: "1", D: "8", E: "11" }, bad: ["C","B"], edge: [["C","B"]], out: "a negative road would break the promise",
      cap: "“Finished, therefore final” assumes every road <b>adds</b> time. Allow a negative road and a cheaper route can appear after you have committed. Dijkstra does not notice; it just returns a wrong answer. That is what Bellman-Ford is for.",
      hi: { out: "negative sadak vaada tod deti",
            cap: "“Khatam, isliye final” maanta hai ki har sadak time <b>jodti</b> hai. Negative sadak aane do aur commit karne ke baad sasta raasta aa sakta hai. Dijkstra dhyan nahi deta; bas galat answer deta hai. Bellman-Ford isi ke liye hai." } },
  ]
},

/* The same network's first four people, A to D, as a yes/no grid: the
   representation the adjacency list replaces, and why. */
"adjacency": {
  kind: "grid",
  arr: [["", "A", "B", "C", "D"],
        ["A", "0", "1", "0", "1"],
        ["B", "1", "0", "1", "0"],
        ["C", "0", "1", "0", "0"],
        ["D", "1", "0", "0", "0"]],
  frames: [
    { scene: `<span class="kicker">Why this example</span><p>The first four people of the same network, A to D, stored the other way: a grid with a 1 wherever two people are friends.</p><table><tr><td>A</td><td>knows B, D</td></tr><tr><td>B</td><td>knows A, C</td></tr><tr><td>C</td><td>knows B</td></tr></table><p>Goal: see what the grid is good at, and what it costs once the network has 10⁶ people.</p>`,
      cap: "Row and column labels are people. A 1 means they are friends. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Usi network ke pehle chaar log, A se D, doosre tareeke se rakhe hue: ek grid jisme jahan do log dost hain wahan 1.</p><table><tr><td>A</td><td>B, D ko jaanta hai</td></tr><tr><td>B</td><td>A, C ko jaanta hai</td></tr><tr><td>C</td><td>B ko jaanta hai</td></tr></table><p>Goal: dekhna ki grid kismein achha hai, aur 10⁶ logon ke network par iski keemat kya hai.</p>`,
            cap: "Row aur column labels log hain. 1 matlab dost hain. Next dabao." } },

    { on: [[1,2],[2,1]], out: "grid[A][B] = 1: there is an edge",
      cap: "A <b>V × V grid</b> with a 1 for every edge. “Do A and B know each other?” is one lookup. Friendship goes both ways, so the grid mirrors across its diagonal.",
      ask: { q: "For 10⁶ people, how many cells does the grid need?", opts: ["10¹²", "about 2 × 10⁶"], a: 0,
             why: "One cell for every pair: 10⁶ × 10⁶, whether or not they are friends." },
      hi: { out: "grid[A][B] = 1: edge hai",
            cap: "Har edge ke liye 1 wala <b>V × V grid</b>. “Kya A aur B ek doosre ko jaante hain?” ek lookup. Dosti dono taraf hai, to grid diagonal ke paar aaine jaisa hai.",
            ask: { q: "10⁶ logon ke liye grid ko kitne cells chahiye?", opts: ["10¹²", "lagbhag 2 × 10⁶"],
                   why: "Har pair ka ek cell: 10⁶ × 10⁶, dost hon ya na hon." } } },

    { dim: [[1,1],[1,3],[2,2],[2,4],[3,1],[3,3],[3,4],[4,2],[4,3],[4,4]], hot: [[1,2],[1,4],[2,1],[2,3],[3,2],[4,1]], out: "6 ones, 10 zeros, even this small",
      cap: "Here is the bill: <b>O(<var>V</var>²) space however few edges exist</b>. Real networks are sparse, so the grid stores mostly zeros. A million people means a trillion cells.",
      hi: { out: "6 ones, 10 zeros, itne chhote mein bhi",
            cap: "Yeh raha bill: <b>O(<var>V</var>²) space, edges kitne bhi kam hon</b>. Asli networks sparse hain, to grid zyadatar zeros rakhta hai. Das lakh log matlab ek trillion cells." } },

    { hot: [[2,1],[2,2],[2,3],[2,4]], out: "B's friends: scan all 4 cells of row B",
      cap: "So use an <b>adjacency list</b>, unless the graph is dense or you keep testing specific pairs. Listing someone's friends is O(<var>V</var>) in a grid and O(degree) in a list, and listing friends is what a walk does all day.",
      hi: { out: "B ke dost: row B ke saare 4 cells scan",
            cap: "To <b>adjacency list</b> lo, jab tak graph dense na ho ya baar baar khaas pairs test na karne hon. Kisi ke dost ginwana grid mein O(<var>V</var>) aur list mein O(degree) hai, aur walk din bhar yahi karti hai." } },
  ]
},

});

/* ---- prefix sums, backtracking, and dynamic programming ---- */
Object.assign(VIZ, {

"prefix-sums": { kind: "cells", arr: ["3","1","4","1","5"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>Five days of steps, in thousands: <code>3, 1, 4, 1, 5</code>. Questions arrive about any stretch of days.</p><table><tr><td>days 1 to 3</td><td>1 + 4 + 1 = 6</td></tr><tr><td>running totals</td><td>0, 3, 4, 8, 9, 14</td></tr><tr><td>stretches adding to 5</td><td>3 of them</td></tr></table><p>Small enough to check every sum by hand. Goal: answer any stretch with one subtraction, then count the stretches that add to 5 in a single pass.</p>`,
    cap: "The boxes are the days, with day numbers underneath. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Paanch din ke steps, hazaar mein: <code>3, 1, 4, 1, 5</code>. Sawaal dinon ke kisi bhi hisse par aate hain.</p><table><tr><td>din 1 se 3</td><td>1 + 4 + 1 = 6</td></tr><tr><td>running totals</td><td>0, 3, 4, 8, 9, 14</td></tr><tr><td>5 tak judne wale hisse</td><td>unme se 3</td></tr></table><p>Itna chhota ki har sum haath se check ho. Goal: kisi bhi hisse ka answer ek subtraction se dena, phir ek pass mein 5 tak judne wale hisse ginna.</p>`,
          cap: "Boxes din hain, neeche din ke number. Next dabao." } },

  { band: [1, 3], out: "sum a[1..3] = 1 + 4 + 1 = 6",
    cap: "One range sum is easy. The trouble is being asked a million of them, because each one costs another walk: <b>O(<var>n</var>) per query</b>.",
    ask: { q: "Answering 10⁶ queries on 10⁶ days by adding each range: roughly how many additions?", opts: ["up to 10¹²", "about 2 × 10⁶"], a: 0,
           why: "Each query can walk up to 10⁶ days, and there are 10⁶ queries." },
    hi: { out: "sum a[1..3] = 1 + 4 + 1 = 6",
          cap: "Ek range sum aasaan hai. Mushkil das lakh poochhe jaana hai, kyunki har ek ek aur walk hai: <b>har query O(<var>n</var>)</b>.",
          ask: { q: "10⁶ dinon par 10⁶ queries, har range jod kar: lagbhag kitne additions?", opts: ["10¹² tak", "lagbhag 2 × 10⁶"],
                 why: "Har query 10⁶ din tak chal sakti hai, aur 10⁶ queries hain." } } },

  { arr: ["0","?","?","?","?","?"], on: [0], dim: [1, 2, 3, 4, 5], out: "pre[0] = 0: the empty prefix",
    cap: "So pay once. <b>pre[<var>i</var>] = the sum of the first <var>i</var> days</b>, with <var>n</var> + 1 slots. Starting with a zero looks fussy, and it is why no range ever needs a special case.",
    ask: { q: "pre[<var>i</var> + 1] = pre[<var>i</var>] + a[<var>i</var>]. What is pre[3]?", opts: ["8", "4"], a: 0,
           why: "The first 3 days: 3 + 1 + 4 = 8." },
    hi: { out: "pre[0] = 0: khaali prefix",
          cap: "To ek baar keemat do. <b>pre[<var>i</var>] = pehle <var>i</var> dinon ka sum</b>, <var>n</var> + 1 slots ke saath. Zero se shuru karna nakhra lagta hai, aur isi se kisi range ko special case nahi chahiye.",
          ask: { q: "pre[<var>i</var> + 1] = pre[<var>i</var>] + a[<var>i</var>]. pre[3] kya hai?", opts: ["8", "4"],
                 why: "Pehle 3 din: 3 + 1 + 4 = 8." } } },

  { arr: ["0","3","4","8","9","14"], on: [0, 1, 2, 3, 4, 5], out: "one pass: pre = 0 3 4 8 9 14",
    cap: "Filling it is a single scan, <b>O(<var>n</var>) once</b>. Now every question about a stretch of days is a subtraction.",
    hi: { out: "ek pass: pre = 0 3 4 8 9 14",
          cap: "Bharna ek scan hai, <b>ek baar O(<var>n</var>)</b>. Ab dinon ke kisi bhi hisse ka sawaal ek subtraction hai." } },

  { arr: ["0","3","4","8","9","14"], hot: [4], bad: [1], ptr: { "pre[4]": 4, "pre[1]": 1 },
    out: "sum a[1..3] = pre[4] - pre[1] = 9 - 3 = 6",
    cap: "Everything up to day 3, minus everything before day 1, leaves exactly days 1 to 3. <b>O(1) per query</b>, however wide the range.",
    ask: { q: "Which subtraction gives the sum of days 0 to 2?", opts: ["pre[3] − pre[0]", "pre[2] − pre[0]"], a: 0,
           why: "Days 0 to 2 are the first 3 days, pre[3] = 8, and nothing comes before day 0: 8 − 0 = 8." },
    hi: { out: "sum a[1..3] = pre[4] - pre[1] = 9 - 3 = 6",
          cap: "Din 3 tak sab, minus din 1 se pehle ka sab, theek din 1 se 3 chhodta hai. <b>Har query O(1)</b>, range kitni bhi chaudi.",
          ask: { q: "Kaunsa subtraction din 0 se 2 ka sum deta hai?", opts: ["pre[3] − pre[0]", "pre[2] − pre[0]"],
                 why: "Din 0 se 2 pehle 3 din hain, pre[3] = 8, aur din 0 se pehle kuch nahi: 8 − 0 = 8." } } },

  { arr: ["0","3","4","8","9","14"], on: [2], hot: [4], dim: [0, 1, 3, 5], out: "k = 5: at total 9, look up 9 - 5 = 4. Seen once",
    cap: "Now count stretches that add to <var>k</var> = 5. A stretch is a pair of totals 5 apart. Sweep once, and at each total ask a <b>hash map</b> how many earlier totals were exactly 5 less. At 9, the earlier 4 pairs up: days 2 to 3.",
    ask: { q: "The next total is 14. Which earlier total pairs with it?", opts: ["9", "4"], a: 0,
           why: "14 − 9 = 5: day 4 alone, the 5." },
    hi: { out: "k = 5: total 9 par 9 - 5 = 4 dhoondho. Ek baar mila",
          cap: "Ab 5 tak judne wale hisse gino, <var>k</var> = 5. Ek hissa 5 ke farak wale do totals ka pair hai. Ek baar chalo, aur har total par <b>hash map</b> se poochho ki kitne pichhle totals theek 5 kam the. 9 par pichhla 4 jodi banata hai: din 2 se 3.",
          ask: { q: "Agla total 14 hai. Kaunsa pichhla total uske saath jodi banata hai?", opts: ["9", "4"],
                 why: "14 − 9 = 5: akela din 4, yaani 5." } } },

  { arr: ["0","3","4","8","9","14"], on: [1, 2, 3, 4, 5], out: "3 stretches: [1, 4], [4, 1], [5]. One pass",
    cap: "Pairs 3 and 8, 4 and 9, 9 and 14: three stretches, found in <b>O(<var>n</var>)</b> instead of checking all O(<var>n</var>²) of them. It works with negative numbers, which a sliding window cannot handle. Start the map with {0: 1}, or stretches from day 0 are missed.",
    hi: { out: "3 hisse: [1, 4], [4, 1], [5]. Ek pass",
          cap: "Pairs 3 aur 8, 4 aur 9, 9 aur 14: teen hisse, saare O(<var>n</var>²) check karne ki jagah <b>O(<var>n</var>)</b> mein. Yeh negative numbers ke saath chalta hai, jo sliding window nahi sambhal sakta. Map {0: 1} se shuru karo, warna din 0 se shuru hisse chhoot jaate hain." } },
]},

/* Songs of 1, 2 and 3 minutes into a 3-minute gap. Every node is a set with
   its total; children add a song to the right of the last one taken. Three
   nodes are cut before they are built, and two are answers. */
"backtracking": {
  kind: "tree", w: 480, h: 320,
  nodes: {
    r:    { x: 240, y: 34,  t: "{}: 0",       w: 74 },
    a1:   { x: 115, y: 108, t: "{1}: 1",      w: 80 },
    a2:   { x: 300, y: 108, t: "{2}: 2",      w: 80 },
    a3:   { x: 420, y: 108, t: "{3}: 3",      w: 80 },
    b12:  { x: 62,  y: 182, t: "{1,2}: 3",    w: 96 },
    b13:  { x: 172, y: 182, t: "{1,3}: 4",    w: 96 },
    b23:  { x: 300, y: 182, t: "{2,3}: 5",    w: 96 },
    c123: { x: 64,  y: 256, t: "{1,2,3}: 6",  w: 116 },
  },
  edges: [["r","a1"],["r","a2"],["r","a3"],["a1","b12"],["a1","b13"],["a2","b23"],["b12","c123"]],
  frames: [
    { scene: `<span class="kicker">Why this example</span><p>Three songs, of 1, 2 and 3 minutes, and a gap of exactly 3 minutes. List every set of songs that fills it.</p><table><tr><td>possible sets</td><td>2³ = 8</td></tr><tr><td>sets that fill 3 minutes</td><td>{1, 2} and {3}</td></tr><tr><td>at 40 songs</td><td>1.1 × 10¹² sets</td></tr></table><p>Small enough to draw every set, big enough to have a branch worth cutting. Goal: find both answers with one shared list, and see which sets are never built at all.</p>`,
      cap: "Each box is a set of songs and its total in minutes. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Teen songs, 1, 2 aur 3 minute ke, aur theek 3 minute ka gap. Har songs ka set batao jo ise bhare.</p><table><tr><td>possible sets</td><td>2³ = 8</td></tr><tr><td>3 minute bharne wale sets</td><td>{1, 2} aur {3}</td></tr><tr><td>40 songs par</td><td>1.1 × 10¹² sets</td></tr></table><p>Itna chhota ki har set bana sakein, itna bada ki ek branch kaatne layak ho. Goal: ek shared list se dono answers dhoondhna, aur dekhna kaunse sets kabhi bante hi nahi.</p>`,
            cap: "Har box songs ka ek set aur minutes mein uska total hai. Next dabao." } },

    { on: ["r"], dim: ["a1","a2","a3","b12","b13","b23","c123"],
      out: "8 sets = 2^3, as a tree of decisions",
      cap: "Every set of songs is one node. A node's children add one more song, always to the right of the last one taken. The tree is never stored: the search walks it with one list, the <b>path</b>.",
      ask: { q: "From {1}, which songs may be added next?", opts: ["2 or 3", "1, 2 or 3"], a: 0,
             why: "Only songs to the right of the last one taken. That rule stops {2, 1} from repeating {1, 2}." },
      hi: { out: "8 sets = 2^3, decisions ke tree ki tarah",
            cap: "Songs ka har set ek node hai. Node ke children ek aur song jodte hain, hamesha aakhri liye song ke right wala. Tree kabhi store nahi hota: search use ek list se chalta hai, <b>path</b>.",
            ask: { q: "{1} se aage kaunse songs jod sakte hain?", opts: ["2 ya 3", "1, 2 ya 3"],
                   why: "Sirf aakhri liye song ke right wale. Yahi rule {2, 1} ko {1, 2} dohraane se rokta hai." } } },

    { on: ["r","a1"], hot: ["b12"], dim: ["a2","a3","b13","b23","c123"], edge: [["r","a1"],["a1","b12"]],
      out: "choose 1, choose 2: total 3, record a copy of [1, 2]",
      cap: "Choose 1, recurse, choose 2, recurse. The total is exactly 3, so record the answer, as a <b>copy</b>: the path list is about to change.",
      ask: { q: "Adding 3 to {1, 2} makes 6. Is anything below {1, 2, 3} worth visiting?", opts: ["no: more songs only raise the total", "yes: it might come back down"], a: 0,
             why: "Every song lasts more than 0 minutes, so a total over 3 stays over 3." },
      hi: { out: "1 chuno, 2 chuno: total 3, [1, 2] ki copy record",
            cap: "1 chuno, recurse, 2 chuno, recurse. Total theek 3, to answer record karo, <b>copy</b> ki tarah: path list badalne wali hai.",
            ask: { q: "{1, 2} mein 3 jodne se 6. Kya {1, 2, 3} ke neeche kuch dekhne layak hai?", opts: ["nahi: aur songs total sirf badhaate hain", "haan: wapas neeche aa sakta hai"],
                   why: "Har song 0 se zyada minute ka hai, to 3 se upar ka total 3 se upar hi rehta hai." } } },

    { on: ["r","a1"], hot: ["b12"], bad: ["c123"], dim: ["a2","a3","b13","b23"], edge: [["r","a1"],["a1","b12"]],
      out: "exact fit: return, so {1,2,3} is never built",
      cap: "A set that already fills the gap returns at once, since any song added would push it over. So {1, 2, 3} is never created. Then pop 2 off the path: it is back to [1].",
      ask: { q: "From {1}, try 3 instead: 1 + 3 = 4. What happens?", opts: ["cut: 4 is over the gap", "build {1, 3}, and check it at the end"], a: 0,
             why: "Same rule. A set already over 3 can only grow, so it is rejected before it is built." },
      hi: { out: "theek fit: return, to {1,2,3} kabhi nahi banta",
            cap: "Jo set gap pehle hi bhar de woh turant return karta hai, kyunki koi bhi song jodna use upar le jaayega. To {1, 2, 3} kabhi nahi banta. Phir path se 2 pop karo: wapas [1].",
            ask: { q: "{1} se ab 3 try karo: 1 + 3 = 4. Kya hota hai?", opts: ["kaato: 4 gap se upar", "{1, 3} banao, aur end mein check"],
                   why: "Wahi rule. 3 se upar pahunch chuka set sirf badh sakta hai, to banne se pehle reject." } } },

    { on: ["r","a1"], hot: ["b12"], bad: ["c123","b13"], dim: ["a2","a3","b23"], edge: [["r","a1"]],
      out: "pop 2, try 3: total 4, cut. Pop 1.",
      cap: "Because 2 was popped, the path was [1] and the attempt was {1, 3}. Without the pop it would have been {1, 2, 3}. Then pop 1 too: the path is empty again, ready for {2}.",
      ask: { q: "{2} totals 2. Its only child, {2, 3}, would total 5. Is {2, 3} built?", opts: ["no", "yes"], a: 0,
             why: "5 is over 3, so it is cut exactly like {1, 3}." },
      hi: { out: "2 pop, 3 try: total 4, kaato. 1 pop.",
            cap: "2 pop hua tha, to path [1] tha aur koshish {1, 3} ki thi. Pop ke bina woh {1, 2, 3} hota. Phir 1 bhi pop: path phir khaali, {2} ke liye taiyaar.",
            ask: { q: "{2} ka total 2. Uska akela child, {2, 3}, 5 hota. Kya {2, 3} banta hai?", opts: ["nahi", "haan"],
                   why: "5, 3 se upar hai, to {1, 3} ki tarah hi kat-ta hai." } } },

    { on: ["r","a1","a2"], hot: ["b12","a3"], bad: ["c123","b13","b23"], edge: [["r","a1"],["a1","b12"],["r","a2"],["r","a3"]],
      out: "5 visited, 3 cut, 2 answers: [1, 2] and [3]",
      cap: "{3} totals 3: the second answer. The work is the number of nodes visited, so <b>pruning is the only lever</b>. Here it saved 3 of 8. On 40 songs, one cut near the top saves 2³⁸ nodes.",
      hi: { out: "5 dekhe, 3 kate, 2 answers: [1, 2] aur [3]",
            cap: "{3} ka total 3: doosra answer. Kaam dekhe gaye nodes ki ginti hai, to <b>pruning hi ek lever hai</b>. Yahan 8 mein se 3 bache. 40 songs par upar ki ek kaat 2³⁸ nodes bachaati hai." } },
  ]
},

"dp-fill": { kind: "cells", arr: ["1","1","?","?","?","?"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>Climb 5 stairs, taking 1 or 2 steps per move. The recursion page drew this as a tree; here it becomes a table.</p><table><tr><td>ways to climb 5</td><td>8</td></tr><tr><td>calls, plain recursion</td><td>15</td></tr><tr><td>different questions</td><td>6: ways(0) to ways(5)</td></tr><tr><td>at 50 stairs</td><td>4.1 × 10¹⁰ calls, 51 questions</td></tr></table><p>Goal: fill one small row of answers, and see that nothing in it is ever worked out twice.</p>`,
    cap: "Box <var>i</var> will hold ways(<var>i</var>), the number of ways to climb <var>i</var> stairs. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>5 stairs chadho, har move mein 1 ya 2 steps. Recursion page ne ise tree ki tarah banaya tha; yahan yeh table banta hai.</p><table><tr><td>5 chadhne ke tareeke</td><td>8</td></tr><tr><td>seedhe recursion ki calls</td><td>15</td></tr><tr><td>alag sawaal</td><td>6: ways(0) se ways(5)</td></tr><tr><td>50 stairs par</td><td>4.1 × 10¹⁰ calls, 51 sawaal</td></tr></table><p>Goal: answers ki ek chhoti row bharna, aur dekhna ki usme kuch bhi do baar nahi nikaala jaata.</p>`,
          cap: "Box <var>i</var> mein ways(<var>i</var>) hoga, <var>i</var> stairs chadhne ke tareekon ki ginti. Next dabao." } },

  { on: [0, 1], dim: [2, 3, 4, 5], out: "base: ways(0) = 1, ways(1) = 1",
    cap: "The last move was a 1 or a 2, so <b>ways(<var>i</var>) = ways(<var>i</var> − 1) + ways(<var>i</var> − 2)</b>. The base cases need no work: one way to climb nothing, one way to climb 1.",
    ask: { q: "Run as plain recursion, how many times does ways(5) end up calling ways(3)?", opts: ["2", "1"], a: 0,
           why: "Once directly, and once inside ways(4). ways(2) is worked out 3 times. That repetition is what the table removes." },
    hi: { out: "base: ways(0) = 1, ways(1) = 1",
          cap: "Aakhri move 1 tha ya 2, to <b>ways(<var>i</var>) = ways(<var>i</var> − 1) + ways(<var>i</var> − 2)</b>. Base cases ko kaam nahi chahiye: kuch na chadhne ka ek tareeka, 1 chadhne ka ek.",
          ask: { q: "Seedhe recursion ki tarah chalao, to ways(5) kitni baar ways(3) ko bulaata hai?", opts: ["2", "1"],
                 why: "Ek baar seedhe, ek baar ways(4) ke andar. ways(2) 3 baar nikaala jaata hai. Table yahi dohraav hataata hai." } } },

  { arr: ["1","1","2","?","?","?"], on: [0, 1], hot: [2], dim: [3, 4, 5], out: "ways(2) = ways(1) + ways(0) = 2",
    cap: "Write each answer down the first time. Filled left to right, this is <b>bottom-up</b>. The same numbers found by recursion plus a cache is <b>top-down</b>. Same table, opposite direction.",
    ask: { q: "Filling left to right, is ways(<var>i</var> − 1) always ready when ways(<var>i</var>) needs it?", opts: ["yes", "no"], a: 0,
           why: "Every cell reads only cells to its left, and those were filled first. Choosing that order is the whole of bottom-up." },
    hi: { out: "ways(2) = ways(1) + ways(0) = 2",
          cap: "Har answer pehli baar likh lo. Left se right bharna <b>bottom-up</b> hai. Wahi numbers recursion plus cache se <b>top-down</b> hain. Wahi table, ulti disha.",
          ask: { q: "Left se right bharte hue, kya ways(<var>i</var>) ko chahiye tab ways(<var>i</var> − 1) hamesha taiyaar hai?", opts: ["haan", "nahi"],
                 why: "Har cell sirf apne left ke cells padhta hai, aur woh pehle bhare gaye. Wahi order chunna poora bottom-up hai." } } },

  { arr: ["1","1","2","3","?","?"], on: [1, 2], hot: [3], dim: [4, 5], out: "ways(3) = ways(2) + ways(1) = 3",
    cap: "Each cell is filled once, from two cells that are already final. Nothing is worked out again, and nothing is guessed.",
    ask: { q: "Two more cells to go. What is ways(5)?", opts: ["8", "7"], a: 0,
           why: "ways(4) = 3 + 2 = 5, then ways(5) = 5 + 3 = 8." },
    hi: { out: "ways(3) = ways(2) + ways(1) = 3",
          cap: "Har cell ek baar bharta hai, do pehle se final cells se. Kuch dobara nahi nikaala jaata, kuch guess nahi hota.",
          ask: { q: "Do cells aur. ways(5) kya hai?", opts: ["8", "7"],
                 why: "ways(4) = 3 + 2 = 5, phir ways(5) = 5 + 3 = 8." } } },

  { arr: ["1","1","2","3","5","8"], on: [0, 1, 2, 3, 4], hot: [5], out: "6 cells, 4 additions: O(n)",
    cap: "8 ways, from 6 cells and 4 additions, where the plain recursion made 15 calls. At 50 stairs it is 51 cells against 4.1 × 10¹⁰ calls. That is the entire trade: a little memory to stop repeating yourself.",
    ask: { q: "Which cells did the last addition, ways(5), actually read?", opts: ["ways(4) and ways(3)", "all five before it"], a: 0,
           why: "The recurrence only reaches two cells back. Everything further left was finished with long ago." },
    hi: { out: "6 cells, 4 additions: O(n)",
          cap: "8 tareeke, 6 cells aur 4 additions se, jahan seedhe recursion ne 15 calls ki. 50 stairs par 51 cells, 4.1 × 10¹⁰ calls ke saamne. Poora sauda yahi hai: dohraana band karne ke liye thodi memory.",
          ask: { q: "Aakhri addition, ways(5), ne asal mein kaunse cells padhe?", opts: ["ways(4) aur ways(3)", "usse pehle ke saare paanch"],
                 why: "Recurrence sirf do cells peeche jaata hai. Usse aage left ka sab kab ka khatam." } } },

  { arr: ["1","1","2","3","5","8"], hot: [4, 5], dim: [0, 1, 2, 3], out: "keep only the last two: O(1) space",
    cap: "So the table can go. Keep two numbers, and slide them along: <b>O(<var>n</var>) time, O(1) space</b>. Reading off what a cell reads is the standard follow-up question, and needs no new idea.",
    hi: { out: "sirf aakhri do rakho: O(1) space",
          cap: "To table hata sakte ho. Do numbers rakho, aur unhe aage khiskaao: <b>O(<var>n</var>) time, O(1) space</b>. Cell kya padhta hai yeh dekhna standard follow-up hai, aur koi naya idea nahi chahiye." } },
]},

/* The same 5 stairs with one rule added: never two 2-steps in a row. The stair
   number alone no longer decides what comes next, so the state gains a row:
   row 0 is "arrived by a 1-step", row 1 "arrived by a 2-step". */
"dp-grid": {
  kind: "grid",
  arr: [["1","1","1","2","3","4"],
        ["0","0","1","1","1","2"]],
  frames: [
    { scene: `<span class="kicker">Why this example</span><p>The same 5 stairs, with one new rule: <b>never two 2-steps in a row</b>. Two of the 8 climbs break it.</p><table><tr><td>banned</td><td>2+2+1 and 1+2+2</td></tr><tr><td>allowed</td><td>6</td></tr><tr><td>climbs reaching stair 3</td><td>1+1+1, 2+1, 1+2</td></tr></table><p>From stair 3, a 2-step is fine after 1+1+1 or 2+1, and banned after 1+2. One number per stair cannot tell those apart. Goal: add the missing fact to the state.</p>`,
      cap: "Columns are stairs 0 to 5. Row 0 counts climbs whose last move was a 1-step, row 1 those whose last move was a 2-step. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Wahi 5 stairs, ek naye rule ke saath: <b>kabhi do 2-steps lagataar nahi</b>. 8 mein se do climbs ise todte hain.</p><table><tr><td>banned</td><td>2+2+1 aur 1+2+2</td></tr><tr><td>allowed</td><td>6</td></tr><tr><td>stair 3 tak ke climbs</td><td>1+1+1, 2+1, 1+2</td></tr></table><p>Stair 3 se 2-step 1+1+1 ya 2+1 ke baad theek hai, aur 1+2 ke baad banned. Har stair ka ek number inhe alag nahi kar sakta. Goal: state mein kami wali baat jodna.</p>`,
            cap: "Columns stairs 0 se 5 hain. Row 0 un climbs ko ginti hai jinka aakhri move 1-step tha, row 1 jinka 2-step. Next dabao." } },

    { arr: [["1","1","?","?","?","?"],["0","0","?","?","?","?"]],
      on: [[0,0],[0,1],[1,0],[1,1]], dim: [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5]],
      out: "state: (stair, last move)",
      cap: "The start counts as row 0, so a 2-step may come first. Stair 1 is reached one way, by a 1-step. A cell now answers a sharper question: climbs to this stair <b>that ended this way</b>.",
      ask: { q: "Climbs reaching stair 3 are 1+1+1, 2+1 and 1+2. From which may the next move be a 2-step?", opts: ["1+1+1 and 2+1", "all three"], a: 0,
             why: "1+2 ended with a 2-step, so another is banned. ways(3) = 3 cannot say which of its 3 climbs that is." },
      hi: { out: "state: (stair, aakhri move)",
            cap: "Start row 0 mein gina jaata hai, to pehla move 2-step ho sakta hai. Stair 1 tak ek hi tareeka, 1-step se. Ab cell ek tez sawaal ka answer hai: is stair tak ke climbs <b>jo is tarah khatam hue</b>.",
            ask: { q: "Stair 3 tak ke climbs 1+1+1, 2+1 aur 1+2 hain. Kisse agla move 2-step ho sakta hai?", opts: ["1+1+1 aur 2+1", "teeno"],
                   why: "1+2 2-step par khatam hua, to ek aur banned. ways(3) = 3 nahi bata sakta ki uske 3 climbs mein woh kaunsa hai." } } },

    { arr: [["1","1","1","?","?","?"],["0","0","1","?","?","?"]],
      on: [[0,0],[0,1],[1,1]], hot: [[0,2],[1,2]], dim: [[0,3],[0,4],[0,5],[1,3],[1,4],[1,5]],
      out: "row 0 = both rows one left. row 1 = row 0 two left",
      cap: "A 1-step may follow anything: <b>row 0 = row 0 + row 1, one stair back</b>. A 2-step may only follow a 1-step: <b>row 1 = row 0, two stairs back</b>. Stair 2: 1 + 0 = 1 and 1.",
      ask: { q: "Row 0 at stair 3 is row 0 + row 1 at stair 2. What is it?", opts: ["2", "1"], a: 0,
             why: "1 + 1 = 2: the climbs 1+1+1 and 2+1." },
      hi: { out: "row 0 = ek peeche dono rows. row 1 = do peeche row 0",
            cap: "1-step kisi ke bhi baad aa sakta hai: <b>row 0 = row 0 + row 1, ek stair peeche</b>. 2-step sirf 1-step ke baad: <b>row 1 = row 0, do stairs peeche</b>. Stair 2: 1 + 0 = 1 aur 1.",
            ask: { q: "Stair 3 par row 0, stair 2 par row 0 + row 1 hai. Kya hai?", opts: ["2", "1"],
                   why: "1 + 1 = 2: climbs 1+1+1 aur 2+1." } } },

    { on: [[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[1,1],[1,2],[1,3],[1,4]], hot: [[0,5],[1,5]],
      out: "stair 5: 4 + 2 = 6 climbs, as counted by hand",
      cap: "Stair 5 holds 4 climbs ending in a 1-step and 2 ending in a 2-step: 6, the 8 minus the 2 banned. The cost is still states × work: 2 × 6 cells, one addition each.",
      ask: { q: "Each column reads only the two columns before it. What must be kept while filling?", opts: ["the last two columns", "the whole grid"], a: 0,
             why: "At most two rows × two columns: 4 numbers. The same space reduction as before, with a state twice as wide." },
      hi: { out: "stair 5: 4 + 2 = 6 climbs, haath se gine jaise",
            cap: "Stair 5 par 4 climbs 1-step par khatam aur 2 climbs 2-step par: 6, 8 mein se 2 banned ghata kar. Cost ab bhi states × kaam: 2 × 6 cells, har ek mein ek addition.",
            ask: { q: "Har column sirf pichhle do columns padhta hai. Bharte waqt kya rakhna padega?", opts: ["aakhri do columns", "poora grid"],
                   why: "Zyada se zyada do rows × do columns: 4 numbers. Pehle jaisa hi space kam karna, bas state dugni chaudi." } } },

    { hot: [[0,4],[1,4],[0,5],[1,5]], dim: [[0,0],[0,1],[0,2],[0,3],[1,0],[1,1],[1,2],[1,3]],
      out: "keep two columns: O(1) space",
      cap: "The lesson of the page in one grid: when the answers come out wrong with no error, <b>suspect the state</b>. One missing fact, here the last move, and a single cell was mixing allowed and banned climbs.",
      hi: { out: "do columns rakho: O(1) space",
            cap: "Page ki seekh ek grid mein: jab answers bina error ke galat aayein, <b>state par shak karo</b>. Ek kami wali baat, yahan aakhri move, aur ek cell allowed aur banned climbs mila raha tha." } },
  ]
},

});

/* ---- a trie: the shared prefix IS the shared path ---- */
Object.assign(VIZ, {
/* The dictionary car, cart, care, dog, built one word at a time, then asked
   the two questions that matter: is "ca" a word, and what starts with "car"? */
"trie": {
  kind: "tree", w: 570, h: 330,
  nodes: {
    root: { x: 300, y: 34,  t: "●", w: 44, hidden: true },
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
    { scene: `<span class="kicker">Why this example</span><p>An autocomplete box. Type <code>car</code>, and it should offer every stored word that starts that way.</p><table><tr><td>dictionary</td><td>car, cart, care, dog</td></tr><tr><td>typed so far</td><td>car</td></tr><tr><td>should offer</td><td>car, cart, care</td></tr></table><p>A hash set would test all four words, and with 10⁶ words that is 10⁶ tests per keystroke. Goal: answer with a walk of 3 steps, one per typed letter.</p>`,
      cap: "The dot at the top is the root, the empty prefix. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Ek autocomplete box. <code>car</code> type karo, aur woh har stored word dikhaye jo aise shuru hota hai.</p><table><tr><td>dictionary</td><td>car, cart, care, dog</td></tr><tr><td>ab tak type</td><td>car</td></tr><tr><td>dikhana chahiye</td><td>car, cart, care</td></tr></table><p>Hash set chaaron words test karta, aur 10⁶ words ke saath yeh har keystroke par 10⁶ tests. Goal: 3 steps ki walk se answer, har typed letter ka ek.</p>`,
            cap: "Upar ka dot root hai, khaali prefix. Next dabao." } },

    { show: ["root","c","a","r"], on: ["c","a","r"], out: "insert \"car\": one node per letter",
      cap: "Each <b>edge</b> is a letter, so a node is not a letter: it is the whole prefix spelled by the path to it. The node marked <i>end</i> says a real word finishes here.",
      ask: { q: "Now insert \"cart\". How many new nodes does it need?", opts: ["1: the t", "4: c, a, r, t"], a: 0,
             why: "“cart” agrees with “car” for three letters, so it reuses that path." },
      hi: { out: "\"car\" insert: har letter ka ek node",
            cap: "Har <b>edge</b> ek letter hai, to node letter nahi: woh wahan tak ke raaste se bana poora prefix hai. <i>end</i> wala node batata hai ki yahan ek asli word khatam hota hai.",
            ask: { q: "Ab \"cart\" insert karo. Kitne naye nodes chahiye?", opts: ["1: t", "4: c, a, r, t"],
                   why: "“cart” teen letters tak “car” se agree karta hai, to wahi raasta dobara use karta hai." } } },

    { show: ["root","c","a","r","t"], on: ["c","a","r"], hot: ["t"], out: "insert \"cart\": one new node, not four",
      cap: "“cart” reuses c, a, r and adds a single node. <b>Shared prefixes are never paid for twice.</b>",
      hi: { out: "\"cart\" insert: ek naya node, chaar nahi",
            cap: "“cart” c, a, r dobara use karta hai aur sirf ek node jodta hai. <b>Shared prefixes ki keemat kabhi do baar nahi.</b>" } },

    { show: ["root","c","a","r","t","e"], on: ["c","a","r"], hot: ["e"], out: "insert \"care\": again, one new node",
      cap: "Three words, one spine. The likeness that a hash table deliberately destroys is exactly what this structure is built from.",
      ask: { q: "Insert \"dog\". How much of the existing trie can it share?", opts: ["nothing: a new branch", "the c branch"], a: 0,
             why: "“dog” starts with d, and no stored word does, so it shares nothing." },
      hi: { out: "\"care\" insert: phir ek naya node",
            cap: "Teen words, ek reedh. Jo milaap hash table jaan-boojh kar mitaata hai, yeh structure theek usi se bana hai.",
            ask: { q: "\"dog\" insert karo. Maujooda trie ka kitna hissa share kar sakta hai?", opts: ["kuch nahi: nayi branch", "c wali branch"],
                   why: "“dog” d se shuru hota hai, aur koi stored word nahi, to kuch share nahi karta." } } },

    { show: ["root","c","a","r","t","e","d","o","g"], on: ["d","o","g"], dim: ["c","a","r","t","e"], out: "insert \"dog\": nothing shared",
      cap: "No shared prefix means a separate branch. A trie is only compact when the words really overlap: the honest limit of the idea.",
      ask: { q: "search(\"ca\"): you walk c, then a, and arrive at a real node. Is \"ca\" a stored word?", opts: ["no: that node is not marked end", "yes: the node exists"], a: 0,
             why: "The node exists because “car” passed through it. Only nodes marked end are words." },
      hi: { out: "\"dog\" insert: kuch shared nahi",
            cap: "Shared prefix nahi, to alag branch. Trie tabhi chhota hai jab words sach mein overlap karein: idea ki imaandaar hadd.",
            ask: { q: "search(\"ca\"): c, phir a chalte ho, aur ek asli node par pahunchte ho. Kya \"ca\" stored word hai?", opts: ["nahi: node end marked nahi", "haan: node hai"],
                   why: "Node isliye hai kyunki “car” usse guzra. Sirf end marked nodes words hain." } } },

    { show: ["root","c","a","r","t","e","d","o","g"], on: ["c"], bad: ["a"], dim: ["r","t","e","d","o","g"], out: "search \"ca\": node exists, not an end",
      cap: "Reaching a node only proves the <b>prefix</b> exists. Without the end flag, the trie would claim to contain “ca”: the first bug everyone writes.",
      ask: { q: "startsWith(\"car\"): walk c, a, r. What do you collect below?", opts: ["car, cart, care", "only car"], a: 0,
             why: "Every end-marked node at or below “car” is a word with that prefix." },
      hi: { out: "search \"ca\": node hai, end nahi",
            cap: "Node par pahunchna sirf <b>prefix</b> ka hona saabit karta hai. End flag ke bina trie daava karta ki “ca” hai: pehla bug jo sab likhte hain.",
            ask: { q: "startsWith(\"car\"): c, a, r chalo. Neeche kya jama karoge?", opts: ["car, cart, care", "sirf car"],
                   why: "“car” par ya uske neeche har end-marked node us prefix wala word hai." } } },

    { show: ["root","c","a","r","t","e","d","o","g"], on: ["c","a","r"], hot: ["t","e"], dim: ["d","o","g"], out: "prefix \"car\": car, cart, care",
      cap: "Autocomplete is exactly this: walk the prefix, then collect what hangs below. The cost is <b>the length of the prefix</b> plus the answers, and not the number of words stored.",
      hi: { out: "prefix \"car\": car, cart, care",
            cap: "Autocomplete theek yahi hai: prefix chalo, phir neeche latka hua jama karo. Cost <b>prefix ki length</b> plus answers hai, stored words ki ginti nahi." } },
  ]
},

});

/* ---- greedy, union-find, topological order, monotonic stack ---- */
Object.assign(VIZ, {

/* Five room bookings over hours 0 to 8, one row each: A 0-6, B 1-3, C 3-5,
   D 2-7, E 6-8. Column c is the hour from c to c + 1. Earliest start keeps
   2; earliest finish keeps 3, which is the most possible. */
"greedy": {
  kind: "grid",
  arr: [["A","A","A","A","A","A","",""],
        ["","B","B","","","","",""],
        ["","","","C","C","","",""],
        ["","","D","D","D","D","D",""],
        ["","","","","","","E","E"]],
  frames: [
    { scene: `<span class="kicker">Why this example</span><p>One meeting room and five requests. Accept as many as possible, with no two overlapping. A meeting ending at 3 and one starting at 3 do not clash.</p><table><tr><td>A</td><td>0 to 6</td></tr><tr><td>B</td><td>1 to 3</td></tr><tr><td>C</td><td>3 to 5</td></tr><tr><td>D</td><td>2 to 7</td></tr><tr><td>E</td><td>6 to 8</td></tr></table><p>Five is enough for a plausible rule to lose a booking. Goal: try two rules that look equally sensible, and see why only one is safe.</p>`,
      cap: "Rows are requests, columns are hours 0 to 7. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Ek meeting room aur paanch requests. Jitni ho sake utni accept karo, bina do ke takraaye. 3 par khatam hone wali aur 3 par shuru hone wali meeting nahi takraatin.</p><table><tr><td>A</td><td>0 se 6</td></tr><tr><td>B</td><td>1 se 3</td></tr><tr><td>C</td><td>3 se 5</td></tr><tr><td>D</td><td>2 se 7</td></tr><tr><td>E</td><td>6 se 8</td></tr></table><p>Paanch kaafi hain ki ek samajhdaar lagta rule ek booking kho de. Goal: do utne hi samajhdaar rules try karna, aur dekhna ki sirf ek safe kyun hai.</p>`,
            cap: "Rows requests hain, columns ghante 0 se 7. Next dabao." } },

    { on: [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[1,1],[1,2],[2,3],[2,4],[3,2],[3,3],[3,4],[3,5],[3,6],[4,6],[4,7]],
      out: "5 requests, 1 room: keep as many as possible",
      cap: "They overlap, so some must be refused. A greedy algorithm picks one rule, sorts by it, and never reconsiders. The whole question is which rule.",
      ask: { q: "Rule one: take whichever <b>starts</b> earliest. Which request is taken first?", opts: ["A", "B"], a: 0,
             why: "A starts at 0, before every other request." },
      hi: { out: "5 requests, 1 room: jitni ho sake rakho",
            cap: "Yeh takraati hain, to kuch mana karni padengi. Greedy algorithm ek rule chunta hai, usse sort karta hai, aur kabhi dobara nahi sochta. Poora sawaal hai kaunsa rule.",
            ask: { q: "Pehla rule: jo sabse pehle <b>shuru</b> ho woh lo. Pehle kaunsi request li jaati hai?", opts: ["A", "B"],
                   why: "A 0 par shuru hoti hai, har doosri request se pehle." } } },

    { on: [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[4,6],[4,7]], bad: [[1,1],[1,2],[2,3],[2,4],[3,2],[3,3],[3,4],[3,5],[3,6]],
      out: "earliest start: A, then only E fits. 2 bookings",
      cap: "A holds the room from 0 to 6, which blocks B, C and D. Only E, starting at 6, still fits. A plausible rule, and it has already lost a booking.",
      ask: { q: "Rule two: take whichever <b>finishes</b> earliest. Which request is taken first?", opts: ["B, ending at 3", "A, starting at 0"], a: 0,
             why: "B ends at 3, before C at 5, A at 6, D at 7 and E at 8." },
      hi: { out: "earliest start: A, phir sirf E fit. 2 bookings",
            cap: "A room 0 se 6 tak rakhti hai, jo B, C aur D ko rok deta hai. Sirf E, 6 par shuru, ab bhi fit. Samajhdaar lagta rule, aur ek booking pehle hi kho di.",
            ask: { q: "Doosra rule: jo sabse pehle <b>khatam</b> ho woh lo. Pehle kaunsi request li jaati hai?", opts: ["B, 3 par khatam", "A, 0 par shuru"],
                   why: "B 3 par khatam hoti hai, C 5, A 6, D 7 aur E 8 se pehle." } } },

    { hot: [[1,1],[1,2]], dim: [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[2,3],[2,4],[3,2],[3,3],[3,4],[3,5],[3,6],[4,6],[4,7]],
      out: "earliest finish: take B, the room is free from 3",
      cap: "Taking the earliest finisher leaves the room free as soon as possible, which leaves the most time for everything after it.",
      ask: { q: "C runs from 3 to 5, starting exactly when B ends. Does it clash with B?", opts: ["no", "yes"], a: 0,
             why: "One ends at 3 and the other starts at 3, so they share the room without overlapping." },
      hi: { out: "earliest finish: B lo, room 3 se khaali",
            cap: "Sabse pehle khatam hone wali lena room jitna jaldi ho sake khaali karta hai, jo baad wali sab ke liye sabse zyada samay chhodta hai.",
            ask: { q: "C 3 se 5 chalti hai, theek jab B khatam hoti hai. Kya yeh B se takraati hai?", opts: ["nahi", "haan"],
                   why: "Ek 3 par khatam, doosri 3 par shuru, to bina overlap room baant leti hain." } } },

    { on: [[1,1],[1,2]], hot: [[2,3],[2,4]], bad: [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[3,2],[3,3],[3,4],[3,5],[3,6]], dim: [[4,6],[4,7]],
      out: "take C. A and D start before 5: skip",
      cap: "Next by finish time: C at 5, which starts at 3 and fits. Then A and D, which start before 5, so they are skipped. One pass, nothing revisited.",
      ask: { q: "E runs from 6 to 8. Is it accepted?", opts: ["yes", "no"], a: 0,
             why: "It starts at 6, after C ends at 5." },
      hi: { out: "C lo. A aur D 5 se pehle shuru: chhodo",
            cap: "Finish time se agli: C, 5 par, jo 3 par shuru hoti hai aur fit hai. Phir A aur D, jo 5 se pehle shuru hoti hain, to chhodi jaati hain. Ek pass, kuch dobara nahi.",
            ask: { q: "E 6 se 8 chalti hai. Kya accept hoti hai?", opts: ["haan", "nahi"],
                   why: "Yeh 6 par shuru hoti hai, C ke 5 par khatam hone ke baad." } } },

    { on: [[1,1],[1,2],[2,3],[2,4]], hot: [[4,6],[4,7]], bad: [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[3,2],[3,3],[3,4],[3,5],[3,6]],
      out: "B, C, E: 3 bookings, and no schedule has 4",
      cap: "Why the rule is safe: take any best schedule and swap its first meeting for B. B ends no later, so everything else still fits, and the count is unchanged. That is the <b>exchange argument</b>, and it is the part the code cannot show.",
      hi: { out: "B, C, E: 3 bookings, aur kisi schedule mein 4 nahi",
            cap: "Rule safe kyun hai: koi bhi best schedule lo aur uski pehli meeting B se badlo. B kisi se baad mein khatam nahi hoti, to baaki sab ab bhi fit, aur ginti wahi. Yahi <b>exchange argument</b> hai, aur yeh woh hissa hai jo code nahi dikha sakta." } },
  ]
},

/* Machines 0 to 4, cables 0-1, 2-3, 1-3. Top row: each machine with an
   arrow to its parent. Bottom row: the parent array that is all there is. */
"union-find": {
  kind: "tree", w: 580, h: 260, arrows: true,
  nodes: {
    n0: { x: 80,  y: 60, t: "0" }, n1: { x: 180, y: 60, t: "1" },
    n2: { x: 280, y: 60, t: "2" }, n3: { x: 380, y: 60, t: "3" },
    n4: { x: 480, y: 60, t: "4" },
    p0: { x: 80,  y: 180, t: "0", sub: "parent[0]", w: 64, hidden: true },
    p1: { x: 180, y: 180, t: "0", sub: "parent[1]", w: 64, hidden: true },
    p2: { x: 280, y: 180, t: "0", sub: "parent[2]", w: 64, hidden: true },
    p3: { x: 380, y: 180, t: "0", sub: "parent[3]", w: 64, hidden: true },
    p4: { x: 480, y: 180, t: "4", sub: "parent[4]", w: 64, hidden: true },
  },
  frames: [
    { scene: `<span class="kicker">Why this example</span><p>Five machines. Cables are plugged in one at a time, and in between someone asks: <b>can <var>u</var> reach <var>v</var> yet?</b></p><table><tr><td>cables, in order</td><td>0–1, then 2–3, then 1–3</td></tr><tr><td>can 0 reach 2?</td><td>yes, via 1 and 3</td></tr><tr><td>can 4 reach anything?</td><td>no</td></tr></table><p>There is no cable 0–2, so a cable list cannot answer. Goal: answer in near-constant time by storing groups, not cables.</p>`,
      cap: "Each circle is a machine; an arrow points at its parent on the way to its group's leader. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Paanch machines. Cables ek ek karke lagti hain, aur beech mein koi poochhta hai: <b>kya <var>u</var> ab <var>v</var> tak pahunch sakti hai?</b></p><table><tr><td>cables, order mein</td><td>0–1, phir 2–3, phir 1–3</td></tr><tr><td>kya 0, 2 tak?</td><td>haan, 1 aur 3 se</td></tr><tr><td>kya 4 kahin tak?</td><td>nahi</td></tr></table><p>0–2 cable nahi hai, to cable list answer nahi de sakti. Goal: cables nahi, groups store karke lagbhag constant time mein answer.</p>`,
            cap: "Har circle ek machine hai; arrow group ke leader ki taraf uske parent ko point karta hai. Next dabao." } },

    { on: ["n0","n1","n2","n3","n4"], edges: [], out: "five machines, five groups: each is its own leader",
      cap: "Forget the cables. Store only <b>which group each machine is in</b>, as one leader per group. At the start every machine leads its own group of one.",
      ask: { q: "Cable 0–1 arrives: union(0, 1). What changes?", opts: ["one pointer: 1 now points at 0", "a cable is added to a list"], a: 0,
             why: "A union is one write. The cable itself is never stored." },
      hi: { out: "paanch machines, paanch groups: har ek apna leader",
            cap: "Cables bhool jao. Sirf yeh rakho ki <b>har machine kis group mein hai</b>, har group ka ek leader. Shuru mein har machine apne akele group ki leader hai.",
            ask: { q: "Cable 0–1 aati hai: union(0, 1). Kya badalta hai?", opts: ["ek pointer: 1 ab 0 ko point karti hai", "ek cable list mein judti hai"],
                   why: "Union ek write hai. Cable khud kabhi store nahi hoti." } } },

    { on: ["n0"], hot: ["n1"], edges: [["n1","n0"]], out: "union(0, 1): point 1 at 0",
      cap: "One write, and two groups are one: {0, 1} with leader 0. No edge list, no walk, nothing rebuilt.",
      hi: { out: "union(0, 1): 1 ko 0 par point karo",
            cap: "Ek write, aur do groups ek: leader 0 ke saath {0, 1}. Na edge list, na walk, kuch dobara nahi bana." } },

    { on: ["n0","n2"], hot: ["n3"], edges: [["n1","n0"],["n3","n2"]], out: "union(2, 3): a second group, leader 2",
      cap: "Groups grow independently: {0, 1} and {2, 3}. Nothing here knows the network's shape.",
      ask: { q: "Cable 1–3 arrives: union(1, 3). Which two machines get linked?", opts: ["their leaders, 0 and 2", "1 and 3 themselves"], a: 0,
             why: "Linking 1 and 3 directly would leave 3 with two parents and the groups half-joined. Always link the leaders." },
      hi: { out: "union(2, 3): doosra group, leader 2",
            cap: "Groups alag alag badhte hain: {0, 1} aur {2, 3}. Yahan kuch network ki shape nahi jaanta.",
            ask: { q: "Cable 1–3 aati hai: union(1, 3). Kaunsi do machines judengi?", opts: ["unke leaders, 0 aur 2", "khud 1 aur 3"],
                   why: "1 aur 3 ko seedha jodne se 3 ke do parents aur groups aadhe jude rehte. Hamesha leaders jodo." } } },

    { on: ["n0"], hot: ["n2"], edges: [["n1","n0"],["n3","n2"],["n2","n0"]], out: "union(1, 3): find(1) = 0, find(3) = 2: point 2 at 0",
      cap: "Find each machine's leader first, then link <b>the leaders</b>. Now 0, 1, 2 and 3 share leader 0. Can 0 reach 2? find(2) = 0 = find(0): yes, with no cable 0–2 anywhere.",
      hi: { out: "union(1, 3): find(1) = 0, find(3) = 2: 2 ko 0 par point",
            cap: "Pehle har machine ka leader dhoondho, phir <b>leaders</b> jodo. Ab 0, 1, 2 aur 3 ka leader 0. Kya 0, 2 tak pahunch sakti hai? find(2) = 0 = find(0): haan, kahin bhi 0–2 cable ke bina." } },

    { on: ["n0"], bad: ["n3","n2"], edges: [["n1","n0"],["n3","n2"],["n2","n0"]], out: "find(3) walks 3 -> 2 -> 0: chains like this grow",
      cap: "Left alone, the chains grow, and <b>find</b> slides towards O(<var>n</var>). Two small repairs fix it; the first is to hang the smaller group under the bigger when you merge.",
      ask: { q: "find(3) just walked 3 → 2 → 0. What should it do on the way back?", opts: ["point every machine it passed straight at 0", "leave the path as it is"], a: 0,
             why: "It has just learned the leader for each of them. Writing that down makes the next find one step." },
      hi: { out: "find(3) 3 -> 2 -> 0 chalta hai: aisi chains badhti hain",
            cap: "Chhod do to chains badhti hain, aur <b>find</b> O(<var>n</var>) ki taraf khisakta hai. Do chhote sudhaar ise theek karte hain; pehla hai merge par chhote group ko bade ke neeche latkana.",
            ask: { q: "find(3) abhi 3 → 2 → 0 chala. Wapas aate waqt kya karna chahiye?", opts: ["har guzri machine ko seedha 0 par point karo", "raasta waisa hi chhodo"],
                   why: "Use abhi har ek ka leader pata chala. Use likh dena agla find ek step ka bana deta hai." } } },

    { on: ["n0"], hot: ["n2","n3"], edges: [["n1","n0"],["n2","n0"],["n3","n0"]], out: "path compression: 3 and 2 now point straight at 0",
      cap: "<b>Path compression</b> flattens the path just walked, so the next find(3) is one step. With <b>union by size</b> as well, the cost per operation is near constant: under 5 steps for any <var>n</var> you will ever meet.",
      ask: { q: "Is there a tree of node objects in memory behind all this?", opts: ["no: just one parent array", "yes: a node per machine with child pointers"], a: 0,
             why: "Every arrow is one entry, parent[x]. A leader is a machine whose entry is itself." },
      hi: { out: "path compression: 3 aur 2 ab seedha 0 ko point karte hain",
            cap: "<b>Path compression</b> abhi chale raaste ko seedha karta hai, to agla find(3) ek step. Saath mein <b>union by size</b> ho to har operation ki cost lagbhag constant: kisi bhi <var>n</var> par 5 steps se kam.",
            ask: { q: "Kya iske peeche memory mein node objects ka tree hai?", opts: ["nahi: bas ek parent array", "haan: har machine ka node child pointers ke saath"],
                   why: "Har arrow ek entry hai, parent[x]. Leader woh machine hai jiski entry khud woh hai." } } },

    { show: ["p0","p1","p2","p3","p4"], on: ["p0","p1","p2","p3"], hot: ["p4"], edges: [["n1","n0"],["n2","n0"],["n3","n0"]], out: "parent = [0, 0, 0, 0, 4]: two groups",
      cap: "The whole structure is one <b>parent array</b>. Leaders are the entries pointing at themselves: 0 and 4, so two groups. That is why it is fast, and why it cannot undo a union or list a group's members.",
      hi: { out: "parent = [0, 0, 0, 0, 4]: do groups",
            cap: "Poora structure ek <b>parent array</b> hai. Leaders woh entries hain jo khud ko point karti hain: 0 aur 4, to do groups. Isiliye yeh tez hai, aur isiliye union undo ya group ke members list nahi kar sakta." } },
  ]
},

/* Five courses, A->B, A->C, B->D, C->D, D->E, with each node's in-degree
   underneath. The last frame swaps in a loop to show what Kahn leaves over. */
"toposort": {
  kind: "tree", w: 580, h: 280, arrows: true,
  nodes: {
    a: { x: 80,  y: 70,  t: "A:0" },
    b: { x: 230, y: 40,  t: "B:1" },
    c: { x: 230, y: 150, t: "C:1" },
    d: { x: 390, y: 90,  t: "D:2" },
    e: { x: 520, y: 90,  t: "E:1" },
  },
  edges: [["a","b"],["a","c"],["b","d"],["c","d"],["d","e"]],
  frames: [
    { scene: `<span class="kicker">Why this example</span><p>Five courses with prerequisites. Find a study plan that breaks no rule, or prove there is none.</p><table><tr><td>A</td><td>before B and C</td></tr><tr><td>B, C</td><td>both before D</td></tr><tr><td>D</td><td>before E</td></tr></table><p>It is small but has a <b>diamond</b>, B and C both leading to D, which fools the obvious cycle check. Goal: build the plan in one pass, and see how the same pass would expose an impossible set of rules.</p>`,
      cap: "Arrows mean “must come first”. The number after each letter counts the rules still blocking that course: its in-degree. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Prerequisites wale paanch courses. Aisa study plan dhoondho jo koi rule na tode, ya saabit karo ki koi nahi.</p><table><tr><td>A</td><td>B aur C se pehle</td></tr><tr><td>B, C</td><td>dono D se pehle</td></tr><tr><td>D</td><td>E se pehle</td></tr></table><p>Chhota hai par isme ek <b>diamond</b> hai, B aur C dono D tak jaate hain, jo obvious cycle check ko bewakoof banata hai. Goal: ek pass mein plan banana, aur dekhna ki wahi pass naamumkin rules kaise pakadta.</p>`,
            cap: "Arrows ka matlab “pehle aana hai”. Har letter ke baad ka number ginta hai kitne rules us course ko abhi rok rahe hain: uska in-degree. Next dabao." } },

    { on: ["a"], out: "in-degrees: A 0, B 1, C 1, D 2, E 1",
      cap: "Each number is how many courses must be taken before this one. Something has to go first, and only a course that nothing blocks can.",
      ask: { q: "Which course can be taken first?", opts: ["only A: nothing blocks it", "A and B"], a: 0,
             why: "B is blocked by A. Only A has in-degree 0." },
      hi: { out: "in-degrees: A 0, B 1, C 1, D 2, E 1",
            cap: "Har number batata hai is course se pehle kitne courses lene hain. Kuch pehle jaana hi hai, aur sirf woh course ja sakta hai jise kuch nahi rokta.",
            ask: { q: "Pehle kaunsa course liya ja sakta hai?", opts: ["sirf A: use kuch nahi rokta", "A aur B"],
                   why: "B ko A rokta hai. Sirf A ka in-degree 0 hai." } } },

    { hot: ["a"], dim: ["b","c","d","e"], out: "queue: A",
      cap: "Start a queue with every course at in-degree 0: here just A. With several independent starting courses, they would all go in.",
      ask: { q: "Take A, and subtract 1 from every course A blocks. What happens to B and C?", opts: ["both reach 0: either can go next", "only B reaches 0"], a: 0,
             why: "Each had exactly one blocker, A, and it is gone." },
      hi: { out: "queue: A",
            cap: "In-degree 0 wale har course se queue shuru karo: yahan bas A. Kai alag shuruaati courses hote to sab jaate.",
            ask: { q: "A lo, aur A jise rokta hai us har course se 1 ghatao. B aur C ka kya hota hai?", opts: ["dono 0 par: koi bhi agla ja sakta hai", "sirf B 0 par"],
                   why: "Har ek ka theek ek blocker tha, A, aur woh ja chuka." } } },

    { t: { b: "B:0", c: "C:0" }, on: ["b","c"], dim: ["a"], edges: [["b","d"],["c","d"],["d","e"]], out: "take A: B and C both hit 0",
      cap: "Two courses become free at once. That is why the order is usually <b>not unique</b>: A, B, C, D, E and A, C, B, D, E are both valid.",
      ask: { q: "D waits on B and C. When does D become free?", opts: ["after both are taken", "after either one"], a: 0,
             why: "D's in-degree is 2. Each of B and C removes one." },
      hi: { out: "A lo: B aur C dono 0 par",
            cap: "Do courses ek saath free. Isiliye order aam taur par <b>unique nahi</b>: A, B, C, D, E aur A, C, B, D, E dono valid.",
            ask: { q: "D, B aur C ka intezaar karta hai. D kab free hota hai?", opts: ["dono lene ke baad", "kisi ek ke baad"],
                   why: "D ka in-degree 2 hai. B aur C har ek ek ghataate hain." } } },

    { t: { b: "B:0", c: "C:0", d: "D:0" }, on: ["d"], dim: ["a","b","c"], edges: [["d","e"]], out: "take B, then C: D hits 0",
      cap: "After B, D's count drops to 1; after C, to 0. A DFS with a plain visited set would call this second arrival at D a loop. Counting knows better.",
      hi: { out: "B lo, phir C: D 0 par",
            cap: "B ke baad D ki ginti 1 par girti hai; C ke baad 0 par. Plain visited set wala DFS D par is doosri pahunch ko loop kehta. Ginti behtar jaanti hai." } },

    { t: { b: "B:0", c: "C:0", d: "D:0", e: "E:0" }, on: ["e"], dim: ["a","b","c","d"], edges: [], out: "A, B, C, D, E: 5 of 5 emitted, a valid plan",
      cap: "Everything came out, so a valid plan exists. Each course and each rule was handled once: <b>O(<var>V</var> + <var>E</var>)</b>, no recursion.",
      ask: { q: "Now change the rules: A→B stays, but B→D, D→C and C→B form a loop, and E needs nothing. How many courses can come out?", opts: ["2: A and E", "all 5"], a: 0,
             why: "B, C and D each wait on another member of the loop, so none ever reaches 0." },
      hi: { out: "A, B, C, D, E: 5 mein se 5, valid plan",
            cap: "Sab nikal aaye, to valid plan hai. Har course aur har rule ek baar sambhala gaya: <b>O(<var>V</var> + <var>E</var>)</b>, koi recursion nahi.",
            ask: { q: "Ab rules badlo: A→B rehta hai, par B→D, D→C aur C→B loop banate hain, aur E ko kuch nahi chahiye. Kitne courses nikal sakte hain?", opts: ["2: A aur E", "saare 5"],
                   why: "B, C aur D har ek loop ke kisi aur member ka intezaar karte hain, to koi 0 tak nahi pahunchta." } } },

    { t: { b: "B:1", c: "C:1", d: "D:1", e: "E:0" }, bad: ["b","c","d"], dim: ["a","e"], edges: [["a","b"],["b","d"],["d","c"],["c","b"]], out: "emitted 2 of 5: the leftovers ARE the loop",
      cap: "A and E come out; B, C and D never reach 0. If the count is short, the leftovers are exactly the courses stuck in, or behind, a loop. <b>Topological sort and cycle detection are one computation.</b>",
      hi: { out: "5 mein se 2 nikle: bache hue HI loop hain",
            cap: "A aur E nikalte hain; B, C aur D kabhi 0 tak nahi pahunchte. Ginti kam ho, to bache hue theek wahi courses hain jo loop mein, ya uske peeche, phase hain. <b>Topological sort aur cycle detection ek hi computation hain.</b>" } },
  ]
},

"monotonic-stack": { kind: "cells", arr: ["2","1","5","6","2","3"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>Six buildings in a row, heights <code>2, 1, 5, 6, 2, 3</code>. For each, find the next taller building to its right.</p><table><tr><td>answers</td><td>5, 5, 6, none, 3, none</td></tr><tr><td>one arrival answers two</td><td>the 5, for the 2 and the 1</td></tr><tr><td>stack work</td><td>6 pushes, 4 pops</td></tr></table><p>Goal: find every answer in one left-to-right pass, and see why a building that is answered can be forgotten for good.</p>`,
    cap: "The boxes are building heights, with positions underneath. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Ek line mein chhe buildings, heights <code>2, 1, 5, 6, 2, 3</code>. Har ek ke liye right mein agli oonchi building dhoondho.</p><table><tr><td>answers</td><td>5, 5, 6, koi nahi, 3, koi nahi</td></tr><tr><td>ek aagman do ka answer</td><td>5, 2 aur 1 ke liye</td></tr><tr><td>stack ka kaam</td><td>6 push, 4 pop</td></tr></table><p>Goal: ek left-to-right pass mein har answer dhoondhna, aur dekhna ki jawab mil chuki building hamesha ke liye kyun bhooli ja sakti hai.</p>`,
          cap: "Boxes buildings ki heights hain, neeche positions. Next dabao." } },

  { out: "for each building, the next taller one to its right",
    cap: "The obvious way walks right from every building until something taller appears: <b>O(<var>n</var>²)</b> at worst.",
    ask: { q: "Walking right from every building, which street is the worst case?", opts: ["heights falling left to right", "heights rising left to right"], a: 0,
           why: "When heights only fall, nothing to the right is ever taller, so every walk runs to the end: <var>n</var>² / 2 steps." },
    hi: { out: "har building ke liye, right mein agli oonchi",
          cap: "Seedha tareeka har building se right chalta hai jab tak kuch ooncha na aaye: worst mein <b>O(<var>n</var>²)</b>.",
          ask: { q: "Har building se right chalte hue, kaunsi gali worst case hai?", opts: ["heights left se right girti hui", "heights left se right badhti hui"],
                 why: "Jab heights sirf girti hain, right mein kabhi kuch ooncha nahi, to har walk end tak jaati hai: <var>n</var>² / 2 steps." } } },

  { on: [0], dim: [1, 2, 3, 4, 5], ptr: { i: 0 }, out: "stack: [2]",
    cap: "Keep a stack of buildings <b>still waiting for an answer</b>. The 2 has not been beaten yet, so it waits.",
    hi: { out: "stack: [2]",
          cap: "Un buildings ka stack rakho jo <b>abhi answer ka intezaar</b> kar rahi hain. 2 ko abhi kisi ne nahi haraaya, to woh intezaar karti hai." } },

  { on: [0, 1], dim: [2, 3, 4, 5], ptr: { i: 1 }, out: "stack: [2, 1]",
    cap: "The 1 is shorter, so it cannot answer the 2. It waits too. The stack now falls from bottom to top, and nobody sorted it.",
    ask: { q: "The 5 arrives next. Which waiting buildings does it answer?", opts: ["both the 1 and the 2", "only the 1, on top"], a: 0,
           why: "5 is taller than the 1, so pop it. Then the 2 is on top, and 5 beats it too, so pop again." },
    hi: { out: "stack: [2, 1]",
          cap: "1 chhoti hai, to 2 ka answer nahi ho sakti. Woh bhi intezaar karti hai. Stack ab neeche se upar girta hai, aur kisi ne sort nahi kiya.",
          ask: { q: "Agli 5 aati hai. Woh kin intezaar karti buildings ka answer hai?", opts: ["1 aur 2 dono", "sirf 1, jo upar hai"],
                 why: "5, 1 se oonchi hai, to use pop karo. Phir 2 upar hai, aur 5 use bhi haraati hai, to phir pop." } } },

  { hot: [2], bad: [0, 1], dim: [3, 4, 5], ptr: { i: 2 }, out: "5 answers the 1 and the 2, both popped. stack: [5]",
    cap: "One arrival settles everything shorter in one go, and each pop writes an answer. Then the 5 waits.",
    ask: { q: "Once popped, does the 2 ever need looking at again?", opts: ["no: it has its answer, the 5", "yes: it may beat a later building"], a: 0,
           why: "The 5 is the first taller building to its right, which is exactly the answer it waited for. Its only job was to wait, and that is done." },
    hi: { out: "5, 1 aur 2 ka answer, dono pop. stack: [5]",
          cap: "Ek aagman har chhoti ko ek jhatke mein nipta deta hai, aur har pop ek answer likhta hai. Phir 5 intezaar karti hai.",
          ask: { q: "Pop hone ke baad kya 2 ko kabhi dobara dekhna padega?", opts: ["nahi: uska answer mil gaya, 5", "haan: baad ki building ko haraa sakti hai"],
                 why: "5 uske right mein pehli oonchi building hai, theek wahi answer jiska woh intezaar kar rahi thi. Uska kaam sirf intezaar tha, aur woh ho gaya." } } },

  { hot: [3], bad: [2], dim: [0, 1, 4, 5], ptr: { i: 3 }, out: "6 answers the 5. stack: [6]",
    cap: "Same again. Each building enters the stack once and leaves at most once. That is the whole cost argument: <b>at most 2<var>n</var> operations, O(<var>n</var>)</b>, despite the loop inside a loop.",
    hi: { out: "6, 5 ka answer. stack: [6]",
          cap: "Phir wahi. Har building stack mein ek baar aati hai aur zyada se zyada ek baar jaati hai. Poora cost argument yahi: <b>zyada se zyada 2<var>n</var> operations, O(<var>n</var>)</b>, loop ke andar loop ke bawajood." } },

  { on: [3, 4], dim: [0, 1, 2, 5], ptr: { i: 4 }, out: "2 is shorter than 6: it waits. stack: [6, 2]",
    cap: "The 2 cannot answer the 6, so it joins the stack, which still falls from bottom to top.",
    ask: { q: "The 3 arrives last. What does it pop?", opts: ["only the 2", "the 2 and the 6"], a: 0,
           why: "The 3 beats the 2 but not the 6, so popping stops at the 6." },
    hi: { out: "2, 6 se chhoti: intezaar. stack: [6, 2]",
          cap: "2, 6 ka answer nahi ho sakti, to stack mein judti hai, jo ab bhi neeche se upar girta hai.",
          ask: { q: "Aakhir mein 3 aati hai. Woh kya pop karti hai?", opts: ["sirf 2", "2 aur 6"],
                 why: "3, 2 ko haraati hai par 6 ko nahi, to popping 6 par rukti hai." } } },

  { on: [3], hot: [5], bad: [4], dim: [0, 1, 2], ptr: { i: 5 }, out: "3 answers the 2. stack: [6, 3], never answered",
    cap: "The street ends with 6 and 3 still waiting. Nothing taller came, so they get the default answer. Forgetting these leftovers is the most common bug in this pattern.",
    hi: { out: "3, 2 ka answer. stack: [6, 3], kabhi answer nahi",
          cap: "Gali 6 aur 3 ke intezaar ke saath khatam hoti hai. Kuch ooncha nahi aaya, to unhe default answer milta hai. In bachon ko bhoolna is pattern ka sabse aam bug hai." } },

  { on: [0, 1, 2, 3, 4, 5], out: "next taller = [5, 5, 6, -1, 3, -1]",
    cap: "6 pushes and 4 pops for 6 buildings. The same loop answers four questions: next greater, next smaller, previous greater, previous smaller. Only the scan direction and the comparison change.",
    hi: { out: "agli oonchi = [5, 5, 6, -1, 3, -1]",
          cap: "6 buildings ke liye 6 push aur 4 pop. Wahi loop chaar sawaalon ka answer deta hai: next greater, next smaller, previous greater, previous smaller. Sirf scan ki disha aur comparison badalte hain." } },
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

/* Readings [3, 1, 4, 1]: one range question (positions 1..3) and one
   change (position 2 from 4 to 6), each touching one node per level. */
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
    { scene: `<span class="kicker">Why this example</span><p>Readings keep changing, and people keep asking for the total of a stretch. Here are four:</p><table><tr><td>readings</td><td>[3, 1, 4, 1]</td></tr><tr><td>total of positions 1..3</td><td>1 + 4 + 1 = 6</td></tr><tr><td>then position 2 becomes</td><td>6, so the total is 8</td></tr></table><p>A plain array is slow at the total; running totals are slow at the change. Goal: both in about log₂ <var>n</var> steps, using stored totals of blocks.</p>`,
      cap: "Each box stores the total of the range under it; the small label is that range. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Readings badalti rehti hain, aur log hisse ka total poochhte rehte hain. Yeh rahi chaar:</p><table><tr><td>readings</td><td>[3, 1, 4, 1]</td></tr><tr><td>positions 1..3 ka total</td><td>1 + 4 + 1 = 6</td></tr><tr><td>phir position 2 banti hai</td><td>6, to total 8</td></tr></table><p>Plain array total mein slow, running totals change mein. Goal: dono lagbhag log₂ <var>n</var> steps mein, blocks ke stored totals se.</p>`,
            cap: "Har box apne neeche ki range ka total rakhta hai; chhota label wahi range hai. Next dabao." } },

    { on: ["root"], out: "[3, 1, 4, 1]: every node stores its range's total",
      cap: "The root covers everything: 9. Its halves hold 4 and 5, and the leaves are the readings. Every node is the sum of its two children.",
      ask: { q: "Total of positions 1..3. Which stored boxes cover exactly that range?", opts: ["[1] and [2,3]: two boxes", "[1], [2] and [3]: three leaves"], a: 0,
             why: "The box [2,3] already holds 4 + 1. Reading it beats reading its two leaves." },
      hi: { out: "[3, 1, 4, 1]: har node apni range ka total rakhta hai",
            cap: "Root sab cover karta hai: 9. Uske aadhe 4 aur 5 rakhte hain, aur leaves readings hain. Har node apne do children ka sum hai.",
            ask: { q: "Positions 1..3 ka total. Kaunse stored boxes theek wahi range dhakte hain?", opts: ["[1] aur [2,3]: do boxes", "[1], [2] aur [3]: teen leaves"],
                   why: "Box [2,3] pehle se 4 + 1 rakhta hai. Use padhna uske do leaves padhne se behtar." } } },

    { on: ["b","r"], hot: ["b","r"], dim: ["a","c","d"], out: "positions 1..3 = [1] + [2,3] = 1 + 5 = 6",
      cap: "A question does not walk the leaves. It <b>covers the range with whole boxes</b>, at most two per level: <b>O(log <var>n</var>)</b>. Two boxes here instead of three readings, and the gap grows fast.",
      ask: { q: "Now position 2 changes from 4 to 6. Which boxes must be fixed?", opts: ["the leaf [2], then [2,3], then the root", "every box in the tree"], a: 0,
             why: "Only boxes whose range contains position 2 are now wrong: one per level." },
      hi: { out: "positions 1..3 = [1] + [2,3] = 1 + 5 = 6",
            cap: "Sawaal leaves nahi chalta. Woh <b>range ko poore boxes se dhakta hai</b>, har level par zyada se zyada do: <b>O(log <var>n</var>)</b>. Yahan teen readings ki jagah do boxes, aur farak tezi se badhta hai.",
            ask: { q: "Ab position 2, 4 se 6 hoti hai. Kaunse boxes theek karne hain?", opts: ["leaf [2], phir [2,3], phir root", "tree ka har box"],
                   why: "Sirf woh boxes galat hain jinki range mein position 2 hai: har level par ek." } } },

    { t: { c: "6", r: "7", root: "11" }, hot: ["c"], on: ["r","root"], dim: ["a","b","d"], out: "change a[2] = 6: leaf, then [2,3] = 7, then root = 11",
      cap: "One leaf and its ancestors: one root-to-leaf path, <b>O(log <var>n</var>)</b>. The question from before now reads 1 + 7 = 8, still from two boxes.",
      ask: { q: "Could the same tree answer the <b>minimum</b> of a range instead of the sum?", opts: ["yes: store the min of the two halves", "no: this only works for sums"], a: 0,
             why: "A box only needs to be built from its two halves. Minimum works that way too." },
      hi: { out: "a[2] = 6: leaf, phir [2,3] = 7, phir root = 11",
            cap: "Ek leaf aur uske ancestors: ek root-to-leaf raasta, <b>O(log <var>n</var>)</b>. Pehle wala sawaal ab 1 + 7 = 8 padhta hai, ab bhi do boxes se.",
            ask: { q: "Kya yahi tree sum ki jagah range ka <b>minimum</b> de sakta hai?", opts: ["haan: do aadhon ka min rakho", "nahi: yeh sirf sums ke liye"],
                   why: "Box ko bas apne do aadhon se banna hai. Minimum bhi aise hi banta hai." } } },

    { on: ["root","l","r","a","b","c","d"], out: "any ASSOCIATIVE operation works",
      cap: "Nothing here assumed addition. Swap in min, max or gcd and the same tree answers those. A running-totals array can only ever do sums, and a Fenwick tree only things you can subtract.",
      hi: { out: "koi bhi ASSOCIATIVE operation chalta hai",
            cap: "Yahan kuch addition maan kar nahi hua. Min, max ya gcd daalo aur wahi tree unka answer deta hai. Running-totals array sirf sums kar sakta hai, aur Fenwick tree sirf woh jo ghataya ja sake." } },

    { bad: ["root","l","r"], dim: ["a","b","c","d"], out: "if the readings never change, do not build this",
      cap: "Static data means running totals: O(1) questions, ten lines, no tree. Reach for a segment tree only when the array <b>changes between questions</b>.",
      hi: { out: "readings kabhi na badlein, to yeh mat banao",
            cap: "Static data matlab running totals: O(1) sawaal, das lines, koi tree nahi. Segment tree tabhi lo jab array <b>sawaalon ke beech badle</b>." } },
  ]
},

/* Four meetings over hours 0 to 8, one row each: A 0-3, B 1-4, C 5-7, D 6-8.
   Column c is the hour from c to c + 1. Merging by start gives 0-4 and 5-8;
   the +1/-1 sweep peaks at 2, in hours 1-2 and hour 6. */
"intervals": {
  kind: "grid",
  arr: [["A","A","A","","","","",""],
        ["","B","B","B","","","",""],
        ["","","","","","C","C",""],
        ["","","","","","","D","D"]],
  frames: [
    { scene: `<span class="kicker">Why this example</span><p>Four meetings, each from a start hour to an end hour. A meeting ending at 3 frees its room at 3.</p><table><tr><td>A</td><td>0 to 3</td></tr><tr><td>B</td><td>1 to 4</td></tr><tr><td>C</td><td>5 to 7</td></tr><tr><td>D</td><td>6 to 8</td></tr></table><p>Two overlapping pairs with a gap between them. Goal: merge them into busy blocks in one pass, then count the rooms needed with a +1/−1 sweep.</p>`,
      cap: "Rows are meetings, columns are hours 0 to 7. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Chaar meetings, har ek start ghante se end ghante tak. 3 par khatam meeting 3 par room khaali karti hai.</p><table><tr><td>A</td><td>0 se 3</td></tr><tr><td>B</td><td>1 se 4</td></tr><tr><td>C</td><td>5 se 7</td></tr><tr><td>D</td><td>6 se 8</td></tr></table><p>Do overlap karte pairs, beech mein gap. Goal: ek pass mein unhe busy blocks mein jodna, phir +1/−1 sweep se chahiye rooms ginna.</p>`,
            cap: "Rows meetings hain, columns ghante 0 se 7. Next dabao." } },

    { on: [[0,0],[0,1],[0,2]], dim: [[1,1],[1,2],[1,3],[2,5],[2,6],[3,6],[3,7]],
      out: "sorted by start: A 0, B 1, C 5, D 6. Block: A, 0-3",
      cap: "Sorted by start, each meeting only needs comparing with the block being built. Anything that could overlap it has already been seen.",
      ask: { q: "B starts at 1, before the block ends at 3. What happens?", opts: ["extend the block to B's end, 4", "start a new block at 1"], a: 0,
             why: "B overlaps the block, so the block grows. Its new end is the later of 3 and 4." },
      hi: { out: "start se sorted: A 0, B 1, C 5, D 6. Block: A, 0-3",
            cap: "Start se sorted, har meeting ko sirf ban rahe block se compare karna hai. Usse overlap kar sakne wala sab pehle dekha ja chuka.",
            ask: { q: "B 1 par shuru hoti hai, block ke 3 par khatam hone se pehle. Kya hota hai?", opts: ["block ko B ke end, 4, tak badhao", "1 par naya block"],
                   why: "B block se overlap karti hai, to block badhta hai. Naya end 3 aur 4 mein baad wala." } } },

    { on: [[0,0],[0,1],[0,2],[1,1],[1,2],[1,3]], dim: [[2,5],[2,6],[3,6],[3,7]],
      out: "A and B merge: busy 0-4",
      cap: "Extending means taking the <b>later of the two ends</b>, max(3, 4) = 4. Taking B's end blindly is the classic bug when B sits entirely inside the block.",
      ask: { q: "C starts at 5, after the block ends at 4. What now?", opts: ["close 0-4 and start a new block", "extend the block to 7"], a: 0,
             why: "There is a real gap from 4 to 5, so nothing links C to the block." },
      hi: { out: "A aur B jude: busy 0-4",
            cap: "Badhaane ka matlab <b>do ends mein baad wala</b> lena, max(3, 4) = 4. Bina soche B ka end lena classic bug hai jab B poori block ke andar ho.",
            ask: { q: "C 5 par shuru hoti hai, block ke 4 par khatam hone ke baad. Ab kya?", opts: ["0-4 band karo aur naya block shuru", "block ko 7 tak badhao"],
                   why: "4 se 5 tak asli gap hai, to C ko block se kuch nahi jodta." } } },

    { on: [[0,0],[0,1],[0,2],[1,1],[1,2],[1,3]], hot: [[2,5],[2,6]], dim: [[3,6],[3,7]],
      out: "C starts at 5 > 4: a new block, 5-7",
      cap: "No overlap means close the current block and open a new one. One pass, and the O(<var>n</var> log <var>n</var>) is entirely the sort.",
      ask: { q: "D runs 6 to 8, starting before C's block ends at 7. What is the merged block?", opts: ["5 to 8", "5 to 7"], a: 0,
             why: "Take the later end: max(7, 8) = 8." },
      hi: { out: "C 5 > 4 par shuru: naya block, 5-7",
            cap: "Overlap nahi matlab current block band karo aur naya kholo. Ek pass, aur O(<var>n</var> log <var>n</var>) poora sort hai.",
            ask: { q: "D 6 se 8 chalti hai, C ke block ke 7 par khatam hone se pehle shuru. Juda block kya hai?", opts: ["5 se 8", "5 se 7"],
                   why: "Baad wala end lo: max(7, 8) = 8." } } },

    { on: [[0,0],[0,1],[0,2],[1,1],[1,2],[1,3],[2,5],[2,6],[3,6],[3,7]],
      out: "busy blocks: 0-4 and 5-8",
      cap: "Two blocks from four meetings. The overlap test worth knowing is <b>a ≤ d and c ≤ b</b>, which you get by negating the only two ways two intervals can miss.",
      ask: { q: "Now count rooms. Each meeting is +1 at its start and −1 at its end; sweep left to right. What is the highest the counter reaches?", opts: ["2", "4"], a: 0,
             why: "A and B overlap during hours 1 and 2, C and D during hour 6. Never three at once." },
      hi: { out: "busy blocks: 0-4 aur 5-8",
            cap: "Chaar meetings se do blocks. Jaanne layak overlap test <b>a ≤ d and c ≤ b</b> hai, jo do intervals ke miss hone ke sirf do tareeke ulat kar milta hai.",
            ask: { q: "Ab rooms gino. Har meeting start par +1 aur end par −1 hai; left se right sweep karo. Counter sabse ooncha kahan tak jaata hai?", opts: ["2", "4"],
                   why: "A aur B ghante 1 aur 2 mein overlap karti hain, C aur D ghante 6 mein. Kabhi teen ek saath nahi." } } },

    { hot: [[0,1],[0,2],[1,1],[1,2],[2,6],[3,6]], dim: [[0,0],[1,3],[2,5],[3,7]],
      out: "+1 at 0 1 5 6, -1 at 3 4 7 8: peak 2, so 2 rooms",
      cap: "The bright hours are where the counter reads 2, its maximum. Sort all 2<var>n</var> events, sweep with one counter, and its peak is the number of rooms. At a tie, process the −1 first if touching meetings may share a room.",
      hi: { out: "+1 0 1 5 6 par, -1 3 4 7 8 par: peak 2, to 2 rooms",
            cap: "Chamakte ghante wahan hain jahan counter 2 padhta hai, uska maximum. Saare 2<var>n</var> events sort karo, ek counter se sweep karo, aur uska peak rooms ki ginti hai. Tie par −1 pehle karo agar chhoone wali meetings room baant sakti hain." } },
  ]
},

/* Five buildings: A-B 1, B-C 2, C-D 3, A-C 4, B-D 4, D-E 6. Kruskal takes
   the links in cost order; A-C and B-D are skipped as loops, and the last
   frame shows the tree is not a shortest-path tree (B to D costs 5, not 4). */
"mst": {
  kind: "tree", w: 580, h: 280,
  weights: { "A>B": 1, "B>C": 2, "A>C": 4, "C>D": 3, "B>D": 4, "D>E": 6 },
  nodes: {
    A: { x: 80,  y: 80,  t: "A" }, B: { x: 240, y: 45,  t: "B" },
    C: { x: 240, y: 190, t: "C" }, D: { x: 400, y: 120, t: "D" },
    E: { x: 530, y: 190, t: "E" },
  },
  edges: [["A","B"],["B","C"],["A","C"],["C","D"],["B","D"],["D","E"]],
  frames: [
    { scene: `<span class="kicker">Why this example</span><p>Five buildings to link with fibre. Each possible link has a price, and the goal is the <b>smallest total</b> that still connects everything.</p><table><tr><td>links</td><td>A–B 1, B–C 2, C–D 3</td></tr><tr><td></td><td>A–C 4, B–D 4, D–E 6</td></tr><tr><td>buy them all</td><td>20</td></tr><tr><td>cheapest network</td><td>12</td></tr></table><p>Two links tie at 4, and the cheapest network sends B to D the long way. Goal: build it greedily, and see why that is safe.</p>`,
      cap: "Circles are buildings; each line is a possible link with its price. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Paanch buildings fibre se jodni hain. Har possible link ki keemat hai, aur goal hai <b>sabse kam total</b> jo phir bhi sab jode.</p><table><tr><td>links</td><td>A–B 1, B–C 2, C–D 3</td></tr><tr><td></td><td>A–C 4, B–D 4, D–E 6</td></tr><tr><td>sab khareedo</td><td>20</td></tr><tr><td>sabse sasta network</td><td>12</td></tr></table><p>Do links 4 par tie hain, aur sabse sasta network B se D lambe raaste bhejta hai. Goal: ise greedy banaana, aur dekhna yeh safe kyun hai.</p>`,
            cap: "Circles buildings hain; har line keemat ke saath ek possible link. Next dabao." } },

    { on: ["A","B","C","D","E"], out: "5 buildings: the answer uses exactly 4 links",
      cap: "Connecting 5 buildings needs at least 4 links, and a fifth would only close a loop. So the answer is a <b>tree</b> of 4 links. <b>Kruskal</b> takes links cheapest first and skips any that would close a loop.",
      hi: { out: "5 buildings: answer theek 4 links",
            cap: "5 buildings jodne ko kam se kam 4 links chahiye, aur paanchva sirf loop band karega. To answer 4 links ka <b>tree</b> hai. <b>Kruskal</b> links sabse saste pehle leta hai aur loop band karne wale chhodta hai." } },

    { on: ["A","B"], hot: ["A","B"], dim: ["C","D","E"], edge: [["A","B"]], out: "take A-B at 1",
      cap: "The cheapest link, A–B at 1, joins two separate buildings, so it is safe. A and B are now one group.",
      ask: { q: "Next is B–C at 2. B and C are in different groups. Take it?", opts: ["yes: it joins two groups", "no: wait for a cheaper one"], a: 0,
             why: "Nothing cheaper is left, and it closes no loop." },
      hi: { out: "A-B lo, 1 par",
            cap: "Sabse sasta link, A–B 1 par, do alag buildings jodta hai, to safe hai. A aur B ab ek group.",
            ask: { q: "Agla B–C 2 par. B aur C alag groups mein hain. Lein?", opts: ["haan: do groups jodta hai", "nahi: saste ka intezaar"],
                   why: "Isse sasta kuch nahi bacha, aur yeh koi loop band nahi karta." } } },

    { on: ["A","B","C"], hot: ["B","C"], dim: ["D","E"], edge: [["A","B"],["B","C"]], out: "take B-C at 2: group {A, B, C}",
      cap: "Second cheapest, different groups, so take it. Three buildings joined by two links.",
      hi: { out: "B-C lo, 2 par: group {A, B, C}",
            cap: "Doosra sabse sasta, alag groups, to lo. Teen buildings do links se judi." } },

    { on: ["A","B","C","D"], hot: ["C","D"], dim: ["E"], edge: [["A","B"],["B","C"],["C","D"]], out: "take C-D at 3: group {A, B, C, D}",
      cap: "C–D at 3 brings D in. Next in cost order come A–C and B–D, both at 4.",
      ask: { q: "A–C costs 4. Should it be taken?", opts: ["no: A and C are already joined", "yes: it is the next cheapest"], a: 0,
             why: "A and C are both in the group {A, B, C, D}. The link would only close the loop A–B–C–A." },
      hi: { out: "C-D lo, 3 par: group {A, B, C, D}",
            cap: "C–D 3 par D ko andar laata hai. Keemat ke order mein agle A–C aur B–D, dono 4 par.",
            ask: { q: "A–C ki keemat 4. Kya lena chahiye?", opts: ["nahi: A aur C pehle se jude", "haan: yeh agla sabse sasta"],
                   why: "A aur C dono group {A, B, C, D} mein hain. Link bas loop A–B–C–A band karega." } } },

    { on: ["A","B","C","D"], dim: ["E"], edge: [["A","B"],["B","C"],["C","D"]], out: "skip A-C and B-D: both would close a loop",
      cap: "A–C would close A–B–C–A, and B–D would close B–C–D–B. Both are skipped. The “same group?” test is <b>union-find</b>, near constant per link.",
      ask: { q: "How many links will the finished network have?", opts: ["4", "5"], a: 0,
             why: "5 buildings need exactly 4 links. D–E at 6 is the last one." },
      hi: { out: "A-C aur B-D chhodo: dono loop band karte",
            cap: "A–C A–B–C–A band karta, aur B–D B–C–D–B. Dono chhode gaye. “Same group?” test <b>union-find</b> hai, har link par lagbhag constant.",
            ask: { q: "Poore network mein kitne links honge?", opts: ["4", "5"],
                   why: "5 buildings ko theek 4 links chahiye. D–E 6 par aakhri hai." } } },

    { on: ["A","B","C","D","E"], hot: ["D","E"], edge: [["A","B"],["B","C"],["C","D"],["D","E"]], out: "take D-E at 6: 4 links, total 12",
      cap: "Four links, total 1 + 2 + 3 + 6 = <b>12</b>. It is optimal because of the <b>cut property</b>: for any split of the buildings, the cheapest link crossing it is safe to take.",
      ask: { q: "In this network, B reaches D through C: 2 + 3 = 5. Is that the fastest way from B to D?", opts: ["no: the direct B–D link is 4", "yes"], a: 0,
             why: "The tree minimises the total, not each journey. B–D was skipped because it closed a loop." },
      hi: { out: "D-E lo, 6 par: 4 links, kul 12",
            cap: "Chaar links, kul 1 + 2 + 3 + 6 = <b>12</b>. Yeh optimal hai <b>cut property</b> ki wajah se: buildings ke kisi bhi split ke liye, use cross karne wala sabse sasta link lena safe hai.",
            ask: { q: "Is network mein B, C se hokar D tak pahunchta hai: 2 + 3 = 5. Kya B se D ka yeh sabse tez raasta hai?", opts: ["nahi: seedha B–D link 4 ka", "haan"],
                   why: "Tree total kam karta hai, har safar nahi. B–D chhoda gaya kyunki loop band karta tha." } } },

    { on: ["A","B","C","D","E"], bad: ["B","D"], edge: [["A","B"],["B","C"],["C","D"],["D","E"],["B","D"]], out: "cheapest total, not shortest journeys",
      cap: "A minimum spanning tree is <b>not</b> a shortest-path tree. The shortest-path tree from A keeps B–D and costs 13; this one costs 12 and makes B to D a 5. Interviewers ask about exactly this.",
      hi: { out: "sabse sasta total, sabse chhote safar nahi",
            cap: "Minimum spanning tree shortest-path tree <b>nahi</b> hai. A se shortest-path tree B–D rakhta hai aur 13 ka; yeh 12 ka hai aur B se D ko 5 bana deta hai. Interviewers theek yahi poochte hain." } },
  ]
},

"cyclic-sort": { kind: "cells", arr: ["4","1","5","4","2"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>Tickets 1 to 5 were scanned at a gate, and the log reads <code>4, 1, 5, 4, 2</code>: five scans, but one ticket twice and one never.</p><table><tr><td>missing</td><td>3</td></tr><tr><td>scanned twice</td><td>4</td></tr><tr><td>swaps needed</td><td>3</td></tr><tr><td>extra memory</td><td>none</td></tr></table><p>Goal: send each ticket to index ticket − 1, then read both answers off the one slot that is wrong.</p>`,
    cap: "The boxes are the log, with indices underneath. Ticket <var>v</var> belongs at index <var>v</var> − 1. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Tickets 1 se 5 ek gate par scan hue, aur log hai <code>4, 1, 5, 4, 2</code>: paanch scans, par ek ticket do baar aur ek kabhi nahi.</p><table><tr><td>missing</td><td>3</td></tr><tr><td>do baar scan</td><td>4</td></tr><tr><td>chahiye swaps</td><td>3</td></tr><tr><td>extra memory</td><td>koi nahi</td></tr></table><p>Goal: har ticket ko index ticket − 1 par bhejna, phir dono answers us ek galat slot se padhna.</p>`,
          cap: "Boxes log hain, neeche indices. Ticket <var>v</var> ki jagah index <var>v</var> − 1. Next dabao." } },

  { hot: [0, 3], ptr: { i: 0 }, out: "a[0] = 4 belongs at index 3, which already holds 4",
    cap: "Look at the ticket in front of you and work out its home: 4 goes to index 3. But index 3 already holds a 4.",
    ask: { q: "Should the two 4s be swapped?", opts: ["no: they are equal, so move on", "yes: send it home"], a: 0,
           why: "Swapping equal values changes nothing, and the loop would repeat it forever. Compare with the target slot, not the current index." },
    hi: { out: "a[0] = 4 ki jagah index 3, jahan pehle se 4 hai",
          cap: "Saamne ka ticket dekho aur uska ghar nikaalo: 4 index 3 par jaata hai. Par index 3 mein pehle se ek 4 hai.",
          ask: { q: "Kya do 4 swap karne chahiye?", opts: ["nahi: barabar hain, to aage badho", "haan: ghar bhejo"],
                 why: "Barabar values swap karna kuch nahi badalta, aur loop ise hamesha dohraata. Target slot se compare karo, current index se nahi." } } },

  { hot: [1, 0], ptr: { i: 1 }, out: "a[1] = 1 belongs at index 0. Swap.",
    cap: "The 1 is not home, and its home holds something else, so swap them. The 1 is now settled for good.",
    ask: { q: "After the swap, index 1 holds a 4. What next?", opts: ["check that 4 before moving on", "move on to index 2"], a: 0,
           why: "The swap brought in a new value. Here its home, index 3, already holds a 4, so this time the index does move on." },
    hi: { out: "a[1] = 1 ki jagah index 0. Swap.",
          cap: "1 ghar par nahi, aur uske ghar mein kuch aur hai, to swap karo. 1 ab hamesha ke liye settle.",
          ask: { q: "Swap ke baad index 1 par 4 hai. Aage kya?", opts: ["aage badhne se pehle us 4 ko check karo", "index 2 par badho"],
                 why: "Swap nayi value laaya. Yahan uske ghar, index 3, mein pehle se 4 hai, to is baar index aage badhta hai." } } },

  { arr: ["1","4","5","4","2"], on: [0], hot: [2, 4], ptr: { i: 2 }, out: "a[2] = 5 belongs at index 4. Swap.",
    cap: "Index 1 was left holding the extra 4. At index 2, the 5 goes home to index 4, and a 2 comes back.",
    hi: { out: "a[2] = 5 ki jagah index 4. Swap.",
          cap: "Index 1 par extra 4 chhoda gaya. Index 2 par 5 ghar index 4 jaata hai, aur ek 2 wapas aata hai." } },

  { arr: ["1","4","2","4","5"], on: [0, 4], hot: [2, 1], ptr: { i: 2 }, out: "now a[2] = 2 belongs at index 1. Swap again.",
    cap: "Still index 2, because the swap brought a stranger. The 2 goes home to index 1, which sends the extra 4 here.",
    ask: { q: "After this swap, a[2] = 4, and index 3 already holds 4. What happens?", opts: ["move on: this 4 is the extra copy", "swap again"], a: 0,
           why: "Its home is taken by an equal value, so there is nowhere to send it. It stays, and marks the problem slot." },
    hi: { out: "ab a[2] = 2 ki jagah index 1. Phir swap.",
          cap: "Ab bhi index 2, kyunki swap ek ajnabi laaya. 2 ghar index 1 jaata hai, jo extra 4 ko yahan bhejta hai.",
          ask: { q: "Is swap ke baad a[2] = 4, aur index 3 mein pehle se 4. Kya hota hai?", opts: ["aage badho: yeh 4 extra copy hai", "phir swap"],
                 why: "Uske ghar mein barabar value hai, to bhejne ko jagah nahi. Yeh rukta hai, aur problem wale slot ko mark karta hai." } } },

  { arr: ["1","2","4","4","5"], on: [0, 1, 3, 4], bad: [2], out: "index 2 holds 4, not 3: 3 is missing, 4 is the duplicate",
    cap: "Now sweep once. <b>The one slot holding the wrong value names both answers</b>: its index says 3 never arrived, its value says 4 arrived twice. 3 swaps for 5 tickets: O(<var>n</var>) time, O(1) extra space.",
    hi: { out: "index 2 par 4, 3 nahi: 3 missing, 4 duplicate",
          cap: "Ab ek baar sweep karo. <b>Galat value wala akela slot dono answers ka naam batata hai</b>: uska index kehta hai 3 kabhi nahi aaya, uski value kehti hai 4 do baar aaya. 5 tickets ke liye 3 swaps: O(<var>n</var>) time, O(1) extra space." } },
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
  { scene: `<span class="kicker">Why this example</span><p>Six days of profit and loss: <code>-2, 3, -1, 4, -3, 2</code>. Find the unbroken stretch of days with the largest total.</p><table><tr><td>stretches to choose from</td><td>21</td></tr><tr><td>best stretch</td><td>3, −1, 4 = 6</td></tr><tr><td>good days only</td><td>3, 4, 2: not unbroken</td></tr></table><p>The best stretch carries a loss, so no rule about skipping bad days can find it. Goal: find the 6 in one pass, deciding at each day whether the past is worth keeping.</p>`,
    cap: "The boxes are the days, with day numbers underneath. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Chhe din ka profit aur loss: <code>-2, 3, -1, 4, -3, 2</code>. Sabse bade total wala lagaataar dinon ka hissa dhoondho.</p><table><tr><td>chunne ko hisse</td><td>21</td></tr><tr><td>sabse achha hissa</td><td>3, −1, 4 = 6</td></tr><tr><td>sirf achhe din</td><td>3, 4, 2: lagaataar nahi</td></tr></table><p>Sabse achhe hisse mein ek loss hai, to bure din chhodne ka koi rule use nahi dhoondh sakta. Goal: ek pass mein 6 dhoondhna, har din tay karte hue ki pichhla rakhne layak hai ya nahi.</p>`,
          cap: "Boxes din hain, neeche din ke number. Next dabao." } },

  { band: [1, 3], out: "the answer: 3 + (-1) + 4 = 6",
    cap: "The answer <b>contains a negative number</b>. So “skip the negatives” is not the rule. Something has to decide when a loss is worth carrying.",
    ask: { q: "Instead of the best stretch anywhere, ask for the best stretch <b>ending exactly on day <var>i</var></b>. How many such answers are there?", opts: ["one per day: 6", "one per start and end: 21"], a: 0,
           why: "Each day has exactly one best stretch ending there. Six small questions instead of 21 candidates." },
    hi: { out: "answer: 3 + (-1) + 4 = 6",
          cap: "Answer mein <b>ek negative number hai</b>. To “negatives chhodo” rule nahi hai. Kuch tay karna padega ki loss uthaana kab faayde ka hai.",
          ask: { q: "Kahin bhi best hisse ki jagah, <b>theek din <var>i</var> par khatam</b> best hissa poochho. Aise kitne answers hain?", opts: ["har din ek: 6", "har start aur end ka ek: 21"],
                 why: "Har din par khatam hone wala theek ek best hissa. 21 candidates ki jagah chhe chhote sawaal." } } },

  { hot: [0], dim: [1, 2, 3, 4, 5], ptr: { i: 0 }, out: "day 0: cur = -2, best = -2",
    cap: "Day 0 has only one stretch ending there: −2 itself. Start both numbers at a[0], not at 0. <b>cur</b> is the best stretch ending here; <b>best</b> is the record.",
    ask: { q: "Day 1 is 3. Carry the past: −2 + 3 = 1. Start fresh: 3. Which is kept?", opts: ["start fresh: 3", "carry: 1"], a: 0,
           why: "The past total is negative, so carrying it can only drag the 3 down." },
    hi: { out: "din 0: cur = -2, best = -2",
          cap: "Din 0 par khatam sirf ek hissa: khud −2. Dono numbers a[0] se shuru karo, 0 se nahi. <b>cur</b> yahan khatam best hissa hai; <b>best</b> record.",
          ask: { q: "Din 1 par 3. Pichhla le chalo: −2 + 3 = 1. Naya shuru: 3. Kya rakha jaata hai?", opts: ["naya shuru: 3", "le chalo: 1"],
                 why: "Pichhla total negative hai, to use le chalna 3 ko sirf neeche kheenchega." } } },

  { hot: [1], dim: [0, 2, 3, 4, 5], ptr: { i: 1 }, out: "day 1: max(3, -2 + 3) = 3, restart. best = 3",
    cap: "At each day there are exactly <b>two</b> candidates: extend the stretch that ended yesterday, or begin a new one today. Nothing else can end here. The carried −2 hurt, so drop it.",
    ask: { q: "Day 2 is −1. Carry: 3 + (−1) = 2. Start fresh: −1. Which is kept?", opts: ["carry: 2", "start fresh: −1"], a: 0,
           why: "The 3 more than pays for the −1. A positive past is always worth keeping." },
    hi: { out: "din 1: max(3, -2 + 3) = 3, naya shuru. best = 3",
          cap: "Har din theek <b>do</b> candidates: kal khatam hissa badhao, ya aaj naya shuru karo. Yahan aur kuch khatam nahi ho sakta. Saath aaya −2 nuksaan tha, to chhodo.",
          ask: { q: "Din 2 par −1. Le chalo: 3 + (−1) = 2. Naya shuru: −1. Kya rakha jaata hai?", opts: ["le chalo: 2", "naya shuru: −1"],
                 why: "3, −1 ki keemat se zyada chuka deta hai. Positive pichhla hamesha rakhne layak." } } },

  { band: [1, 2], dim: [0, 3, 4, 5], ptr: { i: 2 }, out: "day 2: max(-1, 3 - 1) = 2, carry the loss. best = 3",
    cap: "The loss is carried, because the stretch behind it is still an asset. This one comparison is the whole algorithm: <b>keep the past only while its total is positive</b>.",
    ask: { q: "Day 3 is 4. What is cur now?", opts: ["6", "4"], a: 0,
           why: "Carry: 2 + 4 = 6, against a fresh 4. And 6 beats the old best of 3." },
    hi: { out: "din 2: max(-1, 3 - 1) = 2, loss uthao. best = 3",
          cap: "Loss uthaaya jaata hai, kyunki uske peeche ka hissa ab bhi faayde mein hai. Yahi ek tulna poora algorithm hai: <b>pichhla tabhi tak rakho jab tak uska total positive ho</b>.",
          ask: { q: "Din 3 par 4. Ab cur kya hai?", opts: ["6", "4"],
                 why: "Le chalo: 2 + 4 = 6, naye 4 ke saamne. Aur 6 purane best 3 ko haraata hai." } } },

  { band: [1, 3], dim: [0, 4, 5], ptr: { i: 3 }, out: "day 3: max(4, 2 + 4) = 6. best = 6",
    cap: "6 is the best stretch ending on day 3, and the best seen so far. From here the two numbers part ways.",
    ask: { q: "Day 4 is −3, so cur becomes 6 − 3 = 3. What happens to best?", opts: ["stays 6", "drops to 3"], a: 0,
           why: "best is a record and never goes down. Only cur, the stretch ending today, falls." },
    hi: { out: "din 3: max(4, 2 + 4) = 6. best = 6",
          cap: "6 din 3 par khatam best hissa hai, aur ab tak ka best bhi. Yahan se dono numbers alag raaste jaate hain.",
          ask: { q: "Din 4 par −3, to cur 6 − 3 = 3 ho jaata hai. best ka kya hota hai?", opts: ["6 rehta hai", "3 par girta hai"],
                 why: "best record hai aur kabhi nahi girta. Sirf cur, aaj khatam hissa, girta hai." } } },

  { band: [1, 5], dim: [0], ptr: { i: 5 }, out: "day 4: cur 3. day 5: cur 5. best stays 6",
    cap: "cur falls to 3, then climbs to 5, and never passes 6. Returning cur at the end would give 5. Keeping <b>best</b> separate is what returns 6.",
    hi: { out: "din 4: cur 3. din 5: cur 5. best 6 hi",
          cap: "cur 3 par girta hai, phir 5 tak chadhta hai, aur 6 kabhi paar nahi karta. Aakhir mein cur lautaaoge to 5 milega. <b>best</b> alag rakhna hi 6 lautata hai." } },

  { band: [1, 3], on: [1, 2, 3], out: "one pass, two numbers: O(n) time, O(1) space",
    cap: "Every day answers its own question in O(1) from the day before, so the whole array is <b>one pass</b>. It is dynamic programming with the table thrown away, because each cell only ever reads the one before it.",
    hi: { out: "ek pass, do numbers: O(n) time, O(1) space",
          cap: "Har din apna sawaal pichhle din se O(1) mein hal karta hai, to poora array <b>ek pass</b> hai. Yeh table phenka hua dynamic programming hai, kyunki har cell sirf pichhla padhta hai." } },
]},

/* ---- LCA: one post-order pass, and what each subtree reports back ---- */
/* The nine-person org chart. LCA(6, 4) = 5 is found by reports flowing up;
   LCA(5, 4) = 5 shows why a target is its own ancestor. */
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
    { scene: `<span class="kicker">Why this example</span><p>Employees 6 and 4 have a dispute. It goes to the <b>lowest</b> manager with both of them below. The chart only links managers down to their reports.</p><table><tr><td>3</td><td>top; 5 and 1 report to 3</td></tr><tr><td>5</td><td>6 and 2 report to 5</td></tr><tr><td>2</td><td>7 and 4 report to 2</td></tr><tr><td>1</td><td>0 and 8 report to 1</td></tr></table><p>Goal: find that manager in one pass, with nothing stored, by letting answers flow <b>up</b>.</p>`,
      cap: "Each box is a person; lines join a manager to their reports. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Employees 6 aur 4 ka jhagda hai. Woh us <b>sabse neeche</b> wale manager ke paas jaata hai jiske neeche dono hon. Chart managers ko sirf neeche unke reports se jodta hai.</p><table><tr><td>3</td><td>top; 5 aur 1, 3 ko report karte hain</td></tr><tr><td>5</td><td>6 aur 2, 5 ko report karte hain</td></tr><tr><td>2</td><td>7 aur 4, 2 ko report karte hain</td></tr><tr><td>1</td><td>0 aur 8, 1 ko report karte hain</td></tr></table><p>Goal: woh manager ek pass mein dhoondhna, kuch store kiye bina, answers ko <b>upar</b> behne dekar.</p>`,
            cap: "Har box ek insaan hai; lines manager ko reports se jodti hain. Next dabao." } },

    { on: ["c", "h"], dim: ["b", "e", "f", "g"], out: "targets: 6 and 4",
      cap: "Both 3 and 5 have 6 and 4 somewhere below them. So “above both” describes a whole chain of people. The question asks for the <b>lowest</b> one.",
      ask: { q: "Which one is the answer?", opts: ["5, the lower one", "3, the top"], a: 0,
             why: "Below 5 the two chains split: 6 on the left, 2 and then 4 on the right. 5 is the last person on both chains." },
      hi: { out: "targets: 6 aur 4",
            cap: "3 aur 5 dono ke neeche kahin 6 aur 4 hain. To “dono ke upar” logon ki poori chain batata hai. Sawaal <b>sabse neeche</b> wala maangta hai.",
            ask: { q: "Answer kaun hai?", opts: ["5, neeche wala", "3, top"],
                   why: "5 ke neeche do chains alag hoti hain: left mein 6, right mein 2 aur phir 4. 5 dono chains ka aakhri insaan hai." } } },

    { on: ["r", "a", "c", "d", "h"], edge: [["r","a"],["a","c"],["a","d"],["d","h"]], dim: ["b", "e", "f", "g"], out: "paths: 3, 5, 6  and  3, 5, 2, 4",
      cap: "The direct method: write out both paths from the top, walk them side by side, and keep the <b>last node they share</b>: 5. Correct, but it costs two full searches and two stored paths.",
      hi: { out: "raaste: 3, 5, 6  aur  3, 5, 2, 4",
            cap: "Seedha tareeka: upar se dono raaste likho, saath saath chalo, aur <b>aakhri shared node</b> rakho: 5. Sahi, par do poori searches aur do stored raaste lagte hain." } },

    { on: ["c", "h"], t: { g: "nil", e: "nil", f: "nil" }, dim: ["r", "a", "b", "d", "e", "f", "g"], out: "the bottom reports first",
      cap: "Now in one pass. Recurse to the bottom first; each person <b>reports up</b> one thing. A target reports itself: 6 says 6, and 4 says 4. Anyone who found nothing, like 7, 0 and 8, reports nil.",
      ask: { q: "Person 2 hears 4 from the right and nil from the left. What does 2 report up?", opts: ["4, unchanged", "itself, 2"], a: 0,
             why: "Only one target is below 2, so the other must be elsewhere. 2 is not where the chains split, so it just passes 4 along." },
      hi: { out: "neeche wale pehle report karte hain",
            cap: "Ab ek pass mein. Pehle neeche tak recurse karo; har insaan ek cheez <b>upar report</b> karta hai. Target khud ko report karta hai: 6 kehta hai 6, aur 4 kehta hai 4. Jise kuch nahi mila, jaise 7, 0 aur 8, woh nil report karta hai.",
            ask: { q: "Insaan 2 right se 4 aur left se nil sunta hai. 2 upar kya report karta hai?", opts: ["4, bina badle", "khud ko, 2"],
                   why: "2 ke neeche sirf ek target hai, to doosra kahin aur hai. 2 woh jagah nahi jahan chains alag hoti hain, to bas 4 aage bhejta hai." } } },

    { on: ["c", "h", "d"], t: { g: "nil", e: "nil", f: "nil", d: "4" }, dim: ["r", "b", "e", "f", "g"], out: "2 forwards 4",
      cap: "Node 2 heard from one side only, so it <b>forwards the single report</b> and stays out of the way.",
      ask: { q: "Person 5 hears 6 from the left and 4 from the right. What does 5 report?", opts: ["itself: 5 is the answer", "just 6, the first it heard"], a: 0,
             why: "Two reports mean the targets are in different subtrees of 5, so the chains split exactly here." },
      hi: { out: "2, 4 aage bhejta hai",
            cap: "Node 2 ne sirf ek taraf se suna, to woh <b>akeli report aage bhejta hai</b> aur beech mein nahi aata.",
            ask: { q: "Insaan 5 left se 6 aur right se 4 sunta hai. 5 kya report karta hai?", opts: ["khud ko: 5 answer hai", "sirf 6, jo pehle suna"],
                   why: "Do reports ka matlab targets 5 ke alag subtrees mein hain, to chains theek yahin alag hoti hain." } } },

    { on: ["a"], t: { g: "nil", e: "nil", f: "nil", d: "4", a: "5 LCA", b: "nil" }, dim: ["r", "b", "e", "f", "g"], out: "5 heard from both sides: the answer",
      cap: "Two non-empty reports: the paths split <b>here</b>, and nowhere lower. 5 reports itself upward, instead of either child's report.",
      hi: { out: "5 ne dono taraf se suna: answer",
            cap: "Do non-empty reports: raaste <b>yahin</b> alag hote hain, kahin neeche nahi. 5 kisi child ki report ki jagah khud ko upar report karta hai." } },

    { on: ["a", "r"], t: { g: "nil", e: "nil", f: "nil", d: "4", a: "5 LCA", b: "nil", r: "5" }, dim: ["b", "e", "f", "g"], out: "3 hears 5 and nil: forwards 5",
      cap: "The top hears 5 from the left and nil from the right, so by the same rule it forwards 5. <b>The answer floats to the top on its own.</b> One post-order function, nothing stored.",
      ask: { q: "Now find LCA(5, 4): 4 is below 5. Where does the recursion stop on the left side?", opts: ["at 5 itself, which is the answer", "it must search below 5 for 4 first"], a: 0,
             why: "A target returns itself at once. 5 is its own ancestor, so 5 is correct without looking below." },
      hi: { out: "3 ne 5 aur nil suna: 5 aage",
            cap: "Top left se 5 aur right se nil sunta hai, to usi niyam se 5 aage bhejta hai. <b>Answer khud upar tair aata hai.</b> Ek post-order function, kuch store nahi.",
            ask: { q: "Ab LCA(5, 4) nikaalo: 4, 5 ke neeche hai. Left side par recursion kahan rukti hai?", opts: ["5 par hi, jo answer hai", "pehle 5 ke neeche 4 dhoondhna padega"],
                   why: "Target turant khud ko lautata hai. 5 khud ka ancestor hai, to neeche dekhe bina 5 sahi hai." } } },

    { on: ["a"], t: { a: "5 LCA" }, dim: ["r", "b", "c", "d", "e", "f", "g", "h"], out: "LCA(5, 4) = 5: the walk stops at 5",
      cap: "The case people try to special-case. The walk reaches 5, sees a target, and returns it without looking below. <b>A node is its own ancestor</b>, so no extra branch is needed.",
      hi: { out: "LCA(5, 4) = 5: walk 5 par rukti hai",
            cap: "Woh case jise log alag se likhna chahte hain. Walk 5 par pahunchti hai, target dekhti hai, aur neeche dekhe bina lautaati hai. <b>Node khud ka ancestor hai</b>, to extra branch nahi chahiye." } },

    { on: ["r", "a", "b"], dim: ["c", "d", "e", "f", "g", "h"], out: "one query O(n); many queries: binary lifting",
      cap: "One query is one traversal: O(<var>n</var>) time, O(<var>h</var>) stack. For 10⁵ queries on the same chart, precompute each person's manager 1, 2, 4, 8 levels up. Then each query is a handful of jumps: <b>binary lifting</b>.",
      hi: { out: "ek query O(n); bahut queries: binary lifting",
            cap: "Ek query ek traversal hai: O(<var>n</var>) time, O(<var>h</var>) stack. Usi chart par 10⁵ queries ke liye har insaan ka 1, 2, 4, 8 level upar wala manager pehle nikaal lo. Phir har query kuch jumps hai: <b>binary lifting</b>." } },
  ]
},

/* ---- LRU: two structures, each covering the other's blind spot ---- */
/* A three-entry cache holding A, B and C, with C used longest ago. Top row:
   the hash map's keys. Bottom row: the list nodes, most recent on the left. */
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
    { scene: `<span class="kicker">Why this example</span><p>A cache with room for 3 entries. When it is full, it throws out whatever was <b>used longest ago</b>.</p><table><tr><td>holding</td><td>A, B, C (C used longest ago)</td></tr><tr><td>then</td><td>get(B)</td></tr><tr><td>then</td><td>put(D): something must go</td></tr></table><p>The right answer is to evict C. Goal: do each step in O(1), with no searching at all.</p>`,
      cap: "Top row: the hash map's keys. Bottom row: the entries. Press Next.",
      hi: { scene: `<span class="kicker">Yeh example kyun</span><p>3 entries ki jagah wala cache. Bhar jaaye to woh nikaalta hai jo <b>sabse der pehle use hua</b>.</p><table><tr><td>rakha hai</td><td>A, B, C (C sabse pehle use hua)</td></tr><tr><td>phir</td><td>get(B)</td></tr><tr><td>phir</td><td>put(D): kuch jaana hai</td></tr></table><p>Sahi answer C nikaalna hai. Goal: har step O(1) mein, bina kuch dhoondhe.</p>`,
            cap: "Upar ki row: hash map ki keys. Neeche ki row: entries. Next dabao." } },

    { on: ["m1", "m2", "m3"], dim: ["n1", "n2", "n3"], edges: [], out: "a hash map: O(1) get, no idea which entry is oldest",
      cap: "Start with what a cache obviously needs. A hash map answers <b>get</b> in O(1). But its slots are computed from the keys, so it keeps no order at all.",
      ask: { q: "The cache is full and D arrives. Can the map alone say which of A, B, C was used longest ago?", opts: ["no: it stores no order", "yes: the first key inserted"], a: 0,
             why: "Nothing in a hash map records when an entry was last used. You would have to scan and compare stored times." },
      hi: { out: "hash map: O(1) get, pata nahi kaunsa sabse purana",
            cap: "Cache ko jo seedha chahiye usse shuru karo. Hash map <b>get</b> O(1) mein deta hai. Par uske slots keys se nikalte hain, to woh koi order nahi rakhta.",
            ask: { q: "Cache bhara hai aur D aata hai. Kya akela map bata sakta hai ki A, B, C mein kaun sabse pehle use hua?", opts: ["nahi: woh order nahi rakhta", "haan: pehli daali key"],
                   why: "Hash map mein kuch record nahi karta ki entry aakhri baar kab use hui. Stored times scan karke compare karne padte." } } },

    { on: ["n1", "n2", "n3"], dim: ["m1", "m2", "m3"], edges: [["n1","n2"],["n2","n3"]], out: "a list by recency: arrows run newest -> oldest",
      cap: "So add the missing half: a list ordered by <b>last use</b>, the arrows running from newest to oldest. Eviction is now free: the oldest end, C. But finding a key in a list means walking it.",
      ask: { q: "get(B). How do you reach B's node without walking the list?", opts: ["the map points straight at it", "you cannot: walk from the newest end"], a: 0,
             why: "Store the list node itself as the map's value, and one lookup lands on it." },
      hi: { out: "recency ki list: arrows naye -> purane",
            cap: "To kami wala aadha jodo: <b>aakhri use</b> ke order wali list, arrows naye se purane ki taraf. Eviction ab muft: purana sira, C. Par list mein key dhoondhna use chalna hai.",
            ask: { q: "get(B). List chale bina B ke node tak kaise pahunchoge?", opts: ["map seedha usko point karta hai", "nahi pahunch sakte: naye sire se chalo"],
                   why: "List node ko hi map ki value banao, aur ek lookup us par le jaata hai." } } },

    { on: ["m2", "n2"], edge: [["m2","n2"]], dim: ["m1", "m3", "n1", "n3"], out: "get(B): the map stores the NODE, not the value",
      cap: "The join that makes both halves work: the map's value is a <b>pointer to the list node</b>. One lookup and you stand on B's node. B was just used, so it must move to the front.",
      ask: { q: "To unlink B you must reach A, the node before it. How do you get there in O(1)?", opts: ["B's back pointer: the list is doubly linked", "walk from the front"], a: 0,
             why: "Walking from the front is the O(n) you were avoiding. A back pointer gives the node before B directly." },
      hi: { out: "get(B): map NODE rakhta hai, value nahi",
            cap: "Woh jod jo dono aadhon ko chalata hai: map ki value <b>list node ka pointer</b> hai. Ek lookup aur aap B ke node par. B abhi use hua, to use aage jaana hai.",
            ask: { q: "B unlink karne ke liye usse pehle wala A chahiye. O(1) mein wahan kaise?", opts: ["B ka back pointer: list doubly linked hai", "aage se chalo"],
                   why: "Aage se chalna wahi O(n) hai jisse bach rahe the. Back pointer B se pehle wala node seedha deta hai." } } },

    { on: ["n2", "n1", "n3"], dim: ["m1", "m2", "m3"], edges: [["m1","n1"],["m2","n2"],["m3","n3"],["n2","n1"],["n1","n3"]], out: "B moved to the front: 6 pointer writes. Order: B, A, C",
      cap: "Unlink B (2 writes), relink it at the front (4 writes), and nothing moved in memory. The order is now B, A, C, so C is still the one used longest ago.",
      ask: { q: "Now put(D) while full. Which entry is evicted?", opts: ["C, at the oldest end", "A, the first ever inserted"], a: 0,
             why: "C has gone longest without being touched. When A was inserted does not matter." },
      hi: { out: "B aage aaya: 6 pointer writes. Order: B, A, C",
            cap: "B unlink (2 writes), aage relink (4 writes), aur memory mein kuch nahi hila. Order ab B, A, C hai, to C ab bhi sabse pehle use hua.",
            ask: { q: "Ab bhare cache mein put(D). Kaun evict hoga?", opts: ["C, purane sire par", "A, sabse pehle daala gaya"],
                   why: "C sabse der se chhua nahi gaya. A kab daala gaya, isse farak nahi padta." } } },

    { show: ["m4", "n4"], dim: ["m3", "n3"], edges: [["m1","n1"],["m2","n2"],["m4","n4"],["n4","n2"],["n2","n1"]], out: "put(D): evict C from BOTH, insert D at the front",
      cap: "Take C off the oldest end <b>and</b> delete key C from the map. Leave the key and it points at a node that is no longer cached. That is why each node stores its own key. Order now: D, B, A.",
      hi: { out: "put(D): C ko DONO se nikaalo, D aage daalo",
            cap: "C ko purane sire se hatao <b>aur</b> map se key C mitao. Key chhodi to woh aise node ko point karegi jo ab cached nahi. Isiliye har node apni key rakhta hai. Order ab: D, B, A." } },

    { show: ["m4", "n4"], on: ["m1", "m2", "m4", "n1", "n2", "n4"], dim: ["m3", "n3"], edges: [["m1","n1"],["m2","n2"],["m4","n4"],["n4","n2"],["n2","n1"]], out: "get and put: O(1) each, on average",
      cap: "Nothing was searched, sorted or scanned. The pattern to keep: when one structure is fast at exactly what another is slow at, <b>hold the same objects in both</b> and keep them in step on every write.",
      hi: { out: "get aur put: har ek O(1), average",
            cap: "Kuch dhoondha, sort ya scan nahi hua. Yaad rakhne wala pattern: jab ek structure theek wahan tez ho jahan doosra slow, <b>same objects dono mein rakho</b> aur har write par dono ko saath rakho." } },
  ]
},

/* ---- KMP: the text pointer never goes backwards ---- */
"kmp": { kind: "cells", arr: ["a", "b", "a", "b", "a", "b", "c", "a"], frames: [
  { scene: `<span class="kicker">Why this example</span><p>Search the text <code>abababca</code> for the pattern <code>ababc</code>. The pattern occurs once, at index 2.</p><table><tr><td>first attempt, at 0</td><td>matches a b a b, fails on c</td></tr><tr><td>the real match</td><td>starts at 2, inside that attempt</td></tr><tr><td>the pattern's overlap</td><td>a b a b starts and ends with a b</td></tr></table><p>Small, but it has both traps: sliding by one re-reads, and sliding too far skips the match. Goal: slide by exactly the safe amount, and never move back in the text.</p>`,
    cap: "The boxes are the text, with positions underneath. The band marks where the pattern sits. Press Next.",
    hi: { scene: `<span class="kicker">Yeh example kyun</span><p>Text <code>abababca</code> mein pattern <code>ababc</code> dhoondho. Pattern ek baar aata hai, index 2 par.</p><table><tr><td>pehli koshish, 0 par</td><td>a b a b match, c par fail</td></tr><tr><td>asli match</td><td>2 se shuru, usi koshish ke andar</td></tr><tr><td>pattern ka overlap</td><td>a b a b, a b se shuru aur khatam</td></tr></table><p>Chhota, par dono jaal hain: ek khisakna dobara padhta hai, zyada khisakna match chhod deta hai. Goal: theek safe jitna khisakna, aur text mein kabhi peeche na jaana.</p>`,
          cap: "Boxes text hain, neeche positions. Band batata hai pattern kahan baitha hai. Next dabao." } },

  { out: "text n = 8, pattern a b a b c",
    cap: "The naive scan lines the pattern up at index 0, compares left to right, and on a mismatch slides one place right and starts over. Correct, and <b>O(<var>n</var>·<var>m</var>)</b> at worst.",
    ask: { q: "Lined up at index 0, how many characters match before the first mismatch?", opts: ["4", "2"], a: 0,
           why: "a, b, a, b all match. Then text a at index 4 meets pattern c." },
    hi: { out: "text n = 8, pattern a b a b c",
          cap: "Naive scan pattern ko index 0 par rakhta hai, left se right compare karta hai, aur mismatch par ek jagah right khisak kar phir shuru. Sahi, aur worst mein <b>O(<var>n</var>·<var>m</var>)</b>.",
          ask: { q: "Index 0 par rakha, pehle mismatch se pehle kitne characters match hote hain?", opts: ["4", "2"],
                 why: "a, b, a, b sab match. Phir index 4 ka text a pattern ke c se milta hai." } } },

  { band: [0, 3], bad: [4], out: "matched a b a b, then text a vs pattern c",
    cap: "Four characters matched, the fifth did not. Those four are now known exactly: they are the pattern's own first four.",
    ask: { q: "The naive scan now goes back to index 1 and tries each start in turn. Which positions it already read will it read again?", opts: ["1 to 3", "none"], a: 0,
           why: "The start at 1 reads position 1, and the start at 2 reads 2 and 3 again." },
    hi: { out: "a b a b match, phir text a vs pattern c",
          cap: "Chaar characters match hue, paanchwa nahi. Woh chaar ab theek pata hain: pattern ke apne pehle chaar.",
          ask: { q: "Naive scan ab index 1 par lautta hai aur baari baari har start try karta hai. Pehle padhi kaunsi positions dobara padhega?", opts: ["1 se 3", "koi nahi"],
                 why: "1 wala start position 1 padhta hai, aur 2 wala start 2 aur 3 dobara." } } },

  { band: [1, 5], dim: [0], out: "naive: back to index 1, re-reading 1 to 3",
    cap: "<b>The text pointer moved backwards</b>, from 4 to 1. On a text like aaaa...aab, every position pays for the whole pattern again: 10⁹ comparisons at 10⁶ characters.",
    ask: { q: "Could the pattern instead jump past all 4 matched characters, straight to index 4?", opts: ["no: it would skip the match at 2", "yes: they have all been read"], a: 0,
           why: "The real match starts at index 2, inside the part already matched. Jumping to 4 misses it." },
    hi: { out: "naive: index 1 par wapas, 1 se 3 dobara padho",
          cap: "<b>Text pointer peeche gaya</b>, 4 se 1 par. aaaa...aab jaise text par har position poore pattern ki keemat dobara deti hai: 10⁶ characters par 10⁹ comparisons.",
          ask: { q: "Kya pattern iski jagah saare 4 match characters ke paar, seedhe index 4 par kood sakta hai?", opts: ["nahi: 2 wala match chhootega", "haan: sab padh liye"],
                 why: "Asli match index 2 se shuru hota hai, pehle se match hue hisse ke andar. 4 par koodna use chhod deta hai." } } },

  { arr: ["a", "b", "a", "b", "c"], on: [0, 1], hot: [2, 3], out: "the matched part was a b a b",
    cap: "The right slide is in between, and the pattern alone decides it. <b>a b a b</b> begins and ends with the same <b>a b</b>. Slide so the ending a b sits where the starting a b was.",
    hi: { out: "match hua hissa a b a b tha",
          cap: "Sahi khisakna beech mein hai, aur sirf pattern tay karta hai. <b>a b a b</b> ek hi <b>a b</b> se shuru aur khatam hota hai. Aise khisko ki aakhri a b wahan aaye jahan shuru wala a b tha." } },

  { arr: ["0", "0", "1", "2", "0"], on: [0, 1, 2, 3, 4], out: "lps for a b a b c: 0 0 1 2 0",
    cap: "Work that overlap out once for every prefix of the <b>pattern</b>, never the text. lps[3] = 2 says: after 4 matched characters, 2 are still usable. Building the table is the pattern matched against itself, <b>O(<var>m</var>)</b>.",
    ask: { q: "lps[3] = 2. After 4 matched characters and a mismatch, how far does the pattern slide?", opts: ["2", "4"], a: 0,
           why: "4 − 2 = 2. The last two matched characters, a b, become the pattern's first two." },
    hi: { out: "a b a b c ka lps: 0 0 1 2 0",
          cap: "Yeh overlap <b>pattern</b> ke har prefix ke liye ek baar nikaalo, text ke liye kabhi nahi. lps[3] = 2 kehta hai: 4 match characters ke baad 2 ab bhi kaam ke. Table banana pattern ko khud se match karna hai, <b>O(<var>m</var>)</b>.",
          ask: { q: "lps[3] = 2. 4 match characters aur ek mismatch ke baad pattern kitna khisakta hai?", opts: ["2", "4"],
                 why: "4 − 2 = 2. Aakhri do match characters, a b, pattern ke pehle do ban jaate hain." } } },

  { band: [2, 6], dim: [0, 1], hot: [2, 3], out: "slide by 4 - lps[3] = 2: a b already known to match",
    cap: "The pattern now starts at index 2, and its first two characters sit over text a b that was already checked. Comparison resumes at pattern index 2.",
    ask: { q: "Which text index is compared next?", opts: ["4, the one that failed", "2, the new start"], a: 0,
           why: "Text 2 and 3 are known to be a b. Only position 4 is compared again, now against pattern index 2." },
    hi: { out: "4 - lps[3] = 2 khisko: a b pehle se match",
          cap: "Pattern ab index 2 se shuru, aur uske pehle do characters us text a b par hain jo pehle check ho chuka. Compare pattern index 2 se chalta hai.",
          ask: { q: "Agla kaunsa text index compare hota hai?", opts: ["4, jo fail hua tha", "2, naya start"],
                 why: "Text 2 aur 3 a b pata hain. Sirf position 4 dobara compare hoti hai, ab pattern index 2 se." } } },

  { band: [2, 6], hot: [6], dim: [0, 1, 7], out: "text 4, 5, 6 match: found at index 2",
    cap: "The text index went 4, 5, 6, and <b>never went back to 1</b>. Only the pattern index jumped, and only ever down, which is why the fall-back loop costs no more than the forward progress already made.",
    hi: { out: "text 4, 5, 6 match: index 2 par mila",
          cap: "Text index 4, 5, 6 gaya, aur <b>kabhi 1 par wapas nahi gaya</b>. Sirf pattern index kooda, aur sirf neeche, isiliye fall-back loop pehle ki progress se zyada nahi padta." } },

  { on: [0, 1, 2, 3, 4, 5, 6, 7], out: "O(n + m) time, O(m) space, text read once",
    cap: "Each text character is looked at a constant number of times, so the scan is <b>O(<var>n</var>)</b> after an <b>O(<var>m</var>)</b> table. At 10⁶ characters that is about 10⁶ steps, against the naive 10⁹.",
    hi: { out: "O(n + m) time, O(m) space, text ek baar padha",
          cap: "Har text character ko constant baar dekha jaata hai, to <b>O(<var>m</var>)</b> table ke baad scan <b>O(<var>n</var>)</b> hai. 10⁶ characters par lagbhag 10⁶ steps, naive ke 10⁹ ke saamne." } },
]},

});
