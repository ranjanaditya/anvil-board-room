// 4.7 Cash and guardrails: working capital against the ₹10 cr and ₹16 cr caps.
import { PLAN } from '../../data.js';
import { cashAt, cashFix, importPipelineCr, gstBuildCr, sachetRunCr, plantTubRunCr, stockReleaseCr, wheyNeedT } from '../../model.js';
import { num, crore } from '../../format.js';
import { chip, T, section, chartFrame, esc, icon, slider, switchCtl, segmented, count } from '../components.js';
import { bulletChart, widthOf, setTable } from '../charts.js';
import { register } from '../registry.js';

const P = PLAN.cash;
const DATES = { mar27: { label: 'Mar 2027', sachets: 'sachets27' }, mar28: { label: 'Mar 2028', sachets: 'sachets28' } };
const settingsFor = (s, date) => ({ share: s.cash.share, gstRate: s.cash.gstRate, plantTub: s.cash.plantTub, release: s.cash.release, sachets: s.cash[DATES[date].sachets] });
const resultFor = (s, date) => cashAt({ date, ...settingsFor(s, date) });
const c1 = (x) => crore(x);

const items = {
  'cash-caps': { label: 'Working-capital guardrails', search: 'guardrail cap 10 16 working capital', value: 'Up by no more than ₹10 cr until Mar 2027 and ₹16 cr until Mar 2028', src: ['A', 'Model'], note: 'Counted as the rise in working capital from 1 Nov 2026.', used: [['Cap to Mar 2027', '₹10 cr', 'A'], ['Cap to Mar 2028', '₹16 cr', 'A']] },
  'cash-import': { label: 'Import whey pipeline', search: 'import whey cash pipeline letter of credit', value: (s) => `${c1(importPipelineCr(s.cash.share))} at ${Math.round(s.cash.share * 100)}% of whey need`, src: ['B3', 'Model'],
    used: [['Tonnes sold a year', '590 t', 'D'], ['WPC80 per kg of product', '0.9375', 'Calc'], ['Whey need a year', `about ${num(wheyNeedT())} t of WPC80`, 'Calc'], ['Imported, landed with duty', '₹843/kg', 'B3'], ['Lead time', '75 days; letter of credit paid at sight', 'B3'], ['Buffer', 'one 20 t container', 'B3']],
    calc: (s) => [{ formula: 'import = (need × 1,000 × 843 × share × 75 ÷ 365 + 20 × 1,000 × 843) ÷ 1 crore, when share > 0', inputs: `need ${num(wheyNeedT(), { dp: 3 })} t; share ${Math.round(s.cash.share * 100)}%`, result: crore(importPipelineCr(s.cash.share), { dp: 2 }) }] },
  'cash-gst': { label: 'GST input credit build-up', search: 'gst input credit build-up', value: (s) => `₹${num(s.cash.gstRate, { dp: 1 })} cr a year: ${c1(gstBuildCr(s.cash.gstRate, 5))} by Mar 2027, ${c1(gstBuildCr(s.cash.gstRate, 17))} by Mar 2028`, src: ['Model'],
    used: [['GST on protein powder', '18% → 5% on 22 Sep 2025', 'G'], ['Input credit in, a year', 'about ₹16.4 cr', 'Model'], ['Output GST, a year', 'about ₹6.4 cr', 'Model'], ['Months from Nov 2026', '5 to Mar 2027; 17 to Mar 2028', 'Model']],
    calc: (s) => [{ formula: 'gst = rate × months ÷ 12', inputs: `${num(s.cash.gstRate, { dp: 1 })} × 5 ÷ 12; ${num(s.cash.gstRate, { dp: 1 })} × 17 ÷ 12`, result: `${crore(gstBuildCr(s.cash.gstRate, 5), { dp: 2 })}; ${crore(gstBuildCr(s.cash.gstRate, 17), { dp: 2 })}` }],
    caveat: 'An estimate that needs a tax specialist’s sign-off.' },
  'cash-sachet': { label: 'Sachet runs held', value: `${crore(sachetRunCr(), { dp: 2 })} per run`, src: ['B2', 'Calc'], used: [['One run', '5,62,500 sachets (18 t per flavour)', 'B2'], ['Cost per sachet', '₹46.7 (₹38.2 + ₹8.5)', 'B2']], calc: [{ formula: 'sachet cash = runs × 5,62,500 × ₹46.7', inputs: '1 × 5,62,500 × 46.7', result: crore(sachetRunCr(), { dp: 2 }) }] },
  'cash-tub': { label: 'Plant-tub test run', value: `${crore(plantTubRunCr(), { dp: 2 })} when on`, src: ['B2', 'Calc'], used: [['Run', '8 t', 'B2'], ['Cost', '₹800/kg', 'B2']], calc: [{ formula: 'plant tub = 8 t × 1,000 × ₹800', inputs: '8,000 kg × 800', result: crore(plantTubRunCr(), { dp: 2 }) }] },
  'cash-release': { label: 'Stock released by matching production to sales (L8)', value: `−${crore(stockReleaseCr(), { dp: 1 })} when on`, src: ['Model', 'C1', 'C2', 'D'], used: [['Stock released', 'about 28 t', 'Model'], ['Cost per kg', 'about ₹1,250', 'C1 · C2 · D']], calc: [{ formula: 'release = 28 t × 1,000 × ₹1,250', inputs: '28,000 kg × 1,250', result: crore(stockReleaseCr()) }] },
  'gst-card': { label: 'GST credit build-up', value: 'about ₹16.4 cr in against ₹6.4 cr out a year', src: ['Model', 'G'], used: [['GST on protein powder, before 22 Sep 2025', '18%', 'G'], ['From 22 Sep 2025', '5%', 'G'], ['Input credit in, a year', 'about ₹16.4 cr', 'Model'], ['Output GST, a year', 'about ₹6.4 cr', 'Model']], calc: [{ formula: 'net build-up = in − out', inputs: '16.4 − 6.4', result: 'about ₹10 cr a year' }], caveat: 'An estimate that needs a tax specialist’s sign-off.' },
};
for (const date of Object.keys(DATES)) {
  items[`cash-${date}`] = {
    label: `Working capital by ${DATES[date].label} (what-if)`, search: `cash total ${DATES[date].label}`,
    value: (s) => { const r = resultFor(s, date); return `${c1(r.total)} against the ₹${r.cap} cr cap: ${r.over ? `${c1(-r.spare)} over` : `${c1(r.spare)} spare`}; ${c1(r.withoutGst)} without GST credit`; },
    src: ['Model'],
    used: (s) => { const r = resultFor(s, date); return [['Import whey pipeline', crore(r.items.import, { dp: 2 }), 'Model'], ['GST input credit build-up', crore(r.items.gst, { dp: 2 }), 'Model'], ['Sachet runs held', `${settingsFor(s, date).sachets} → ${crore(r.items.sachet, { dp: 2 })}`, 'Model'], ['Plant-tub test run', crore(r.items.tub, { dp: 2 }), 'Model'], ['Stock released (L8)', crore(r.items.release, { dp: 2 }), 'Model'], ['Cap', `₹${r.cap} cr`, 'A']]; },
    calc: (s) => { const r = resultFor(s, date); return [{ formula: 'total = import + GST + sachets + plant tub + release', inputs: Object.values(r.items).map((v) => num(v, { dp: 2 })).join(' + ').replace(/\+ −/g, '− '), result: crore(r.total, { dp: 2 }) }, { formula: 'spare = cap − total', inputs: `${r.cap} − ${num(r.total, { dp: 2 })}`, result: crore(r.spare, { dp: 2, sign: true }) }]; },
  };
}
register('cash', items);

/* ---------- Pieces ---------- */
function headline(s) {
  const a = resultFor(s, 'mar27');
  return `By Mar 2027 the plan uses ${count('cash-h', a.total, 'cr1')}${chip('cash-mar27')} of the ₹10 cr working-capital cap. By Mar 2028 the ${T('[[GST]]')} credit build-up is the binding limit.`;
}

function bullet(s, date) {
  const r = resultFor(s, date);
  const id = `cash-b-${date}`;
  const label = DATES[date].label;
  const sachets = settingsFor(s, date).sachets;
  const list = [
    { key: 'import', label: 'Import whey pipeline', short: 'Import', v: r.items.import, item: 'cash-import' },
    { key: 'gst', label: 'GST credit build-up', short: 'GST credit', v: r.items.gst, item: 'cash-gst' },
    { key: 'sachet', label: `Sachet runs held (${sachets})`, short: 'Sachet', v: r.items.sachet, item: 'cash-sachet' },
    { key: 'tub', label: 'Plant-tub test run', short: 'Tub', v: r.items.tub, item: 'cash-tub' },
    { key: 'release', label: 'Stock released (L8)', short: 'Release', v: r.items.release, item: 'cash-release' },
  ];
  const chartItems = list.filter((it) => Math.abs(it.v) > 1e-9).map((it) => ({ ...it, text: crore(it.v, { dp: 1 }), tip: { title: it.label, value: crore(it.v, { dp: 2 }), src: ['Model'] } }));
  const pos = list.filter((it) => it.v > 0).reduce((a, it) => a + it.v, 0);
  const domain = Math.max(r.cap * 1.2, pos * 1.05, r.total * 1.05);
  const dom = domain > 20 ? Math.ceil(domain / 5) * 5 : Math.ceil(domain / 2) * 2;
  const svg = bulletChart({ id, w: widthOf(id, 520), items: chartItems, total: r.total, cap: r.cap, domain: dom, title: `Working capital by ${label} against the ₹${r.cap} crore cap`, desc: `Total ${crore(r.total)}: ${list.map((it) => `${it.label} ${crore(it.v)}`).join(', ')}. ${r.over ? `${crore(-r.spare)} over` : `${crore(r.spare)} spare`}.`, topText: `Total ${crore(r.total)}` });
  const tbl = setTable(id, `Working capital by ${label}`, ['Item', '₹ cr'], [...list.map((it) => [it.label, num(it.v, { dp: 2 })]), ['Total', num(r.total, { dp: 2 })], ['Total without GST credit', num(r.withoutGst, { dp: 2 })], ['Cap', String(r.cap)], [r.over ? 'Over' : 'Spare', num(Math.abs(r.spare), { dp: 2 })]]);
  const state = r.over ? `<span class="bc-state neg">${icon('circle-alert', { size: 16 })} ${count(`cash-over-${date}`, -r.spare, 'cr1')} over</span>` : `<span class="bc-state pos">${icon('circle-check', { size: 16 })} ${count(`cash-spare-${date}`, r.spare, 'cr1')} spare</span>`;
  return `<div class="card bullet-card">
    <div class="bc-head"><div><div class="label">${label} · cap ₹${r.cap} cr</div><div class="bc-total">${count(`cash-total-${date}`, r.total, 'cr1')}</div></div><div>${state} ${chip(`cash-${date}`)}</div></div>
    ${chartFrame({ id, title: `Rise in working capital from 1 Nov 2026 to ${label}`, item: `cash-${date}`, svg, table: tbl })}
    <div class="bc-items">${list.map((it) => `<div><span>${esc(it.label)}</span><span><b>${esc(crore(it.v, { dp: 1, sign: it.v < 0 }))}</b>${chip(it.item)}</span></div>`).join('')}<div><span>Without GST credit</span><span><b>${esc(crore(r.withoutGst))}</b>${chip(`cash-${date}`)}</span></div></div>
  </div>`;
}

function planner(s) {
  const c = s.cash;
  return `<div class="card"><div class="planner-grid">
    <div class="ctl"><div class="ctl-head"><span class="ctl-name" id="cp-imp">Import share of whey need</span></div>
      ${segmented({ bind: 'cash.share', labelId: 'cp-imp', value: c.share, type: 'num', options: P.importShares.map((x) => ({ value: x, label: `${Math.round(x * 100)}%` })) })}
      <p class="ctl-desc">Imports land at ₹843/kg against ₹1,024 domestic, but the letter of credit is paid at sight and cash is tied up for 75 days. ${chip('cash-import')}</p></div>
    <div class="ctl"><div class="ctl-head"><span class="ctl-name" id="cp-gst">GST credit build-up, ₹ cr a year</span><span class="ctl-value"><span class="whatif">What-if</span>${count('cp-gst', c.gstRate, 'num1')}</span></div>
      ${slider({ bind: 'cash.gstRate', min: P.gst.min, max: P.gst.max, step: P.gst.step, value: c.gstRate, labelId: 'cp-gst', valueText: `₹${num(c.gstRate, { dp: 1 })} crore a year`, bigStep: 2, ticks: [10] })}
      <div class="ctl-range"><span>₹6</span><span>Estimate about ₹10 cr a year</span><span>₹14</span></div></div>
    <div class="ctl sc-switch" style="display:flex"><div><div class="ctl-name" id="cp-tub">Plant-tub test run</div><p class="ctl-desc">8 t at ₹800/kg, ₹0.64 cr. ${chip('cash-tub')}</p></div>${switchCtl({ bind: 'cash.plantTub', checked: c.plantTub, labelId: 'cp-tub' })}</div>
    <div class="ctl sc-switch" style="display:flex"><div><div class="ctl-name" id="cp-rel">Stock release (L8)</div><p class="ctl-desc">Match production to sales: about 28 t at ₹1,250/kg, ₹3.5 cr back. ${chip('cash-release')}</p></div>${switchCtl({ bind: 'cash.release', checked: c.release, labelId: 'cp-rel' })}</div>
    ${['mar27', 'mar28'].map((d) => `<div class="ctl"><div class="ctl-head"><span class="ctl-name" id="cp-s-${d}">Sachet runs held at ${DATES[d].label}</span></div>
      ${segmented({ bind: `cash.${DATES[d].sachets}`, labelId: `cp-s-${d}`, value: c[DATES[d].sachets], type: 'num', options: [0, 1, 2].map((n) => ({ value: n, label: n === 0 ? 'None' : n === 1 ? 'One run' : 'Two runs' })) })}
      <p class="ctl-desc">₹2.63 cr per run of 5.6 lakh sachets. ${chip('cash-sachet')}</p></div>`).join('')}
  </div></div>`;
}

const describe = (change, dateLabel) => {
  if (change.key === 'import') return `hold imports at ${Math.round(change.to * 100)}%`;
  if (change.key === 'sachet') return `hold ${change.to === 0 ? 'no sachet run' : change.to === 1 ? 'one sachet run' : 'two sachet runs'} at ${dateLabel}`;
  if (change.key === 'tub') return 'skip the plant-tub test run';
  return 'release stock by matching production to sales (L8)';
};

function reading(s) {
  const out = [];
  for (const date of ['mar27', 'mar28']) {
    const r = resultFor(s, date);
    const label = DATES[date].label;
    if (!r.over) { out.push(`<p><b>${label}</b> sits inside the ₹${r.cap} cr cap with <b class="pos">${c1(r.spare)} spare</b>. ${chip(`cash-${date}`)}</p>`); continue; }
    const fix = cashFix(settingsFor(s, date), date);
    if (fix && fix.changes.length) {
      const text = fix.changes.map((ch) => describe(ch, label)).join(' and ');
      out.push(`<p><b>${label}</b> is <b class="neg">${c1(-r.spare)} over</b> the ₹${r.cap} cr cap. ${esc(text[0].toUpperCase() + text.slice(1))} to stay inside ₹${r.cap} cr. ${chip(`cash-${date}`)}</p>`);
    } else {
      out.push(`<p><b>${label}</b> is <b class="neg">${c1(-r.spare)} over</b> the ₹${r.cap} cr cap, and no mix of these settings brings it inside: it would take a GST credit build-up below ₹${num(s.cash.gstRate, { dp: 1 })} cr a year. ${chip(`cash-${date}`)}</p>`);
    }
  }
  const b = resultFor(s, 'mar28');
  out.push(`<p class="muted">By Mar 2028 the GST credit build-up is ${c1(b.items.gst)} of the ${c1(b.total)} total; without it the plan would use ${c1(b.withoutGst)}. ${chip('cash-gst')}</p>`);
  return `<div class="reading" role="status">${out.join('')}</div>`;
}

export default {
  id: 'cash',
  title: 'Cash and guardrails',
  tab: 'Cash',
  group: 'Deliver',
  icon: 'wallet',
  keywords: 'cash working capital guardrails cap gst imports sachet',
  render() {
    return `<header class="screen-head"><h1 class="headline" tabindex="-1" data-region="headline"></h1><p class="meaning"><span class="meaning-label">What this means</span> The board capped the rise in working capital at ₹10 cr until Mar 2027 and ₹16 cr until Mar 2028 ${chip('cash-caps')}. Imports and stuck GST credit use the room; matching production to sales gives some back.</p></header>
<div class="split split-6-6">
  ${section({ id: 'cash-27-s', title: 'Mar 2027 against ₹10 cr', body: '<div data-region="b27"></div>' })}
  ${section({ id: 'cash-28-s', title: 'Mar 2028 against ₹16 cr', body: '<div data-region="b28"></div>' })}
</div>
${section({ id: 'cash-read-s', title: 'Reading', body: '<div data-region="reading"></div>' })}
${section({ id: 'cash-plan-s', title: 'Planner', sub: 'Import share, GST credit, the plant-tub run and the stock release apply to both dates; sachet runs are set per date.', body: '<div data-region="planner"></div>' })}
${section({ id: 'cash-gst-s', title: 'Why GST credit builds up', body: `<div class="card"><p>${T('[[GST]] on protein powder fell from 18% to 5% on 22 Sep 2025. Most inputs still carry 18%, so input credit builds up: about ₹16.4 cr in against ₹6.4 cr out a year.')} ${chip('gst-card')}</p><p class="note caution">${icon('triangle-alert', { size: 16 })}<span>This is an estimate that needs a tax specialist’s sign-off.</span></p></div>` })}`;
  },
  region(key, s) {
    switch (key) {
      case 'headline': return headline(s);
      case 'b27': return bullet(s, 'mar27');
      case 'b28': return bullet(s, 'mar28');
      case 'reading': return reading(s);
      case 'planner': return planner(s);
      default: return null;
    }
  },
  live(s) {
    const a = resultFor(s, 'mar27');
    const b = resultFor(s, 'mar28');
    return `Cash by Mar 2027 ${c1(a.total)}, ${a.over ? 'over' : 'inside'} the ₹10 cr cap; by Mar 2028 ${c1(b.total)}, ${b.over ? 'over' : 'inside'} the ₹16 cr cap.`;
  },
};

