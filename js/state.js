// State module: one shared scenario drives every screen. It syncs to the URL (so a copied
// link restores it) and saves to localStorage when storage is available. A scenario in the
// URL wins over saved state. Everything works with storage blocked.

import { PLAN, TRACKER_ROWS, TRACKER_STATUSES } from './data.js';
import { caseSliders, matchCase, matchPlantXPreset, SLIDER_KEYS, CASES } from './model.js';

const KEYS = { scenario: 'anvil.scenario.v1', tracker: 'anvil.tracker.v1', theme: 'anvil.theme', nav: 'anvil.nav.collapsed' };

/* ---------- Safe storage ---------- */
export const storage = {
  get(key) { try { return window.localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { window.localStorage.setItem(key, value); return true; } catch { return false; } },
  remove(key) { try { window.localStorage.removeItem(key); } catch { /* storage blocked */ } },
};

/* ---------- Defaults and validation ---------- */
export function defaults() {
  return {
    branch: 'mkt',
    caseName: 'central',
    fy28Case: 'central',
    sliders: caseSliders('central'),
    backstop: false,
    upside: false,
    fy28m: PLAN.fy28.marketing.default,
    px: { preset: 'fy26', q: [...PLAN.plantX.presets.fy26] },
    cash: { share: 0.3, gstRate: PLAN.cash.gst.default, plantTub: true, release: true, sachets27: 1, sachets28: 0 },
    margin: PLAN.formats.margin.default,
    qcTake: PLAN.qc.take.default,
    qcDiscount: PLAN.qc.discount.default,
  };
}

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const snap = (x, step, lo) => Math.round((x - lo) / step) * step + lo;
const tidy = (x) => Math.round(x * 1e6) / 1e6;
const isNum = (x) => typeof x === 'number' && Number.isFinite(x);

function cleanSlider(k, v) {
  const r = PLAN.q4.sliders[k];
  return tidy(clamp(v, r.min, r.max));
}

// Bring any partial or untrusted scenario into a valid, complete one.
export function normalize(input) {
  const d = defaults();
  if (!input || typeof input !== 'object') return d;
  const s = d;
  if (input.branch === 'cm2' || input.branch === 'mkt') s.branch = input.branch;
  if (typeof input.backstop === 'boolean') s.backstop = input.backstop;
  if (typeof input.upside === 'boolean') s.upside = input.upside;
  if (CASES.includes(input.fy28Case)) s.fy28Case = input.fy28Case;
  if (CASES.includes(input.caseName)) {
    s.caseName = input.caseName;
    s.sliders = caseSliders(input.caseName);
    s.fy28Case = input.caseName;
  } else if (input.caseName === 'custom' && input.sliders) {
    for (const k of SLIDER_KEYS) if (isNum(input.sliders[k])) s.sliders[k] = cleanSlider(k, input.sliders[k]);
    s.caseName = matchCase(s.sliders);
    if (s.caseName !== 'custom') s.fy28Case = s.caseName;
  }
  const fm = PLAN.fy28.marketing;
  if (isNum(input.fy28m)) s.fy28m = tidy(clamp(snap(input.fy28m, fm.step, fm.min), fm.min, fm.max));
  if (input.px && Array.isArray(input.px.q) && input.px.q.length === 4 && input.px.q.every(isNum)) {
    s.px.q = input.px.q.map((t) => tidy(clamp(Math.round(t * 10) / 10, PLAN.plantX.slider.min, PLAN.plantX.slider.max)));
    s.px.preset = matchPlantXPreset(s.px.q);
  } else if (input.px && PLAN.plantX.presets[input.px.preset]) {
    s.px = { preset: input.px.preset, q: [...PLAN.plantX.presets[input.px.preset]] };
  }
  const c = input.cash || {};
  if (PLAN.cash.importShares.some((x) => Math.abs(x - c.share) < 1e-9)) s.cash.share = c.share;
  const g = PLAN.cash.gst;
  if (isNum(c.gstRate)) s.cash.gstRate = tidy(clamp(snap(c.gstRate, g.step, g.min), g.min, g.max));
  if (typeof c.plantTub === 'boolean') s.cash.plantTub = c.plantTub;
  if (typeof c.release === 'boolean') s.cash.release = c.release;
  if ([0, 1, 2].includes(c.sachets27)) s.cash.sachets27 = c.sachets27;
  if ([0, 1, 2].includes(c.sachets28)) s.cash.sachets28 = c.sachets28;
  const mg = PLAN.formats.margin;
  if (isNum(input.margin)) s.margin = clamp(Math.round(input.margin), mg.min, mg.max);
  const qt = PLAN.qc.take;
  if (isNum(input.qcTake)) s.qcTake = clamp(Math.round(input.qcTake), qt.min, qt.max);
  const qd = PLAN.qc.discount;
  if (isNum(input.qcDiscount)) s.qcDiscount = clamp(Math.round(input.qcDiscount), qd.min, qd.max);
  return s;
}

/* ---------- URL encoding ---------- */
const SCENARIO_PARAMS = ['b', 'c', 'bs', 'l2', 'l3', 'l4b', 'l7', 'f', 'up', 'm', 'px', 'imp', 'gst', 'tub', 'rel', 's27', 's28', 'mg', 'qt', 'qd'];
const short = (x) => String(tidy(x));

export function toQuery(s) {
  const q = new URLSearchParams();
  q.set('b', s.branch);
  q.set('c', s.caseName);
  if (s.caseName === 'custom') {
    for (const k of SLIDER_KEYS) q.set(k.toLowerCase(), short(s.sliders[k]));
    q.set('f', s.fy28Case);
  }
  q.set('bs', s.backstop ? '1' : '0');
  const d = defaults();
  if (s.upside) q.set('up', '1');
  if (s.fy28m !== d.fy28m) q.set('m', short(s.fy28m));
  if (s.px.preset !== 'fy26') q.set('px', s.px.preset === 'custom' ? s.px.q.map(short).join('_') : s.px.preset);
  if (s.cash.share !== d.cash.share) q.set('imp', String(Math.round(s.cash.share * 100)));
  if (s.cash.gstRate !== d.cash.gstRate) q.set('gst', short(s.cash.gstRate));
  if (!s.cash.plantTub) q.set('tub', '0');
  if (!s.cash.release) q.set('rel', '0');
  if (s.cash.sachets27 !== d.cash.sachets27) q.set('s27', String(s.cash.sachets27));
  if (s.cash.sachets28 !== d.cash.sachets28) q.set('s28', String(s.cash.sachets28));
  if (s.margin !== d.margin) q.set('mg', String(s.margin));
  if (s.qcTake !== d.qcTake) q.set('qt', String(s.qcTake));
  if (s.qcDiscount !== d.qcDiscount) q.set('qd', String(s.qcDiscount));
  return q;
}

// A URL that names any scenario setting is read as a full scenario: anything missing is a default.
export function fromQuery(q) {
  if (!SCENARIO_PARAMS.some((k) => q.has(k))) return null;
  const n = (k) => (q.has(k) ? Number(q.get(k)) : undefined);
  const input = { cash: {} };
  input.branch = q.get('b') || 'mkt';
  input.caseName = q.get('c') || 'central';
  if (input.caseName === 'custom') {
    input.sliders = {};
    for (const k of SLIDER_KEYS) input.sliders[k] = n(k.toLowerCase());
    input.fy28Case = q.get('f');
  }
  input.backstop = q.get('bs') === '1';
  input.upside = q.get('up') === '1';
  input.fy28m = n('m');
  const px = q.get('px');
  if (px && PLAN.plantX.presets[px]) input.px = { preset: px };
  else if (px) input.px = { q: px.split(/[_,]/).map(Number) };
  if (q.has('imp')) input.cash.share = Number(q.get('imp')) / 100;
  input.cash.gstRate = n('gst');
  if (q.has('tub')) input.cash.plantTub = q.get('tub') !== '0';
  if (q.has('rel')) input.cash.release = q.get('rel') !== '0';
  input.cash.sachets27 = n('s27');
  input.cash.sachets28 = n('s28');
  input.margin = n('mg');
  input.qcTake = n('qt');
  input.qcDiscount = n('qd');
  return normalize(input);
}

/* ---------- Hash routes: #/screen?scenario&ui ---------- */
export function parseHash(hash = window.location.hash) {
  const h = hash.replace(/^#/, '');
  const i = h.indexOf('?');
  const path = (i >= 0 ? h.slice(0, i) : h).replace(/^\/+/, '');
  const params = new URLSearchParams(i >= 0 ? h.slice(i + 1) : '');
  return { route: path || 'overview', params };
}

export function buildHash(route, ui = {}, s = state) {
  const q = toQuery(s);
  for (const [k, v] of Object.entries(ui)) if (v !== null && v !== undefined && v !== '') q.set(k, v);
  return `#/${route}?${q.toString()}`;
}

export function shareUrl(route, ui = {}) {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}${buildHash(route, ui)}`;
}

/* ---------- Store ---------- */
let state = defaults();
const listeners = new Set();

export const getState = () => state;
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function notify(kind) { for (const fn of listeners) fn(state, kind); }

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => storage.set(KEYS.scenario, JSON.stringify(state)), 150);
}

export function initState(urlParams) {
  const fromUrl = urlParams ? fromQuery(urlParams) : null;
  if (fromUrl) { state = fromUrl; save(); return 'url'; }
  const raw = storage.get(KEYS.scenario);
  if (raw) {
    try { state = normalize(JSON.parse(raw)); return 'storage'; } catch { state = defaults(); }
  }
  return 'default';
}

export function getPath(path, s = state) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), s);
}

function setIn(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  o[keys.at(-1)] = value;
}

// The one way to change the scenario. Side effects keep linked settings consistent.
export function set(path, value) {
  const next = structuredClone(state);
  if (path === 'caseName') {
    if (!CASES.includes(value)) return;
    next.caseName = value;
    next.sliders = caseSliders(value);
    next.fy28Case = value;
  } else if (path.startsWith('sliders.')) {
    const k = path.split('.')[1];
    next.sliders[k] = cleanSlider(k, value);
    next.caseName = matchCase(next.sliders);
    if (next.caseName !== 'custom') next.fy28Case = next.caseName;
  } else if (path === 'px.preset') {
    if (!PLAN.plantX.presets[value]) return;
    next.px = { preset: value, q: [...PLAN.plantX.presets[value]] };
  } else if (path.startsWith('px.q.')) {
    const i = Number(path.split('.')[2]);
    next.px.q[i] = tidy(clamp(Math.round(value * 10) / 10, PLAN.plantX.slider.min, PLAN.plantX.slider.max));
    next.px.preset = matchPlantXPreset(next.px.q);
  } else {
    setIn(next, path, value);
  }
  const clean = path.startsWith('px.') || path.startsWith('sliders.') || path === 'caseName' ? next : normalize(next);
  if (JSON.stringify(clean) === JSON.stringify(state)) return;
  state = clean;
  save();
  notify('scenario');
}

export function resetScenario() {
  state = defaults();
  save();
  notify('scenario');
}

// Apply a scenario from a pasted or edited URL during the session.
export function applyScenario(next) {
  if (JSON.stringify(next) === JSON.stringify(state)) return false;
  state = next;
  save();
  notify('scenario');
  return true;
}

export const scenarioLabel = (s = state) => {
  const branch = s.branch === 'cm2' ? 'Costs inside CM2' : 'Marketing step-up';
  const c = s.caseName === 'custom' ? 'Custom' : s.caseName[0].toUpperCase() + s.caseName.slice(1);
  return `${branch} · ${c} · Backstop ${s.backstop ? 'on' : 'off'}`;
};

/* ---------- Tracker: edits saved in the browser ---------- */
let tracker = loadTracker();

function blankRow(r) {
  return { id: r.id, owner: 'Unassigned', status: 'Not started', next: r.next || '', notes: '' };
}

function loadTracker() {
  const base = TRACKER_ROWS.map(blankRow);
  const raw = storage.get(KEYS.tracker);
  if (!raw) return base;
  try {
    const saved = JSON.parse(raw);
    return base.map((row) => {
      const s = saved && saved[row.id];
      if (!s) return row;
      return {
        ...row,
        owner: typeof s.owner === 'string' && s.owner.trim() ? s.owner.slice(0, 80) : row.owner,
        status: TRACKER_STATUSES.includes(s.status) ? s.status : row.status,
        next: /^\d{4}-\d{2}-\d{2}$/.test(s.next || '') || s.next === '' ? s.next : row.next,
        notes: typeof s.notes === 'string' ? s.notes.slice(0, 500) : row.notes,
      };
    });
  } catch {
    return base;
  }
}

function saveTracker() {
  const out = {};
  for (const r of tracker) out[r.id] = { owner: r.owner, status: r.status, next: r.next, notes: r.notes };
  storage.set(KEYS.tracker, JSON.stringify(out));
}

export const getTracker = () => tracker;
export const trackerRow = (id) => tracker.find((r) => r.id === id);

export function setTracker(id, field, value) {
  const row = trackerRow(id);
  if (!row || !['owner', 'status', 'next', 'notes'].includes(field)) return;
  if (field === 'status' && !TRACKER_STATUSES.includes(value)) return;
  if (field === 'owner') value = value.trim() ? value.slice(0, 80) : 'Unassigned';
  if (field === 'next' && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
  if (field === 'notes') value = value.slice(0, 500);
  if (row[field] === value) return;
  tracker = tracker.map((r) => (r.id === id ? { ...r, [field]: value } : r));
  saveTracker();
  notify('tracker');
}

// Import: rows are matched by their Lever id; unknown rows are ignored. Returns the count applied.
export function importTracker(rows) {
  let applied = 0;
  tracker = tracker.map((r) => {
    const src = rows.find((x) => x.id === r.id);
    if (!src) return r;
    applied++;
    return {
      ...r,
      owner: (src.owner || '').trim() ? src.owner.trim().slice(0, 80) : 'Unassigned',
      status: TRACKER_STATUSES.includes(src.status) ? src.status : r.status,
      next: /^\d{4}-\d{2}-\d{2}$/.test(src.next || '') ? src.next : src.next === '' ? '' : r.next,
      notes: (src.notes || '').slice(0, 500),
    };
  });
  saveTracker();
  notify('tracker');
  return applied;
}

export function resetTracker() {
  tracker = TRACKER_ROWS.map(blankRow);
  storage.remove(KEYS.tracker);
  notify('tracker');
}

/* ---------- Preferences ---------- */
export const prefs = {
  theme() { const t = storage.get(KEYS.theme); return t === 'light' || t === 'dark' ? t : null; },
  setTheme(t) { if (t) storage.set(KEYS.theme, t); else storage.remove(KEYS.theme); },
  navCollapsed() { const v = storage.get(KEYS.nav); return v === '1' ? true : v === '0' ? false : null; },
  setNavCollapsed(v) { storage.set(KEYS.nav, v ? '1' : '0'); },
};
