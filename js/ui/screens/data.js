// 4.9 Data and method: sources, assumptions, data health, open requests and the glossary.
import { SOURCES, SOURCE_ORDER, ASSUMPTIONS, DATA_HEALTH, OPEN_REQUESTS, GLOSSARY, AS_OF } from '../../data.js';
import { fmtDate } from '../../format.js';
import { chip, T, screenHead, esc, icon } from '../components.js';
import { register } from '../registry.js';

const TABS = [
  { id: 'sources', label: 'Sources' },
  { id: 'assumptions', label: 'Assumptions' },
  { id: 'health', label: 'Data health' },
  { id: 'requests', label: 'Open requests' },
  { id: 'glossary', label: 'Glossary' },
];

const FORMULAS = [
  { name: 'Q4 FY27 CM3 walk', lines: ['M = −10.0 − 4.13 − 0.23 = −14.36 (Q4 FY26 CM3, less FY27 whey at ₹1,024/kg and flavour and pack at ₹5/kg, as points of ₹2,181/kg NR)', 'q4 = M + L1 + L2 + L3 + L4b + L7 + B', 'q4_cr = q4 × 33 ÷ 100', 'band_low = M + L1 + 1.5 + 0.2 + 0 + 0 + B', 'band_high = M + L1 + 2.4 + 2.2 + 1.1 + 0.4 + B', 'L1 = +10.0 (marketing branch) or +5.3 (CM2 branch); B = 3.5 when the backstop is on'] },
  { name: 'FY28 full year', lines: ['cm3 = cm2 − marketing', 'cm3_cr = cm3 × 129 ÷ 100', 'break-even marketing = cm2', 'CM2: momentum 20.6, cautious 25.4, central 28.2, favourable 30.5 (% of NR)'] },
  { name: 'Plant X draft', lines: ['rate = t ≥ 90 ? ₹104 : ₹118 per kg, on every kg that quarter', 'shortfall = max(0, 70 − t) tonnes, billed at 90% of the rate', 'draft = t × 1,000 × rate + shortfall × 1,000 × 0.9 × rate', 'at today’s rate = t × 1,000 × ₹120'] },
  { name: 'Cash planner', lines: ['import = (590 × 0.9375 × 1,000 × 843 × share × 75 ÷ 365 + 20 × 1,000 × 843) ÷ 1 crore, when share > 0', 'GST build-up = rate × months ÷ 12 (5 months to Mar 2027, 17 to Mar 2028)', 'sachets = runs × 5,62,500 × ₹46.7; plant tub = 8 t × ₹800/kg; release = −28 t × ₹1,250/kg', 'caps: ₹10 cr at Mar 2027, ₹16 cr at Mar 2028'] },
  { name: 'Format lab', lines: ['price = cost ÷ (1 − margin)', 'cost per 100 g protein = unit cost ÷ protein per unit × 100'] },
  { name: 'Quick-commerce check', lines: ['contribution per kg = 2,901 ÷ 1.05 × (1 − discount) × (1 − take) − 1,250', 'break-even take = 1 − 1,250 ÷ (2,901 ÷ 1.05 × (1 − discount))'] },
];

const items = {};
FORMULAS.forEach((f, i) => { items[`formula-${i}`] = { label: `Plan model: ${f.name}`, value: f.lines[0], src: ['Model'], calc: f.lines.map((l) => ({ formula: l, inputs: '', result: 'Computed live from unrounded inputs' })) }; });
ASSUMPTIONS.forEach((a, i) => { items[`as-${i + 1}`] = { label: `Assumption ${i + 1}`, value: a.text, src: a.src }; });
DATA_HEALTH.conflicts.forEach((c, i) => { items[`dh-c${i + 1}`] = { label: `Conflict: ${c.title}`, value: c.text, src: c.src }; });
DATA_HEALTH.errors.forEach((c, i) => { items[`dh-e${i + 1}`] = { label: `Error inside file ${c.file}`, value: c.text, src: c.src }; });
OPEN_REQUESTS.forEach((r) => { if (r.src) items[`or-${r.id}`] = { label: `Open request: ${r.request}`, value: r.why, src: r.src }; });
register('data', items);

function sources() {
  return `<ul class="src-list" role="list">${SOURCE_ORDER.map((code) => {
    const s = SOURCES[code];
    return `<li><span class="src static">${esc(code)}</span><div><b>${esc(s.file)}</b>${s.what ? `<div class="muted">${esc(s.what)}</div>` : ''}${s.opinion ? '<div class="small cau" style="margin-top:2px">Opinion, not a record</div>' : ''}</div></li>`;
  }).join('')}</ul>
  <h3 class="section-title" style="margin-top:32px;font-size:20px">Plan model formulas</h3>
  <p class="section-sub">Every interactive result is computed live with these formulas from unrounded inputs, and rounded only for display.</p>
  <div class="formula-list">${FORMULAS.map((f, i) => `<div class="formula"><div class="ctl-name">${esc(f.name)}${chip(`formula-${i}`)}</div>${f.lines.map((l) => `<div class="f-expr">${esc(l)}</div>`).join('')}</div>`).join('')}</div>`;
}

function assumptions() {
  return `<ol class="num-list">${ASSUMPTIONS.map((a, i) => `<li>${T(a.text)} ${chip(`as-${i + 1}`)}</li>`).join('')}</ol>`;
}

function health() {
  return `<h3 class="ctl-name" style="font-size:15px">Conflicts between files</h3>
  <ol class="num-list">${DATA_HEALTH.conflicts.map((c, i) => `<li><b>${esc(c.title)}.</b> ${esc(c.text)} ${chip(`dh-c${i + 1}`)}</li>`).join('')}</ol>
  <h3 class="ctl-name" style="font-size:15px;margin-top:28px">Errors inside a file</h3>
  <ul class="bullets" role="list">${DATA_HEALTH.errors.map((c, i) => `<li><span class="src static">${esc(c.file)}</span> ${esc(c.text)} ${chip(`dh-e${i + 1}`)}</li>`).join('')}</ul>
  <h3 class="ctl-name" style="font-size:15px;margin-top:28px">Reading rules</h3>
  <ul class="bullets" role="list">${DATA_HEALTH.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`;
}

function requests() {
  return `<div class="tbl-wrap"><table class="tbl stack"><caption class="sr-only">Open data requests</caption>
  <thead><tr><th scope="col">Request</th><th scope="col">Why it matters</th><th scope="col" class="r">Due</th></tr></thead>
  <tbody>${OPEN_REQUESTS.map((r) => `<tr><th scope="row" data-label="Request">${esc(r.request)}</th><td data-label="Why it matters" class="wrap">${esc(r.why)}${r.src ? chip(`or-${r.id}`) : ''}</td><td data-label="Due" class="r">${r.due ? esc(fmtDate(r.due)) : '<span class="nir">Not set</span>'}</td></tr>`).join('')}</tbody></table></div>`;
}

function glossary(ui) {
  const hl = ui && ui.term ? ui.term.toLowerCase() : null;
  return `<dl class="gl-list">${GLOSSARY.map((g) => `<div id="gl-${esc(g.term.replace(/\s+/g, '-'))}"${hl === g.term.toLowerCase() ? ' class="flash"' : ''}><dt>${esc(g.term)} <span>· ${esc(g.full)}</span></dt><dd>${esc(g.def)}</dd></div>`).join('')}</dl>`;
}

const PANELS = { sources, assumptions, health, requests, glossary };

export default {
  id: 'data',
  title: 'Data and method',
  tab: 'Data',
  group: 'Reference',
  icon: 'database',
  keywords: 'sources assumptions data health open requests glossary method formulas',
  render() {
    return `${screenHead({
      headline: 'Every number here comes from the data-room files A to L, or from a stated calculation on them.',
      meaning: `Chats are opinions unless they quote a record, and anything the records lack says “Not in the records”. Data as of ${esc(AS_OF.label)}.`,
    })}
<div data-region="tabs"></div>`;
  },
  region(key, s, ui) {
    if (key !== 'tabs') return null;
    const active = TABS.some((t) => t.id === ui.tab) ? ui.tab : 'sources';
    return `<div class="tabs" role="tablist" aria-label="Data and method">${TABS.map((t) => `<button type="button" role="tab" class="tab-btn" id="tab-${t.id}" data-tab="${t.id}" data-action="data-tab" aria-selected="${t.id === active}" aria-controls="panel-${t.id}" tabindex="${t.id === active ? 0 : -1}">${esc(t.label)}</button>`).join('')}</div>
<div class="tab-panel" role="tabpanel" id="panel-${active}" aria-labelledby="tab-${active}" tabindex="0">${PANELS[active](ui)}</div>`;
  },
  actions: {
    'data-tab': (el, e, ctx) => ctx.setTab(el.dataset.tab),
  },
  onRoute(ui) {
    if (ui.term) {
      requestAnimationFrame(() => {
        const el = document.getElementById(`gl-${ui.term.replace(/\s+/g, '-')}`);
        if (el) el.scrollIntoView({ block: 'center' });
      });
    }
  },
};

