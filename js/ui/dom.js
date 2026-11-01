// UI helpers: escaping, DOM morphing for live regions, counting numbers, announcements.

import { pct, pts, crore, lakh, rupees, num, stepValue } from '../format.js';

const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ENT[c]);

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let uid = 0;
export const nextId = (p = 'id') => `${p}-${++uid}`;

/* ---------- Morph: patch an element's children to match new HTML ---------- */
// Keeps unchanged nodes in place, so focus, hover and CSS transitions survive updates.
function sameKind(a, b) {
  if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) return false;
  if (a.nodeType !== 1) return true;
  return a.getAttribute('data-key') === b.getAttribute('data-key');
}

function morphAttrs(a, b) {
  const active = a === document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(a.nodeName);
  for (const { name } of Array.from(a.attributes)) if (!b.hasAttribute(name)) a.removeAttribute(name);
  for (const { name, value } of Array.from(b.attributes)) {
    if (active && name === 'value') continue;
    if (a.getAttribute(name) !== value) a.setAttribute(name, value);
  }
  // A field the user typed into ignores its value attribute, so set the live value too.
  if (!active && a.nodeName === 'INPUT' && b.hasAttribute('value') && a.value !== b.getAttribute('value')) a.value = b.getAttribute('value');
  if (!active && a.nodeName === 'SELECT') {
    const sel = b.querySelector('option[selected]');
    if (sel && a.value !== sel.textContent) a.value = sel.textContent;
  }
}

function morphChildren(from, to) {
  let f = from.firstChild;
  let t = to.firstChild;
  while (t) {
    const nextT = t.nextSibling;
    if (!f) {
      from.appendChild(t);
    } else if (sameKind(f, t)) {
      if (f.nodeType === 1) {
        morphAttrs(f, t);
        morphChildren(f, t);
      } else if (f.nodeValue !== t.nodeValue) {
        f.nodeValue = t.nodeValue;
      }
      f = f.nextSibling;
    } else {
      const nextF = f.nextSibling;
      from.replaceChild(t, f);
      f = nextF;
    }
    t = nextT;
  }
  while (f) {
    const n = f.nextSibling;
    from.removeChild(f);
    f = n;
  }
}

export function morph(el, html) {
  const tmp = el.cloneNode(false);
  tmp.innerHTML = html;
  morphChildren(el, tmp);
}

/* ---------- Counting numbers ---------- */
// Elements carry data-count (a stable key), data-v (the unrounded value) and data-f (a format).
export const COUNT_FORMATS = {
  pct1: (x) => pct(x),
  pct1s: (x) => pct(x, { sign: true }),
  pct0: (x) => pct(x, { dp: 0 }),
  pts1: (x) => pts(x),
  step: (x) => stepValue(x),
  cr1: (x) => crore(x),
  cr1s: (x) => crore(x, { sign: true }),
  cr2: (x) => crore(x, { dp: 2 }),
  cr2s: (x) => crore(x, { dp: 2, sign: true }),
  crAbs1: (x) => crore(Math.abs(x)),
  lakh1: (x) => lakh(x),
  rs0: (x) => rupees(x),
  rs0s: (x) => rupees(x, { sign: true }),
  rs1: (x) => rupees(x, { dp: 1 }),
  num0: (x) => num(x),
  num1: (x) => num(x, { dp: 1 }),
  t0: (x) => `${num(x)} t`,
  t1: (x) => `${num(x, { dp: 1 })} t`,
};

export function count(key, value, fmt) {
  const f = COUNT_FORMATS[fmt];
  return `<span class="count" data-count="${esc(key)}" data-v="${value}" data-f="${fmt}">${esc(f(value))}</span>`;
}

const shown = new Map();
const frames = new Map();

// Count from the value on screen to the new one over 300 ms. A timer guarantees the final
// value lands even when frames are paused (background tab), so the text is never stale.
function countTo(el, key, to, f) {
  const from = shown.has(key) ? shown.get(key) : to;
  const prev = frames.get(key);
  if (prev) { cancelAnimationFrame(prev.raf); clearTimeout(prev.timer); }
  frames.delete(key);
  if (Math.abs(from - to) < 1e-12 || reducedMotion() || document.hidden) { shown.set(key, to); return; }
  const t0 = performance.now();
  const finish = () => {
    const cur = frames.get(key);
    if (cur) { cancelAnimationFrame(cur.raf); clearTimeout(cur.timer); }
    frames.delete(key);
    shown.set(key, to);
    if (el.isConnected) el.textContent = f(to);
  };
  const tick = (t) => {
    if (!frames.has(key)) return;
    const k = Math.min(1, (t - t0) / 300);
    if (k >= 1) { finish(); return; }
    const v = from + (to - from) * (1 - (1 - k) ** 3);
    shown.set(key, v);
    if (el.isConnected) el.textContent = f(v);
    frames.get(key).raf = requestAnimationFrame(tick);
  };
  el.textContent = f(from);
  frames.set(key, { raf: requestAnimationFrame(tick), timer: setTimeout(finish, 340) });
}

export function runCounts(root) {
  for (const el of root.querySelectorAll('[data-count]')) {
    const f = COUNT_FORMATS[el.dataset.f];
    if (!f) continue;
    countTo(el, el.dataset.count, Number(el.dataset.v), f);
  }
}

/* ---------- Live regions ---------- */
// A region is an element with data-region="key". Its HTML comes from a resolver and is
// morphed in place when it changes. Controls live outside regions so they keep focus.
export function renderRegions(root, resolve) {
  for (const el of root.querySelectorAll('[data-region]')) {
    if (el.parentElement && el.parentElement.closest('[data-region]')) continue; // nested: rendered by its parent
    renderRegion(el, resolve);
  }
}

function renderRegion(el, resolve) {
  const html = resolve(el.dataset.region, el);
  const changed = html != null && el.__html !== html;
  if (changed) {
    morph(el, html);
    el.__html = html;
    runCounts(el);
  }
  for (const child of el.querySelectorAll('[data-region]')) {
    if (child.parentElement.closest('[data-region]') !== el) continue;
    if (changed) child.__html = undefined; // the parent's morph reset its content
    renderRegion(child, resolve);
  }
}

/* ---------- Announcements for screen readers (polite, throttled) ---------- */
let annTimer = null;
let lastAnnounced = '';
export function announce(text, delay = 800) {
  clearTimeout(annTimer);
  annTimer = setTimeout(() => {
    const el = document.getElementById('announcer');
    if (!el || text === lastAnnounced) return;
    lastAnnounced = text;
    el.textContent = text;
  }, delay);
}

/* ---------- Download a text file ---------- */
export function download(filename, text, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([type.startsWith('text/csv') ? '\ufeff' : '', text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// CSV for spreadsheets: plain hyphen-minus so negatives parse as numbers.
export function toCSV(head, rows) {
  const cell = (v) => {
    const s = String(v ?? '').replace(/\u2212/g, '-');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [head, ...rows].map((r) => r.map(cell).join(',')).join('\n');
}

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); rows.push(row); row = []; cur = '';
    } else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}
