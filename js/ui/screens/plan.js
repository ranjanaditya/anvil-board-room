// 4.6 Plan simulator: the Q4 FY27 walk, the levers behind it, and the FY28 test.
import { PLAN, LEVERS } from '../../data.js';
import { fy28, FY28_CASES, importPipelineCr, stockReleaseCr, plantTubRunCr, sachetRunCr, wheySensitivity, plantXYear } from '../../model.js';
import { num, pct, pts, crore, stepValue } from '../../format.js';
import { chip, T, section, chartFrame, esc, icon, slider, switchCtl, count, statusChip } from '../components.js';
import { walkChart, lineChart, widthOf, setTable } from '../charts.js';
import { register } from '../registry.js';
import { walk, scenarioControls, caseTitle, branchTitle } from '../scenario.js';
import { trackerRow } from '../../state.js';

const R = PLAN.q4.sliders;
const F = PLAN.fy28;
const baseRows = (l) => [['What it does', l.what, 'Model'], ['₹ cr a year', l.crYear, 'Model'], ['Q4 FY27, points of NR', l.q4, 'Model'], ['Starts', l.starts, 'Model'], ['Cash', l.cash, 'Model'], ['Stop rule', l.stop, 'Model']];
const sliderCalc = (k) => (s) => {
  const w = walk(s);
  return [{ formula: `${k} effect on Q4 FY27 (what-if)`, inputs: `slider at ${stepValue(w[k])}; range ${pts(R[k].min)} to ${pts(R[k].max)}; Central case midpoint ${stepValue((R[k].min + R[k].max) / 2)}`, result: `${stepValue(w[k])} points of NR (${crore((w[k] * PLAN.q4.nrCr) / 100, { dp: 2, sign: true })} in the quarter)` }];
};
const EXTRA = {
  L1: { src: ['Model', 'F'], used: [['Coupon-aggregator codes', '₹2.5 cr a year', 'F'], ['Creators with no trackable code', 'about ₹4.2 cr (62% of ₹6.7 cr)', 'F'], ['Marketing, FY26', '₹39.3 cr, about 30% of NR', 'F'], ['Rupees per point of NR, FY28', '₹1.29 cr', 'Model']],
    calc: (s) => [{ formula: 'Q4 FY27 effect, by branch', inputs: 'Marketing step-up: 35% → 25% of NR; Costs inside CM2: 30.5% → 25.2%', result: `${pts(s.branch === 'cm2' ? PLAN.q4.l1.cm2 : PLAN.q4.l1.mkt)} on the ${branchTitle(s.branch)} branch` }, { formula: 'gross a year = points × ₹1.29 cr', inputs: '5.3 × 1.29 and 10.0 × 1.29', result: `₹${num(5.3 * 1.29, { dp: 1 })} cr to ₹${num(10 * 1.29, { dp: 1 })} cr` }] },
  L2: { src: ['Model', 'F'], used: [['Everyday D2C discount, FY26', '28.9%', 'F · Calc'], ['D2C orders with an affiliate or coupon code, FY26', '24%', 'F'], ['Affiliate and coupon aggregators, FY26', '₹2.5 cr; 90-day repeat 5%', 'F']], calc: sliderCalc('L2') },
  L3: { src: ['Model', 'F', 'L'], used: [['Marketplace discount, FY26 typical month', '18% (Amazon and Flipkart)', 'F'], ['Amazon best-seller rank, Anvil', '#3 → #6', 'L']], calc: sliderCalc('L3') },
  L4a: { src: ['Model', 'B3', 'Calc'], used: [['Domestic WPC80 quote, Oct 2026', '₹1,024/kg', 'B3'], ['Imported WPC80, landed', '₹843/kg', 'B3'], ['Each ₹50/kg on WPC80', `about ₹47 per kg of product, ₹${num(wheySensitivity().crYear, { dp: 1 })} cr a year`, 'Calc']], caveat: 'Uncounted upside: L4a never enters the headline figure.' },
  L4b: { src: ['Model', 'B3'], used: [['Imported WPC80, landed with duty', '₹843/kg (Sep 2026)', 'B3'], ['Containers', '20 t, at least 2 per order', 'B3'], ['Lead time', '75 days; letter of credit at sight', 'B3'], ['Whey need a year', 'about 553 t of WPC80 (590 t × 0.9375)', 'Calc']],
    calc: (s) => [...sliderCalc('L4b')(s), { formula: 'cash = (need × 1,000 × ₹843 × share × 75 ÷ 365 + 20 t × 1,000 × ₹843) ÷ 1 crore', inputs: '30% and 50% of need', result: `${crore(importPipelineCr(0.3))} at 30%; ${crore(importPipelineCr(0.5))} at 50%` }] },
  L5: { src: ['Model', 'B1', 'C1'], used: [['Draft rate at 90 t a quarter or more', '₹104/kg', 'B1'], ['Today’s rate', '₹120/kg', 'B1'], ['Hold 92 t a quarter', '368 t a year', 'Model']], calc: () => { const y = plantXYear(PLAN.plantX.presets.hold92); return [{ formula: 'saving = 368 t × (₹120 − ₹104)', inputs: `${crore(y.atToday / 1e7, { dp: 2 })} − ${crore(y.draft / 1e7, { dp: 2 })}`, result: `${crore(-y.diff / 1e7, { dp: 2 })}, about +₹0.6 cr a year` }]; } },
  L6: { src: ['Model', 'J', 'G'], used: [['Flipkart weight-based handling fee on tubs', 'from 1 Apr 2025', 'J'], ['Fee-rate rise, FY24 → FY26', '5 points', 'A · G']] },
  L7: { src: ['Model', 'F'], used: [['Test 1, WhatsApp nudge (Jun 2026)', '10,000 COD orders offered ₹150 off: 38% switched, 12% cancelled, 50% stayed COD; ₹6 per message', 'F'], ['Test 2, prepaid-only checkout (Jul to Aug 2026)', '14 tier-3 clusters, 22% of D2C orders: orders fell 34%, RTO 29% → 4%', 'F'], ['RTO on shipped COD orders, FY26', '26%', 'F']], calc: sliderCalc('L7') },
  L8: { src: ['Model', 'C1', 'C2', 'H', 'D'], used: [['Made, FY26', '636 t', 'C1 · C2'], ['Sold, FY26', '590 t', 'D'], ['Destroyed, FY26', '9.4 t, about ₹1.2 cr', 'H · D']], calc: [{ formula: 'cash released = 28 t × ₹1,250 per kg', inputs: '28,000 kg × ₹1,250', result: crore(stockReleaseCr()) }] },
  L9: { src: ['Model', 'L', 'F'], used: [['Active Amazon listings, Q2 FY27', 'Anvil 6; Brand B 15; Brand C 12', 'L'], ['Anvil click share', '24% → 18%', 'F']] },
  Tests: { src: ['Model', 'B2'], used: [['Plant-tub run', '8 t at ₹800/kg', 'B2'], ['One sachet flavour', '5.6 lakh sachets at ₹46.7', 'B2']], calc: [{ formula: 'cash = plant-tub run + one sachet run', inputs: `${crore(plantTubRunCr(), { dp: 2 })} + ${crore(sachetRunCr(), { dp: 2 })}`, result: '₹0.6 cr + ₹2.6 cr' }] },
};
const items = {};
for (const l of LEVERS) {
  const e = EXTRA[l.id] || {};
  items[l.id] = { kind: 'lever', label: `${l.id} · ${l.short}`, search: `${l.id} ${l.short} ${l.stop}`, value: l.q4 === '0' || l.q4 === 'Not counted' || l.q4 === 'Not in the P&L' ? `${l.crYear} (₹ cr a year)` : `${l.q4} points of NR in Q4 FY27`, src: e.src || ['Model'], note: l.what,
    used: (s) => [...baseRows(l), ...(e.used || [])], calc: e.calc, caveat: e.caveat };
}
items['fy28-chart'] = {
  label: 'FY28 CM3 against marketing spend', search: 'fy28 marketing spend break-even', value: (s) => FY28_CASES.map((c) => `${caseTitle(c)} ${pts(fy28(c, s.fy28m).cm3)}`).join('; ') + ` at ${num(s.fy28m, { dp: 1 })}% marketing`, src: ['Model'],
  used: (s) => [['Marketing (what-if)', `${num(s.fy28m, { dp: 1 })}% of NR`, ''], ['FY28 NR, held flat', '₹129 cr', 'Model'], ...FY28_CASES.map((c) => [`CM2, ${caseTitle(c)}`, `${num(F.cm2[c], { dp: 1 })}% of NR`, 'Model'])],
  calc: (s) => [{ formula: 'cm3 = cm2 − marketing', inputs: `Central: ${num(F.cm2.central, { dp: 1 })} − ${num(s.fy28m, { dp: 1 })}`, result: pts(fy28('central', s.fy28m).cm3) }, { formula: 'cm3_cr = cm3 × 129 ÷ 100', inputs: `${num(fy28('central', s.fy28m).cm3, { dp: 1 })} × 1.29`, result: crore(fy28('central', s.fy28m).cm3Cr, { sign: true }) }, { formula: 'break-even marketing = cm2', inputs: 'CM3 is zero when marketing equals CM2', result: FY28_CASES.map((c) => `${caseTitle(c)} ${num(F.cm2[c], { dp: 1 })}%`).join(', ') }],
};
for (const c of FY28_CASES) {
  items[`fy28-${c}`] = { label: `FY28, ${caseTitle(c)} case`, value: (s) => `${pct(fy28(c, s.fy28m).cm3, { sign: true })} of NR (${crore(fy28(c, s.fy28m).cm3Cr, { sign: true })}) at ${num(s.fy28m, { dp: 1 })}% marketing`, src: ['Model'], note: F.buildUp[c],
    used: (s) => [['CM2', `${num(F.cm2[c], { dp: 1 })}% of NR`, 'Model'], ['Marketing (what-if)', `${num(s.fy28m, { dp: 1 })}% of NR`, ''], ['FY28 NR', '₹129 cr', 'Model'], ['Build-up', F.buildUp[c], 'Model']],
    calc: (s) => { const r = fy28(c, s.fy28m); return [{ formula: 'cm3 = cm2 − marketing', inputs: `${num(r.cm2, { dp: 1 })} − ${num(r.marketingPct, { dp: 1 })}`, result: pts(r.cm3) }, { formula: 'cm3_cr = cm3 × 129 ÷ 100', inputs: `${num(r.cm3, { dp: 2 })} × 129 ÷ 100`, result: crore(r.cm3Cr, { sign: true }) }]; },
    caveat: 'Case CM2 values are shown as given. The build-up is rounded and converts rupee items at ₹1.29 cr per point.' };
}
items.upside = { label: 'L4a upside, not counted', value: '+0.5 to +1.6 points of NR', src: ['Model', 'B3'], note: 'Drawn as a dashed band beyond the result; it never enters the headline figure.', used: [['Domestic quote, Oct 2026', '₹1,024/kg', 'B3'], ['Imported, landed', '₹843/kg', 'B3']] };
register('plan', items);

/* ---------- Pieces ---------- */
function headline(s) {
  const w = walk(s);
  const pos = w.value > 0 ? 'above' : w.value < 0 ? 'below' : 'at';
  return `At these settings, Q4 FY27 ${T('[[CM3]]')} lands at <span class="${w.value >= 0 ? 'pos' : 'neg'}">${count('plan-h', w.value, 'pct1s')}</span> of NR (${count('plan-hc', w.valueCr, 'cr1s')}), ${pos} break-even.${chip('q4-plan')}`;
}
function meaning(s) {
  const w = walk(s);
  const txt = w.low >= 0 ? 'Every setting clears break-even.' : w.high < 0 ? 'Even the favourable end misses break-even, so judge the plan on FY28.' : 'Break-even sits inside the plan range.';
  return `<span class="meaning-label">What this means</span> ${txt} <span class="muted">Plan range ${esc(pct(w.low, { sign: true }))} to ${esc(pct(w.high, { sign: true }))} of NR.</span>${chip('q4-plan')}`;
}

function walkFig(s) {
  const w = walk(s);
  const id = 'pl-walk';
  let run = w.M;
  const step = (key, label, v, extra = {}) => {
    const from = run;
    run += v;
    return { key, label, from, to: run, v, ...extra };
  };
  const steps = [
    { kind: 'start', label: 'Momentum', code: 'Momentum', from: 0, to: w.M, v: w.M, text: pts(w.M), item: 'momentum', aria: `Momentum: ${pts(w.M)} points of NR`, tip: { title: 'Momentum, no levers', value: `${pts(w.M)} points of NR (${num(w.M, { dp: 2 })})`, src: ['A', 'B3', 'D', 'Model'], formula: 'M = −10.0 − 4.13 − 0.23' } },
    step('L1', 'L1 Marketing', w.L1, { code: 'L1', name: 'Marketing', text: pts(w.L1), item: 'L1', aria: `L1 marketing: ${pts(w.L1)}, set by the branch`, tip: { title: 'L1 · Marketing back to 25% of NR', value: `${pts(w.L1)} (${branchTitle(s.branch)})`, src: ['Model'] } }),
    ...['L2', 'L3', 'L4b', 'L7'].map((k) => step(k, { L2: 'L2 D2C price', L3: 'L3 Marketplace price', L4b: 'L4b Imported whey', L7: 'L7 COD to prepaid' }[k], w[k], { code: k, name: { L2: 'D2C price', L3: 'Marketplace price', L4b: 'Imported whey', L7: 'COD to prepaid' }[k], min: R[k].min, max: R[k].max, text: stepValue(w[k]), item: k,
      aria: `${k}: what-if ${stepValue(w[k])}, range ${pts(R[k].min)} to ${pts(R[k].max)}`, tip: { title: R[k].label, value: `What-if ${stepValue(w[k])} points`, rows: [['Range', `${pts(R[k].min)} to ${pts(R[k].max)}`]], src: ['Model'] } })),
    step('B', 'Backstop', w.B, { code: 'Backstop', off: !s.backstop, potential: PLAN.q4.backstop.points, text: s.backstop ? pts(w.B) : 'Off', item: 'backstop', aria: s.backstop ? 'Backstop on: plus 3.5' : 'Backstop off; plus 3.5 when switched on', tip: { title: 'Backstop', value: s.backstop ? '+3.5 points (on)' : 'Off · +3.5 points when on', src: ['F', 'Model'] } }),
  ];
  const result = { value: w.value, low: w.low, high: w.high, text: pts(w.value), rangeText: `${pts(w.low)} to ${pts(w.high)}`, item: 'q4-plan', aria: `Q4 FY27 CM3: what-if ${pts(w.value)}; plan range ${pts(w.low)} to ${pts(w.high)}`,
    tip: { title: 'Q4 FY27 CM3', value: `What-if ${pct(w.value, { sign: true })} of NR · ${crore(w.valueCr, { sign: true })}`, rows: [['Plan range', `${pct(w.low, { sign: true })} to ${pct(w.high, { sign: true })}`]], src: ['Model'], formula: 'q4 = M + L1 + L2 + L3 + L4b + L7 + B' } };
  const upside = s.upside ? { low: PLAN.q4.upsideL4a[0], high: PLAN.q4.upsideL4a[1], text: '+0.5 to +1.6', item: 'upside', aria: 'L4a upside, not counted: plus 0.5 to plus 1.6', tip: { title: 'L4a upside, not counted', value: '+0.5 to +1.6 points beyond the result', src: ['Model', 'B3'] } } : null;
  const svg = walkChart({ id, w: widthOf(id, 760), steps, result, upside, title: 'Q4 FY27 CM3 walk, points of NR', desc: `From momentum ${pts(w.M)} through the levers to ${pts(w.value)} at these settings; plan range ${pts(w.low)} to ${pts(w.high)}. Solid bars are the current settings; hatched extensions are the rest of each lever’s range.` });
  const tbl = setTable(id, 'Q4 FY27 CM3 walk', ['Step', 'What-if, points of NR', 'Range', 'Running total'], [
    ['Momentum', num(w.M, { dp: 2, sign: true }), '', num(w.M, { dp: 2, sign: true })],
    ...steps.slice(1).map((st) => [st.label, st.off ? 'Off (+3.5 when on)' : stepValue(st.v), st.min !== undefined ? `${pts(st.min)} to ${pts(st.max)}` : '', num(st.to, { dp: 2, sign: true })]),
    ['Q4 FY27 CM3', pts(w.value), `${pts(w.low)} to ${pts(w.high)}`, ''],
    ...(s.upside ? [['L4a upside, not counted', '+0.5 to +1.6', '', '']] : []),
  ]);
  return chartFrame({ id, title: 'Q4 FY27 walk, points of NR', sub: `${branchTitle(s.branch)} · ${caseTitle(s.caseName)} · Backstop ${s.backstop ? 'on' : 'off'}`, item: 'q4-plan', svg, table: tbl,
    legend: `<p class="chart-legend"><span class="lg">Momentum (M) is Q4 FY26 CM3 less FY27 cost rises; B is the backstop.</span><span class="lg"><span class="lg-sw" style="background:var(--positive)"></span>Current setting (what-if)</span><span class="lg"><span class="lg-sw" style="background:var(--positive-fill);border:1px dashed var(--positive)"></span>Rest of the lever’s range</span><span class="lg"><span class="lg-band"></span>Plan range</span>${s.upside ? '<span class="lg"><span class="lg-sw" style="border:1.5px dashed var(--positive)"></span>Uncounted upside</span>' : ''}</p>`,
    note: `<span class="in-quarter">In the quarter: <b class="${w.value >= 0 ? 'pos' : 'neg'}">${count('plan-q', w.valueCr, 'cr1s')}</b>, on NR of about ₹33 cr. ${chip('q4-plan')}</span>` });
}

function leverControls(s) {
  const w = walk(s);
  const ctl = (k) => {
    const r = R[k];
    return `<div class="ctl">
      <div class="ctl-head"><span class="ctl-name" id="lv-${k}">${esc(r.label)}</span><span class="ctl-value pos"><span class="whatif">What-if</span>${count(`lv-${k}`, w[k], 'step')}</span></div>
      ${slider({ bind: `sliders.${k}`, min: r.min, max: r.max, step: PLAN.q4.step, value: w[k], labelId: `lv-${k}`, valueText: `${stepValue(w[k])} points of NR; range ${pts(r.min)} to ${pts(r.max)}` })}
      <div class="ctl-range"><span>${esc(pts(r.min))}</span><span>Range ${esc(pts(r.min))} to ${esc(pts(r.max))}</span><span>${esc(pts(r.max))}</span></div>
      <p class="ctl-desc">${T(r.desc.replace('COD to prepaid', '[[COD]] to prepaid').replace('tier-3 RTOs', 'tier-3 [[RTO|RTOs]]'))} ${chip(k)}</p>
    </div>`;
  };
  return `<div class="card">
    <div class="ctl l1-ro"><div class="ctl-head"><span class="ctl-name">L1 · Marketing back to 25% of NR</span><span class="ctl-value pos">${esc(pts(w.L1))}</span></div>
      <p class="ctl-desc">Set by the branch, not a slider: ${esc(PLAN.q4.l1Basis[s.branch])} (${esc(branchTitle(s.branch))}). ${chip('L1')}</p></div>
    ${['L2', 'L3', 'L4b', 'L7'].map(ctl).join('')}
    <div class="ctl sc-switch" style="display:flex"><div><div class="ctl-name" id="lv-up">Show uncounted upside</div><p class="ctl-desc" id="lv-up-d">Draws L4a, repricing domestic whey (+0.5 to +1.6), as a dashed band. It never enters the headline. ${chip('L4a')}</p></div>${switchCtl({ bind: 'upside', checked: s.upside, labelId: 'lv-up', describedBy: 'lv-up-d' })}</div>
  </div>`;
}

function leverTable(s) {
  const w = walk(s);
  const q4cell = (l) => {
    if (l.id === 'L1') return `<b class="pos">${esc(pts(w.L1))}</b><div class="muted small">${esc(l.q4)}</div>`;
    if (R[l.id]) return `${esc(l.q4)}<div class="muted small">what-if ${esc(stepValue(w[l.id]))}</div>`;
    return esc(l.q4);
  };
  const rows = LEVERS.map((l) => {
    const t = trackerRow(l.id);
    return `<tr class="row-link" data-item="${l.id}" tabindex="0" aria-label="${esc(`${l.id}, ${l.short}. Open working`)}">
      <th scope="row" data-label="Lever"><span class="nowrap"><b>${esc(l.id)}</b></span></th>
      <td data-label="What it does" class="wrap">${esc(l.what)}</td>
      <td data-label="₹ cr a year" class="wrap">${esc(l.crYear)}</td>
      <td data-label="Q4 FY27 effect, points">${q4cell(l)}</td>
      <td data-label="Starts">${esc(l.starts)}</td>
      <td data-label="Cash">${esc(l.cash)}</td>
      <td data-label="Stop rule" class="wrap">${esc(l.stop)}</td>
      <td data-label="Status">${statusChip(t ? t.status : 'Not started')}${chip(l.id)}</td>
    </tr>`;
  }).join('');
  return `<div class="card"><div class="tbl-wrap"><table class="tbl stack lever-tbl"><caption class="sr-only">Levers L1 to L9 and the tests</caption>
  <thead><tr><th scope="col">Lever</th><th scope="col">What it does</th><th scope="col">₹ cr a year</th><th scope="col">Q4 FY27 effect, points of NR</th><th scope="col">Starts</th><th scope="col">Cash</th><th scope="col">Stop rule</th><th scope="col">Status</th></tr></thead>
  <tbody>${rows}</tbody></table></div><p class="tbl-note">Status comes from the tracker on Roadmap and tracker. Click a row for its working.</p></div>`;
}

function fy28Fig(s) {
  const m = s.fy28m;
  const id = 'pl-fy28';
  const cls = (c) => (c === s.fy28Case ? 'ln-acc' : c === 'momentum' ? 'ln-3' : 'ln-2');
  const series = FY28_CASES.map((c) => ({ key: c, label: caseTitle(c), endLabel: `${caseTitle(c)}${c === s.fy28Case ? ' (selected)' : ''}`, cls: cls(c), dash: c === 'momentum', marker: 'none', noMarks: true,
    pts: [{ x: 20, y: F.cm2[c] - 20 }, { x: 35, y: F.cm2[c] - 35 }] }));
  const markers = FY28_CASES.map((c) => {
    const r = fy28(c, m);
    return { key: `${c}-m`, label: caseTitle(c), endLabel: '', cls: r.cm3 >= 0 ? 'ln-pos' : 'ln-neg', noLine: true, marker: 'filled', r: c === s.fy28Case ? 6 : 4.5,
      pts: [{ x: m, y: r.cm3, xLabel: `${num(m, { dp: 1 })}% marketing`, text: `${pct(r.cm3, { sign: true })} of NR`, label: pts(r.cm3), anchor: 'start', dx: 9, dy: 4, labelCls: r.cm3 >= 0 ? 'pos' : 'neg', item: `fy28-${c}`,
        tip: { title: `${caseTitle(c)} at ${num(m, { dp: 1 })}% marketing (what-if)`, value: `${pct(r.cm3, { sign: true })} of NR · ${crore(r.cm3Cr, { sign: true })}`, rows: [['CM2', `${num(r.cm2, { dp: 1 })}%`], ['Break-even marketing', `${num(r.cm2, { dp: 1 })}%`]], src: ['Model'], formula: 'cm3 = cm2 − marketing' } }] };
  });
  const svg = lineChart({ id, w: widthOf(id, 1100), h: 300, title: 'FY28 CM3 against marketing spend', desc: `CM3 as % of NR for four cases as marketing runs from 20% to 35% of NR. At ${num(m, { dp: 1 })}%: ${FY28_CASES.map((c) => `${caseTitle(c)} ${pts(fy28(c, m).cm3)}`).join(', ')}.`,
    xDomain: [20, 35], xTicks: [20, 22.5, 25, 27.5, 30, 32.5, 35].map((v) => ({ v, label: `${num(v, { dp: v % 1 ? 1 : 0 })}%` })), yDomain: [-15, 12], yTicks: [-15, -10, -5, 0, 5, 10], yFmt: (v) => `${num(v, { sign: true })}%`, zero: true, zeroLabel: 'Break-even',
    series: [...series, ...markers], vlines: [{ x: 25, label: 'Plan 25%', dy: 4 }, { x: 28, label: '28%', dy: 4 }, { x: 30.5, label: 'FY26 actual 30.5%', dy: 4 }, { x: m, cls: 'acc', label: '' }], m: { l: 48, t: 24 } });
  const tbl = setTable(id, 'FY28 CM3 against marketing spend', ['Case', 'CM2 %', `CM3 % at ${num(m, { dp: 1 })}%`, `CM3 ₹ cr at ${num(m, { dp: 1 })}%`, 'CM3 % at 25%', 'CM3 % at 28%', 'Break-even marketing %'],
    FY28_CASES.map((c) => [caseTitle(c), num(F.cm2[c], { dp: 1 }), pts(fy28(c, m).cm3), num(fy28(c, m).cm3Cr, { dp: 1, sign: true }), pts(fy28(c, 25).cm3), pts(fy28(c, 28).cm3), num(F.cm2[c], { dp: 1 })]));
  const readouts = FY28_CASES.map((c) => {
    const r = fy28(c, m);
    return `<div class="ro${c === s.fy28Case ? ' selected' : ''}"><div class="ro-name"><span>${esc(caseTitle(c))}${c === s.fy28Case ? ' <span class="muted small">selected</span>' : ''}</span>${chip(`fy28-${c}`)}</div>
      <div class="ro-v ${r.cm3 >= 0 ? 'pos' : 'neg'}">${count(`ro-${c}`, r.cm3, 'pct1s')} <span class="muted small">${count(`ro-cr-${c}`, r.cm3Cr, 'cr1s')}</span></div>
      <div class="ro-sub">CM2 ${num(r.cm2, { dp: 1 })}% of NR. Stays at or above zero while marketing is at or below ${num(r.cm2, { dp: 1 })}% of NR.</div></div>`;
  }).join('');
  return `<div class="card">
    <div class="ctl" style="padding-top:0;border-bottom:0">
      <div class="ctl-head"><span class="ctl-name" id="fy28-m">Marketing, % of NR in FY28</span><span class="ctl-value"><span class="whatif">What-if</span>${count('fy28-m', m, 'pct1')}</span></div>
      <div class="fy28-slider">${slider({ bind: 'fy28m', min: F.marketing.min, max: F.marketing.max, step: F.marketing.step, value: m, labelId: 'fy28-m', valueText: `${num(m, { dp: 1 })}% of NR`, bigStep: 5, ticks: F.marketing.ticks })}
      <div class="ctl-range"><span>20%</span><span>Ticks: 25% plan · 28% · 30.5% FY26 actual ${chip('fy28-chart')}</span><span>35%</span></div></div>
    </div>
    ${chartFrame({ id, title: 'CM3 as % of NR, by case', sub: `One line per case; the selected case (${caseTitle(s.fy28Case)}) follows the Case control. FY28 NR held flat at ₹129 cr.`, item: 'fy28-chart', svg, table: tbl })}
    <div class="fy28-readouts">${readouts}</div>
  </div>`;
}

export default {
  id: 'plan',
  title: 'Plan simulator',
  tab: 'Plan',
  group: 'Deliver',
  icon: 'sliders-horizontal',
  keywords: 'simulator levers walk sliders fy28 marketing break-even what-if',
  render(s) {
    return `<header class="screen-head"><h1 class="headline" tabindex="-1" data-region="headline"></h1><p class="meaning" data-region="meaning"></p></header>
${section({ id: 'pl-ctl-s', title: 'Scenario', sub: 'These are the same controls as the scenario chip in the top bar; every screen follows them.', body: '<div class="card" data-region="controls"></div>' })}
<div class="split split-8-4">
  ${section({ id: 'pl-walk-s', title: 'Q4 FY27 walk', body: '<div data-region="walk"></div>' })}
  ${section({ id: 'pl-lev-s', title: 'Lever settings', sub: 'Each slider is a what-if; its full range stays in view.', body: '<div data-region="levers"></div>' })}
</div>
${section({ id: 'pl-table-s', title: 'Every lever', sub: T('L1 to L9 and the tests, with their stop rules. [[RTD]], [[COD]] and [[RTO]] are explained in the glossary.'), body: '<div data-region="table"></div>' })}
${section({ id: 'pl-fy28-s', title: 'FY28 CM3 against marketing spend', sub: 'The two-year test: a positive full year.', body: '<div data-region="fy28"></div>' })}`;
  },
  region(key, s) {
    switch (key) {
      case 'headline': return headline(s);
      case 'meaning': return meaning(s);
      case 'controls': return scenarioControls(s, { idp: 'plan', full: true });
      case 'walk': return walkFig(s);
      case 'levers': return leverControls(s);
      case 'table': return leverTable(s);
      case 'fy28': return fy28Fig(s);
      default: return null;
    }
  },
  live(s) {
    const w = walk(s);
    return `At these settings Q4 FY27 CM3 lands at ${pct(w.value, { sign: true })} of NR, ${w.value >= 0 ? 'at or above' : 'below'} break-even.`;
  },
};

