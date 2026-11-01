// 4.5 Plant X renewal: the draft terms, a calculator for them, and the bargaining position.
import { PLAN, PLANT_X_TERMS } from '../../data.js';
import { plantXQuarter, plantXYear } from '../../model.js';
import { num, crore, lakh, rupees, fmtDate, countdown, todayISO } from '../../format.js';
import { chip, section, screenHead, chartFrame, esc, icon, tchip, slider, numberField, segmented, count } from '../components.js';
import { plantXBars, hbars, widthOf, setTable } from '../charts.js';
import { register } from '../registry.js';

const P = PLAN.plantX;
const QUARTER_NAMES = ['Q1 · Apr to Jun', 'Q2 · Jul to Sep', 'Q3 · Oct to Dec', 'Q4 · Jan to Mar'];
const TIER = {
  'tier-low': ['₹104 tier', 'positive', 'circle-check'],
  'tier-high': ['₹118 tier', 'caution', 'circle-dashed'],
  'below-min': ['Below the 70 t minimum', 'negative', 'circle-x'],
};
const crR = (r, dp = 2, sign = false) => crore(r / 1e7, { dp, sign });
const lkR = (r, sign = false) => lakh(r / 1e5, { sign });
const SCENARIOS = [
  { key: 'today', label: 'Today, 356 t at ₹120', rupees: plantXYear(P.presets.fy26).atToday, note: 'FY26 actual bill' },
  { key: 'fy26', label: 'Draft on the FY26 pattern', rupees: plantXYear(P.presets.fy26).draft },
  { key: 'even89', label: 'Draft at an even 89 t', rupees: plantXYear(P.presets.even89).draft },
  { key: 'hold92', label: 'Draft holding 92 t', rupees: plantXYear(P.presets.hold92).draft, recommended: true },
  { key: 'floor70', label: 'Draft at the 70 t floor', rupees: plantXYear(P.presets.floor70).draft },
];

const quarterCalc = (t) => {
  const q = plantXQuarter(t);
  const rows = [{ formula: 'rate = t ≥ 90 ? ₹104 : ₹118 per kg, on every kg that quarter', inputs: `t = ${num(t, { dp: 1 })} t`, result: `₹${q.rate}/kg` },
    { formula: 'draft cost = t × 1,000 × rate + shortfall × 1,000 × 0.9 × rate', inputs: `${num(t, { dp: 1 })} × 1,000 × ${q.rate} + ${num(q.shortfallT, { dp: 1 })} × 1,000 × 0.9 × ${q.rate}`, result: `${rupees(q.draft)} (${lkR(q.draft)})` },
    { formula: 'same tonnes at today’s rate = t × 1,000 × ₹120', inputs: `${num(t, { dp: 1 })} × 1,000 × 120`, result: `${rupees(q.atToday)} (${lkR(q.atToday)})` }];
  return rows;
};

const items = {
  'px-draft': { label: 'Plant X draft terms', search: 'plant x draft renewal terms 70 90 104 118', value: '₹104/kg at 90 t a quarter or more; ₹118/kg below; minimum 70 t', src: ['B1'],
    used: [['Received', fmtDate(P.draftReceived), 'B1'], ['Term', 'Three years from 1 Apr 2027', 'B1'], ['Minimum', '70 t a quarter; shortfall billed at 90% of the rate', 'B1'], ['Rate at 90 t a quarter or more', '₹104/kg on all kg', 'B1'], ['Rate below 90 t', '₹118/kg on all kg', 'B1']] },
  'px-today': { label: 'Plant X conversion rate today', value: '₹120/kg since 1 Apr 2025', src: ['B1', 'C1'], used: [['Apr 2023', '₹110/kg', 'B1'], ['From 1 Oct 2024', '₹114/kg', 'B1'], ['From 1 Apr 2025', '₹120/kg', 'B1'], ['Billed as', '“capex recovery”, both rises', 'B1']] },
  'px-y': { label: 'Plant Y contract', value: 'To Mar 2028; no minimum; ₹3.60 per 30 g serving (₹120/kg)', src: ['B1', 'C2'], used: [['Contract runs to', 'Mar 2028', 'B1'], ['Minimum', 'None', 'B1'], ['Rate', '₹3.60 per 30 g serving', 'C2'], ['Per kg', '₹3.60 ÷ 30 g × 1,000 = ₹120', 'Calc'], ['FY26 servings', '93.32 lakh (about 280 t)', 'C2'], ['FY26 bill', '₹3,35,95,200', 'C2']] },
  'px-fy26': { label: 'Plant X, FY26 actual', search: 'plant x fy26 82 88 90 96 356', value: '82, 88, 90 and 96 t; 356 t; ₹4,27,20,000', src: ['C1'], used: [['Q1 FY26', '82 t', 'C1'], ['Q2 FY26', '88 t', 'C1'], ['Q3 FY26', '90 t', 'C1'], ['Q4 FY26', '96 t', 'C1'], ['FY26', '356 t at ₹120/kg', 'C1'], ['Bill', '₹4,27,20,000 (₹4.27 cr)', 'C1']] },
  'px-deadline': { label: 'Plant X answer due', value: '31 Dec 2026', src: ['A', 'B1'], note: 'The board asked for a renewal decision by 31 Dec 2026; new terms would start 1 Apr 2027.', used: [['Draft received', '9 Oct 2026', 'B1'], ['Decision due', '31 Dec 2026', 'A'], ['New terms start', '1 Apr 2027', 'B1']] },
  'px-edges': { label: 'The 90 t cliff', search: 'cliff 89 t 11.4 lakh', value: 'One quarter at 89 t instead of 90 t costs ₹11.4 lakh more', src: ['B1', 'Calc'],
    calc: [
      { formula: 'cost at 89 t − cost at 90 t', inputs: '89 × 1,000 × 118 − 90 × 1,000 × 104', result: lkR(plantXQuarter(89).draft - plantXQuarter(90).draft) },
      { formula: 'cost at 89.9 t − cost at 90 t', inputs: '89.9 × 1,000 × 118 − 90 × 1,000 × 104', result: lkR(plantXQuarter(89.9).draft - plantXQuarter(90).draft) },
      { formula: 'cost at 0 t = 70 t shortfall × 1,000 × 0.9 × ₹118', inputs: '70 × 1,000 × 0.9 × 118', result: lkR(plantXQuarter(0).draft) },
    ] },
  'px-year': { label: 'Plant X draft, annual cost (what-if)', search: 'plant x calculator annual cost draft', value: (s) => { const y = plantXYear(s.px.q); return `${crR(y.draft)} under the draft against ${crR(y.atToday)} at ₹120 (${crR(y.diff, 2, true)})`; }, src: ['Model', 'B1'],
    used: (s) => s.px.q.map((t, i) => { const q = plantXQuarter(t); return [QUARTER_NAMES[i], `${num(t, { dp: 1 })} t at ₹${q.rate} → ${lkR(q.draft)}`, 'Model']; }).concat([['FY26 actual bill, reference', '₹4.27 cr', 'C1']]),
    calc: (s) => { const y = plantXYear(s.px.q); return [{ formula: 'year = sum of the four quarters', inputs: s.px.q.map((t) => lkR(plantXQuarter(t).draft)).join(' + '), result: `${rupees(y.draft)} (${crR(y.draft)})` }, { formula: 'difference = draft − same tonnes at ₹120', inputs: `${crR(y.draft)} − ${crR(y.atToday)}`, result: crR(y.diff, 2, true) }, { formula: 'tonnes to route from Y = sum of max(0, 92 − t)', inputs: s.px.q.map((t) => num(Math.max(0, 92 - t), { dp: 1 })).join(' + '), result: `${num(y.routeFromY, { dp: 1 })} t` }]; } },
  'px-scen': { label: 'Plant X scenarios at a glance', value: 'Today ₹4.27 cr; FY26 pattern ₹3.94 cr; even 89 t ₹4.20 cr; holding 92 t ₹3.83 cr; 70 t floor ₹3.30 cr', src: ['Model', 'C1', 'B1'],
    used: SCENARIOS.map((sc) => [sc.label, crR(sc.rupees), sc.key === 'today' ? 'C1' : 'Model']),
    calc: [{ formula: 'draft holding 92 t = 92 × 4 × 1,000 × ₹104', inputs: '368 t × ₹104', result: crR(plantXYear(P.presets.hold92).draft) }, { formula: 'against the same 368 t at ₹120', inputs: '368 t × ₹120', result: `${crR(plantXYear(P.presets.hold92).atToday)}, a saving of ${crR(-plantXYear(P.presets.hold92).diff)}` }] },
  'px-fill': { label: 'Anvil’s share of the tub lines', value: 'about 44%: 169 of 380 t a quarter in Q1 CY26', src: ['C1', 'C2', 'Calc'], used: [['Anvil at X, Q1 CY26', '96 t', 'C1'], ['Anvil at Y, Q1 CY26', 'about 73 t', 'C2'], ['Combined tub-line capacity', '380 t a quarter', 'E']], calc: [{ formula: 'share = (96 + 73) ÷ 380', inputs: '169 ÷ 380', result: `${num(169 / 380 * 100)}%` }] },
  'px-share': { label: 'Anvil’s share of combined output', value: '30% → 21% (Q2 CY23 → Q1 CY26)', src: ['E'], used: [['Anvil', '30% → 21%', 'E'], ['Brand B', '22% → 5%', 'E'], ['Brand C', '18% → 4%', 'E']] },
  'px-lines': { label: 'Line capacity built at the two plants', value: 'Tub 380 → 380 t a quarter; sachet 0 → 340; RTD 0 → 180', src: ['E'], used: [['Tub lines', '380 → 380 (peak 440)', 'E'], ['Sachet lines', '0 → 340', 'E'], ['RTD lines', '0 → 180', 'E'], ['Plant X cumulative capex', '₹52 cr → ₹150 cr', 'E']] },
  'px-calls': { label: 'Procurement notes on Plant X', value: 'No volume deal is on offer; three calls went unanswered', src: ['B1'] },
};
SCENARIOS.forEach((sc) => { items[`px-sc-${sc.key}`] = { label: sc.label, value: crR(sc.rupees), src: sc.key === 'today' ? ['C1'] : ['Model', 'B1'] }; });
register('plant-x', items);

function terms() {
  return `<div class="card"><dl class="terms">
  <dt>The draft ${chip('px-draft')}</dt>
  <dd><ul>${PLANT_X_TERMS.draft.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></dd>
  <dt>Today ${chip('px-today')}</dt>
  <dd>${esc(PLANT_X_TERMS.today)}.</dd>
  <dt>Plant Y ${chip('px-y')}</dt>
  <dd>${esc(PLANT_X_TERMS.plantY)}.</dd>
  <dt>FY26 at Plant X ${chip('px-fy26')}</dt>
  <dd>82, 88, 90 and 96 t by quarter: 356 t, billed ₹4,27,20,000. Two quarters sat under the 90 t tier.</dd>
  <dt>Why the cliff matters ${chip('px-edges')}</dt>
  <dd>One quarter at 89 t instead of 90 t costs <b>${lkR(plantXQuarter(89).draft - plantXQuarter(90).draft)}</b> more; at 89.9 t, <b>${lkR(plantXQuarter(89.9).draft - plantXQuarter(90).draft)}</b> more. A quarter at 0 t still bills <b>${lkR(plantXQuarter(0).draft)}</b>.</dd>
</dl></div>`;
}

function calculator(s) {
  const y = plantXYear(s.px.q);
  const presets = [{ value: 'fy26', label: 'FY26 pattern' }, { value: 'even89', label: 'Even 89 t' }, { value: 'hold92', label: 'Hold 92 t' }, { value: 'floor70', label: 'Floor 70 t' }];
  const qcards = y.quarters.map((q, i) => {
    const [tl, tone, ic] = TIER[q.tier];
    const save = y.savingsTo90[i];
    return `<div class="qcard">
      <div class="qcard-head"><span class="ctl-name" id="pxq-${i}">${QUARTER_NAMES[i]}</span>${tchip(tl, tone, ic)}</div>
      ${slider({ bind: `px.q.${i}`, min: 0, max: 140, step: 1, value: q.t, labelId: `pxq-${i}`, valueText: `${num(q.t, { dp: 1 })} tonnes`, bigStep: 10, ticks: [70, 90] })}
      ${numberField({ bind: `px.q.${i}`, id: `pxn-${i}`, label: QUARTER_NAMES[i].replace(' · ', ', '), value: q.t, min: 0, max: 140, step: 0.1, unit: 't', bigStep: 1 })}
      <div class="res-sub">Draft cost <b>${lkR(q.draft)}</b> · at ₹120: ${lkR(q.atToday)}${chip('px-year')}</div>
      ${save !== null ? `<div class="qsave">Moving this quarter to 90 t saves ${lkR(save)}</div>` : ''}
    </div>`;
  }).join('');
  const id = 'px-bars';
  const svg = plantXBars({ id, w: widthOf(id, 700), title: 'Tonnes per quarter under the draft', desc: `Quarters at ${s.px.q.map((t) => num(t, { dp: 1 })).join(', ')} tonnes, against the 70 t minimum and the 90 t tier.`,
    quarters: y.quarters.map((q, i) => ({ label: `Q${i + 1}`, t: q.t, tier: q.tier, tText: `${num(q.t, { dp: 1 })} t`, tierText: TIER[q.tier][0], costText: lkR(q.draft), item: 'px-year',
      tip: { title: `${QUARTER_NAMES[i]} (what-if)`, value: `${num(q.t, { dp: 1 })} t at ₹${q.rate}/kg`, rows: [['Draft cost', lkR(q.draft)], ['Same tonnes at ₹120', lkR(q.atToday)], ...(q.shortfallT > 0 ? [['Shortfall billed', `${num(q.shortfallT, { dp: 1 })} t at 90%`]] : [])], src: ['Model', 'B1'], formula: 't × 1,000 × rate + shortfall × 1,000 × 0.9 × rate' } })) });
  const tbl = setTable(id, 'Plant X draft by quarter', ['Quarter', 'Tonnes', 'Rate ₹/kg', 'Draft cost ₹', 'Same tonnes at ₹120 ₹'], y.quarters.map((q, i) => [QUARTER_NAMES[i], num(q.t, { dp: 1 }), q.rate, rupees(q.draft), rupees(q.atToday)]));
  const diffTone = y.diff <= 0 ? 'pos' : 'neg';
  return `<div class="card">
  <div class="presets"><span class="label" id="px-pre">Presets</span>${segmented({ bind: 'px.preset', labelId: 'px-pre', value: s.px.preset, options: presets })}${s.px.preset === 'custom' ? '<span class="custom-tag">Custom</span>' : ''}</div>
  <div class="quarters">${qcards}</div>
  <div style="margin-top:20px">${chartFrame({ id, title: 'Tonnes per quarter, coloured by tier', sub: 'Lines at the 70 t minimum and the 90 t tier', item: 'px-year', svg, table: tbl })}</div>
  <div class="results">
    <div class="res"><div class="label">Draft cost</div><div class="res-v">${count('px-draft', y.draft / 1e7, 'cr2')}</div><div class="res-sub">${num(y.tonnes, { dp: 1 })} t in the year ${chip('px-year')}</div></div>
    <div class="res"><div class="label">Same tonnes at ₹120</div><div class="res-v">${count('px-120', y.atToday / 1e7, 'cr2')}</div><div class="res-sub">Today’s rate</div></div>
    <div class="res"><div class="label">Difference</div><div class="res-v ${diffTone}">${count('px-diff', y.diff / 1e7, 'cr2s')}</div><div class="res-sub">${y.diff <= 0 ? 'Draft cheaper' : 'Draft dearer'} than ₹120</div></div>
    <div class="res"><div class="label">FY26 actual bill</div><div class="res-v">₹4.27 cr</div><div class="res-sub">Reference ${chip('px-fy26')}</div></div>
  </div>
  <div class="calc-notes"><span>Tonnes to route from Y to reach 92 t: <b>${num(y.routeFromY, { dp: 1 })} t</b> ${chip('px-year')}</span><span class="muted small">Every value here is a what-if on the quarter inputs above.</span></div>
</div>`;
}

function scenarios() {
  const id = 'px-scen';
  const rows = SCENARIOS.map((sc) => ({ label: sc.label, v: sc.rupees / 1e7, text: crR(sc.rupees), tone: sc.key === 'today' ? 's-neu' : 's-neu', outline: sc.recommended, strong: sc.recommended, item: `px-sc-${sc.key}`,
    sub: sc.recommended ? 'recommended' : '', tip: { title: sc.label, value: crR(sc.rupees), src: sc.key === 'today' ? ['C1'] : ['Model', 'B1'] } }));
  const svg = hbars({ id, w: widthOf(id, 1000), rows, domain: [0, 5], title: 'Plant X scenarios at a glance', desc: 'Annual conversion bill: today ₹4.27 crore; draft on the FY26 pattern ₹3.94; even 89 t ₹4.20; holding 92 t ₹3.83; at the 70 t floor ₹3.30.', refs: [{ v: 4.272, label: 'FY26 actual ₹4.27 cr' }], labelW: 220, rowH: 40 });
  const tbl = setTable(id, 'Plant X scenarios, annual bill', ['Scenario', '₹ cr', 'Source'], SCENARIOS.map((sc) => [sc.label, num(sc.rupees / 1e7, { dp: 2 }), sc.key === 'today' ? 'C1' : 'Model']));
  return chartFrame({ id, title: 'Annual conversion bill, ₹ cr', item: 'px-scen', svg, table: tbl, note: '<span>Holding 92 t is outlined: the recommended stance.</span>' });
}

function bargaining() {
  return `<div class="card"><ul class="bullets" role="list">
  <li>Anvil fills about <b>44%</b> of the two plants’ tub lines: 169 of 380 t a quarter in Q1 CY26. ${chip('px-fill')}</li>
  <li>Its share of the plants’ combined output fell from <b>30% to 21%</b>. ${chip('px-share')}</li>
  <li>Tub lines did not grow (380 t a quarter, peak 440) while sachet lines reached 340 t and ready-to-drink (RTD) lines 180 t. ${chip('px-lines')}</li>
  <li>Procurement notes say no volume deal is on offer and <b>three</b> calls went unanswered. ${chip('px-calls')}</li>
</ul></div>`;
}

function reco() {
  return `<div class="card reco">
  <div class="reco-head"><div><div class="label">Recommendation · L5</div><h3 class="unk-title">Counter the draft, then hold at least 92 t a quarter</h3></div>${tchip('Recommended', 'accent', 'check')}</div>
  <p style="margin-top:12px">Route volume from Plant Y, which has no minimum and charges the equivalent of ₹120/kg ${chip('px-y')}.</p>
  <div class="lab-out" style="margin-top:12px"><span class="reco-v pos">+₹0.6 cr a year</span><span class="muted">from Apr 2027</span>${chip('L5')}</div>
  <p class="note">${icon('flag', { size: 16 })}<span><b>Stop rule:</b> “X refuses and falls under 90 t twice.”</span></p>
</div>`;
}

function banner() {
  const c = countdown(P.decideBy, todayISO());
  return `<div class="banner${c.past ? ' overdue' : ''}" role="note">${icon(c.past ? 'circle-alert' : 'calendar', { size: 20 })}<span>Answer due ${fmtDate(P.decideBy)} · ${c.past ? `${esc(c.text.replace(' ago', ''))} overdue` : esc(c.text)}</span>${chip('px-deadline')}</div>`;
}

export default {
  id: 'plant-x',
  title: 'Plant X renewal',
  tab: 'Plant X',
  group: 'Decide',
  icon: 'factory',
  keywords: 'plant x renewal contract draft conversion tonnes 92 90 70 baddi',
  render() {
    return `${screenHead({
      headline: `Don’t sign the Plant X draft as written. Below 90 t a quarter every kg is billed at ₹118${chip('px-draft')}, so counter, then hold at least 92 t a quarter.${chip('L5')}`,
      meaning: 'Plant X (Baddi) and Plant Y (Pune) make everything Anvil sells. The draft rewards steady volume and punishes any quarter that slips under its tier.',
    })}
<div data-region="banner"></div>
<div class="split split-4-8">
  ${section({ id: 'px-terms-s', title: 'Terms', body: '<div data-region="terms"></div>' })}
  ${section({ id: 'px-calc-s', title: 'Draft calculator', sub: 'Set tonnes for each quarter of a contract year. Rates apply to every kg in the quarter.', body: '<div data-region="calc"></div>' })}
</div>
${section({ id: 'px-scen-s', title: 'Scenarios at a glance', body: '<div data-region="scen"></div>' })}
<div class="split split-6-6">
  ${section({ id: 'px-bargain-s', title: 'Bargaining position', body: '<div data-region="bargain"></div>' })}
  ${section({ id: 'px-reco-s', title: 'Recommendation', body: '<div data-region="reco"></div>' })}
</div>`;
  },
  region(key, s) {
    switch (key) {
      case 'banner': return banner();
      case 'terms': return terms();
      case 'calc': return calculator(s);
      case 'scen': return scenarios();
      case 'bargain': return bargaining();
      case 'reco': return reco();
      default: return null;
    }
  },
  live(s) {
    const y = plantXYear(s.px.q);
    return `Plant X draft ${crR(y.draft)} against ${crR(y.atToday)} at ₹120.`;
  },
};

