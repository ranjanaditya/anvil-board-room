// App shell: top bar (scenario chip, target meter, search, copy link, theme), navigation
// (sidebar, icon rail, phone tab bar), and overlays (scenario popover, source drawer,
// command palette, sheets, tooltip, toast).

import { AS_OF, SOURCES } from '../data.js';
import { pct } from '../format.js';
import { esc, count, $ } from './dom.js';
import { icon } from './icons.js';
import { meterSVG, widthOf } from './charts.js';
import { glossaryTerm } from './components.js';
import { resolveItem } from './registry.js';
import { scenarioControls, walk, meterLabel } from './scenario.js';
import { scenarioLabel, prefs } from '../state.js';

export const FOOTER = `Confidential · Anvil Nutrition board and leadership · Data as of ${AS_OF.label} · Sources: data-room files A to L`;

export function shellHTML(screens) {
  const groups = [];
  for (const s of screens) {
    let g = groups.find((x) => x.name === s.group);
    if (!g) { g = { name: s.group, items: [] }; groups.push(g); }
    g.items.push(s);
  }
  const navItem = (s) => `<a class="nav-item" href="#/${s.id}" data-screen="${s.id}" data-tt="${esc(s.title)}">${icon(s.icon, { size: 20 })}<span class="nav-text">${esc(s.title)}</span></a>`;
  const tabs = ['overview', 'diagnosis', 'plan', 'plant-x'].map((id) => screens.find((s) => s.id === id));
  const more = screens.filter((s) => !tabs.includes(s));
  return `<a class="skip-link" href="#main" data-action="skip">Skip to content</a>
<header class="topbar">
  <div class="tb-brand">
    <a class="brand" href="#/overview"><span class="brand-name">Anvil Ledger</span><span class="brand-asof">Data as of ${AS_OF.label}</span></a>
  </div>
  <div class="tb-mid">
    <button type="button" class="scenario-chip" data-action="scenario" aria-haspopup="dialog" aria-expanded="false" aria-controls="scenario-pop">${icon('sliders-horizontal', { size: 18 })}<span class="chip-text" data-region="shell:chip"></span>${icon('chevron-down', { size: 16, cls: 'chev' })}</button>
    <div class="tb-meter"><a class="tb-meter-link" href="#/plan" data-region="shell:meter"></a><button type="button" class="src" data-item="q4-plan" aria-label="Source Model for the target meter: open details">Model</button></div>
    <button type="button" class="tb-pill" data-action="meter-sheet" aria-haspopup="dialog" data-region="shell:pill"></button>
  </div>
  <div class="tb-tools">
    <button type="button" class="tb-search" data-action="palette" aria-label="Search" aria-keyshortcuts="Control+K Meta+K">${icon('search', { size: 18 })}<span class="tb-search-text">Search</span><kbd class="kbd" data-region="shell:kbd"></kbd></button>
    <button type="button" class="icon-btn" data-action="copy-link" aria-label="Copy link to this view" data-tt="Copy link">${icon('link', { size: 20 })}</button>
    <button type="button" class="icon-btn" data-action="theme" data-region="shell:theme" data-tt="Theme"></button>
  </div>
</header>
<div class="layout">
  <nav id="sidenav" class="sidenav" aria-label="Screens">
    <div class="nav-scroll">${groups.map((g) => `<div class="nav-group"><div class="nav-group-label">${esc(g.name)}</div>${g.items.map(navItem).join('')}</div>`).join('')}</div>
    <button type="button" class="nav-collapse" data-action="nav-collapse" aria-expanded="true" data-tt="Collapse navigation"><span data-region="shell:collapse"></span></button>
  </nav>
  <div class="content">
    <main id="main" tabindex="-1"></main>
    <footer class="footer"><p>${esc(FOOTER)}</p></footer>
  </div>
</div>
<nav class="tabbar" aria-label="Screens">
  ${tabs.map((s) => `<a class="tab" href="#/${s.id}" data-screen="${s.id}">${icon(s.icon, { size: 20 })}<span>${esc(s.tab || s.title)}</span></a>`).join('')}
  <button type="button" class="tab" data-action="more" aria-haspopup="dialog" aria-controls="more-sheet" aria-expanded="false" data-more>${icon('ellipsis', { size: 20 })}<span>More</span></button>
</nav>
<div class="scrim" hidden data-action="scrim"></div>
<div id="scenario-pop" class="popover" role="dialog" aria-labelledby="sp-title" hidden>
  <div class="pop-head"><h2 id="sp-title" class="pop-title">Scenario</h2><button type="button" class="icon-btn" data-action="close-overlay" aria-label="Close scenario settings">${icon('x', { size: 20 })}</button></div>
  <p class="pop-sub">One scenario drives every screen and the target meter.</p>
  <div data-region="shell:scenario"></div>
</div>
<aside id="drawer" class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" hidden>
  <div class="drawer-head"><div><div class="label">Source and working</div><h2 id="drawer-title" class="drawer-title" data-region="shell:drawer-title"></h2></div><button type="button" class="icon-btn" data-action="drawer-close" aria-label="Close source details">${icon('x', { size: 20 })}</button></div>
  <div class="drawer-body" data-region="shell:drawer"></div>
</aside>
<div id="palette" class="palette" role="dialog" aria-modal="true" aria-label="Search" hidden>
  <div class="palette-box">
    <div class="palette-row">${icon('search', { size: 20 })}<input id="palette-input" type="text" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" aria-activedescendant="" autocomplete="off" spellcheck="false" placeholder="Search screens, levers, claims, people, terms and figures"><button type="button" class="kbd kbd-btn" data-action="close-overlay" aria-label="Close search">Esc</button></div>
    <ul id="palette-list" class="palette-list" role="listbox" aria-label="Results"></ul>
    <div class="palette-foot" aria-hidden="true"><span><kbd class="kbd">↑</kbd><kbd class="kbd">↓</kbd> move</span><span><kbd class="kbd">Enter</kbd> open</span><span><kbd class="kbd">Esc</kbd> close</span></div>
  </div>
</div>
<div id="more-sheet" class="sheet" role="dialog" aria-modal="true" aria-labelledby="more-title" hidden>
  <div class="sheet-head"><h2 id="more-title" class="pop-title">More screens</h2><button type="button" class="icon-btn" data-action="close-overlay" aria-label="Close">${icon('x', { size: 20 })}</button></div>
  <div class="sheet-list">${more.map((s) => `<a class="sheet-item" href="#/${s.id}" data-screen="${s.id}">${icon(s.icon, { size: 20 })}<span>${esc(s.title)}</span>${icon('chevron-right', { size: 18, cls: 'chev' })}</a>`).join('')}
    <button type="button" class="sheet-item" data-action="copy-link">${icon('link', { size: 20 })}<span>Copy link to this view</span></button>
    <button type="button" class="sheet-item" data-action="theme">${icon('sun', { size: 20 })}<span>Switch light or dark theme</span></button></div>
</div>
<div id="meter-sheet" class="sheet" role="dialog" aria-modal="true" aria-labelledby="meter-sheet-title" hidden>
  <div class="sheet-head"><h2 id="meter-sheet-title" class="pop-title">Target meter</h2><button type="button" class="icon-btn" data-action="close-overlay" aria-label="Close">${icon('x', { size: 20 })}</button></div>
  <div data-region="shell:meter-sheet"></div>
</div>
<div id="tip" class="tip" role="tooltip" hidden></div>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
<div id="announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>`;
}

/* ---------- Shell regions ---------- */
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export function effectiveTheme() {
  const t = document.documentElement.dataset.theme;
  if (t === 'light' || t === 'dark') return t;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function shellRegion(key, s, ui) {
  switch (key) {
    case 'shell:chip': {
      const short = `${s.branch === 'cm2' ? 'In CM2' : 'Step-up'} · ${s.caseName === 'custom' ? 'Custom' : s.caseName[0].toUpperCase() + s.caseName.slice(1)} · Backstop ${s.backstop ? 'on' : 'off'}`;
      return `<span class="chip-long">${esc(scenarioLabel(s))}</span><span class="chip-short" aria-hidden="true">${esc(short)}</span>`;
    }
    case 'shell:meter': {
      const w = walk(s);
      const ok = w.value >= 0;
      return `<span class="meter-text"><span class="meter-k">Q4 FY27 CM3:</span> <b class="meter-range">${esc(pct(w.low, { sign: true }))} to ${esc(pct(w.high, { sign: true }))}</b> of NR <span class="meter-sep" aria-hidden="true">·</span> <span class="meter-at">at these settings</span> <b class="meter-val ${ok ? 'pos' : 'neg'}">${count('meter', w.value, 'pct1s')}</b></span><span class="meter-box" data-chart-box="meter">${meterSVG({ w: widthOf('meter', 320), low: w.low, high: w.high, value: w.value })}</span>`;
    }
    case 'shell:pill': {
      const w = walk(s);
      const ok = w.value >= 0;
      return `<span class="pill-dot ${ok ? 'pos' : 'neg'}" aria-hidden="true"></span><span>Q4 FY27 <b class="${ok ? 'pos' : 'neg'}">${esc(pct(w.value, { sign: true }))}</b></span>`;
    }
    case 'shell:meter-sheet': {
      const w = walk(s);
      const ok = w.value >= 0;
      return `<p class="sheet-meter-text">${esc(meterLabel(s))} <button type="button" class="src" data-item="q4-plan" aria-label="Source Model: open details">Model</button></p><div class="sheet-meter" data-chart-box="meter-sheet">${meterSVG({ w: widthOf('meter-sheet', 320), low: w.low, high: w.high, value: w.value })}</div><p class="muted small">The band is the plan range; the dot is the current settings, ${ok ? 'at or above' : 'below'} break-even.</p><a class="btn btn-primary" href="#/plan" data-action="close-overlay-nav">${icon('sliders-horizontal', { size: 18 })}<span>Open the Plan simulator</span></a><h3 class="pop-title" style="margin:24px 0 12px">Scenario</h3>${scenarioControls(s, { idp: 'sheet' })}`;
    }
    case 'shell:scenario': return scenarioControls(s, { idp: 'pop' });
    case 'shell:theme': {
      const t = effectiveTheme();
      const next = t === 'dark' ? 'light' : 'dark';
      return `${icon(t === 'dark' ? 'sun' : 'moon', { size: 20 })}<span class="sr-only">Switch to ${next} theme</span>`;
    }
    case 'shell:kbd': return isMac() ? '⌘K' : 'Ctrl K';
    case 'shell:collapse': {
      const collapsed = document.body.classList.contains('nav-rail');
      return `${icon(collapsed ? 'panel-left-open' : 'panel-left-close', { size: 20 })}<span class="nav-text">${collapsed ? 'Expand' : 'Collapse'}</span><span class="sr-only">${collapsed ? 'Expand navigation' : 'Collapse navigation'}</span>`;
    }
    case 'shell:drawer-title': {
      const it = ui.item ? resolveItem(ui.item, s) : null;
      return esc(it ? it.label : '');
    }
    case 'shell:drawer': return ui.item ? drawerBody(ui.item, s) : '';
    default: return null;
  }
}

/* ---------- Source drawer ---------- */
export function drawerBody(id, s) {
  const it = resolveItem(id, s);
  if (!it) return `<p class="nir">Not in the records</p>`;
  const sources = it.src.map((c) => {
    const src = SOURCES[c];
    return src ? `<li><span class="src static">${esc(c)}</span><span><b>${esc(src.file)}</b>${src.what ? `<span class="muted"> · ${esc(src.what)}</span>` : ''}</span></li>` : '';
  }).join('');
  const verdicts = it.verdicts ? `<div class="dr-verdicts">${it.verdicts}</div>` : '';
  const quote = it.quote ? `<blockquote class="dr-quote">“${esc(it.quote)}”${it.who ? `<cite>${esc(it.who)}</cite>` : ''}</blockquote>` : '';
  const records = it.records ? `<div class="dr-sec"><div class="label">What the records show</div><p>${esc(it.records)}</p></div>` : '';
  const note = it.note ? `<p class="dr-note">${esc(it.note)}</p>` : '';
  const used = it.used && it.used.length
    ? `<div class="dr-sec"><div class="label">Figures used</div><table class="dr-table"><tbody>${it.used.map(([k, v, c]) => `<tr><th scope="row">${esc(k)}</th><td class="r">${esc(v)}</td><td class="r">${c ? `<span class="src static">${esc(c)}</span>` : ''}</td></tr>`).join('')}</tbody></table></div>`
    : '';
  const calc = it.calc && it.calc.length
    ? `<div class="dr-sec"><div class="label">Formula and inputs</div>${it.calc.map((c) => `<div class="formula"><div class="f-expr">${esc(c.formula)}</div>${c.inputs ? `<div class="f-in"><span class="muted">Inputs</span> ${esc(c.inputs)}</div>` : ''}<div class="f-out"><span class="muted">Result</span> <b>${esc(c.result)}</b></div></div>`).join('')}</div>`
    : '';
  const caveat = it.caveat ? `<div class="dr-caveat">${icon('triangle-alert', { size: 18 })}<p>${esc(it.caveat)}</p></div>` : '';
  const value = it.kind === 'claim' ? '' : `<div class="dr-value">${esc(it.value || '')}</div>`;
  return `${value}${note}${verdicts}${quote}
<div class="dr-sec"><div class="label">Source</div><ul class="dr-sources">${sources}</ul></div>
${records}${used}${calc}${caveat}
<div class="dr-actions"><button type="button" class="btn" data-action="copy-value" data-item="${esc(id)}" data-no-open>${icon('copy', { size: 18 })}<span>Copy value</span></button></div>`;
}

/* ---------- Tooltip ---------- */
let tipFor = null;
export function showTip(el, html) {
  const tip = $('#tip');
  tip.innerHTML = html;
  tip.hidden = false;
  tipFor = el;
  el.setAttribute('aria-describedby', 'tip');
  const r = el.getBoundingClientRect();
  const tr = tip.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  let left = r.left + r.width / 2 - tr.width / 2;
  left = Math.max(8, Math.min(vw - tr.width - 8, left));
  let top = r.top - tr.height - 10;
  if (top < 72) top = r.bottom + 10;
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
}
export function hideTip(el) {
  if (el && tipFor && el !== tipFor) return;
  const tip = $('#tip');
  if (tip) tip.hidden = true;
  if (tipFor) tipFor.removeAttribute('aria-describedby');
  tipFor = null;
}
export const tipOwner = () => tipFor;

export function glossaryTip(term) {
  const g = glossaryTerm(term);
  if (!g) return '';
  return `<div class="tip-title">${esc(g.term)} · ${esc(g.full)}</div><div>${esc(g.def)}</div>`;
}

export function chartTip(t) {
  if (!t) return '';
  const src = (t.src || []).map((c) => `<span class="src static">${esc(c)}</span>`).join(' ');
  const rows = (t.rows || []).map(([k, v]) => `<div class="tip-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
  return `<div class="tip-title">${esc(t.title)}</div>${t.value ? `<div class="tip-value">${esc(t.value)}</div>` : ''}${rows}${src ? `<div class="tip-src"><span class="muted">Source</span> ${src}</div>` : ''}${t.formula ? `<div class="tip-formula">${esc(t.formula)}</div>` : ''}${t.hint ? `<div class="tip-hint">${esc(t.hint)}</div>` : ''}`;
}

/* ---------- Toast ---------- */
let toastTimer = null;
export function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ---------- Theme ---------- */
export function applyTheme(t) {
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}
export function toggleTheme() {
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  prefs.setTheme(next);
  applyTheme(next);
  return next;
}

/* ---------- Command palette index ---------- */
export function paletteResults(index, query) {
  const qq = query.trim().toLowerCase();
  if (!qq) return index.filter((r) => r.type === 'Screen' || r.type === 'Action').slice(0, 14);
  const tokens = qq.split(/\s+/);
  const scored = [];
  for (const r of index) {
    const title = r.title.toLowerCase();
    const hay = `${title} ${(r.sub || '').toLowerCase()} ${(r.keys || '').toLowerCase()}`;
    if (!tokens.every((t) => hay.includes(t))) continue;
    let score = 0;
    if (title === qq) score += 100;
    if (title.startsWith(qq)) score += 50;
    if (title.includes(qq)) score += 20;
    score += { Screen: 8, Lever: 7, Claim: 6, Person: 5, Term: 5, Figure: 3, Action: 2 }[r.type] || 0;
    scored.push([score, r]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, 40).map((x) => x[1]);
}

export function renderPaletteList(results, active) {
  if (!results.length) return `<li class="palette-empty" role="presentation">No matches. Try a lever (L4b), a person (Kunal), a term (RTO) or a figure (whey).</li>`;
  let lastType = '';
  return results.map((r, i) => {
    const head = r.type !== lastType ? `<li class="palette-group" role="presentation">${esc(r.type === 'Figure' ? 'Figures' : `${r.type}s`)}</li>` : '';
    lastType = r.type;
    return `${head}<li id="pal-${i}" class="palette-opt" role="option" aria-selected="${i === active}" data-index="${i}">${icon(r.icon || 'arrow-right', { size: 18 })}<span class="po-main"><span class="po-title">${esc(r.title)}</span>${r.sub ? `<span class="po-sub">${esc(r.sub)}</span>` : ''}</span><span class="po-type">${esc(r.where || '')}</span></li>`;
  }).join('');
}

