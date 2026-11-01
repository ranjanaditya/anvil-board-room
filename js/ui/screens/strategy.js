// 4.4 Strategy: what business Anvil should be in by FY28.
import { OPTIONS, ANITA_QUOTE, COMPETITORS, PLANTS, FORMATS } from '../../data.js';
import { priceForMargin, marginPct, wheySensitivity, qcContribution, qcBreakEvenTake } from '../../model.js';
import { num, pct, rupees, crore } from '../../format.js';
import { chip, T, section, screenHead, chartFrame, esc, icon, tchip, slider, count, notInRecords } from '../components.js';
import { slopeChart, dumbbell, hbars, lineChart, widthOf, setTable } from '../charts.js';
import { register } from '../registry.js';

const C = COMPETITORS;
const brandCls = ['ln-1', 'ln-2', 'ln-3'];

const items = {
  anita: { kind: 'person', label: 'Anita, lead independent director', search: 'anita board director doubles shrinks', value: `“${ANITA_QUOTE.text}”`, src: ['K'], note: 'Context from the board chat. The chat header has no “You”; the unlabelled messages read as Anita’s.', caveat: 'Chats are opinions, not records.' },
  'opt-A': { label: 'Option A: cut-only tub brand', search: 'option cut 20% across the board', value: 'Reject as framed', src: ['A', 'F', 'Calc'], note: OPTIONS[0].why,
    used: [['Marketing, FY26', '₹39.3 cr', 'F'], ['A flat 20% cut', '₹7.9 cr a year', 'Calc'], ['CM2, FY26', '25.2% of NR', 'BP'], ['Retail media on Amazon and Flipkart, FY26', '₹10.2 cr', 'F']],
    calc: [{ formula: 'saving = 20% × marketing', inputs: '20% × ₹39.3 cr', result: `₹${num(0.2 * 39.3, { dp: 2 })} cr, about ₹7.9 cr` }, { formula: 'NR it can lose and still pay = saving ÷ CM2 share', inputs: '₹7.86 cr ÷ 25.2%', result: `about ₹${num(0.2 * 39.3 / 0.252)} cr` }] },
  'opt-B': { label: 'Option B: format-first pivot', value: 'Test first', src: ['B2', 'F'], note: OPTIONS[1].why,
    used: [['One sachet run', '5.6 lakh sachets (18 t per flavour), ₹2.6 cr of cash', 'B2'], ['D2C new customers, FY26', '0.7 lakh', 'F'], ['First RTD slot', 'Plant X, Apr 2027', 'B2']] },
  'opt-C': { label: 'Option C: marketplace and quick-commerce led', value: 'No for tubs', src: ['G', 'Ext', 'Calc'], note: OPTIONS[2].why,
    used: [['Fees and ads, share of marketplace NR', '31% (fees 20.8%, ads 10.5%)', 'Calc'], ['Quick-commerce take, external estimate', '45% to 55%', 'Ext'], ['Contribution per kg at 45% / 55%', '+₹270 / −₹7', 'Calc'], ['Cost per kg of a whey tub', '₹1,250', 'D']] },
  'opt-D': { label: 'Option D: tub-led brand that earns its volume', search: 'recommended tub-led', value: 'Recommended', src: ['B2', 'B3', 'F', 'Model'], note: OPTIONS[3].why,
    used: [['Plant tub CM2', 'about 38%', 'Model'], ['Whey tub CM2', 'about 24%', 'Model'], ['BCAA, share of NR at the September run-rate', 'about 0.5%', 'Calc'], ['Plant tub cost', '₹800/kg', 'B2'], ['Imported WPC80, landed', '₹843/kg', 'B3']] },
  'comp-realisation': { label: 'Net realisation per 100 g of protein', search: 'competitors brand b brand c price realisation', value: 'Anvil ₹314 → ₹291; Brand B ₹308 → ₹320; Brand C ₹307 → ₹314', src: ['L'], used: C.brands.map((b, i) => [`${b}, FY24 → FY26`, `₹${C.realisationPer100gProtein.v[i][0]} → ₹${C.realisationPer100gProtein.v[i][1]}`, 'L']) },
  'comp-cm1': { label: 'CM1 by brand', value: 'Anvil 53% → 43%; Brand B 48% → 53%; Brand C 46% → 50%', src: ['L'], used: C.brands.map((b, i) => [`${b}, FY24 → FY26`, `${C.cm1Pct.v[i][0]}% → ${C.cm1Pct.v[i][1]}% of NR`, 'L']) },
  'comp-rank': { label: 'Amazon best-seller rank', search: 'rank amazon bsr', value: 'Anvil #3 → #6; Brand B #6 → #3; Brand C #8 → #4', src: ['L'], used: C.brands.map((b, i) => [`${b}, Q1 FY25 → Q2 FY27`, `#${C.amazonRank.v[i][0]} → #${C.amazonRank.v[i][1]}`, 'L']) },
  'comp-listings': { label: 'Active Amazon listings, Q2 FY27', value: 'Anvil 6; Brand B 15; Brand C 12', src: ['L'], used: C.brands.map((b, i) => [b, `${C.activeListings.v[i]} listings`, 'L']) },
  'plant-share': { label: 'Share of the two plants’ combined output', search: 'output share plants brand', value: 'Anvil 30% → 21%; Brand B 22% → 5%; Brand C 18% → 4% (Q2 CY23 → Q1 CY26)', src: ['E'],
    used: [['Anvil', '30% → 21%', 'E'], ['Brand B', '22% → 5%', 'E'], ['Brand C', '18% → 4%', 'E'], ['All others', '30% → 70%', 'E'], ['Brands B and C, volume at the two plants', 'about −41%', 'Calc']],
    caveat: 'X and Y report identical utilisation, so only combined plant figures are used.' },
  'plants-built': { label: 'Combined capacity by line type', search: 'capacity tub sachet rtd lines', value: 'Tub 380 → 380 t a quarter (peak 440); sachet 0 → 340; RTD 0 → 180', src: ['E'],
    used: [['Tub lines, Q2 CY23 → Q1 CY26', '380 → 380 t a quarter (peak 440)', 'E'], ['Sachet and stick-pack lines', '0 → 340 t a quarter', 'E'], ['RTD lines', '0 → 180 t a quarter', 'E'], ['Plant X capacity', '209 → 495 t a quarter', 'E'], ['Plant X cumulative capex', '₹52 cr → ₹150 cr', 'E'], ['Plant Y capacity', '57 → 135 lakh servings a quarter', 'E'], ['Plant Y cumulative capex', '₹40 cr → ₹108 cr', 'E']] },
  formats: { label: 'Format lab: unit costs', search: 'formats sachet rtd plant tub cost per unit', value: 'Whey tub ₹1,250/kg; plant tub ₹800/kg; sachet ₹46.7; RTD ₹56', src: ['B2', 'B3', 'D'],
    used: FORMATS.map((f) => [f.name, `${rupees(f.unitCost, { dp: f.unitCost % 1 ? 1 : 0 })} per unit${f.costNote ? ` (${f.costNote})` : ''}`, f.src.join(' · ')]),
    caveat: 'Costs are before outbound logistics. The plant tub’s protein content is not in the records.' },
  'fmt-price': { label: 'Net price needed at the target margin', search: 'target margin net price', value: (s) => FORMATS.map((f) => `${f.name.split(',')[0]} ${rupees(priceForMargin(f.unitCost, s.margin), { dp: f.unitCost % 1 ? 1 : 0 })}`).join('; '), src: ['Calc'],
    used: (s) => [['Target product margin (what-if)', `${s.margin}%`, ''], ...FORMATS.map((f) => [`${f.name}, cost`, rupees(f.unitCost, { dp: f.unitCost % 1 ? 1 : 0 }), f.src.join(' · ')])],
    calc: (s) => [{ formula: 'price = cost ÷ (1 − margin)', inputs: `₹1,250 ÷ (1 − ${s.margin}%)`, result: `${rupees(priceForMargin(1250, s.margin))} per kg for the whey tub` }],
    caveat: 'Net price is ex-GST and after discounts.' },
  'fmt-ref': { label: 'Whey tub realisation, FY26', value: 'about ₹2,181 per kg; CM1 about 43%', src: ['L', 'Calc'], used: [['NR, FY26', '₹128.7 cr', 'A'], ['Tonnes sold, FY26', '590 t', 'D'], ['Cost per kg, FY26 actual', 'about ₹1,250', 'C1 · C2 · D'], ['Anvil CM1, FY26', '43% of NR', 'L']],
    calc: [{ formula: 'realisation = NR ÷ tonnes sold', inputs: '₹128.7 cr ÷ 590 t', result: '₹2,181 per kg' }, { formula: 'CM1 = (realisation − cost) ÷ realisation', inputs: '(2,181 − 1,250) ÷ 2,181', result: `${num(marginPct(2181, 1250))}%` }] },
  'whey-sens': { label: 'Whey sensitivity', search: 'whey 50 per kg sensitivity', value: 'Each ₹50/kg on WPC80 moves cost by about ₹47 per kg of product, or ₹2.8 cr a year at 590 t', src: ['B3', 'Calc'],
    used: [['Change in the WPC80 price', '₹50/kg', ''], ['WPC80 per kg of product', '0.9375 kg', 'Calc'], ['Tonnes sold, FY26', '590 t', 'D']],
    calc: () => { const w = wheySensitivity(); return [{ formula: 'cost per kg of product = ₹50 × 0.9375', inputs: '50 × 0.9375', result: `₹${num(w.perKgProduct, { dp: 2 })}, about ₹47` }, { formula: 'a year = per kg × 590 t', inputs: '46.875 × 5,90,000 kg', result: `${crore(w.crYear, { dp: 2 })}, about ₹2.8 cr` }]; } },
  qc: { label: 'Quick-commerce contribution per kg (what-if)', search: 'quick commerce take rate blinkit instamart zepto', value: (s) => `${num(qcContribution(s.qcTake, s.qcDiscount), { sign: true })} ₹/kg at a ${s.qcTake}% take and ${s.qcDiscount}% discount`, src: ['Calc', 'Ext', 'K'],
    used: (s) => [['MRP of the 1 kg tub, with 5% GST', '₹2,901', 'F'], ['Cost per kg', '₹1,250', 'D'], ['Take rate (what-if)', `${s.qcTake}%`, ''], ['Discount off MRP (what-if)', `${s.qcDiscount}%`, ''], ['External estimate of the take', '45% to 55%', 'Ext'], ['CFO’s remark', '30%', 'K']],
    calc: (s) => [{ formula: 'contribution per kg = 2,901 ÷ 1.05 × (1 − discount) × (1 − take) − 1,250', inputs: `2,901 ÷ 1.05 × ${num(1 - s.qcDiscount / 100, { dp: 2 })} × ${num(1 - s.qcTake / 100, { dp: 2 })} − 1,250`, result: `₹${num(qcContribution(s.qcTake, s.qcDiscount), { sign: true })} per kg` }, { formula: 'break-even take = 1 − 1,250 ÷ (2,901 ÷ 1.05 × (1 − discount))', inputs: `discount ${s.qcDiscount}%`, result: pct(qcBreakEvenTake(s.qcDiscount)) }],
    caveat: 'Before ads, dark-store logistics and returns. No signed quick-commerce rate card is on file. The 45% to 55% band is an external research estimate. The 30% figure is the CFO’s remark in a chat.' },
};
for (const f of FORMATS) {
  items[`fmt-${f.key}`] = { label: f.name, value: `${rupees(f.unitCost, { dp: f.unitCost % 1 ? 1 : 0 })} per unit`, src: f.src,
    used: [['Cost per unit', `${rupees(f.unitCost, { dp: f.unitCost % 1 ? 1 : 0 })}${f.costNote ? ` (${f.costNote})` : ''}`, f.src.join(' · ')], ['Cost per kg', f.perKg ? rupees(f.perKg) : f.perKgNote || 'Not in the records', 'Calc'], ['Protein', f.protein || 'Not in the records', 'B2'], ['Cost per 100 g of protein', f.per100gProtein ? rupees(f.per100gProtein) : 'Not in the records', 'Calc'], ['Minimum run and its cash', f.minRun, 'B2'], ['Where and when', f.where, 'B2'], ['Shelf life', f.shelf, 'B2']] };
}
register('strategy', items);

/* ---------- Pieces ---------- */
function optionsHTML() {
  return `<div class="options">${OPTIONS.map((o) => `<article class="option card${o.recommended ? ' recommended' : ''}" aria-labelledby="opt-${o.id}">
    <div class="opt-head"><span class="opt-letter" aria-hidden="true">${o.id}</span><h3 class="opt-name" id="opt-${o.id}"><span class="sr-only">Option ${o.id}: </span>${esc(o.name)}</h3></div>
    <div class="opt-chips">${tchip(o.verdict, o.recommended ? 'accent' : o.tone, o.icon)}</div>
    <p class="opt-why">${T(o.why.replace('CM2 about', '[[CM2]] about').replace('BCAA parked', '[[BCAA]] parked'))} ${chip(`opt-${o.id}`)}</p>
  </article>`).join('')}</div>`;
}

function slopes() {
  const a = 'st-real';
  const b = 'st-cm1';
  const series = (key, fmt) => C.brands.map((br, i) => ({ label: br, short: br.replace('Brand ', ''), cls: brandCls[i], v: C[key].v[i], item: key === 'cm1Pct' ? 'comp-cm1' : 'comp-realisation',
    tip: { title: br, value: `${fmt(C[key].v[i][0])} → ${fmt(C[key].v[i][1])}`, src: ['L'] } }));
  const rs = (v) => `₹${v}`;
  const ps = (v) => `${v}%`;
  const sa = slopeChart({ id: a, w: widthOf(a, 520), title: 'Net realisation per 100 g of protein, FY24 to FY26', desc: 'Anvil ₹314 to ₹291; Brand B ₹308 to ₹320; Brand C ₹307 to ₹314.', from: 'FY24', to: 'FY26', series: series('realisationPer100gProtein', rs), fmt: rs, domain: [285, 325] });
  const sb = slopeChart({ id: b, w: widthOf(b, 520), title: 'CM1, % of NR, FY24 to FY26', desc: 'Anvil 53% to 43%; Brand B 48% to 53%; Brand C 46% to 50%.', from: 'FY24', to: 'FY26', series: series('cm1Pct', ps), fmt: ps, domain: [40, 56] });
  const ta = setTable(a, 'Net realisation per 100 g of protein', ['Brand', 'FY24 ₹', 'FY26 ₹'], C.brands.map((br, i) => [br, ...C.realisationPer100gProtein.v[i]]));
  const tb = setTable(b, 'CM1, % of NR', ['Brand', 'FY24 %', 'FY26 %'], C.brands.map((br, i) => [br, ...C.cm1Pct.v[i]]));
  return chartFrame({ id: a, title: 'Price: net realisation per 100 g of protein', sub: 'FY24 to FY26', item: 'comp-realisation', svg: sa, table: ta })
    + chartFrame({ id: b, title: 'Margin: CM1, % of NR', sub: 'FY24 to FY26', item: 'comp-cm1', svg: sb, table: tb });
}

function rankAndListings() {
  const a = 'st-rank';
  const rows = C.brands.map((br, i) => ({ label: br, strong: i === 0, cls: brandCls[i], v: C.amazonRank.v[i], item: 'comp-rank', tip: { title: `${br}, Amazon best-seller rank`, value: `#${C.amazonRank.v[i][0]} → #${C.amazonRank.v[i][1]}`, rows: [['From', 'Q1 FY25'], ['To', 'Q2 FY27']], src: ['L'] } }));
  const sa = dumbbell({ id: a, w: widthOf(a, 520), rows, domain: [1, 9], from: 'Q1 FY25', to: 'Q2 FY27', title: 'Amazon best-seller rank, Q1 FY25 to Q2 FY27', desc: 'Anvil fell from 3rd to 6th; Brand B rose from 6th to 3rd; Brand C from 8th to 4th.' });
  const ta = setTable(a, 'Amazon best-seller rank', ['Brand', 'Q1 FY25', 'Q2 FY27'], C.brands.map((br, i) => [br, ...C.amazonRank.v[i]]));
  const b = 'st-listings';
  const lrows = C.brands.map((br, i) => ({ label: br, v: C.activeListings.v[i], text: `${C.activeListings.v[i]}`, tone: 's-neu', strong: i === 0, item: 'comp-listings', tip: { title: `${br}, active Amazon listings`, value: `${C.activeListings.v[i]} (Q2 FY27)`, src: ['L'] } }));
  const sb = hbars({ id: b, w: widthOf(b, 520), rows: lrows, domain: [0, 16], title: 'Active Amazon listings, Q2 FY27', desc: 'Anvil 6, Brand B 15, Brand C 12.', labelW: 80, rowH: 36 });
  const tb = setTable(b, 'Active Amazon listings, Q2 FY27', ['Brand', 'Listings'], C.brands.map((br, i) => [br, C.activeListings.v[i]]));
  return chartFrame({ id: a, title: 'Amazon best-seller rank', sub: 'Hollow: Q1 FY25 · filled: Q2 FY27 · 1 is best', item: 'comp-rank', svg: sa, table: ta })
    + chartFrame({ id: b, title: 'Active Amazon listings', sub: 'Q2 FY27', item: 'comp-listings', svg: sb, table: tb });
}

function plantShare() {
  const id = 'st-share';
  const q = PLANTS.quarters;
  const mk = (key, label, cls, dash) => ({ key, label, cls, dash, marker: 'filled', r: 3, endLabel: `${label} ${PLANTS.share[key].at(-1)}%`,
    pts: PLANTS.share[key].map((v, i) => ({ x: i, y: v, xLabel: q[i], text: `${v}%`, item: 'plant-share', tip: { title: `${label}, ${q[i]}`, value: `${v}% of combined output`, src: ['E'] } })) });
  const svg = lineChart({ id, w: widthOf(id, 1000), h: 240, title: 'Share of the two plants’ combined output', desc: 'Q2 CY23 to Q1 CY26. Anvil 30% to 21%; Brand B 22% to 5%; Brand C 18% to 4%; all others 30% to 70%.', xDomain: [-0.3, 11.3], xTicks: q.map((l, i) => ({ v: i, label: i % 2 === 0 || i === 11 ? l : '' })).filter((t) => t.label), yDomain: [0, 75], yTicks: [0, 25, 50, 75], yFmt: (v) => `${v}%`,
    series: [mk('anvil', 'Anvil', 'ln-1'), mk('brandB', 'Brand B', 'ln-2'), mk('brandC', 'Brand C', 'ln-3'), mk('others', 'All others', 'ln-3', true)] });
  const tbl = setTable(id, 'Share of combined output, %', ['Quarter', 'Anvil', 'Brand B', 'Brand C', 'All others'], q.map((l, i) => [l, PLANTS.share.anvil[i], PLANTS.share.brandB[i], PLANTS.share.brandC[i], PLANTS.share.others[i]]));
  return chartFrame({ id, title: 'Each brand’s share of Plants X and Y output', sub: '% of combined output, by calendar quarter (Q1 CY26 is FY26 Q4)', item: 'plant-share', svg, table: tbl });
}

function formatLab(s) {
  const m = s.margin;
  const priceCell = (f) => `<b>${rupees(priceForMargin(f.unitCost, m), { dp: f.unitCost % 1 ? 1 : 0 })}</b>${f.key === 'tub' || f.key === 'plant' ? '<span class="muted">/kg</span>' : ''}`;
  const rows = [
    ['Cost per unit', (f) => `${rupees(f.unitCost, { dp: f.unitCost % 1 ? 1 : 0 })}${f.costNote ? `<div class="muted small">${esc(f.costNote)}</div>` : ''}`],
    ['Cost per kg', (f) => (f.perKg ? rupees(f.perKg) : `<span class="nir">${esc(f.perKgNote || 'Not in the records')}</span>`)],
    ['Protein', (f) => (f.protein ? esc(f.protein) : notInRecords('plant-tub protein'))],
    ['Cost per 100 g of protein', (f) => (f.per100gProtein ? rupees(f.per100gProtein) : notInRecords('plant-tub protein'))],
    ['Minimum run and its cash', (f) => esc(f.minRun)],
    ['Where and when', (f) => esc(f.where)],
    ['Shelf life', (f) => esc(f.shelf)],
    [`Net price needed at ${m}% margin`, priceCell],
  ];
  const head = `<tr><th scope="col"><span class="sr-only">Measure</span></th>${FORMATS.map((f) => `<th scope="col" class="r">${esc(f.name.replace(', 1 kg', '').replace(' (today)', ''))}${chip(`fmt-${f.key}`)}</th>`).join('')}</tr>`;
  const body = rows.map(([label, fn], ri) => `<tr${ri === rows.length - 1 ? ' class="hl"' : ''}><th scope="row">${esc(label)}</th>${FORMATS.map((f) => `<td class="r" data-label="${esc(f.name)}">${fn(f)}</td>`).join('')}</tr>`).join('');
  const tub = priceForMargin(1250, m);
  return `<div class="card">
  <div class="ctl" style="padding-top:0">
    <div class="ctl-head"><span class="ctl-name" id="fl-m">Target product margin</span><span class="ctl-value"><span class="whatif">What-if</span>${count('fl-m', m, 'pct0')}</span></div>
    ${slider({ bind: 'margin', min: 20, max: 70, step: 1, value: m, labelId: 'fl-m', valueText: `${m}% margin`, bigStep: 10 })}
    <div class="ctl-range"><span>20%</span><span>Range 20% to 70%</span><span>70%</span></div>
  </div>
  <div class="tbl-wrap"><table class="tbl stack fmt-tbl"><caption class="sr-only">Format lab: cost before outbound logistics, and the net price needed for the target margin</caption><thead>${head}</thead><tbody>${body}</tbody></table></div>
  <p class="tbl-note">Cost before outbound logistics ${chip('formats')}. Net price is ex-GST and after discounts: price = cost ÷ (1 − margin) ${chip('fmt-price')}.</p>
  <div class="reading">The whey tub realised about <b>₹2,181 per kg</b> in FY26, a product margin (${T('[[CM1]]')}) of about <b>43%</b> ${chip('fmt-ref')}. At ${m}% it would need <b class="${tub > 2181 ? 'neg' : 'pos'}">${rupees(tub)} per kg</b>, ${tub > 2181 ? `${rupees(tub - 2181)} more than it realised` : `within what it realised`}.</div>
  <p class="note">${icon('info', { size: 16 })}<span>Each ₹50/kg on ${T('[[WPC80]]')} moves cost by about ₹47 per kg of product, or ₹2.8 cr a year at 590 t. ${chip('whey-sens')}</span></p>
</div>`;
}

function qcCheck(s) {
  const t = s.qcTake;
  const d = s.qcDiscount;
  const c = qcContribution(t, d);
  const be = qcBreakEvenTake(d);
  const id = 'st-qc';
  const curve = [];
  for (let x = 25; x <= 65; x += 1) curve.push({ x, y: qcContribution(x, d) });
  const rs = (v) => rupees(v, { sign: true });
  const series = [
    { key: 'curve', label: 'Contribution per kg', cls: 'ln-1', noMarks: true, pts: curve },
    { key: 'ticks', label: 'Contribution per kg', cls: 'ln-1', noLine: true, marker: 'filled', r: 2.5,
      pts: curve.filter((p) => p.x % 5 === 0).map((p) => ({ ...p, xLabel: `${p.x}% take`, text: `${rs(p.y)} per kg`, item: 'qc', tip: { title: `${p.x}% take, ${d}% discount`, value: `${rs(p.y)} per kg`, src: ['Calc'], formula: '2,901 ÷ 1.05 × (1 − d) × (1 − t) − 1,250' } })) },
    { key: 'now', label: 'At this take rate', cls: c >= 0 ? 'ln-pos' : 'ln-neg', noLine: true, marker: 'filled', r: 6,
      pts: [{ x: t, y: c, xLabel: `${t}% take`, text: `${rs(c)} per kg`, label: rs(c), dy: c >= 0 ? -12 : 20, item: 'qc', tip: { title: `At a ${t}% take and ${d}% discount (what-if)`, value: `${rs(c)} per kg`, rows: [['Break-even take', pct(be)]], src: ['Calc', 'Ext'], formula: '2,901 ÷ 1.05 × (1 − d) × (1 − t) − 1,250' } }] },
  ];
  const svg = lineChart({ id, w: widthOf(id, 480), h: 230, title: 'Quick-commerce contribution per kg against the take rate', desc: `Before ads, dark-store logistics and returns, at a ${d}% discount. Break-even take ${pct(be)}. External estimate band 45% to 55%.`,
    xDomain: [25, 65], xTicks: [25, 35, 45, 55, 65].map((v) => ({ v, label: `${v}%` })), yDomain: [-600, 900], yTicks: [-600, -300, 0, 300, 600, 900], yFmt: (v) => rupees(v), zero: true,
    series, bands: [{ x0: 45, x1: 55, label: 'External estimate', cls: 'xband caution' }],
    vlines: [{ x: be, label: `Break-even ${pct(be)}`, anchor: be > 56 ? 'end' : 'start', dy: 24 }, { x: 30, label: 'CFO’s remark, 30%', dy: 168 }], endLabels: false, m: { l: 56, r: 16, t: 22 } });
  const tbl = setTable(id, 'Quick-commerce contribution per kg', ['Take rate %', `Contribution ₹/kg at ${d}% discount`], [25, 30, 35, 40, 45, 50, 55, 60, 65].map((x) => [x, num(qcContribution(x, d), { sign: true })]));
  return `<div class="card">
  <div class="ctl" style="padding-top:0">
    <div class="ctl-head"><span class="ctl-name" id="qc-t">Take rate</span><span class="ctl-value"><span class="whatif">What-if</span>${count('qc-t', t, 'pct0')}</span></div>
    ${slider({ bind: 'qcTake', min: 25, max: 65, step: 1, value: t, labelId: 'qc-t', valueText: `${t}% take rate`, band: [45, 55], bigStep: 10 })}
    <div class="ctl-range"><span>25%</span><span>Shaded: 45% to 55%, external estimate</span><span>65%</span></div>
  </div>
  <div class="ctl">
    <div class="ctl-head"><span class="ctl-name" id="qc-d">Discount off MRP</span><span class="ctl-value"><span class="whatif">What-if</span>${count('qc-d', d, 'pct0')}</span></div>
    ${slider({ bind: 'qcDiscount', min: 0, max: 30, step: 1, value: d, labelId: 'qc-d', valueText: `${d}% discount`, bigStep: 10 })}
    <div class="ctl-range"><span>0%</span><span>MRP ₹2,901 including 5% GST; cost ₹1,250/kg</span><span>30%</span></div>
  </div>
  <div class="lab-out" style="margin-top:16px"><span class="label">Contribution per kg</span><span class="big-num ${c >= 0 ? 'pos' : 'neg'}">${count('qc-c', c, 'rs0s')}</span>${chip('qc')}<span class="muted">Break-even take <b>${pct(be)}</b></span></div>
  <p class="muted small">What-if, before ads, dark-store logistics and returns.</p>
  <div style="margin-top:12px">${chartFrame({ id, title: 'Contribution per kg by take rate', sub: `At a ${d}% discount off MRP`, item: 'qc', svg, table: tbl })}</div>
  <p class="note caution">${icon('triangle-alert', { size: 16 })}<span>No signed quick-commerce rate card is on file. The 45% to 55% band is an external research estimate. The 30% figure is the CFO’s remark in a chat.</span></p>
</div>`;
}

function plantsBuilt() {
  const id = 'st-built';
  const q = PLANTS.quarters;
  const cap = PLANTS.capacity;
  const mk = (key, label, cls, dash) => ({ key, label, cls, dash, marker: 'filled', r: 3, endLabel: `${label} ${cap[key].at(-1)} t`,
    pts: cap[key].map((v, i) => ({ x: i, y: v, xLabel: q[i], text: `${v} t a quarter`, item: 'plants-built', tip: { title: `${label} lines, ${q[i]}`, value: `${v} t a quarter`, src: ['E'] } })) });
  const svg = lineChart({ id, w: widthOf(id, 1000), h: 240, title: 'Combined capacity by line type, tonnes a quarter', desc: 'Tub lines 380 to 380 (peak 440); sachet lines 0 to 340; RTD lines 0 to 180; Q2 CY23 to Q1 CY26.', xDomain: [-0.3, 11.3], xTicks: q.map((l, i) => ({ v: i, label: i % 2 === 0 || i === 11 ? l : '' })).filter((t) => t.label), yDomain: [0, 480], yTicks: [0, 120, 240, 360, 480], yFmt: (v) => `${v} t`,
    series: [mk('tub', 'Tub', 'ln-1'), mk('sachet', 'Sachet', 'ln-2'), mk('rtd', 'RTD', 'ln-3', true)], m: { l: 48 } });
  const tbl = setTable(id, 'Combined capacity by line type, t a quarter', ['Quarter', 'Tub', 'Sachet and stick-pack', 'RTD'], q.map((l, i) => [l, cap.tub[i], cap.sachet[i], cap.rtd[i]]));
  return chartFrame({ id, title: 'Plants X and Y, combined capacity', sub: 'Tonnes a quarter, Q2 CY23 to Q1 CY26', item: 'plants-built', svg, table: tbl, note: '<span>Tub lines peaked at 440 t and ended where they started; the new capacity is sachet and ready-to-drink (RTD).</span>' });
}

export default {
  id: 'strategy',
  title: 'Strategy',
  group: 'Decide',
  icon: 'compass',
  keywords: 'options competitors brand b brand c format lab quick commerce sachet rtd plant tub',
  render() {
    return `${screenHead({
      headline: 'Be a tub-led brand that earns its volume, not a cost-cutter, a format pivot or a quick-commerce play.',
      meaning: T('Reprice and re-cost the tub core, hedge whey with a plant tub, trial one sachet flavour and park [[BCAA|BCAA]].'),
    })}
<aside class="anita card" aria-label="Context from the board chat">${icon('quote', { size: 22 })}<div><blockquote>“${esc(ANITA_QUOTE.text)}”${chip('anita')}</blockquote><cite>${esc(ANITA_QUOTE.who)}</cite></div></aside>
${section({ id: 'st-options-s', title: 'Four options for FY28', body: '<div data-region="options"></div>' })}
${section({ id: 'st-comp-s', title: 'What competitors did', sub: 'Brands B and C sell through the same channels and, until recently, the same plants.', body: '<div class="comp-grid" data-region="slopes"></div><div class="comp-grid" style="margin-top:24px" data-region="rank"></div><div style="margin-top:24px" data-region="share"></div><p class="reading">B and C raised price and margin, gained rank, and moved most of their making out of Plants X and Y.</p>' })}
<div class="split split-7-5">
  ${section({ id: 'st-lab-s', title: 'Format lab', sub: 'What each format costs before outbound logistics, and the net price a target margin needs.', body: '<div data-region="lab"></div>' })}
  ${section({ id: 'st-qc-s', title: 'Quick-commerce check', sub: 'What a 1 kg tub earns on a quick-commerce app.', body: '<div data-region="qc"></div>' })}
</div>
${section({ id: 'st-built-s', title: 'What the plants built', body: '<div data-region="built"></div>' })}`;
  },
  region(key, s) {
    switch (key) {
      case 'options': return optionsHTML();
      case 'slopes': return slopes();
      case 'rank': return rankAndListings();
      case 'share': return plantShare();
      case 'lab': return formatLab(s);
      case 'qc': return qcCheck(s);
      case 'built': return plantsBuilt();
      default: return null;
    }
  },
};

