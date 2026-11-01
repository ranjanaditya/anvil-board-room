// Shared components, rendered as HTML strings. Interactive ones bind to scenario paths
// through data-bind and are wired by the shell's delegated event handlers.

import { esc, count } from './dom.js';
import { icon } from './icons.js';
import { GLOSSARY, VERDICTS } from '../data.js';
import { itemCodes, itemLabel } from './registry.js';
import { getState } from '../state.js';
import { spoken } from '../format.js';

/* ---------- Source chips ---------- */
export function chip(id, codes) {
  const s = getState();
  const c = codes || itemCodes(id, s);
  const label = itemLabel(id, s);
  return `<button type="button" class="src" data-item="${esc(id)}" aria-label="Source ${esc(c.join(', '))}${label ? ` for ${esc(spoken(label))}` : ''}: open details">${esc(c.join(' · '))}</button>`;
}

// A number followed by its source chip.
export const fig = (value, id, cls = '') => `<span class="fig ${cls}"><span class="fig-v">${value}</span>${chip(id)}</span>`;

/* ---------- Glossary terms ---------- */
const GL = new Map(GLOSSARY.map((g) => [g.term.toLowerCase(), g]));
export const glossaryTerm = (t) => GL.get(String(t).toLowerCase());

export function abbr(term, text) {
  const g = glossaryTerm(term);
  if (!g) return esc(text || term);
  return `<abbr class="gl" tabindex="0" data-gl="${esc(g.term)}" aria-label="${esc(`${text || g.term}, ${g.full}`)}">${esc(text || g.term)}</abbr>`;
}

// Text with glossary markers: [[CM3]] or [[CM3|contribution margin 3 (CM3)]].
export function T(text) {
  return String(text)
    .split(/(\[\[[^\]]+\]\])/g)
    .map((part) => {
      const m = part.match(/^\[\[([^|\]]+)(?:\|([^\]]+))?\]\]$/);
      return m ? abbr(m[1], m[2]) : esc(part);
    })
    .join('');
}

/* ---------- Chips for verdicts, tones and status ---------- */
export function vchip(key, part) {
  const v = VERDICTS[key];
  return `<span class="tchip tone-${v.tone}">${icon(v.icon, { size: 16 })}<span>${part ? `${esc(part)}: ` : ''}${esc(v.label)}</span></span>`;
}
export function tchip(label, tone = 'neutral', iconName = null) {
  return `<span class="tchip tone-${tone}">${iconName ? icon(iconName, { size: 16 }) : ''}<span>${esc(label)}</span></span>`;
}
const STATUS_TONE = { 'Not started': ['neutral', 'circle-dashed'], 'In test': ['caution', 'circle-dashed'], Live: ['positive', 'circle-check'], Stopped: ['negative', 'circle-x'], Done: ['neutral', 'check'], Overdue: ['negative', 'circle-alert'] };
export function statusChip(status) {
  const [tone, ic] = STATUS_TONE[status] || STATUS_TONE['Not started'];
  return tchip(status, tone, ic);
}

export const notInRecords = (what = '') => `<span class="nir">Not in the records${what ? ` <span class="sr-only">(${esc(what)})</span>` : ''} <a class="nir-link" href="#/data?tab=requests">See open requests</a></span>`;

/* ---------- Tone helpers: colour always paired with a sign or word ---------- */
export const toneOf = (x, eps = 1e-9) => (x > eps ? 'pos' : x < -eps ? 'neg' : 'neu');
export const signTone = (x) => (x >= 0 ? 'pos' : 'neg'); // for CM3 levels against the zero target

/* ---------- Controls ---------- */
export function segmented({ bind, labelId, options, value, size = 'md', type }) {
  const anyChecked = options.some((o) => o.value === value);
  return `<div class="seg seg-${size}" role="radiogroup" aria-labelledby="${labelId}" data-bind="${esc(bind)}"${type ? ` data-type="${type}"` : ''}>${options
    .map((o, i) => {
      const on = o.value === value;
      const tab = on || (!anyChecked && i === 0) ? 0 : -1;
      return `<button type="button" role="radio" class="seg-opt" data-value="${esc(o.value)}" aria-checked="${on}" tabindex="${tab}">${o.html || esc(o.label)}</button>`;
    })
    .join('')}</div>`;
}

export function switchCtl({ bind, checked, labelId, describedBy }) {
  return `<button type="button" role="switch" class="switch" data-bind="${esc(bind)}" aria-checked="${checked}" aria-labelledby="${labelId}"${describedBy ? ` aria-describedby="${describedBy}"` : ''}><span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span><span class="switch-text" aria-hidden="true">${checked ? 'On' : 'Off'}</span></button>`;
}

// Custom slider: exact values (a case midpoint such as 1.95 stays 1.95), 0.1-step keyboard
// movement, Shift for ten steps, Home and End for the ends.
export function slider({ bind, min, max, step, value, labelId, valueText, band, bigStep, ticks = [] }) {
  const pos = ((value - min) / (max - min)) * 100;
  const bandHtml = band ? `<div class="slider-band" style="left:${((band[0] - min) / (max - min)) * 100}%;width:${((band[1] - band[0]) / (max - min)) * 100}%"></div>` : '';
  const tickHtml = ticks.map((t) => `<span class="slider-tick" style="left:${((t - min) / (max - min)) * 100}%"></span>`).join('');
  return `<div class="slider" data-bind="${esc(bind)}" data-min="${min}" data-max="${max}" data-step="${step}"${bigStep ? ` data-big="${bigStep}"` : ''}><div class="slider-track">${bandHtml}<div class="slider-fill" style="width:${pos}%"></div>${tickHtml}</div><div class="slider-thumb" role="slider" tabindex="0" aria-labelledby="${labelId}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${value}" aria-valuetext="${esc(spoken(valueText))}" style="left:${pos}%"></div></div>`;
}

export function numberField({ bind, id, label, value, min, max, step = 0.1, unit = 't', bigStep = 1 }) {
  return `<div class="numfield"><button type="button" class="step-btn" data-action="step" data-target="${id}" data-dir="-1" aria-label="Decrease ${esc(label)} by ${bigStep} ${unit}">${icon('minus', { size: 16 })}</button><input id="${id}" class="num-input" type="number" inputmode="decimal" data-bind="${esc(bind)}" min="${min}" max="${max}" step="${step}" data-big="${bigStep}" value="${value}" aria-label="${esc(label)}, ${unit}"><span class="num-unit" aria-hidden="true">${unit}</span><button type="button" class="step-btn" data-action="step" data-target="${id}" data-dir="1" aria-label="Increase ${esc(label)} by ${bigStep} ${unit}">${icon('plus', { size: 16 })}</button></div>`;
}

/* ---------- Layout pieces ---------- */
export function screenHead({ headline, meaning, live = false, extra = '' }) {
  return `<header class="screen-head"><h1 class="headline" tabindex="-1"${live ? ' data-region="headline"' : ''}>${headline}</h1><p class="meaning"${live ? ' data-region="meaning"' : ''}><span class="meaning-label">What this means</span> ${meaning}</p>${extra}</header>`;
}

export function section({ id, title, sub, body, cls = '', tools = '' }) {
  return `<section class="section ${cls}"${id ? ` id="${id}" aria-labelledby="${id}-h"` : ''}><div class="section-head"><div><h2 class="section-title"${id ? ` id="${id}-h"` : ''}>${title}</h2>${sub ? `<p class="section-sub">${sub}</p>` : ''}</div>${tools ? `<div class="section-tools">${tools}</div>` : ''}</div>${body}</section>`;
}

export function kpi({ label, value, sub, extra = '', id }) {
  return `<div class="kpi card"${id ? ` data-key="${id}"` : ''}><div class="label">${label}</div><div class="kpi-value">${value}</div>${extra}<div class="kpi-sub">${sub}</div></div>`;
}

/* ---------- Tables ---------- */
// head: [{ label, num, cls }]; rows: [{ cells: [html], item, cls }]. Rows with an item open the drawer.
export function table({ head, rows, cls = '', caption = '', stack = true, rowLabel = 0 }) {
  const th = head.map((h) => `<th scope="col" class="${h.num ? 'r' : ''} ${h.cls || ''}">${h.label}</th>`).join('');
  const tr = rows
    .map((r) => {
      const attrs = r.item ? ` class="row-link ${r.cls || ''}" data-item="${esc(r.item)}" tabindex="0" aria-label="${esc(r.aria || '')}"` : r.cls ? ` class="${r.cls}"` : '';
      const tds = r.cells
        .map((c, i) => {
          const h = head[i] || {};
          const tag = i === rowLabel ? 'th scope="row"' : 'td';
          const close = i === rowLabel ? 'th' : 'td';
          return `<${tag} class="${h.num ? 'r' : ''} ${h.cls || ''}" data-label="${esc(stripTags(h.label))}">${c}</${close}>`;
        })
        .join('');
      return `<tr${attrs}>${tds}</tr>`;
    })
    .join('');
  return `<div class="tbl-wrap"><table class="tbl ${stack ? 'stack' : ''} ${cls}">${caption ? `<caption class="sr-only">${esc(caption)}</caption>` : ''}<thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
}
export const stripTags = (h) => String(h).replace(/<[^>]*>/g, '').trim();

/* ---------- Charts: frame with title, source, table view and CSV ---------- */
export const tableView = new Set();
export const chartPhase = new Map(); // id → 'pending' | 'drawing' | 'done'

export function chartFrame({ id, title, sub = '', item, codes, svg, table: tbl, note = '', legend = '', minH }) {
  const asTable = tableView.has(id);
  const phase = chartPhase.get(id) || 'pending';
  const tableHtml = tbl ? simpleTable(tbl) : '';
  return `<figure class="chart ${phase === 'done' ? '' : phase}" data-chart="${id}">
  <div class="chart-head"><div class="chart-heading"><h3 class="chart-title">${title}</h3>${sub ? `<p class="chart-sub">${sub}</p>` : ''}</div>
  <div class="chart-tools">${item ? chip(item, codes) : ''}<button type="button" class="tool" data-action="toggle-table" data-chart-id="${id}" aria-pressed="${asTable}">${icon(asTable ? 'chart-column' : 'table', { size: 16 })}<span>${asTable ? 'View as chart' : 'View as table'}</span></button><button type="button" class="tool" data-action="csv" data-chart-id="${id}" aria-label="Download ${esc(stripTags(title))} as CSV">${icon('download', { size: 16 })}<span>CSV</span></button></div></div>
  ${legend}
  <div class="chart-box" data-chart-box="${id}"${asTable ? ' hidden' : ''}${minH ? ` style="min-height:${minH}px"` : ''}>${svg}</div>
  <div class="chart-table"${asTable ? '' : ' hidden'}>${tableHtml}</div>
  ${note ? `<figcaption class="chart-note">${note}</figcaption>` : ''}
</figure>`;
}

function simpleTable({ head, rows }) {
  const th = head.map((h, i) => `<th scope="col"${i ? ' class="r"' : ''}>${esc(h)}</th>`).join('');
  const tr = rows.map((r) => `<tr>${r.map((c, i) => (i ? `<td class="r" data-label="${esc(head[i])}">${esc(c)}</td>` : `<th scope="row" data-label="${esc(head[0])}">${esc(c)}</th>`)).join('')}</tr>`).join('');
  return `<div class="tbl-wrap"><table class="tbl stack"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
}

export { count, icon, esc };
