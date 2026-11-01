// App core: hash routing, the render loop, overlays and every interaction.
// Screens are pure render functions of the scenario; this module wires them up.

import { SCREENS, screenById } from './screens/index.js';
import { LEVERS, CLAIMS, PEOPLE, GLOSSARY } from '../data.js';
import {
  getState, subscribe, set, resetScenario, parseHash, buildHash, shareUrl, fromQuery, applyScenario,
  initState, getPath, prefs, scenarioLabel,
} from '../state.js';
import { renderRegions, $, $$, announce, download, toCSV, reducedMotion } from './dom.js';
import { TIPS, TABLES, WIDTHS } from './charts.js';
import { tableView, chartPhase } from './components.js';
import { resolveItem, hasItem, itemIds } from './registry.js';
import * as shell from './shell.js';
import { meterLabel } from './scenario.js';
import { spoken } from '../format.js';

const ui = { route: 'overview', item: null, tab: null, term: null, params: new URLSearchParams(), pushedItem: false };
let current = null;
const ownHashes = new Set();
let lastPointer = 'mouse';
let dragging = null;

export const getUI = () => ui;

/* ---------- Boot ---------- */
export function boot() {
  shell.applyTheme(prefs.theme());
  const { params } = parseHash();
  initState(params);
  document.getElementById('app').innerHTML = shell.shellHTML(SCREENS);
  applyNavMode();
  bindEvents();
  subscribe(onChange);
  window.addEventListener('hashchange', () => onHash(false));
  for (const mq of ['(min-width: 1200px)', '(min-width: 1440px)', '(max-width: 767.98px)']) {
    window.matchMedia(mq).addEventListener('change', () => { applyNavMode(); refresh(); });
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => refresh());
  onHash(true);
  // Countdowns and the Today line follow the date in India.
  let day = new Date().toDateString();
  setInterval(() => { const d = new Date().toDateString(); if (d !== day) { day = d; refresh(); } }, 60000);
  document.documentElement.classList.add('ready');
}

/* ---------- Routing ---------- */
function onHash(initial) {
  const { route, params } = parseHash();
  const screen = screenById(route) || screenById('overview');
  if (!initial && !ownHashes.has(window.location.hash)) {
    const sc = fromQuery(params);
    if (sc) applyScenario(sc);
  }
  ui.params = params;
  ui.tab = params.get('tab');
  ui.term = params.get('term');
  const item = params.get('item');
  ui.item = item && hasItem(item) ? item : null;
  if (!ui.item) ui.pushedItem = false;
  if (!current || current.id !== screen.id) mount(screen, !initial);
  else refresh();
  syncDrawer();
  syncUrlNow();
  if (current.onRoute) current.onRoute(ui);
}

function hashFor(route, extra = {}) {
  const h = buildHash(route, extra);
  ownHashes.add(h);
  return h;
}

export function navigate(route, item = null, extra = {}) {
  const base = hashFor(route, extra);
  if (window.location.hash !== base) window.location.hash = base;
  if (item) {
    rememberOpener();
    ui.pushedItem = true;
    window.location.hash = hashFor(route, { ...extra, item });
  }
}

let openerEl = null;
function rememberOpener(el) { openerEl = el || document.activeElement; }

export function openItem(id, opener) {
  if (!hasItem(id)) return;
  rememberOpener(opener);
  ui.pushedItem = true;
  window.location.hash = hashFor(ui.route, { item: id, tab: ui.tab });
}

function closeDrawer() {
  if (!ui.item) return;
  if (ui.pushedItem) {
    ui.pushedItem = false;
    window.history.back();
  } else {
    ui.item = null;
    syncUrlNow();
    refresh();
    syncDrawer();
  }
}

let urlTimer = null;
function syncUrlSoon() { clearTimeout(urlTimer); urlTimer = setTimeout(syncUrlNow, 250); }
function syncUrlNow() {
  clearTimeout(urlTimer);
  const h = hashFor(ui.route, { item: ui.item, tab: ui.tab });
  if (h !== window.location.hash) {
    try { window.history.replaceState(window.history.state, '', h); } catch { /* throttled by the browser */ }
    ownHashes.add(window.location.hash);
  }
}

export function setTab(tab) {
  ui.tab = tab;
  syncUrlNow();
  refresh();
}

/* ---------- Mount and render ---------- */
let io = null;
function mount(screen, userNav) {
  current = screen;
  ui.route = screen.id;
  shell.hideTip();
  if (io) io.disconnect();
  const main = $('#main');
  main.innerHTML = `<div class="screen screen-${screen.id}">${screen.render(getState(), ui)}</div>`;
  refresh();
  for (const a of $$('[data-screen]')) {
    if (a.dataset.screen === screen.id) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  const more = $('[data-more]');
  if (more) more.classList.toggle('active', !['overview', 'diagnosis', 'plan', 'plant-x'].includes(screen.id));
  document.title = `${screen.title} · Anvil Ledger`;
  closeOverlay('more', false);
  closeOverlay('nav', false);
  if (userNav) {
    window.scrollTo(0, 0);
    const h1 = $('#main h1');
    if (h1) h1.focus({ preventScroll: true });
  }
}

// Batch every change made in one event into a single render. A microtask, not a frame,
// so results update while a slider is dragged and also in a background tab.
let queued = false;
function scheduleRefresh() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => { queued = false; refresh(); });
}

const resolver = (s) => (key) => (key.startsWith('shell:') ? shell.shellRegion(key, s, ui) : current && current.region ? current.region(key, s, ui) : null);

export function refresh() {
  const s = getState();
  const resolve = resolver(s);
  renderRegions(document, resolve);
  if (measureCharts()) renderRegions(document, resolve);
  observeCharts();
  const meter = $('.tb-meter-link');
  if (meter) meter.setAttribute('aria-label', `${spoken(meterLabel(s))}. Open the Plan simulator`);
  const chip = $('.scenario-chip');
  if (chip) chip.setAttribute('aria-label', `Scenario: ${spoken(scenarioLabel(s))}. Change settings`);
}

const ro = 'ResizeObserver' in window ? new ResizeObserver((entries) => {
  let changed = false;
  for (const e of entries) {
    const id = e.target.dataset.chartBox;
    const w = Math.floor(e.contentRect.width);
    if (id && w > 40 && WIDTHS.get(id) !== w) { WIDTHS.set(id, w); changed = true; }
  }
  if (changed) scheduleRefresh();
}) : null;
const observed = new WeakSet();

function measureCharts() {
  let changed = false;
  for (const el of $$('[data-chart-box]')) {
    if (!observed.has(el) && ro) { ro.observe(el); observed.add(el); }
    if (!el.offsetParent && el.getClientRects().length === 0) continue;
    const w = Math.floor(el.getBoundingClientRect().width);
    if (w > 40 && WIDTHS.get(el.dataset.chartBox) !== w) { WIDTHS.set(el.dataset.chartBox, w); changed = true; }
  }
  return changed;
}

function observeCharts() {
  const charts = $$('.chart.pending');
  if (!charts.length) return;
  if (!('IntersectionObserver' in window) || reducedMotion()) {
    for (const el of charts) { chartPhase.set(el.dataset.chart, 'done'); el.classList.remove('pending'); }
    return;
  }
  if (!io) {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        const id = el.dataset.chart;
        io.unobserve(el);
        if (chartPhase.get(id) === 'done' || chartPhase.get(id) === 'drawing') continue;
        chartPhase.set(id, 'drawing');
        el.classList.remove('pending');
        el.classList.add('drawing');
        setTimeout(() => {
          chartPhase.set(id, 'done');
          const cur = document.querySelector(`[data-chart="${id}"]`);
          if (cur) cur.classList.remove('drawing');
        }, 1100);
      }
    }, { threshold: 0.15 });
  }
  for (const el of charts) io.observe(el);
}

/* ---------- State changes ---------- */
function onChange(s, kind) {
  scheduleRefresh();
  if (kind === 'scenario') {
    syncUrlSoon();
    const live = current && current.live ? ` ${current.live(s)}` : '';
    announce(`${spoken(meterLabel(s))}.${spoken(live)}`, dragging ? 1200 : 700);
  }
}

/* ---------- Overlays ---------- */
const OVERLAYS = {
  scenario: { sel: '#scenario-pop', modal: false, trigger: '.scenario-chip' },
  drawer: { sel: '#drawer', modal: true },
  palette: { sel: '#palette', modal: true },
  more: { sel: '#more-sheet', modal: true, trigger: '[data-more]' },
  meter: { sel: '#meter-sheet', modal: true, trigger: '.tb-pill' },
  nav: { sel: '#sidenav', modal: true, nav: true },
};
const stack = [];

function openOverlay(name, opener) {
  if (stack.some((o) => o.name === name)) return;
  const cfg = OVERLAYS[name];
  const el = $(cfg.sel);
  const entry = { name, opener: opener || document.activeElement };
  stack.push(entry);
  if (cfg.nav) document.body.classList.add('nav-overlay-open');
  else el.hidden = false;
  if (cfg.trigger) $$(cfg.trigger).forEach((t) => t.setAttribute('aria-expanded', 'true'));
  if (cfg.modal) {
    $('.scrim').hidden = false;
    for (const sel of ['.topbar', '.content', '.tabbar', '#sidenav']) {
      const n = $(sel);
      if (n && !n.contains(el)) n.inert = true;
    }
    document.body.classList.add('modal-open');
  }
  refresh();
  void el.offsetWidth; // start the open transition from the closed style
  el.classList.add('open');
  const target = name === 'palette' ? $('#palette-input') : name === 'drawer' ? el.querySelector('.drawer-head .icon-btn') : el.querySelector('[role="radio"][tabindex="0"], button, a, input');
  if (target) target.focus({ preventScroll: true });
}

function closeOverlay(name, restore = true) {
  const i = stack.findIndex((o) => o.name === name);
  if (i < 0) return;
  const [entry] = stack.splice(i, 1);
  const cfg = OVERLAYS[name];
  const el = $(cfg.sel);
  el.classList.remove('open');
  if (cfg.nav) document.body.classList.remove('nav-overlay-open');
  else if (reducedMotion()) el.hidden = true;
  else setTimeout(() => { if (!el.classList.contains('open')) el.hidden = true; }, 200);
  if (cfg.trigger) $$(cfg.trigger).forEach((t) => t.setAttribute('aria-expanded', 'false'));
  if (!stack.some((o) => OVERLAYS[o.name].modal)) {
    $('.scrim').hidden = true;
    for (const sel of ['.topbar', '.content', '.tabbar', '#sidenav']) { const n = $(sel); if (n) n.inert = false; }
    document.body.classList.remove('modal-open');
  }
  if (restore && entry.opener && entry.opener.isConnected && typeof entry.opener.focus === 'function') entry.opener.focus({ preventScroll: true });
}

function closeTop() {
  const top = stack[stack.length - 1];
  if (!top) return false;
  if (top.name === 'drawer') closeDrawer();
  else closeOverlay(top.name);
  return true;
}

function syncDrawer() {
  const open = stack.some((o) => o.name === 'drawer');
  if (ui.item && !open) {
    openOverlay('drawer', openerEl);
    openerEl = null;
  } else if (!ui.item && open) {
    closeOverlay('drawer');
  }
}

/* ---------- Command palette ---------- */
let palIndex = null;
let palResults = [];
let palActive = 0;

function buildIndex() {
  const s = getState();
  const idx = [];
  for (const sc of SCREENS) idx.push({ type: 'Screen', title: sc.title, sub: sc.group, keys: sc.keywords || '', icon: sc.icon, go: () => navigate(sc.id) });
  for (const l of LEVERS) idx.push({ type: 'Lever', title: `${l.id} · ${l.short}`, sub: l.what, keys: `${l.id} lever ${l.stop}`, icon: 'sliders-horizontal', where: 'Plan simulator', go: () => navigate('plan', hasItem(l.id) ? l.id : null) });
  for (const c of CLAIMS) {
    const p = PEOPLE[c.person];
    idx.push({ type: 'Claim', title: `${p.name}: ${c.topic}`, sub: `“${c.quote}”`, keys: `${p.role} claim ${c.records}`, icon: 'scale', where: 'Claims vs records', go: () => navigate('claims', hasItem(c.id) ? c.id : null) });
  }
  for (const [key, p] of Object.entries(PEOPLE)) {
    const first = CLAIMS.find((c) => c.person === key);
    const target = key === 'anita' ? ['strategy', 'anita'] : first ? ['claims', first.id] : ['claims', null];
    idx.push({ type: 'Person', title: p.name, sub: p.role, keys: `person ${key}`, icon: 'user', where: key === 'anita' ? 'Strategy' : 'Claims vs records', go: () => navigate(target[0], hasItem(target[1]) ? target[1] : null) });
  }
  for (const g of GLOSSARY) idx.push({ type: 'Term', title: g.term, sub: `${g.full}: ${g.def}`, keys: 'glossary term', icon: 'book-open', where: 'Glossary', go: () => navigate('data', null, { tab: 'glossary', term: g.term }) });
  const skip = new Set([...LEVERS.map((l) => l.id), ...CLAIMS.map((c) => c.id), 'anita']);
  for (const id of itemIds()) {
    if (skip.has(id)) continue;
    const it = resolveItem(id, s);
    if (!it || !it.label) continue;
    const sc = screenById(it.screen);
    idx.push({ type: 'Figure', title: it.label, sub: it.value || '', keys: `${it.search || ''} ${(it.src || []).join(' ')}`, icon: 'hash', where: sc ? sc.title : '', go: () => navigate(it.screen, id) });
  }
  idx.push(
    { type: 'Action', title: 'Switch branch', sub: 'Marketing step-up or Costs inside CM2', keys: 'branch toggle', icon: 'split', go: () => set('branch', getState().branch === 'cm2' ? 'mkt' : 'cm2') },
    { type: 'Action', title: 'Reset scenario to defaults', sub: 'Marketing step-up · Central · Backstop off', keys: 'reset defaults', icon: 'rotate-ccw', go: () => { resetScenario(); shell.toast('Scenario reset to defaults'); } },
    { type: 'Action', title: 'Copy link to this view', sub: 'The scenario travels in the link', keys: 'share url copy', icon: 'link', go: copyLink },
    { type: 'Action', title: 'Switch theme', sub: 'Light or dark', keys: 'theme dark light', icon: 'sun', go: () => { shell.toggleTheme(); refresh(); } },
    { type: 'Action', title: 'Theme: follow device', sub: 'Use the device’s light or dark setting', keys: 'theme system auto', icon: 'monitor-cog', go: () => { prefs.setTheme(null); shell.applyTheme(null); refresh(); shell.toast('Theme follows the device'); } },
  );
  return idx;
}

function openPalette(opener) {
  palIndex = buildIndex();
  const input = $('#palette-input');
  input.value = '';
  palActive = 0;
  renderPalette();
  openOverlay('palette', opener);
}
function renderPalette() {
  const input = $('#palette-input');
  palResults = shell.paletteResults(palIndex, input.value);
  palActive = Math.min(palActive, Math.max(0, palResults.length - 1));
  $('#palette-list').innerHTML = shell.renderPaletteList(palResults, palActive);
  input.setAttribute('aria-activedescendant', palResults.length ? `pal-${palActive}` : '');
  const act = $(`#pal-${palActive}`);
  if (act) act.scrollIntoView({ block: 'nearest' });
}
function choosePalette(i) {
  const r = palResults[i];
  if (!r) return;
  closeOverlay('palette', false);
  r.go();
}

/* ---------- Clipboard ---------- */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}
async function copyLink() {
  const ok = await copyText(shareUrl(ui.route, ui.tab ? { tab: ui.tab } : {}));
  shell.toast(ok ? 'Link copied' : 'Could not copy. Copy the address bar instead.');
}

/* ---------- Navigation modes ---------- */
function applyNavMode() {
  const b = document.body;
  const desktop = window.matchMedia('(min-width: 1200px)').matches;
  const wide = window.matchMedia('(min-width: 1440px)').matches;
  const phone = window.matchMedia('(max-width: 767.98px)').matches;
  closeOverlay('nav', false);
  if (desktop) {
    const pref = prefs.navCollapsed();
    b.classList.toggle('nav-rail', pref === null ? !wide : pref);
  } else {
    b.classList.toggle('nav-rail', !phone);
  }
  b.classList.toggle('is-phone', phone);
  b.classList.toggle('is-tablet', !phone && !desktop);
  const btn = $('.nav-collapse');
  if (btn) btn.setAttribute('aria-expanded', String(!b.classList.contains('nav-rail')));
}

/* ---------- Actions ---------- */
const ACTIONS = {
  skip: (el, e) => { e.preventDefault(); const m = $('#main'); m.focus(); m.scrollIntoView(); },
  scenario: (el) => (stack.some((o) => o.name === 'scenario') ? closeOverlay('scenario') : openOverlay('scenario', el)),
  palette: (el) => openPalette(el),
  'copy-link': () => copyLink(),
  theme: () => { const t = shell.toggleTheme(); refresh(); shell.toast(`${t === 'dark' ? 'Dark' : 'Light'} theme`); },
  'nav-collapse': () => {
    if (window.matchMedia('(min-width: 1200px)').matches) {
      const rail = !document.body.classList.contains('nav-rail');
      prefs.setNavCollapsed(rail);
      applyNavMode();
      refresh();
    } else if (stack.some((o) => o.name === 'nav')) closeOverlay('nav');
    else openOverlay('nav', $('.nav-collapse'));
  },
  'nav-open': (el) => openOverlay('nav', el),
  more: (el) => openOverlay('more', el),
  'meter-sheet': (el) => openOverlay('meter', el),
  scrim: () => closeTop(),
  'close-overlay': () => closeTop(),
  'close-overlay-nav': () => { const top = stack[stack.length - 1]; if (top) closeOverlay(top.name, false); },
  'drawer-close': () => closeDrawer(),
  reset: () => { resetScenario(); shell.toast('Scenario reset to defaults'); },
  'switch-branch': () => set('branch', getState().branch === 'cm2' ? 'mkt' : 'cm2'),
  'toggle-table': (el) => {
    const id = el.dataset.chartId;
    if (tableView.has(id)) tableView.delete(id); else tableView.add(id);
    refresh();
    const again = document.querySelector(`[data-action="toggle-table"][data-chart-id="${id}"]`);
    if (again) again.focus();
  },
  csv: (el) => {
    const t = TABLES.get(el.dataset.chartId);
    if (!t) return;
    download(`anvil-${el.dataset.chartId}.csv`, toCSV(t.head, t.rows));
    shell.toast('CSV downloaded');
  },
  'copy-value': async (el) => {
    const it = resolveItem(el.dataset.item, getState());
    if (!it) return;
    const ok = await copyText(`${it.label}: ${it.value} (Source: ${it.src.join(', ')})`);
    shell.toast(ok ? 'Value copied' : 'Could not copy');
  },
  step: (el) => {
    const input = document.getElementById(el.dataset.target);
    if (!input) return;
    const bind = input.dataset.bind;
    const big = Number(input.dataset.big || 1);
    const min = Number(input.min);
    const max = Number(input.max);
    const cur = Number(getPath(bind));
    const v = Math.min(max, Math.max(min, Math.round((cur + Number(el.dataset.dir) * big) * 10) / 10));
    set(bind, v);
  },
  'open-item': (el) => openItem(el.dataset.target, el),
};

/* ---------- Events ---------- */
function bindEvents() {
  document.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType || 'mouse'; }, true);
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('pointerdown', onSliderDown);
  document.addEventListener('pointermove', onSliderMove);
  document.addEventListener('pointerup', onSliderUp);
  document.addEventListener('pointercancel', onSliderUp);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChangeEvent);
  document.addEventListener('pointerover', onOver);
  document.addEventListener('pointerout', onOut);
  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);
  window.addEventListener('scroll', () => { if (lastPointer !== 'touch') shell.hideTip(); }, { passive: true });
  window.addEventListener('resize', () => shell.hideTip(), { passive: true });
}

function onClick(e) {
  const t = e.target;
  if (!(t instanceof Element)) return;
  if (stack.some((o) => o.name === 'scenario') && !t.closest('#scenario-pop') && !t.closest('.scenario-chip')) closeOverlay('scenario', false);
  if (t.closest('#tip')) return;
  const opt = t.closest('.palette-opt');
  if (opt) { choosePalette(Number(opt.dataset.index)); return; }
  const radio = t.closest('[role="radio"]');
  if (radio) {
    const g = radio.closest('[role="radiogroup"][data-bind]');
    if (g) { selectRadio(g, radio); return; }
  }
  const sw = t.closest('[role="switch"][data-bind]');
  if (sw) { set(sw.dataset.bind, sw.getAttribute('aria-checked') !== 'true'); return; }
  const act = t.closest('[data-action]');
  if (act) {
    const name = act.dataset.action;
    const fn = ACTIONS[name] || (current && current.actions && current.actions[name]);
    if (fn) { if (act.tagName === 'BUTTON') e.preventDefault(); fn(act, e, { set, getState, ui, refresh, setTab, toast: shell.toast, navigate }); return; }
  }
  const item = t.closest('[data-item]');
  if (item && !item.hasAttribute('data-no-open')) {
    if (item.classList.contains('mark') && lastPointer === 'touch' && shell.tipOwner() !== item) { showTipFor(item); return; }
    openItem(item.dataset.item, item);
    return;
  }
  const gl = t.closest('[data-gl]');
  if (gl) { if (shell.tipOwner() === gl) shell.hideTip(); else showTipFor(gl); return; }
  if (lastPointer === 'touch' && !t.closest('[data-tip]')) shell.hideTip();
}

function selectRadio(group, radio) {
  const raw = radio.dataset.value;
  const value = group.dataset.type === 'num' ? Number(raw) : raw;
  if (group.dataset.bind.startsWith('ui:')) {
    const fn = current && current.actions && current.actions[group.dataset.bind.slice(3)];
    if (fn) fn(radio, null, { set, getState, ui, refresh, setTab, value });
  } else set(group.dataset.bind, value);
  requestAnimationFrame(() => {
    const again = group.isConnected ? group.querySelector(`[data-value="${CSS.escape(raw)}"]`) : null;
    if (again && document.activeElement && group.contains(document.activeElement)) again.focus();
  });
}

const tidy = (x) => Math.round(x * 1e6) / 1e6;
function stepFrom(cur, min, step, n) {
  const k = (cur - min) / step;
  return tidy(min + (n > 0 ? Math.floor(k + 1e-9) + n : Math.ceil(k - 1e-9) + n) * step);
}

function onKeydown(e) {
  const k = e.key;
  if ((e.metaKey || e.ctrlKey) && k.toLowerCase() === 'k') {
    e.preventDefault();
    if (stack.some((o) => o.name === 'palette')) closeOverlay('palette'); else openPalette(document.activeElement);
    return;
  }
  if (k === 'Escape') {
    if (shell.tipOwner()) { shell.hideTip(); e.preventDefault(); return; }
    if (closeTop()) e.preventDefault();
    return;
  }
  const el = e.target;
  if (!(el instanceof Element)) return;
  if (el.id === 'palette-input') {
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      e.preventDefault();
      if (!palResults.length) return;
      palActive = (palActive + (k === 'ArrowDown' ? 1 : -1) + palResults.length) % palResults.length;
      renderPalette();
    } else if (k === 'Enter') { e.preventDefault(); choosePalette(palActive); }
    return;
  }
  if (el.classList.contains('slider-thumb')) {
    const sl = el.closest('.slider');
    const min = Number(sl.dataset.min);
    const max = Number(sl.dataset.max);
    const step = Number(sl.dataset.step);
    const cur = Number(getPath(sl.dataset.bind));
    const n = e.shiftKey ? 10 : 1;
    let v = null;
    if (k === 'ArrowRight' || k === 'ArrowUp') v = stepFrom(cur, min, step, n);
    else if (k === 'ArrowLeft' || k === 'ArrowDown') v = stepFrom(cur, min, step, -n);
    else if (k === 'PageUp') v = stepFrom(cur, min, step, 10);
    else if (k === 'PageDown') v = stepFrom(cur, min, step, -10);
    else if (k === 'Home') v = min;
    else if (k === 'End') v = max;
    if (v !== null) { e.preventDefault(); set(sl.dataset.bind, Math.min(max, Math.max(min, v))); }
    return;
  }
  if (el.getAttribute('role') === 'radio') {
    const g = el.closest('[role="radiogroup"]');
    const radios = $$('[role="radio"]', g);
    const i = radios.indexOf(el);
    let j = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + radios.length) % radios.length;
    else if (k === 'Home') j = 0;
    else if (k === 'End') j = radios.length - 1;
    if (j !== null) { e.preventDefault(); radios[j].focus(); if (g.dataset.bind) selectRadio(g, radios[j]); }
    return;
  }
  if (el.classList.contains('mark')) {
    const svg = el.closest('svg');
    const marks = $$('.mark', svg);
    const i = marks.indexOf(el);
    let j = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') j = Math.min(marks.length - 1, i + 1);
    else if (k === 'ArrowLeft' || k === 'ArrowUp') j = Math.max(0, i - 1);
    else if (k === 'Home') j = 0;
    else if (k === 'End') j = marks.length - 1;
    if (j !== null) {
      e.preventDefault();
      marks.forEach((m) => m.setAttribute('tabindex', '-1'));
      marks[j].setAttribute('tabindex', '0');
      marks[j].focus();
      return;
    }
  }
  if (el.getAttribute('role') === 'tab') {
    const list = el.closest('[role="tablist"]');
    const tabs = $$('[role="tab"]', list);
    const i = tabs.indexOf(el);
    let j = null;
    if (k === 'ArrowRight') j = (i + 1) % tabs.length;
    else if (k === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
    else if (k === 'Home') j = 0;
    else if (k === 'End') j = tabs.length - 1;
    if (j !== null) { e.preventDefault(); tabs[j].click(); requestAnimationFrame(() => { const t = $(`[role="tab"][data-tab="${tabs[j].dataset.tab}"]`); if (t) t.focus(); }); }
    return;
  }
  if ((k === 'Enter' || k === ' ') && el.matches('[data-item]') && !el.matches('button, a, input, select, textarea')) {
    e.preventDefault();
    openItem(el.dataset.item, el);
    return;
  }
  if ((k === 'Enter' || k === ' ') && el.matches('[data-gl]')) {
    e.preventDefault();
    if (shell.tipOwner() === el) shell.hideTip(); else showTipFor(el);
  }
}

/* Sliders: pointer drag */
function sliderValue(sl, clientX) {
  const track = sl.querySelector('.slider-track').getBoundingClientRect();
  const min = Number(sl.dataset.min);
  const max = Number(sl.dataset.max);
  const step = Number(sl.dataset.step);
  const ratio = Math.min(1, Math.max(0, (clientX - track.left) / track.width));
  const raw = min + ratio * (max - min);
  return Math.min(max, Math.max(min, tidy(min + Math.round((raw - min) / step) * step)));
}
function onSliderDown(e) {
  const sl = e.target instanceof Element ? e.target.closest('.slider') : null;
  if (!sl || e.button !== 0) return;
  e.preventDefault();
  const thumb = sl.querySelector('.slider-thumb');
  thumb.focus({ preventScroll: true });
  dragging = { sl, id: e.pointerId };
  try { sl.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
  sl.classList.add('dragging');
  set(sl.dataset.bind, sliderValue(sl, e.clientX));
}
function onSliderMove(e) {
  if (!dragging || e.pointerId !== dragging.id) return;
  set(dragging.sl.dataset.bind, sliderValue(dragging.sl, e.clientX));
}
function onSliderUp(e) {
  if (!dragging || e.pointerId !== dragging.id) return;
  dragging.sl.classList.remove('dragging');
  dragging = null;
}

function onInput(e) {
  const el = e.target;
  if (el.id === 'palette-input') { palActive = 0; renderPalette(); return; }
  if (el.matches('input.num-input[data-bind]')) {
    const v = parseFloat(el.value);
    if (Number.isFinite(v) && v >= Number(el.min) && v <= Number(el.max)) set(el.dataset.bind, v);
    return;
  }
  if (current && current.onInput) current.onInput(e, { set, getState, refresh });
}

function onChangeEvent(e) {
  const el = e.target;
  if (el.matches('input.num-input[data-bind]')) {
    let v = parseFloat(el.value);
    if (!Number.isFinite(v)) v = Number(getPath(el.dataset.bind));
    v = Math.min(Number(el.max), Math.max(Number(el.min), Math.round(v * 10) / 10));
    set(el.dataset.bind, v);
    el.value = String(getPath(el.dataset.bind));
    return;
  }
  if (current && current.onChange) current.onChange(e, { set, getState, refresh, toast: shell.toast });
}

/* Tooltips: hover, keyboard focus and tap */
function tipHTML(el) {
  if (el.dataset.tip) {
    const t = TIPS.get(el.dataset.tip);
    if (!t) return '';
    const hint = el.dataset.item ? (lastPointer === 'touch' ? 'Tap again for the source and working' : 'Click or press Enter for the source and working') : '';
    return shell.chartTip({ ...t, hint });
  }
  if (el.dataset.gl) return shell.glossaryTip(el.dataset.gl);
  if (el.dataset.tt) {
    if (el.classList.contains('nav-item') && !document.body.classList.contains('nav-rail')) return '';
    if (el.classList.contains('nav-collapse') && !document.body.classList.contains('nav-rail')) return '';
    return `<div>${el.dataset.tt.replace(/[<>&]/g, '')}</div>`;
  }
  return '';
}
function showTipFor(el) {
  const html = tipHTML(el);
  if (html) shell.showTip(el, html);
}
const TIP_SEL = '[data-tip], [data-gl], [data-tt]';
function onOver(e) {
  if (e.pointerType === 'touch' || dragging) return;
  const el = e.target instanceof Element ? e.target.closest(TIP_SEL) : null;
  if (el) showTipFor(el);
}
function onOut(e) {
  if (e.pointerType === 'touch') return;
  const el = e.target instanceof Element ? e.target.closest(TIP_SEL) : null;
  if (el && !(e.relatedTarget instanceof Node && el.contains(e.relatedTarget)) && document.activeElement !== el) shell.hideTip(el);
}
function onFocusIn(e) {
  const el = e.target instanceof Element ? e.target.closest(TIP_SEL) : null;
  if (el && el.matches(':focus-visible')) showTipFor(el);
}
function onFocusOut(e) {
  const el = e.target instanceof Element ? e.target.closest(TIP_SEL) : null;
  if (el) shell.hideTip(el);
}
