// 4.1 Overview: the answer on one screen.
import { PNL, FY26_QUARTERS, NEXT_DECISIONS, PLAN } from '../../data.js';
import { q4Band, fy28 } from '../../model.js';
import { pct, pts, crore, num, fmtDate, countdown, todayISO, stepValue } from '../../format.js';
import { chip, T, section, screenHead, chartFrame, count, icon, esc, statusChip } from '../components.js';
import { pathChart, whyFellChart, miniRange, widthOf, setTable } from '../charts.js';
import { register } from '../registry.js';
import { walk, caseTitle, branchTitle } from '../scenario.js';
import { trackerRow } from '../../state.js';

register('overview', {
  'ov-swing': {
    label: 'CM3 change, FY24 to FY26',
    search: 'cm3 fell 19.5 swing',
    value: '−₹19.5 cr',
    src: ['BP', 'Calc'],
    used: [['CM3, FY24', '+₹12.7 cr (13.1% of NR)', 'BP'], ['CM3, FY26', '−₹6.8 cr (−5.3% of NR)', 'BP']],
    calc: [{ formula: 'change = CM3 FY26 − CM3 FY24', inputs: '−6.8 − 12.7', result: '−₹19.5 cr' }],
  },
  'cm3-by-year': {
    label: 'CM3, FY24 to FY26',
    search: 'cm3 fy24 fy25 fy26 board pack exhibit',
    value: '+₹12.7 cr (13.1%) in FY24 to −₹6.8 cr (−5.3%) in FY26',
    src: ['BP'],
    used: PNL.years.map((y, i) => [`CM3, ${y}`, `${crore(PNL.cm3Cr.values[i], { sign: true })} · ${pct(PNL.cm3Pct.values[i], { sign: true })} of NR`, 'BP']).concat(
      PNL.years.map((y, i) => [`CM2, ${y}`, `${num(PNL.cm2Pct.values[i], { dp: 1 })}% of NR`, 'BP'])),
  },
  'ov-cm3-fy26': {
    label: 'CM3, FY26',
    value: '−₹6.8 cr · −5.3% of NR',
    src: ['BP'],
    used: [['CM3, FY24', '+₹12.7 cr · 13.1% of NR', 'BP'], ['CM3, FY25', '+₹5.0 cr · 4.2% of NR', 'BP'], ['CM3, FY26', '−₹6.8 cr · −5.3% of NR', 'BP'], ['NR, FY26', '₹128.7 cr', 'A']],
  },
  'fy26-quarters': {
    label: 'CM3 by quarter, FY26',
    search: 'quarter q1 q2 q3 q4 fy26 slide',
    value: '0%, −3%, −7%, −10% of NR',
    src: ['A'],
    used: FY26_QUARTERS.labels.map((l, i) => [l, `CM3 ${pct(FY26_QUARTERS.cm3Pct[i], { dp: 0 })} of NR · NR ₹${num(FY26_QUARTERS.nr[i], { dp: 1 })} cr`, 'A']),
    note: 'CM3 got worse every quarter of FY26. The festive quarter (Q3) did better than Q4.',
  },
  'ov-q4fy26': {
    label: 'CM3, Q4 FY26',
    value: '−10% of NR, on NR of ₹34.9 cr',
    src: ['A'],
    used: FY26_QUARTERS.labels.map((l, i) => [l, `CM3 ${pct(FY26_QUARTERS.cm3Pct[i], { dp: 0 })} of NR · NR ₹${num(FY26_QUARTERS.nr[i], { dp: 1 })} cr`, 'A']),
  },
  'unknown-test': {
    label: 'The one unknown',
    search: 'branch unknown marketing step-up costs inside cm2',
    value: (s) => {
      const a = q4Band('mkt', s.backstop);
      const b = q4Band('cm2', s.backstop);
      return `Marketing step-up ${pct(a.low, { sign: true })} to ${pct(a.high, { sign: true })}; Costs inside CM2 ${pct(b.low, { sign: true })} to ${pct(b.high, { sign: true })} (backstop ${s.backstop ? 'on' : 'off'})`;
    },
    src: ['Model', 'A', 'F'],
    used: (s) => ['mkt', 'cm2'].flatMap((br) => {
      const b = q4Band(br, s.backstop);
      return [[`${branchTitle(br)}: plan band`, `${pct(b.low, { sign: true })} to ${pct(b.high, { sign: true })} (${crore(b.lowCr, { sign: true })} to ${crore(b.highCr, { sign: true })})`, 'Model'], [`${branchTitle(br)}: central point`, pct(b.central, { sign: true }), 'Model']];
    }),
    note: 'If Q4 FY26 marketing was 31% of NR or less, switch to Costs inside CM2. The data that settles it is due 15 Nov 2026.',
    caveat: 'The marketing step-up is inferred: discounts were flat across FY26 and CM2 held near 25.2%.',
  },
});

const DECISION_ITEMS = {};
NEXT_DECISIONS.forEach((d) => { DECISION_ITEMS[d.date] = `dec-${d.date}`; });

function kpis(s) {
  const w = walk(s);
  const lo = fy28('cautious', 25);
  const hi = fy28('favourable', 25);
  const okNow = w.value >= 0;
  return `
<div class="kpi card">
  <div class="label">CM3, FY26</div>
  <div class="kpi-value neg">−₹6.8 cr</div>
  <div class="kpi-sub"><span>−5.3% of NR · +₹12.7 cr in FY24</span>${chip('ov-cm3-fy26')}</div>
</div>
<div class="kpi card">
  <div class="label">CM3, Q4 FY26</div>
  <div class="kpi-value neg">−10% <span class="kpi-unit">of NR</span></div>
  <div class="kpi-sub"><span>on NR of ₹34.9 cr</span>${chip('ov-q4fy26')}</div>
</div>
<div class="kpi card">
  <div class="label">CM3, Q4 FY27 plan</div>
  <div class="kpi-value kpi-range">${esc(pts(w.low))} <span class="kpi-to">to</span> ${esc(pts(w.high))}<span class="kpi-unit">%</span></div>
  <div class="kpi-mini" data-chart-box="kpi-mini">${miniRange({ w: widthOf('kpi-mini', 200), low: w.low, high: w.high, value: w.value })}</div>
  <div class="kpi-sub"><span>What-if at these settings: <b class="${okNow ? 'pos' : 'neg'}">${count('kpi-q4', w.value, 'pct1s')}</b> of NR</span>${chip('q4-plan')}</div>
</div>
<div class="kpi card">
  <div class="label">CM3, FY28 at 25% marketing</div>
  <div class="kpi-value kpi-range pos">${esc(pts(lo.cm3))} <span class="kpi-to">to</span> ${esc(pts(hi.cm3))}<span class="kpi-unit">%</span></div>
  <div class="kpi-sub"><span>${esc(crore(lo.cm3Cr, { sign: true }))} to ${esc(crore(hi.cm3Cr, { sign: true }))}, cautious to favourable</span>${chip('fy28-range')}</div>
</div>`;
}

function hero(s) {
  const w = walk(s);
  const fyCase = s.fy28Case;
  const f = fy28(fyCase, 25);
  const lo = fy28('cautious', 25);
  const hi = fy28('favourable', 25);
  const actual = [
    { slot: 'FY24', label: 'FY24 full year', v: 13.1, text: '+13.1', full: true, item: 'cm3-by-year', tip: { title: 'FY24, full year', value: '+13.1% of NR (+₹12.7 cr)', src: ['BP'] } },
    { slot: 'FY25', label: 'FY25 full year', v: 4.2, text: '+4.2', full: true, item: 'cm3-by-year', tip: { title: 'FY25, full year', value: '+4.2% of NR (+₹5.0 cr)', src: ['BP'] } },
    ...FY26_QUARTERS.cm3Pct.map((v, i) => ({ slot: `Q${i + 1} FY26`, label: FY26_QUARTERS.labels[i], v, text: num(v, { sign: true }), item: 'fy26-quarters', tip: { title: FY26_QUARTERS.labels[i], value: `${pct(v, { dp: 0, sign: true })} of NR`, rows: [['NR', `₹${num(FY26_QUARTERS.nr[i], { dp: 1 })} cr`]], src: ['A'] } })),
  ];
  const range = `${pts(w.low)} to ${pts(w.high)}`;
  const id = 'ov-path';
  const svg = pathChart({
    id, w: widthOf(id, 1000), title: 'The path back to zero', desc: `CM3 as a share of net revenue: FY24 +13.1%, FY25 +4.2%, FY26 quarters 0, −3, −7 and −10%. Q1 to Q3 FY27 are not in the records yet. Q4 FY27 plan ${range}%; FY28 at 25% marketing ${pts(lo.cm3)} to ${pts(hi.cm3)}%.`,
    actual,
    q4: { low: w.low, high: w.high, value: w.value, rangeText: range, valueText: pts(w.value), item: 'q4-plan', tip: { title: 'Q4 FY27 plan', value: `${pct(w.low, { sign: true })} to ${pct(w.high, { sign: true })} of NR`, rows: [['At these settings (what-if)', `${pct(w.value, { sign: true })} · ${crore(w.valueCr, { sign: true })}`], ['Branch', branchTitle(s.branch)], ['Backstop', s.backstop ? 'On' : 'Off']], src: ['Model'], formula: 'q4 = M + L1 + L2 + L3 + L4b + L7 + B' } },
    fy28: { low: lo.cm3, high: hi.cm3, value: f.cm3, rangeText: `${pts(lo.cm3)} to ${pts(hi.cm3)}`, valueText: pts(f.cm3), caseLabel: caseTitle(fyCase), item: 'fy28-range', tip: { title: 'FY28 full year at 25% marketing', value: `${pct(lo.cm3, { sign: true })} to ${pct(hi.cm3, { sign: true })} of NR`, rows: [[`${caseTitle(fyCase)} case`, `${pct(f.cm3, { sign: true })} · ${crore(f.cm3Cr, { sign: true })}`]], src: ['Model'], formula: 'cm3 = cm2 − marketing' } },
  });
  const tbl = setTable(id, 'The path back to zero', ['Period', 'CM3, % of NR', 'Kind', 'Source'], [
    ['FY24', '+13.1', 'Full year, actual', 'BP'], ['FY25', '+4.2', 'Full year, actual', 'BP'],
    ...FY26_QUARTERS.labels.map((l, i) => [l, num(FY26_QUARTERS.cm3Pct[i], { sign: true }), 'Quarter, actual', 'A']),
    ['Q1 to Q3 FY27', 'Not in the records yet', 'Quarter', '—'],
    ['Q4 FY27', `${range} (at these settings ${pts(w.value)})`, 'Quarter, plan range', 'Model'],
    ['FY28', `${pts(lo.cm3)} to ${pts(hi.cm3)} (${caseTitle(fyCase)} ${pts(f.cm3)})`, 'Full year, plan at 25% marketing', 'Model'],
  ]);
  return chartFrame({
    id, title: 'CM3 as % of NR, actual and plan', item: 'q4-plan', svg, table: tbl,
    legend: `<p class="chart-legend"><span class="lg"><span class="lg-dot hollow"></span>Full year</span><span class="lg"><span class="lg-dot"></span>Quarter</span><span class="lg"><span class="lg-band"></span>Plan range, ${esc(branchTitle(s.branch))}, backstop ${s.backstop ? 'on' : 'off'}</span><span class="lg">Dots on the plan bars are what-ifs at these settings</span></p>`,
  });
}

function whyFell() {
  const id = 'ov-why';
  const groups = [
    { label: 'Cost never priced through', v: -13.7, valueText: '−₹13.7 cr', item: 'bridge-cost', tip: { title: 'Cost never priced through', value: '−₹13.7 cr', src: ['D', 'C1', 'C2', 'A', 'G'] },
      parts: [
        { label: 'Whey', short: 'Whey', v: -7.7, text: '−7.7', item: 'bridge-whey', tip: { title: 'Whey', value: '−₹7.7 cr', src: ['D'], formula: '(₹870 − ₹740) per kg × 590 t' } },
        { label: 'Marketplace fee rates', short: 'Fee rates', v: -4.8, text: '−4.8', item: 'bridge-fees', tip: { title: 'Marketplace fee rates', value: '−₹4.8 cr', src: ['A', 'G'], formula: '5 points × ₹96.9 cr of marketplace NR' } },
        { label: 'Conversion, flavour and pack', short: 'Conversion', v: -1.2, text: '−1.2', item: 'bridge-conversion', tip: { title: 'Conversion, flavour and pack', value: '−₹1.2 cr', src: ['C1', 'C2', 'D'], formula: '+₹20/kg × 590 t' } },
      ],
      sub: 'Whey −7.7 · Marketplace fee rates −4.8 · Conversion, flavour and pack −1.2' },
    { label: 'Net cost of growth', v: -6.0, valueText: '−₹6.0 cr', item: 'bridge-growth', tip: { title: 'Net cost of growth', value: '−₹6.0 cr (−5.9 before rounding)', rows: [['Volume and mix', '+14.4'], ['Price and discounts', '−10.0'], ['Marketing', '−10.4']], src: ['D', 'H', 'F', 'Calc'] },
      sub: 'Volume and mix +14.4 · Price and discounts −10.0 · Marketing −10.4' },
    { label: 'Logistics and rounding', v: 0.2, valueText: '+₹0.2 cr', item: 'bridge-other', tip: { title: 'Logistics and rounding', value: '+₹0.2 cr', rows: [['Logistics', '+0.1'], ['Rounding', '+0.1']], src: ['H', 'F', 'Calc'] },
      sub: 'Logistics +0.1 · Rounding +0.1' },
  ];
  const svg = whyFellChart({ id, w: widthOf(id, 600), groups, title: 'Why CM3 fell', desc: 'Three bars that add to minus ₹19.5 crore: cost never priced through minus 13.7, net cost of growth minus 6.0, logistics and rounding plus 0.2.' });
  const tbl = setTable(id, 'Why CM3 fell', ['Group', 'Item', '₹ cr', 'Source'], [
    ['Cost never priced through', 'Whey', '−7.7', 'D'], ['Cost never priced through', 'Marketplace fee rates', '−4.8', 'A, G'], ['Cost never priced through', 'Conversion, flavour and pack', '−1.2', 'C1, C2, D'],
    ['Net cost of growth', 'Volume and mix', '+14.4', 'D, H, F, Calc'], ['Net cost of growth', 'Price and discounts', '−10.0', 'F, Calc'], ['Net cost of growth', 'Marketing', '−10.4', 'F'],
    ['Logistics and rounding', 'Logistics', '+0.1', 'H, F'], ['Logistics and rounding', 'Rounding', '+0.1', 'Calc'], ['Total', '', '−19.5', 'BP'],
  ]);
  return chartFrame({ id, title: 'Three bars that add to −₹19.5 cr', sub: '₹ cr ex-GST, FY24 to FY26', item: 'ov-swing', svg, table: tbl, note: `<span class="total-line-text">Total <b class="neg">−₹19.5 cr</b> ${chip('ov-swing')}</span> <a class="link" href="#/diagnosis">See the full bridge ${icon('arrow-right', { size: 16 })}</a>` });
}

function planLevers(s) {
  const w = walk(s);
  const r = PLAN.q4.sliders;
  const rows = [
    { name: 'Momentum, no levers', range: pts(w.M), now: null, item: 'momentum', tone: 'neg' },
    { name: 'L1 · Marketing back to 25% of NR', range: pts(w.L1), now: null, note: s.branch === 'cm2' ? '+5.3 on the CM2 branch (+10.0 on the marketing branch)' : '+10.0 on the marketing branch (+5.3 on the CM2 branch)', item: 'L1', tone: 'pos' },
    { name: 'L2 and L3 · Price', range: `${pts(r.L2.min + r.L3.min)} to ${pts(r.L2.max + r.L3.max)}`, now: w.L2 + w.L3, item: 'L2', tone: 'pos' },
    { name: 'L4b · Imported whey', range: `0 to ${pts(r.L4b.max)}`, now: w.L4b, item: 'L4b', tone: 'pos' },
    { name: 'L7 · COD to prepaid', range: `0 to ${pts(r.L7.max)}`, now: w.L7, item: 'L7', tone: 'pos' },
    { name: 'Backstop', range: s.backstop ? '+3.5' : 'Off', now: null, note: s.backstop ? 'Pause half of D2C paid prospecting' : '+3.5 when switched on', item: 'backstop', tone: s.backstop ? 'pos' : 'neu' },
  ];
  const ok = w.value >= 0;
  return `<ul class="lever-list" role="list">${rows.map((x) => `<li class="lever-row">
    <div class="lr-main"><span class="lr-name">${esc(x.name)}</span>${x.note ? `<span class="lr-note">${esc(x.note)}</span>` : ''}</div>
    <div class="lr-val"><b class="${x.tone}">${esc(x.range)}</b>${x.now !== null ? `<span class="lr-now">what-if ${esc(stepValue(x.now))}</span>` : ''}</div>${chip(x.item)}
  </li>`).join('')}
  <li class="lever-row lr-total"><div class="lr-main"><span class="lr-name">Q4 FY27 CM3, points of NR</span><span class="lr-note">${esc(branchTitle(s.branch))} · ${esc(caseTitle(s.caseName))}</span></div>
    <div class="lr-val"><b>${esc(pts(w.low))} to ${esc(pts(w.high))}</b><span class="lr-now ${ok ? 'pos' : 'neg'}">what-if ${count('ov-lever-total', w.value, 'pts1')}</span></div>${chip('q4-plan')}</li></ul>
  <p class="card-foot"><a class="link" href="#/plan">Open the simulator ${icon('arrow-right', { size: 16 })}</a></p>`;
}

function decisions() {
  const today = todayISO();
  return `<ol class="decisions" role="list">${NEXT_DECISIONS.map((d) => {
    const c = countdown(d.date, today);
    const row = trackerRow(d.tracker);
    let state;
    if (c.past) state = row && row.status === 'Done' ? statusChip('Done') : statusChip('Overdue');
    else state = `<span class="countdown ${c.n <= 14 ? 'soon' : ''}">${icon('clock', { size: 16 })}<span>${esc(c.text)}</span></span>`;
    return `<li class="decision card${c.past ? ' past' : ''}"><div class="dec-date"><span class="dec-day">${esc(fmtDate(d.date))}</span>${chip(DECISION_ITEMS[d.date])}</div><p class="dec-label">${T(d.label.replace('P&L', 'P&L'))}</p><div class="dec-state">${state}</div></li>`;
  }).join('')}</ol>`;
}

function unknown(s) {
  const a = q4Band('mkt', s.backstop);
  const b = q4Band('cm2', s.backstop);
  const col = (br, band, desc) => {
    const on = s.branch === br;
    return `<div class="unk-col${on ? ' selected' : ''}">
      <div class="unk-head"><span class="label">${on ? 'Selected branch' : 'Other branch'}</span><h3 class="unk-title">${esc(branchTitle(br))}</h3></div>
      <p class="unk-desc">${T(desc)} ${chip('l1-value')}</p>
      <div class="unk-band"><span class="muted">Q4 FY27 CM3</span> <b class="${band.high < 0 ? 'neg' : band.low >= 0 ? 'pos' : ''}">${esc(pct(band.low, { sign: true }))} to ${esc(pct(band.high, { sign: true }))}</b> <span class="muted">of NR · backstop ${s.backstop ? 'on' : 'off'}</span> ${chip('unknown-test')}</div>
    </div>`;
  };
  return `<div class="unknown card">
    <div class="unk-cols">
      ${col('mkt', a, 'Q4 FY26 marketing stepped up from about 25% to 35% of [[NR]], so L1 is worth +10.0 points. Inferred, not recorded.')}
      ${col('cm2', b, 'The slide sat inside [[CM2]], so bringing marketing to 25.2% is worth only +5.3 points.')}
    </div>
    <div class="unk-test"><div><span class="label">The test that decides it</span><p>${T('If Q4 FY26 marketing was 31% of NR or less, switch to Costs inside CM2. FY26 marketing by quarter and the H1 FY27 P&L by channel are due 15 Nov 2026.')} ${chip('branch-test')}</p></div>
    <button type="button" class="btn btn-primary" data-action="switch-branch">${icon('split', { size: 18 })}<span>Switch to ${esc(branchTitle(s.branch === 'cm2' ? 'mkt' : 'cm2'))}</span></button></div>
  </div>`;
}

export default {
  id: 'overview',
  title: 'Overview',
  tab: 'Overview',
  group: 'Understand',
  icon: 'layout-dashboard',
  keywords: 'answer summary kpi home',
  render() {
    return `${screenHead({
      headline: `${T('[[CM3|CM3]] fell ₹19.5 cr')}${chip('ov-swing')} ${T('in two years. The plan targets break-even in Q4 FY27 and a positive FY28.')}`,
      meaning: `One unknown decides Q4 FY27: whether the FY26 slide came from marketing. The data that settles it is due 15 Nov.${chip('branch-test')}`,
    })}
<p class="glossline">${T('[[CM3]] is contribution margin 3: what Anvil keeps after paying for its product, its deliveries and its customers. [[NR]] is net revenue. [[FY]] runs April to March.')}</p>
<div class="kpi-row" data-region="kpis"></div>
${section({ id: 'ov-path-s', title: 'The path back to zero', body: '<div data-region="hero"></div>' })}
<div class="split split-7-5">
  ${section({ id: 'ov-why-s', title: 'Why CM3 fell', body: '<div data-region="why"></div>' })}
  ${section({ id: 'ov-plan-s', title: 'What the plan does in Q4 FY27', sub: 'Effect in points of NR for the selected branch. Slider positions are what-ifs; ranges stay in view.', body: '<div class="card" data-region="levers"></div>' })}
</div>
${section({ id: 'ov-next-s', title: 'Next decisions', sub: 'Counted from today’s date in India.', body: '<div data-region="decisions"></div>' })}
${section({ id: 'ov-unknown-s', title: 'The one unknown', body: '<div data-region="unknown"></div>' })}`;
  },
  region(key, s) {
    switch (key) {
      case 'kpis': return kpis(s);
      case 'hero': return hero(s);
      case 'why': return whyFell();
      case 'levers': return planLevers(s);
      case 'decisions': return decisions();
      case 'unknown': return unknown(s);
      default: return null;
    }
  },
  live(s) {
    const w = walk(s);
    return `Q4 FY27 plan ${pct(w.low, { sign: true })} to ${pct(w.high, { sign: true })} of NR.`;
  },
};
