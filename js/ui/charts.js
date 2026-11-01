// Charts: hand-built SVG, sized to their container so text stays at its real size.
// Builders register tooltip content (value, unit, source, formula) per mark, and every
// chart's data as a table for "View as table" and CSV download. Each chart is one tab
// stop; arrow keys move between its marks.

import { esc } from './dom.js';
import { spoken, num } from '../format.js';

export const TIPS = new Map();
export const TABLES = new Map();
export const WIDTHS = new Map();
export const widthOf = (id, fallback) => WIDTHS.get(id) || fallback;

export function lin(d0, d1, r0, r1) {
  const k = (r1 - r0) / (d1 - d0 || 1);
  const f = (v) => r0 + (v - d0) * k;
  f.inv = (x) => d0 + (x - r0) / k;
  return f;
}
const q = (x) => Math.round(x * 10) / 10;
const tw = (s, size = 12) => String(s).length * size * 0.56;
const clampN = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function svgWrap({ id, w, h, title, desc, body, defs = '' }) {
  return `<svg class="viz" width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMinYMin meet" role="group" aria-labelledby="${id}-t ${id}-d"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
}

// A focusable mark. Only the first mark of a chart is in the tab order (roving focus).
let markCounter = new Map();
export function startChart(id) {
  markCounter.set(id, 0);
  for (const k of TIPS.keys()) if (k.startsWith(`${id}:`)) TIPS.delete(k);
}
export function mark(chart, { label, tip, item, cls = '' }, body) {
  const i = markCounter.get(chart) || 0;
  markCounter.set(chart, i + 1);
  TIPS.set(`${chart}:${i}`, tip);
  return `<g class="mark ${cls}" tabindex="${i === 0 ? 0 : -1}" role="img" aria-label="${esc(spoken(label))}" data-tip="${chart}:${i}"${item ? ` data-item="${esc(item)}"` : ''}>${body}</g>`;
}
const ringRect = (x, y, w, h, r = 3) => `<rect class="ring" x="${q(x - 3)}" y="${q(y - 3)}" width="${q(Math.max(0, w) + 6)}" height="${q(Math.max(0, h) + 6)}" rx="${r + 2}"/>`;
const ringCircle = (cx, cy, r) => `<circle class="ring" cx="${q(cx)}" cy="${q(cy)}" r="${r + 4}"/>`;
const hit = (cx, cy, r = 10) => `<circle class="hit" cx="${q(cx)}" cy="${q(cy)}" r="${r}"/>`;

export function setTable(id, title, head, rows) {
  TABLES.set(id, { title, head, rows });
  return { head, rows };
}

function gridY(y, ticks, x0, x1, fmt, labels = true) {
  return ticks
    .map((t) => `<line class="grid" x1="${x0}" x2="${x1}" y1="${q(y(t))}" y2="${q(y(t))}"/>${labels ? `<text class="axis" x="${x0 - 8}" y="${q(y(t)) + 4}" text-anchor="end">${esc(fmt(t))}</text>` : ''}`)
    .join('');
}
function zeroLine(y, x0, x1, label, anchor = 'end') {
  const yy = q(y(0));
  const lx = anchor === 'end' ? x1 : x0;
  return `<line class="zero" x1="${x0}" x2="${x1}" y1="${yy}" y2="${yy}"/>${label ? `<text class="zero-label" x="${lx}" y="${yy - 6}" text-anchor="${anchor}">${esc(label)}</text>` : ''}`;
}
// Push labels apart vertically so they never collide.
function spread(items, gap, lo, hi) {
  const s = [...items].sort((a, b) => a.y - b.y);
  for (let i = 1; i < s.length; i++) if (s[i].y < s[i - 1].y + gap) s[i].y = s[i - 1].y + gap;
  const over = s.length ? s[s.length - 1].y - hi : 0;
  if (over > 0) for (const it of s) it.y -= over;
  for (let i = s.length - 2; i >= 0; i--) if (s[i].y > s[i + 1].y - gap) s[i].y = s[i + 1].y - gap;
  if (s.length && s[0].y < lo) { const d = lo - s[0].y; for (const it of s) it.y += d; }
  return items;
}
const linePath = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${q(p[0])},${q(p[1])}`).join('');

/* ---------- Target meter ---------- */
export function meterSVG({ w, low, high, value, compact = false }) {
  const pad = 8;
  const x = lin(-8, 6, pad, w - pad);
  const cx = (v) => clampN(x(v), pad, w - pad);
  const h = compact ? 22 : 34;
  const ty = 10;
  const ok = value >= 0;
  const axis = compact
    ? ''
    : `<text class="meter-axis" x="${pad}" y="${h - 2}">${'−'}8%</text><text class="meter-axis" x="${w - pad}" y="${h - 2}" text-anchor="end">+6%</text><text class="meter-axis meter-zero-label" x="${q(x(0))}" y="${h - 2}" text-anchor="middle">Break-even target, Q4 FY27</text>`;
  return `<svg class="meter-svg" width="100%" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false">
<rect class="meter-track" x="${pad}" y="${ty - 2}" width="${w - 2 * pad}" height="4" rx="2"/>
<rect class="meter-band" x="${q(cx(low))}" y="${ty - 6}" width="${q(Math.max(3, cx(high) - cx(low)))}" height="12" rx="6"/>
<line class="meter-zero" x1="${q(x(0))}" x2="${q(x(0))}" y1="0" y2="${ty + 9}"/>
<circle class="meter-dot ${ok ? 'pos' : 'neg'}" cx="${q(cx(value))}" cy="${ty}" r="5.5"/>
${axis}</svg>`;
}

/* ---------- KPI mini range bar ---------- */
export function miniRange({ w, low, high, value, domain = [-8, 6] }) {
  const pad = 6;
  const x = lin(domain[0], domain[1], pad, w - pad);
  const ok = value >= 0;
  return `<svg class="mini-range" width="100%" height="26" viewBox="0 0 ${w} 26" aria-hidden="true" focusable="false">
<rect class="meter-track" x="${pad}" y="9" width="${w - 2 * pad}" height="4" rx="2"/>
<rect class="meter-band" x="${q(x(low))}" y="5" width="${q(Math.max(3, x(high) - x(low)))}" height="12" rx="6"/>
<line class="meter-zero" x1="${q(x(0))}" x2="${q(x(0))}" y1="1" y2="21"/>
<circle class="meter-dot ${ok ? 'pos' : 'neg'}" cx="${q(x(value))}" cy="11" r="5"/>
<text class="axis" x="${q(x(0))}" y="26" text-anchor="middle" font-size="10">0</text></svg>`;
}

/* ---------- Overview: the path back to zero ---------- */
export function pathChart({ id, w, actual, q4, fy28, title, desc }) {
  startChart(id);
  const h = 320;
  const m = { t: 28, r: Math.min(150, w * 0.16), b: 52, l: 44 };
  const slots = { FY24: 0, FY25: 1, 'Q1 FY26': 2.15, 'Q2 FY26': 2.85, 'Q3 FY26': 3.55, 'Q4 FY26': 4.25, 'Q1 FY27': 4.95, 'Q2 FY27': 5.65, 'Q3 FY27': 6.35, 'Q4 FY27': 7.05, FY28: 8.2 };
  const x = lin(-0.35, 8.45, m.l, w - m.r);
  const y = lin(-12, 16, h - m.b, m.t);
  const ticks = [-10, -5, 0, 5, 10, 15];
  let body = gridY(y, ticks, m.l, w - m.r + 24, (t) => num(t, { sign: true }));
  // the gap with no records
  const gx0 = x(slots['Q1 FY27']) - 22;
  const gx1 = x(slots['Q3 FY27']) + 22;
  body += `<rect class="gap-box" x="${q(gx0)}" y="${m.t}" width="${q(gx1 - gx0)}" height="${h - m.b - m.t}" rx="8"/>`;
  body += `<text class="gap-label" x="${q((gx0 + gx1) / 2)}" y="${q(y(10))}" text-anchor="middle">Not in the</text><text class="gap-label" x="${q((gx0 + gx1) / 2)}" y="${q(y(10)) + 16}" text-anchor="middle">records yet</text>`;
  body += zeroLine(y, m.l, w - m.r + 24, '');
  body += `<text class="zero-label" x="${m.l + 6}" y="${q(y(0)) - 6}">Break-even</text>`;
  // actual line
  const pts = actual.map((a) => [x(slots[a.slot]), y(a.v)]);
  body += `<path class="ln-actual draw-line" pathLength="1" d="${linePath(pts)}"/>`;
  body += `<path class="ln-gap" d="M${q(pts.at(-1)[0])},${q(pts.at(-1)[1])}L${q(gx0)},${q(pts.at(-1)[1])}"/>`;
  actual.forEach((a, i) => {
    const [cx, cy] = pts[i];
    const tone = a.v >= 0 ? 'pos' : 'neg';
    const below = a.v < 0;
    body += mark(id, { label: `${a.label}: ${a.text}% of NR`, tip: a.tip, item: a.item },
      `${hit(cx, cy)}${ringCircle(cx, cy, 5)}<circle class="pt ${a.full ? 'hollow' : 'filled'} ${tone}" cx="${q(cx)}" cy="${q(cy)}" r="5"/><text class="val ${tone}" x="${q(cx)}" y="${q(below ? cy + 20 : cy - 11)}" text-anchor="middle">${esc(a.text)}</text>`);
  });
  // Q4 FY27 plan band and current dot
  const bw = 16;
  const qx = x(slots['Q4 FY27']);
  body += mark(id, { label: `Q4 FY27 plan: ${q4.rangeText}% of NR; at these settings ${q4.valueText}%`, tip: q4.tip, item: q4.item },
    `${ringRect(qx - bw / 2, y(q4.high), bw, y(q4.low) - y(q4.high))}<rect class="band-acc draw-fade" x="${q(qx - bw / 2)}" y="${q(y(q4.high))}" width="${bw}" height="${q(Math.max(2, y(q4.low) - y(q4.high)))}" rx="4"/><circle class="pt filled ${q4.value >= 0 ? 'pos' : 'neg'} ring-dot" cx="${q(qx)}" cy="${q(y(q4.value))}" r="6"/>`);
  body += `<text class="val strong" x="${q(qx)}" y="${q(y(q4.high) - 10)}" text-anchor="middle">${esc(q4.rangeText)}</text>`;
  body += `<text class="val ${q4.value >= 0 ? 'pos' : 'neg'}" x="${q(qx + 12)}" y="${q(y(q4.value) + 4)}">${esc(q4.valueText)}</text>`;
  // FY28 band and the selected case
  const fx = x(slots.FY28);
  body += mark(id, { label: `FY28 full year at 25% marketing: ${fy28.rangeText}% of NR; ${fy28.caseLabel} ${fy28.valueText}%`, tip: fy28.tip, item: fy28.item },
    `${ringRect(fx - bw / 2, y(fy28.high), bw, y(fy28.low) - y(fy28.high))}<rect class="band-acc draw-fade" x="${q(fx - bw / 2)}" y="${q(y(fy28.high))}" width="${bw}" height="${q(y(fy28.low) - y(fy28.high))}" rx="4"/><circle class="pt hollow ${fy28.value >= 0 ? 'pos' : 'neg'} ring-dot" cx="${q(fx)}" cy="${q(y(fy28.value))}" r="6"/>`);
  body += `<text class="val strong" x="${q(fx)}" y="${q(y(fy28.high) - 10)}" text-anchor="middle">${esc(fy28.rangeText)}</text>`;
  body += `<text class="val ${fy28.value >= 0 ? 'pos' : 'neg'}" x="${q(fx + 12)}" y="${q(y(fy28.value) + 4)}">${esc(`${fy28.caseLabel} ${fy28.valueText}`)}</text>`;
  // x labels
  const lab = (s, t, cls = '') => `<text class="axis ${cls}" x="${q(x(slots[s]))}" y="${h - m.b + 20}" text-anchor="middle">${esc(t)}</text>`;
  body += lab('FY24', 'FY24') + lab('FY25', 'FY25') + lab('FY28', 'FY28');
  ['Q1', 'Q2', 'Q3', 'Q4'].forEach((qq) => { body += lab(`${qq} FY26`, qq); body += lab(`${qq} FY27`, qq, qq === 'Q4' ? '' : 'muted'); });
  const mid = (a, b) => (x(slots[a]) + x(slots[b])) / 2;
  body += `<text class="axis group" x="${q(mid('FY24', 'FY25'))}" y="${h - m.b + 40}" text-anchor="middle">Full years</text>`;
  body += `<text class="axis group" x="${q(mid('Q1 FY26', 'Q4 FY26'))}" y="${h - m.b + 40}" text-anchor="middle">FY26 by quarter</text>`;
  body += `<text class="axis group" x="${q(mid('Q1 FY27', 'Q4 FY27'))}" y="${h - m.b + 40}" text-anchor="middle">FY27</text>`;
  body += `<text class="axis group" x="${q(x(slots.FY28))}" y="${h - m.b + 40}" text-anchor="middle">Full year</text>`;
  return svgWrap({ id, w, h, title, desc, body });
}

/* ---------- Overview: why CM3 fell, three bars ---------- */
export function whyFellChart({ id, w, groups, title, desc }) {
  startChart(id);
  const m = { t: 8, r: 64, b: 8, l: 4 };
  const x = lin(-14.5, 1, m.l, w - m.r);
  const subs = groups.map((g) => (g.sub ? wrapText(g.sub, w - m.l - 8, 12) : []));
  const rowH = subs.map((ls) => 52 + ls.length * 16 + 8);
  const h = m.t + rowH.reduce((a, b) => a + b, 0) + 22;
  let body = '';
  let y0 = m.t;
  groups.forEach((g, i) => {
    const by = y0 + 26;
    body += `<text class="row-label" x="${m.l}" y="${y0 + 14}">${esc(g.label)}</text>`;
    body += `<text class="val strong ${g.v < 0 ? 'neg' : 'pos'}" x="${w - 4}" y="${by + 14}" text-anchor="end">${esc(g.valueText)}</text>`;
    if (g.parts) {
      let run = 0;
      g.parts.forEach((p) => {
        const a = x(run);
        const b = x(run + p.v);
        run += p.v;
        const wd = Math.abs(a - b);
        const inner = wd > tw(p.short, 12) + 12 ? `<text class="seg-label" x="${q((a + b) / 2)}" y="${by + 14}" text-anchor="middle">${esc(p.short)}</text>` : '';
        body += mark(id, { label: `${g.label}, ${p.label}: ${p.text} crore`, tip: p.tip, item: p.item },
          `${ringRect(Math.min(a, b), by, wd, 20)}<rect class="bar s-neg draw-x-r part" x="${q(Math.min(a, b))}" y="${by}" width="${q(Math.max(1, wd - 1.5))}" height="20" rx="3"/>${inner}`);
      });
    } else {
      const a = x(0);
      const b = x(g.v);
      body += mark(id, { label: `${g.label}: ${g.valueText}`, tip: g.tip, item: g.item },
        `${ringRect(Math.min(a, b), by, Math.abs(a - b), 20)}<rect class="bar ${g.v < 0 ? 's-neg draw-x-r' : 's-pos draw-x-l'}" x="${q(Math.min(a, b))}" y="${by}" width="${q(Math.max(2, Math.abs(a - b)))}" height="20" rx="3"/>`);
    }
    subs[i].forEach((ln, k) => { body += `<text class="sub" x="${m.l}" y="${by + 40 + k * 16}">${esc(ln)}</text>`; });
    y0 += rowH[i];
  });
  body += `<line class="zero" x1="${q(x(0))}" x2="${q(x(0))}" y1="${m.t + 18}" y2="${h - 26}"/>`;
  body += `<text class="axis" x="${q(x(0))}" y="${h - 8}" text-anchor="middle">0</text>`;
  return svgWrap({ id, w, h, title, desc, body });
}

/* ---------- Diagnosis: horizontal waterfall bridge ---------- */
export function bridgeChart({ id, w, steps, groups, title, desc }) {
  startChart(id);
  const narrow = w < 560;
  const rowH = 34;
  const m = { t: 10, r: narrow ? 12 : 168, b: 30, l: narrow ? 112 : 196 };
  const h = m.t + steps.length * rowH + m.b;
  const x = lin(-13, 33, m.l, w - m.r);
  let body = '';
  for (const t of narrow ? [-10, 0, 10, 20, 30] : [-10, -5, 0, 5, 10, 15, 20, 25, 30]) {
    body += `<line class="grid" x1="${q(x(t))}" x2="${q(x(t))}" y1="${m.t}" y2="${h - m.b}"/><text class="axis" x="${q(x(t))}" y="${h - 10}" text-anchor="middle">${esc(num(t, { sign: true }))}</text>`;
  }
  body += `<line class="zero" x1="${q(x(0))}" x2="${q(x(0))}" y1="${m.t - 4}" y2="${h - m.b}"/>`;
  steps.forEach((s, i) => {
    const y0 = m.t + i * rowH + 7;
    const bh = rowH - 14;
    const a = x(Math.min(s.from, s.to));
    const b = x(Math.max(s.from, s.to));
    const tone = s.total ? 's-neu' : s.v >= 0 ? 's-pos' : 's-neg';
    const grow = s.total ? (s.to >= 0 ? 'draw-x-l' : 'draw-x-r') : s.v >= 0 ? 'draw-x-l' : 'draw-x-r';
    const lx = s.total || s.v >= 0 ? b + 6 : a - 6;
    const anchor = s.total || s.v >= 0 ? 'start' : 'end';
    const label = narrow && s.label.length > 16 ? s.short || s.label : s.label;
    body += `<text class="row-label ${s.total ? 'strong' : ''}" x="${m.l - 10}" y="${y0 + bh / 2 + 4}" text-anchor="end">${esc(label)}</text>`;
    body += mark(id, { label: `${s.label}: ${s.text} crore`, tip: s.tip, item: s.item },
      `${ringRect(a, y0, b - a, bh)}<rect class="bar ${tone} ${grow}" x="${q(a)}" y="${y0}" width="${q(Math.max(2, b - a))}" height="${bh}" rx="3"/><text class="val ${s.total ? 'strong' : s.v >= 0 ? 'pos' : 'neg'}" x="${q(lx)}" y="${y0 + bh / 2 + 4}" text-anchor="${anchor}">${esc(s.text)}</text>`);
    if (i < steps.length - 1) {
      const nx = x(s.to);
      body += `<line class="connector" x1="${q(nx)}" x2="${q(nx)}" y1="${y0 + bh}" y2="${y0 + rowH}"/>`;
    }
  });
  if (!narrow) {
    for (const g of groups) {
      const i0 = steps.findIndex((s) => s.key === g.keys[0]);
      const i1 = steps.findIndex((s) => s.key === g.keys.at(-1));
      const top = m.t + i0 * rowH + 6;
      const bot = m.t + (i1 + 1) * rowH - 6;
      const bx = w - m.r + 18;
      body += `<path class="bracket" d="M${bx - 6},${top}H${bx}V${bot}H${bx - 6}"/>`;
      const lines = wrapText(g.label, m.r - 32, 12);
      const y0 = (top + bot) / 2 - (lines.length * 15) / 2 + 4;
      body += lines.map((ln, k) => `<text class="bracket-label" x="${bx + 10}" y="${q(y0 + k * 15)}">${esc(ln)}</text>`).join('');
      body += `<text class="val strong neg" x="${bx + 10}" y="${q(y0 + lines.length * 15 + 3)}">${esc(g.text)}</text>`;
    }
  }
  return svgWrap({ id, w, h, title, desc, body });
}

/* ---------- Columns for a few values against zero ---------- */
export function columnChart({ id, w, cols, yDomain, yTicks, yFmt, title, desc, h = 250, annotate }) {
  startChart(id);
  const m = { t: 34, r: 12, b: 50, l: 40 };
  const x0 = m.l;
  const x1 = w - m.r;
  const y = lin(yDomain[0], yDomain[1], h - m.b, m.t);
  const slot = (x1 - x0) / cols.length;
  const bw = Math.min(64, slot * 0.5);
  let body = gridY(y, yTicks, x0, x1, yFmt);
  body += zeroLine(y, x0, x1, '');
  cols.forEach((c, i) => {
    const cx = x0 + slot * (i + 0.5);
    const a = y(Math.max(0, c.v));
    const b = y(Math.min(0, c.v));
    const tone = c.v > 0 ? 's-pos' : c.v < 0 ? 's-neg' : 's-neu';
    const hh = Math.max(2, b - a);
    body += mark(id, { label: `${c.label}: ${c.text}`, tip: c.tip, item: c.item },
      `${ringRect(cx - bw / 2, a, bw, hh)}<rect class="bar ${tone} ${c.v < 0 ? 'draw-y-t' : 'draw-y-b'}" x="${q(cx - bw / 2)}" y="${q(c.v === 0 ? y(0) - 1 : a)}" width="${q(bw)}" height="${q(c.v === 0 ? 2 : hh)}" rx="3"/><text class="val ${c.v < 0 ? 'neg' : c.v > 0 ? 'pos' : 'strong'}" x="${q(cx)}" y="${q(c.v < 0 ? b + 16 : a - 8)}" text-anchor="middle">${esc(c.text)}</text>`);
    body += `<text class="axis strong-axis" x="${q(cx)}" y="${h - m.b + 20}" text-anchor="middle">${esc(c.label)}</text>`;
    if (c.sub) body += `<text class="axis" x="${q(cx)}" y="${h - m.b + 36}" text-anchor="middle">${esc(c.sub)}</text>`;
  });
  if (annotate) {
    const i = annotate.index;
    const cx = x0 + slot * (i + 0.5);
    body += `<text class="note-label" x="${q(Math.min(cx, x1 - tw(annotate.text, 12) / 2))}" y="${m.t - 16}" text-anchor="middle">${esc(annotate.text)}</text><line class="leader" x1="${q(cx)}" x2="${q(cx)}" y1="${m.t - 10}" y2="${q(y(0)) - 4}"/>`;
  }
  return svgWrap({ id, w, h, title, desc, body });
}

/* ---------- Horizontal bars ---------- */
export function hbars({ id, w, rows, domain, title, desc, labelW, rowH = 40, refs = [], showZero = false }) {
  startChart(id);
  const lw = labelW ?? Math.min(220, Math.max(90, w * 0.32));
  const m = { t: refs.length ? 26 : 6, r: 92, b: 6, l: lw };
  const h = m.t + rows.length * rowH + m.b;
  const x = lin(domain[0], domain[1], m.l, w - m.r);
  let body = '';
  for (const r of refs) {
    const rx = q(x(r.v));
    body += `<line class="ref" x1="${rx}" x2="${rx}" y1="${m.t - 6}" y2="${h - m.b}"/><text class="ref-label" x="${rx}" y="${m.t - 12}" text-anchor="${rx > w - m.r - 60 ? 'end' : 'middle'}">${esc(r.label)}</text>`;
  }
  if (showZero) body += `<line class="zero" x1="${q(x(0))}" x2="${q(x(0))}" y1="${m.t}" y2="${h - m.b}"/>`;
  rows.forEach((r, i) => {
    const y0 = m.t + i * rowH + 8;
    const bh = rowH - 16;
    const a = x(Math.min(0, r.v));
    const b = x(Math.max(0, r.v));
    const lines = wrapText(r.label, lw - 12, 12);
    body += lines.map((ln, k) => `<text class="row-label ${r.strong ? 'strong' : ''}" x="${lw - 10}" y="${q(y0 + bh / 2 + 4 + (k - (lines.length - 1) / 2) * 14)}" text-anchor="end">${esc(ln)}</text>`).join('');
    body += mark(id, { label: `${r.label}: ${r.text}`, tip: r.tip, item: r.item },
      `${ringRect(a, y0, b - a, bh)}<rect class="bar ${r.tone || 's-neu'} ${r.v < 0 ? 'draw-x-r' : 'draw-x-l'} ${r.outline ? 'outlined' : ''}" x="${q(a)}" y="${y0}" width="${q(Math.max(2, b - a))}" height="${bh}" rx="3"/><text class="val ${r.valCls || 'strong'}" x="${q(b + 8)}" y="${y0 + bh / 2 + 4}">${esc(r.text)}</text>${r.sub && b + 16 + tw(r.text, 13) + tw(r.sub, 12) < w ? `<text class="sub" x="${q(b + 8 + tw(r.text, 13) + 8)}" y="${y0 + bh / 2 + 4}">${esc(r.sub)}</text>` : ''}`);
  });
  return svgWrap({ id, w, h, title, desc, body });
}

export function wrapText(text, width, size = 12) {
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const wd of words) {
    const t = cur ? `${cur} ${wd}` : wd;
    if (tw(t, size) > width && cur) { lines.push(cur); cur = wd; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

/* ---------- Line chart ---------- */
// series: [{ key, label, cls, dash, marker, pts: [{ x, y, tip, item, label }] }]
export function lineChart(o) {
  const { id, w, h = 240, title, desc, xDomain, xTicks = [], yDomain, yTicks, yFmt, series, refs = [], vlines = [], bands = [], zero = false, zeroLabel = '', endLabels = true, m: mm = {} } = o;
  startChart(id);
  const longest = Math.max(0, ...series.map((s) => tw(s.endLabel || s.label || '', 12)));
  const m = { t: 18, r: endLabels ? Math.min(140, longest + 18) : 16, b: 30, l: 42, ...mm };
  const x = lin(xDomain[0], xDomain[1], m.l, w - m.r);
  const y = lin(yDomain[0], yDomain[1], h - m.b, m.t);
  let body = '';
  for (const b of bands) {
    body += `<rect class="${b.cls || 'xband'}" x="${q(x(b.x0))}" y="${m.t}" width="${q(Math.max(1, x(b.x1) - x(b.x0)))}" height="${h - m.b - m.t}"/>`;
    if (b.label) body += `<text class="band-label" x="${q((x(b.x0) + x(b.x1)) / 2)}" y="${m.t - 6}" text-anchor="middle">${esc(b.label)}</text>`;
  }
  body += gridY(y, yTicks, m.l, w - m.r, yFmt);
  if (zero && yDomain[0] < 0) body += zeroLine(y, m.l, w - m.r, zeroLabel);
  for (const t of xTicks) body += `<text class="axis" x="${q(x(t.v))}" y="${h - m.b + 18}" text-anchor="${t.anchor || 'middle'}">${esc(t.label)}</text>`;
  for (const r of refs) {
    const ry = q(y(r.y));
    body += `<line class="ref ${r.cls || ''}" x1="${m.l}" x2="${w - m.r}" y1="${ry}" y2="${ry}"/>`;
    if (r.label) body += `<text class="ref-label" x="${r.anchor === 'start' ? m.l + 4 : w - m.r}" y="${ry + (r.below ? 16 : -6)}" text-anchor="${r.anchor || 'end'}">${esc(r.label)}</text>`;
  }
  for (const v of vlines) {
    const vx = q(x(v.x));
    body += `<line class="vline ${v.cls || ''}" x1="${vx}" x2="${vx}" y1="${m.t - (v.label ? 2 : 0)}" y2="${h - m.b}"/>`;
    if (v.label) body += `<text class="vline-label ${v.cls || ''}" x="${vx + (v.anchor === 'end' ? -4 : 4)}" y="${m.t + (v.dy || 10)}" text-anchor="${v.anchor || 'start'}">${esc(v.label)}</text>`;
  }
  const ends = [];
  for (const s of series) {
    const pts = s.pts.map((p) => [x(p.x), y(p.y)]);
    if (!s.noLine && pts.length > 1) body += `<path class="ln ${s.cls || 'ln-1'} ${s.dash ? 'dashed' : 'draw-line'}" ${s.dash ? '' : 'pathLength="1"'} d="${linePath(pts)}"/>`;
    const endText = s.endLabel === undefined ? s.label : s.endLabel;
    if (endLabels && endText && pts.length) ends.push({ y: pts.at(-1)[1] + 4, x: pts.at(-1)[0], text: endText, cls: s.labelCls || s.cls || 'ln-1' });
  }
  for (const s of series) {
    if (s.noMarks) continue;
    s.pts.forEach((p) => {
      const cx = x(p.x);
      const cy = y(p.y);
      const marker = s.marker === 'none' ? '' : `<circle class="pt ${s.marker === 'hollow' ? 'hollow' : 'filled'} ${s.ptCls || s.cls || 'ln-1'}" cx="${q(cx)}" cy="${q(cy)}" r="${s.r || 3.5}"/>`;
      const lbl = p.label ? `<text class="val ${p.labelCls || ''}" x="${q(cx + (p.dx || 0))}" y="${q(cy + (p.dy ?? -9))}" text-anchor="${p.anchor || 'middle'}">${esc(p.label)}</text>` : '';
      body += mark(id, { label: p.aria || `${s.label}, ${p.xLabel}: ${p.text}`, tip: p.tip, item: p.item || s.item }, `${hit(cx, cy, s.hitR || 9)}${ringCircle(cx, cy, s.r || 3.5)}${marker}${lbl}`);
    });
  }
  spread(ends, 15, m.t, h - m.b);
  for (const e of ends) body += `<text class="end-label ${e.cls}" x="${q(e.x + 8)}" y="${q(e.y)}">${esc(e.text)}</text>`;
  return svgWrap({ id, w, h, title, desc, body });
}

/* ---------- Slope chart: two points per series with labels at both ends ---------- */
export function slopeChart({ id, w, h = 230, title, desc, from, to, series, fmt, domain }) {
  startChart(id);
  const lw = Math.min(110, w * 0.3);
  const m = { t: 30, r: lw, b: 14, l: lw };
  const y = lin(domain[0], domain[1], h - m.b, m.t);
  const xa = m.l;
  const xb = w - m.r;
  let body = `<text class="axis strong-axis" x="${xa}" y="16" text-anchor="middle">${esc(from)}</text><text class="axis strong-axis" x="${xb}" y="16" text-anchor="middle">${esc(to)}</text>`;
  body += `<line class="grid" x1="${xa}" x2="${xa}" y1="${m.t - 6}" y2="${h - m.b}"/><line class="grid" x1="${xb}" x2="${xb}" y1="${m.t - 6}" y2="${h - m.b}"/>`;
  const left = series.map((s) => ({ y: y(s.v[0]) + 4, s }));
  const right = series.map((s) => ({ y: y(s.v[1]) + 4, s }));
  spread(left, 16, m.t, h - m.b + 4);
  spread(right, 16, m.t, h - m.b + 4);
  series.forEach((s, i) => {
    const pa = [xa, y(s.v[0])];
    const pb = [xb, y(s.v[1])];
    body += mark(id, { label: `${s.label}: ${fmt(s.v[0])} in ${from} to ${fmt(s.v[1])} in ${to}`, tip: s.tip, item: s.item },
      `<path class="ln ${s.cls} draw-line" pathLength="1" d="${linePath([pa, pb])}"/><circle class="hit" cx="${q((pa[0] + pb[0]) / 2)}" cy="${q((pa[1] + pb[1]) / 2)}" r="12"/>${ringCircle(pb[0], pb[1], 4)}<circle class="pt filled ${s.cls}" cx="${q(pa[0])}" cy="${q(pa[1])}" r="4"/><circle class="pt filled ${s.cls}" cx="${q(pb[0])}" cy="${q(pb[1])}" r="4"/>`);
    body += `<text class="end-label ${s.cls}" x="${xa - 10}" y="${q(left[i].y)}" text-anchor="end">${esc(`${s.short || s.label} ${fmt(s.v[0])}`)}</text>`;
    body += `<text class="end-label ${s.cls}" x="${xb + 10}" y="${q(right[i].y)}">${esc(`${fmt(s.v[1])} ${s.short || s.label}`)}</text>`;
  });
  return svgWrap({ id, w, h, title, desc, body });
}

/* ---------- Dumbbell: rank moves ---------- */
export function dumbbell({ id, w, rows, domain, from, to, title, desc }) {
  startChart(id);
  const lw = 76;
  const rowH = 40;
  const m = { t: 30, r: 24, b: 28, l: lw };
  const h = m.t + rows.length * rowH + m.b;
  const x = lin(domain[0], domain[1], m.l, w - m.r);
  let body = '';
  for (let r = domain[0]; r <= domain[1]; r++) body += `<line class="grid" x1="${q(x(r))}" x2="${q(x(r))}" y1="${m.t - 6}" y2="${h - m.b}"/><text class="axis" x="${q(x(r))}" y="${h - 8}" text-anchor="middle">#${r}</text>`;
  body += `<text class="axis" x="${m.l}" y="14">Better rank</text><text class="axis" x="${w - m.r}" y="14" text-anchor="end">Worse rank</text>`;
  rows.forEach((r, i) => {
    const cy = m.t + i * rowH + rowH / 2;
    const a = x(r.v[0]);
    const b = x(r.v[1]);
    const dir = b > a ? -1 : 1;
    body += `<text class="row-label ${r.strong ? 'strong' : ''}" x="${lw - 12}" y="${cy + 4}" text-anchor="end">${esc(r.label)}</text>`;
    body += mark(id, { label: `${r.label}: rank ${r.v[0]} in ${from} to ${r.v[1]} in ${to}`, tip: r.tip, item: r.item },
      `${ringRect(Math.min(a, b) - 6, cy - 8, Math.abs(b - a) + 12, 16)}<line class="db-line ${r.cls}" x1="${q(a)}" x2="${q(b + dir * 8)}" y1="${cy}" y2="${cy}"/><path class="db-arrow ${r.cls}" d="M${q(b + dir * 9)},${cy - 5}L${q(b + dir * 2)},${cy}L${q(b + dir * 9)},${cy + 5}"/><circle class="pt hollow ${r.cls}" cx="${q(a)}" cy="${cy}" r="5"/><circle class="pt filled ${r.cls}" cx="${q(b)}" cy="${cy}" r="5"/>`);
  });
  return svgWrap({ id, w, h, title, desc, body });
}

/* ---------- Plant X: tonnes per quarter against the 70 t and 90 t lines ---------- */
export function plantXBars({ id, w, quarters, title, desc }) {
  startChart(id);
  const h = 250;
  const m = { t: 20, r: 96, b: 48, l: 40 };
  const y = lin(0, 140, h - m.b, m.t);
  const slot = (w - m.r - m.l) / quarters.length;
  const bw = Math.min(72, slot * 0.52);
  let body = gridY(y, [0, 35, 70, 105, 140], m.l, w - m.r, (t) => `${t} t`);
  body += `<line class="ref caution" x1="${m.l}" x2="${w - m.r}" y1="${q(y(90))}" y2="${q(y(90))}"/><text class="ref-label" x="${w - m.r + 6}" y="${q(y(90)) + 4}">90 t: ₹104 tier</text>`;
  body += `<line class="ref negative" x1="${m.l}" x2="${w - m.r}" y1="${q(y(70))}" y2="${q(y(70))}"/><text class="ref-label" x="${w - m.r + 6}" y="${q(y(70)) + 4}">70 t minimum</text>`;
  quarters.forEach((qq, i) => {
    const cx = m.l + slot * (i + 0.5);
    const top = y(qq.t);
    const tone = qq.tier === 'tier-low' ? 's-pos' : qq.tier === 'tier-high' ? 's-cau' : 's-neg';
    body += mark(id, { label: `${qq.label}: ${qq.tText}, ${qq.tierText}, draft cost ${qq.costText}`, tip: qq.tip, item: qq.item },
      `${ringRect(cx - bw / 2, top, bw, y(0) - top)}<rect class="bar ${tone} draw-y-b" x="${q(cx - bw / 2)}" y="${q(top)}" width="${q(bw)}" height="${q(Math.max(1, y(0) - top))}" rx="3"/><text class="val strong" x="${q(cx)}" y="${q(top - 8)}" text-anchor="middle">${esc(qq.tText)}</text>`);
    body += `<text class="axis strong-axis" x="${q(cx)}" y="${h - m.b + 18}" text-anchor="middle">${esc(qq.label)}</text><text class="axis" x="${q(cx)}" y="${h - m.b + 34}" text-anchor="middle">${esc(qq.costText)}</text>`;
  });
  return svgWrap({ id, w, h, title, desc, body });
}

/* ---------- Plan: Q4 FY27 walk, a vertical waterfall with lever ranges ---------- */
export function walkChart({ id, w, steps, result, upside, title, desc }) {
  startChart(id);
  const h = 340;
  const m = { t: 26, r: 14, b: 58, l: 44 };
  const y = lin(-16, 10, h - m.b, m.t);
  const n = steps.length + 1 + (upside ? 1 : 0);
  const slot = (w - m.l - m.r) / n;
  const bw = Math.min(54, slot * 0.56);
  const hatch = `<pattern id="${id}-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="hatch-bg" width="6" height="6"/><line class="hatch-line" x1="0" y1="0" x2="0" y2="6"/></pattern>`;
  // Column labels: the lever code always; its short name only when the column has room.
  const SHORT = { Momentum: 'M', Backstop: 'B', 'Q4 FY27': 'Q4' };
  const axisLabel = (code, name, cx, width) => {
    const text = width < 64 && SHORT[code] ? SHORT[code] : code;
    let out = `<text class="axis strong-axis" x="${q(cx)}" y="${h - m.b + 18}" text-anchor="middle">${esc(text)}</text>`;
    if (name && width >= 76) out += wrapText(name, width - 6, 12).slice(0, 2).map((ln, k) => `<text class="axis" x="${q(cx)}" y="${h - m.b + 32 + k * 14}" text-anchor="middle">${esc(ln)}</text>`).join('');
    return out;
  };
  let body = gridY(y, [-15, -10, -5, 0, 5, 10], m.l, w - m.r, (t) => num(t, { sign: true }));
  body += zeroLine(y, m.l, w - m.r, '');
  body += `<text class="zero-label" x="${m.l + 6}" y="${q(y(0)) - 6}">Break-even</text>`;
  steps.forEach((s, i) => {
    const cx = m.l + slot * (i + 0.5);
    const x0 = cx - bw / 2;
    let inner = '';
    if (s.kind === 'start') {
      inner = `<rect class="bar s-neg draw-y-t" x="${q(x0)}" y="${q(y(0))}" width="${q(bw)}" height="${q(y(s.to) - y(0))}" rx="3"/>`;
    } else if (s.off) {
      inner = `<rect class="bar-off" x="${q(x0)}" y="${q(y(s.from + s.potential))}" width="${q(bw)}" height="${q(y(s.from) - y(s.from + s.potential))}" rx="3"/>`;
    } else {
      const top = y(s.to);
      const bot = y(s.from);
      inner = `<rect class="bar s-pos draw-y-b" x="${q(x0)}" y="${q(top)}" width="${q(bw)}" height="${q(Math.max(1, bot - top))}" rx="2"/>`;
      if (s.max !== undefined && s.max > s.v + 1e-9) {
        const hTop = y(s.from + s.max);
        inner += `<rect class="bar-hatch" fill="url(#${id}-hatch)" x="${q(x0)}" y="${q(hTop)}" width="${q(bw)}" height="${q(Math.max(1, top - hTop))}" rx="2"/>`;
      }
      if (s.min !== undefined && s.min > 1e-9) {
        const ty = q(y(s.from + s.min));
        inner += `<line class="range-tick" x1="${q(x0 - 3)}" x2="${q(x0 + bw + 3)}" y1="${ty}" y2="${ty}"/>`;
      }
    }
    const labelY = s.kind === 'start' ? y(s.to) + 18 : y(s.from + (s.off ? s.potential : s.max ?? s.v)) - 8;
    const lbl = `<text class="val ${s.kind === 'start' ? 'neg' : s.off ? '' : 'pos'} strong" x="${q(cx)}" y="${q(labelY)}" text-anchor="middle">${esc(s.text)}</text>`;
    body += mark(id, { label: s.aria, tip: s.tip, item: s.item }, `${ringRect(x0, Math.min(y(s.from), y(s.to), y(s.from + (s.max ?? 0))), bw, Math.abs(y(s.from) - y(s.to)) + 2)}${inner}${lbl}`);
    if (i < steps.length) {
      const nx = cx + slot;
      body += `<line class="connector" x1="${q(cx + bw / 2)}" x2="${q(nx - bw / 2)}" y1="${q(y(s.to))}" y2="${q(y(s.to))}"/>`;
    }
    body += axisLabel(s.code || s.label, s.name, cx, slot);
  });
  // result: band and current value
  const ri = steps.length;
  const cx = m.l + slot * (ri + 0.5);
  const x0 = cx - bw / 2;
  const ok = result.value >= 0;
  const valTop = y(Math.max(0, result.value));
  const valBot = y(Math.min(0, result.value));
  body += mark(id, { label: result.aria, tip: result.tip, item: result.item },
    `${ringRect(x0 - 6, y(result.high), bw + 12, y(result.low) - y(result.high))}<rect class="band-acc" x="${q(x0 - 6)}" y="${q(y(result.high))}" width="${q(bw + 12)}" height="${q(Math.max(2, y(result.low) - y(result.high)))}" rx="4"/><rect class="bar ${ok ? 's-pos' : 's-neg'}" x="${q(x0 + 6)}" y="${q(valTop)}" width="${q(bw - 12)}" height="${q(Math.max(2, valBot - valTop))}" rx="2"/><line class="result-line ${ok ? 'pos' : 'neg'}" x1="${q(x0 - 6)}" x2="${q(x0 + bw + 6)}" y1="${q(y(result.value))}" y2="${q(y(result.value))}"/><text class="val strong ${ok ? 'pos' : 'neg'}" x="${q(cx)}" y="${q(y(result.high) - 22)}" text-anchor="middle">${esc(result.text)}</text><text class="val" x="${q(cx)}" y="${q(y(result.high) - 8)}" text-anchor="middle">${esc(result.rangeText)}</text>`);
  body += axisLabel('Q4 FY27', 'CM3', cx, slot);
  if (upside) {
    const ux = m.l + slot * (ri + 1.5);
    const top = y(result.value + upside.high);
    const bot = y(result.value + upside.low);
    body += mark(id, { label: upside.aria, tip: upside.tip, item: upside.item },
      `${ringRect(ux - bw / 2, top, bw, bot - top)}<rect class="upside" x="${q(ux - bw / 2)}" y="${q(top)}" width="${q(bw)}" height="${q(bot - top)}" rx="3"/><text class="val" x="${q(ux)}" y="${q(top - 8)}" text-anchor="middle">${esc(upside.text)}</text>`);
    body += axisLabel('L4a', 'upside, not counted', ux, slot);
  }
  return svgWrap({ id, w, h, title, desc, body, defs: hatch });
}

/* ---------- Cash: bullet chart against a cap ---------- */
export function bulletChart({ id, w, items, total, cap, domain, title, desc, topText }) {
  startChart(id);
  const h = 128;
  const m = { t: 30, r: 16, b: 30, l: 8 };
  const x = lin(0, domain, m.l, w - m.r);
  const by = m.t + 10;
  const bh = 30;
  const hatch = `<pattern id="${id}-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="hatch-bg pos" width="6" height="6"/><line class="hatch-line pos" x1="0" y1="0" x2="0" y2="6"/></pattern>`;
  let body = '';
  for (let t = 0; t <= domain; t += domain > 20 ? 5 : 2) body += `<line class="grid" x1="${q(x(t))}" x2="${q(x(t))}" y1="${by - 6}" y2="${by + bh + 6}"/><text class="axis" x="${q(x(t))}" y="${h - 8}" text-anchor="middle">₹${t}</text>`;
  let run = 0;
  const positives = items.filter((it) => it.v > 0);
  positives.forEach((it, i) => {
    const a = x(run);
    run += it.v;
    const b = x(run);
    const fits = b - a > tw(it.short, 11) + 10;
    body += mark(id, { label: `${it.label}: ${it.text}`, tip: it.tip, item: it.item },
      `${ringRect(a, by, b - a, bh)}<rect class="bar cash-${i % 4} draw-x-l" x="${q(a)}" y="${by}" width="${q(Math.max(1, b - a - 1.5))}" height="${bh}" rx="2"/>${fits ? `<text class="seg-label dark" x="${q((a + b) / 2)}" y="${by + bh / 2 + 4}" text-anchor="middle">${esc(it.short)}</text>` : ''}`);
  });
  const rel = items.find((it) => it.v < 0);
  if (rel) {
    const a = x(run + rel.v);
    const b = x(run);
    body += mark(id, { label: `${rel.label}: ${rel.text}`, tip: rel.tip, item: rel.item },
      `${ringRect(a, by - 4, b - a, bh + 8)}<rect class="release" fill="url(#${id}-hatch)" x="${q(a)}" y="${by - 4}" width="${q(b - a)}" height="${bh + 8}" rx="2"/>`);
  }
  if (total > cap) body += `<rect class="over" x="${q(x(cap))}" y="${by - 4}" width="${q(x(total) - x(cap))}" height="${bh + 8}" rx="2"/>`;
  const tx = q(x(total));
  body += `<line class="total-line" x1="${tx}" x2="${tx}" y1="${by - 8}" y2="${by + bh + 8}"/>`;
  const cx = q(x(cap));
  body += `<line class="cap-line" x1="${cx}" x2="${cx}" y1="${m.t - 12}" y2="${by + bh + 10}"/><text class="cap-label" x="${cx}" y="${m.t - 16}" text-anchor="${cx > w - 90 ? 'end' : 'middle'}">Cap ₹${cap} cr</text>`;
  if (topText) body += `<text class="axis" x="${tx}" y="${by + bh + 22}" text-anchor="${tx > w - 80 ? 'end' : tx < 80 ? 'start' : 'middle'}">${esc(topText)}</text>`;
  return svgWrap({ id, w, h, title, desc, body, defs: hatch });
}

/* ---------- Roadmap timeline ---------- */
// Header rows: years, months, then the shaded target periods. Today's label sits at the foot.
export function timelineChart({ id, w, lanes, items, gates, bands, start, end, today, dayNum, monthTicks, title, desc }) {
  startChart(id);
  const lw = 150;
  const m = { t: 70, r: 16, b: 34, l: lw };
  const x = lin(dayNum(start), dayNum(end), m.l, w - m.r);
  // assign rows inside each lane so labels never overlap
  const laneRows = new Map();
  const placed = [];
  for (const lane of lanes) {
    const its = items.filter((it) => it.lane === lane.key).sort((a, b) => dayNum(a.start) - dayNum(b.start));
    const rowsEnd = [];
    for (const it of its) {
      const sx = x(dayNum(it.start));
      const ex = it.end ? x(dayNum(it.end)) : sx;
      const labelEnd = Math.max(ex, sx + 10) + 8 + tw(it.label, 12);
      const fitsRight = labelEnd < w - m.r;
      const left = fitsRight ? sx - 8 : sx - 8 - tw(it.label, 12);
      const right = fitsRight ? labelEnd : Math.max(ex, sx + 10);
      let r = rowsEnd.findIndex((e) => left > e + 12);
      if (r < 0) { r = rowsEnd.length; rowsEnd.push(right); } else rowsEnd[r] = right;
      placed.push({ ...it, sx, ex, row: r, fitsRight });
    }
    laneRows.set(lane.key, Math.max(1, rowsEnd.length));
  }
  const rowH = 26;
  let yCursor = m.t;
  const laneY = new Map();
  for (const lane of lanes) { laneY.set(lane.key, yCursor); yCursor += laneRows.get(lane.key) * rowH + 14; }
  const h = yCursor + m.b;
  let body = '';
  bands.forEach((b, i) => {
    const a = x(dayNum(b.start));
    const e = x(dayNum(b.end));
    body += `<rect class="tl-band ${i === 0 ? 'acc' : ''}" x="${q(a)}" y="${m.t - 22}" width="${q(e - a)}" height="${h - m.t + 22 - m.b}"/><text class="band-label" x="${q(a + 6)}" y="${m.t - 9}">${esc(b.short || b.label)}</text>`;
  });
  for (const t of monthTicks) {
    const tx = q(x(dayNum(t.iso)));
    body += `<line class="grid" x1="${tx}" x2="${tx}" y1="${m.t - 22}" y2="${h - m.b}"/><text class="axis" x="${tx + 3}" y="${m.t - 30}">${esc(t.month)}</text>`;
    if (t.year) body += `<text class="axis group" x="${tx + 3}" y="${m.t - 50}">${esc(t.year)}</text>`;
  }
  for (const lane of lanes) {
    const ly = laneY.get(lane.key);
    const lh = laneRows.get(lane.key) * rowH;
    body += `<line class="lane-line" x1="0" x2="${w - m.r}" y1="${ly + lh + 7}" y2="${ly + lh + 7}"/>`;
    body += wrapText(lane.label, lw - 16, 12).map((ln, k) => `<text class="row-label strong" x="0" y="${ly + 16 + k * 14}">${esc(ln)}</text>`).join('');
  }
  for (const g of gates) {
    const gx = q(x(dayNum(g.start)));
    body += mark(id, { label: `${g.when}: ${g.label}`, tip: g.tip, item: g.item }, `${ringRect(gx - 3, m.t - 22, 6, h - m.t + 22 - m.b)}<line class="gate" x1="${gx}" x2="${gx}" y1="${m.t - 22}" y2="${h - m.b}"/><text class="gate-label" x="${gx - 4}" y="${h - m.b + 16}" text-anchor="end">${esc(g.short || g.label)}</text>`);
  }
  for (const it of placed) {
    const cy = laneY.get(it.lane) + it.row * rowH + 12;
    const shape = it.kind === 'milestone'
      ? `<path class="diamond ${it.done ? 'done' : ''}" d="M${q(it.sx)},${cy - 7}L${q(it.sx + 7)},${cy}L${q(it.sx)},${cy + 7}L${q(it.sx - 7)},${cy}Z"/>`
      : `<rect class="window ${it.done ? 'done' : ''}" x="${q(it.sx)}" y="${cy - 6}" width="${q(Math.max(6, it.ex - it.sx))}" height="12" rx="3"/>`;
    const lx = it.fitsRight ? Math.max(it.ex, it.sx + (it.kind === 'milestone' ? 10 : 6)) + 6 : it.sx - 10;
    const x0 = it.fitsRight ? it.sx - 8 : lx - tw(it.label, 12);
    const x1 = it.fitsRight ? lx + tw(it.label, 12) : Math.max(it.ex, it.sx) + 8;
    body += mark(id, { label: `${it.when}, ${it.laneLabel}: ${it.label}`, tip: it.tip, item: it.item },
      `${ringRect(x0, cy - 9, x1 - x0, 18)}${shape}<text class="tl-label" x="${q(lx)}" y="${cy + 4}" text-anchor="${it.fitsRight ? 'start' : 'end'}">${esc(it.label)}</text>`);
  }
  if (today) {
    const tx = q(x(dayNum(today.iso)));
    if (tx >= m.l && tx <= w - m.r) body += `<line class="today" x1="${tx}" x2="${tx}" y1="${m.t - 22}" y2="${h - m.b + 4}"/><text class="today-label" x="${tx + 4}" y="${h - m.b + 16}">Today, ${esc(today.label)}</text>`;
  }
  return svgWrap({ id, w, h, title, desc, body });
}
