// 4.3 Claims vs records: each leader's story, tested against the data room.
import { CLAIMS, PEOPLE, VERDICTS, GROWTH, WPC80_DOMESTIC, WPC80_IMPORT } from '../../data.js';
import { everydayDiscount, festivePremium, newBuyerRoas, codShareOfRto, pctChange, clicksIndex } from '../../model.js';
import { num } from '../../format.js';
import { chip, T, section, screenHead, chartFrame, esc, icon, vchip, notInRecords } from '../components.js';
import { lineChart, widthOf, setTable } from '../charts.js';
import { register } from '../registry.js';

const G = GROWTH.rows;
const disc = GROWTH.discounts;
const verdictHTML = (c) => c.verdicts.map((v) => vchip(v.v, v.part)).join('');
const who = (c) => `${PEOPLE[c.person].name}, ${PEOPLE[c.person].role}`;
const verdictText = (c) => c.verdicts.map((v) => `${v.part ? `${v.part}: ` : ''}${VERDICTS[v.v].label}`).join(' · ');

const nb = G.roas.v.map((r, i) => newBuyerRoas(r, G.existingShare.v[i]));
const clicks = GROWTH.search.index.map((x, i) => clicksIndex(x, GROWTH.search.clickShare[i]));

const USED = {
  arjun: [
    ['Everyday D2C discount, FY24', `${num(everydayDiscount(disc.d2c.FY24), { dp: 1 })}%`, 'F · Calc'],
    ['Everyday D2C discount, FY26', `${num(everydayDiscount(disc.d2c.FY26), { dp: 1 })}%`, 'F · Calc'],
    ['Festive premium, FY24', `${num(festivePremium(disc.d2c.FY24), { dp: 1 })} points`, 'F · Calc'],
    ['Festive premium, FY26', `${num(festivePremium(disc.d2c.FY26), { dp: 1 })} points`, 'F · Calc'],
    ['SAVE10 given to coupon aggregators', 'Feb 2025', 'F'],
    ['D2C orders with an affiliate or coupon code', '5% → 15% → 24%', 'F'],
    ['CM3, festive Q3 FY26', '−7% of NR', 'A'],
    ['CM3, non-festive Q4 FY26', '−10% of NR', 'A'],
    ['Net realisation per 100 g protein, Anvil', '₹314 → ₹291', 'L'],
    ['Net realisation per 100 g protein, Brand B', '₹308 → ₹320', 'L'],
    ['Net realisation per 100 g protein, Brand C', '₹307 → ₹314', 'L'],
  ],
  rhea: [
    ['Site conversion, as claimed', '3.1% → 2.3%', 'I'],
    ['Site-conversion data', 'Not in the records', ''],
    ['Marketing, FY24 → FY26', '₹28.9 cr → ₹39.3 cr (+₹10.4 cr)', 'F'],
    ['CM3 swing, FY24 → FY26', '−₹19.5 cr', 'BP · Calc'],
    ['Reported Meta ROAS, 7-day click', '3.5 → 3.4 → 3.3', 'F'],
    ['Existing customers’ share of attributed purchases', '24% → 42% → 59%', 'F'],
    ['ROAS on new buyers', `${num(nb[0], { dp: 2 })} → ${num(nb[2], { dp: 2 })} (−49%)`, 'Calc'],
    ['D2C new customers', '0.8 → 0.8 → 0.7 lakh', 'F'],
    ['New customers reordering within 90 days', '34% → 26% → 17%', 'F'],
  ],
  karan: [
    ['FY26 logistics bill', '₹2.35 cr', 'H'],
    ['Rate rises, courier and warehouse contracts', '₹0.47 cr', 'H'],
    ['Marketplace fees, share of company NR', '7.6% → 15.6%', 'A · G'],
    ['COD share of D2C orders', '36% → 44% → 52%', 'F'],
    ['RTO on shipped COD orders', '8% → 17% → 26%', 'F'],
    ['RTO on shipped prepaid orders', '2% → 2% → 2%', 'F'],
    ['COD share of D2C RTOs, FY26', `${num(codShareOfRto(52, 26, 2))}%`, 'Calc'],
    ['Reported Meta ROAS, 7-day click', '3.5 → 3.4 → 3.3', 'F'],
    ['ROAS on new buyers', '2.66 → 1.35 (−49%)', 'Calc'],
    ['Paid CAC', '₹1,948 → ₹2,520 (+29%)', 'Calc'],
    ['Courier rate, 1 to 2 kg consignment', '₹62 → ₹86, then held', 'F'],
  ],
  kunal: [
    ['Domestic WPC80 quote, Q1 FY24', '₹790/kg', 'B3'],
    ['Domestic WPC80 quote, Q1 FY25', '₹853/kg', 'B3'],
    ['Domestic WPC80 quote, Q1 FY26', '₹928/kg', 'B3'],
    ['Domestic WPC80 quote, Oct 2026', '₹1,024/kg (+30% on Q1 FY24)', 'B3'],
    ['Whey per kg of product, FY24 → FY26', '₹740 → ₹870 (+17.6%)', 'D'],
    ['Whey cost rise, FY26', '₹7.7 cr', 'D · Calc'],
    ['CM2, FY24 → FY26', '43.1% → 25.2% of NR (17.9 points)', 'BP'],
    ['Marketplace fees per kg', '₹181 → ₹341', 'A · G'],
    ['Imported WPC80, landed with duty', '₹843/kg (Sep 2026)', 'B3'],
    ['Domestic quotes', 'One distributor since Mar 2025', 'B3'],
  ],
  'kunal-growth': [['Marketing, FY24 → FY26', '₹28.9 cr → ₹39.3 cr', 'F'], ['Marketing, share of NR', 'about 30% in both years', 'Calc'], ['CM3 swing', '−₹19.5 cr', 'BP · Calc'], ['A flat 20% cut', 'saves ₹7.9 cr a year', 'Calc']],
  'kunal-bcaa': [
    ['BCAA jars, Apr → Sep 2026', '1,000 → 600 (−40%)', 'F'],
    ['BCAA D2C marketing, Apr → Sep 2026', '₹1.9 lakh → ₹0.7 lakh (−63%)', 'F'],
    ['BCAA CM3, Apr → Sep 2026', '27% → 30%', 'F'],
    ['BCAA NR, Sep 2026', '₹5.8 lakh', 'F'],
    ['D2C tubs, CM3', 'about −30%', 'F · A'],
    ['BCAA share of NR at the September run-rate', 'about 0.5%', 'Calc'],
  ],
  'kunal-qc': [['Signed quick-commerce rate card', 'Not in the records', ''], ['External estimate of the take', '45% to 55%', 'Ext'], ['CFO’s remark', '30%+ before ads', 'K']],
  'vikram-rank': [['Amazon best-seller rank, Anvil', '#3 → #6 (Q1 FY25 → Q2 FY27)', 'L'], ['Brand B', '#6 → #3', 'L'], ['Brand C', '#8 → #4', 'L'], ['Anvil click share', '24% → 18%', 'F']],
  'vikram-search': [['Amazon searches for whey protein (index)', '100 → 79 (−21%)', 'F'], ['Anvil click share', '24% → 18%', 'F'], ['Anvil clicks (index × share)', '−41%', 'Calc'], ['Share of the fall in the last three quarters', 'about half', 'Calc']],
  procurement: [['Plant X, FY26 by quarter', '82, 88, 90 and 96 t', 'C1'], ['FY26 average', '89 t a quarter', 'Calc'], ['Quarters under the 90 t tier', '2', 'C1']],
  plants: [['Plant X cumulative capex', '₹52 cr → ₹150 cr', 'E'], ['Combined tub-line capacity', '380 → 380 t a quarter (peak 440)', 'E'], ['Sachet and stick-pack lines', '0 → 340 t a quarter', 'E'], ['RTD lines', '0 → 180 t a quarter', 'E'], ['Conversion rate', '₹110 → ₹114 → ₹120 per kg', 'B1']],
  sinha: [['Reported utilisation, both plants', '81% → 89%', 'E']],
  meera: [['Reel performance data', 'Not in the records', '']],
};
const CALC = {
  arjun: [
    { formula: 'everyday discount = average of the ten months other than Oct and Nov', inputs: `FY26 D2C: ${disc.d2c.FY26.filter((_, i) => i !== 6 && i !== 7).join(', ')}`, result: `${num(everydayDiscount(disc.d2c.FY26), { dp: 1 })}%` },
    { formula: 'festive premium = average of Oct and Nov − everyday discount', inputs: `FY24: (17 + 16) ÷ 2 − 13.5; FY26: (32 + 31) ÷ 2 − 28.9`, result: `${num(festivePremium(disc.d2c.FY24), { dp: 1 })} → ${num(festivePremium(disc.d2c.FY26), { dp: 1 })} points` },
  ],
  rhea: [{ formula: 'ROAS on new buyers = reported ROAS × (1 − existing customers’ share)', inputs: '3.5 × (1 − 24%); 3.3 × (1 − 59%)', result: `${num(nb[0], { dp: 2 })} → ${num(nb[2], { dp: 2 })}, ${num(pctChange(nb[0], nb[2]))}%` }],
  karan: [
    { formula: 'COD share of RTOs = COD share × COD RTO ÷ (COD share × COD RTO + prepaid share × prepaid RTO)', inputs: '52 × 26 ÷ (52 × 26 + 48 × 2)', result: `${num(codShareOfRto(52, 26, 2))}%` },
    { formula: 'paid CAC = D2C-destined performance spend ÷ paid new customers', inputs: 'FY26: ₹12.6 cr ÷ 0.50 lakh', result: '₹2,520 (FY24 ₹1,948, +29%)' },
  ],
  kunal: [
    { formula: 'whey share of CM2 lost = whey cost rise ÷ NR', inputs: '₹7.7 cr ÷ ₹128.7 cr', result: `${num(7.7 / 128.7 * 100)} of the 17.9 points` },
    { formula: 'fees per kg = marketplace fees ÷ tonnes sold', inputs: '(₹11.67 cr + ₹8.47 cr) ÷ 590 t', result: `₹${num((11.67 + 8.47) * 1e7 / 590e3)}` },
  ],
  'kunal-growth': [{ formula: 'share of the swing = marketing rise ÷ CM3 swing', inputs: '10.4 ÷ 19.5', result: `${num(10.4 / 19.5 * 100)}%, about half` }],
  'kunal-bcaa': [{ formula: 'share of NR = September NR × 12 ÷ FY26 NR', inputs: '₹5.8 lakh × 12 ÷ ₹128.7 cr', result: `${num(5.8e5 * 12 / 128.7e7 * 100, { dp: 1 })}%` }],
  'vikram-search': [{ formula: 'clicks = search index × click share', inputs: `100 × 24 → 79 × 18`, result: `${num(clicks[0])} → ${num(clicks.at(-1))}, ${num(pctChange(clicks[0], clicks.at(-1)))}%` }],
  procurement: [{ formula: 'average = FY26 tonnes ÷ 4', inputs: '356 t ÷ 4', result: '89 t a quarter' }],
};
const CAVEATS = {
  rhea: 'No site-conversion data is in the records, so the conversion claim cannot be tested.',
  'kunal-qc': 'No signed quick-commerce rate card is on file. The 45% to 55% band is an external research estimate.',
  meera: 'A remark, not a record: no reel data is on file.',
  karan: 'Reported ROAS is platform-attributed and 7-day click; 59% of attributed purchases came from existing customers.',
};

const items = {};
for (const c of CLAIMS) {
  items[c.id] = {
    kind: 'claim',
    label: `${who(c)}: ${c.topic}`,
    search: `${PEOPLE[c.person].name} ${c.topic} claim`,
    value: verdictText(c),
    quote: c.quote,
    who: who(c),
    verdicts: verdictHTML(c),
    records: c.records,
    src: c.src,
    used: USED[c.id],
    calc: CALC[c.id],
    caveat: CAVEATS[c.id] || (['I', 'J', 'K'].some((x) => c.src.includes(x)) ? 'Chats are opinions, not records, unless they quote a record.' : undefined),
  };
}
const ev = (label, value, src, used, calc) => ({ label, value, src, used, calc });
Object.assign(items, {
  'ev-arjun-everyday': ev('Everyday D2C discount', '13.5% (FY24) to 28.9% (FY26)', ['F', 'Calc'], USED.arjun.slice(0, 2).concat([USED.arjun[4], USED.arjun[5]]), [CALC.arjun[0]]),
  'ev-arjun-festive': ev('Festive premium, D2C', '3.0 points (FY24) to 2.6 points (FY26)', ['F', 'Calc'], USED.arjun.slice(0, 4), [CALC.arjun[1]]),
  'ev-rhea-mkt': ev('Marketing rise against the CM3 swing', '+₹10.4 cr, about half of −₹19.5 cr', ['F', 'BP'], USED['kunal-growth'].slice(0, 3), CALC['kunal-growth']),
  'ev-rhea-roas': ev('ROAS on new buyers', '2.66 (FY24) to 1.35 (FY26), −49%', ['F', 'Calc'], USED.rhea.slice(4, 7), CALC.rhea),
  'ev-karan-logistics': ev('Logistics against marketplace fees', 'Logistics bill ₹2.35 cr; contract rate rises ₹0.47 cr; fees 7.6% → 15.6% of NR', ['H', 'A', 'G'], USED.karan.slice(0, 3)),
  'ev-karan-rto': ev('RTO, COD against prepaid', 'COD 8% → 26%; prepaid 2%; COD 93% of D2C RTOs', ['F', 'Calc'], USED.karan.slice(3, 7), [CALC.karan[0]]),
  'ev-karan-cac': ev('Paid CAC', '₹1,948 (FY24) to ₹2,520 (FY26), +29%', ['F', 'Calc'], USED.karan.slice(7, 10), [CALC.karan[1]]),
  'ev-kunal-quote': ev('Domestic WPC80 quote', '₹790 (Q1 FY24) to ₹1,024 (Oct 2026), +30%', ['B3'], USED.kunal.slice(0, 4).concat([USED.kunal[8], USED.kunal[9]])),
  'ev-kunal-whey': ev('Whey cost per kg of product', '₹740 → ₹870 (+17.6%): ₹7.7 cr, 6 of the 17.9 points of CM2 lost', ['D', 'BP', 'Calc'], USED.kunal.slice(4, 7), [CALC.kunal[0]]),
  'ev-kunal-fees': ev('Marketplace fees per kg', '₹181 → ₹341', ['A', 'G'], [USED.kunal[7], ['Fees, Amazon, FY26', '₹11.67 cr', 'G'], ['Fees, Flipkart, FY26', '₹8.47 cr', 'G']], [CALC.kunal[1]]),
  'rhea-quote': ev('Rhea’s conversion figures', '3.1% → 2.3%, as claimed', ['I'], [['Site conversion, as claimed', '3.1% → 2.3%', 'I'], ['Site-conversion data', 'Not in the records', '']]),
  'karan-quote': ev('Karan’s ROAS figure', '3.4x on 7-day click, as claimed', ['I', 'F'], [['Reported Meta ROAS, FY25', '3.4x', 'F'], ['Reported Meta ROAS, FY26', '3.3x', 'F']]),
  'kunal-quote': ev('Kunal’s whey figure', 'about 30% since FY24, as claimed', ['K', 'B3'], USED.kunal.slice(0, 4)),
});
register('claims', items);

/* ---------- Filters (screen state, not part of the scenario) ---------- */
const filter = { verdict: 'all', person: 'all' };
const matches = (c) => (filter.verdict === 'all' || c.verdicts.some((v) => v.v === filter.verdict)) && (filter.person === 'all' || c.person === filter.person);

function filtersHTML() {
  const vOpts = [['all', 'All', null], ...Object.entries(VERDICTS).map(([k, v]) => [k, v.label, v])];
  const people = ['all', ...new Set(CLAIMS.map((c) => c.person))];
  const vc = (k, label, v) => `<button type="button" role="radio" class="fchip" data-value="${k}" aria-checked="${filter.verdict === k}" tabindex="${filter.verdict === k ? 0 : -1}">${v ? icon(v.icon, { size: 16, cls: `tone-${v.tone}-ic` }) : ''}<span>${esc(label)}</span></button>`;
  const pc = (p) => `<button type="button" role="radio" class="fchip" data-value="${p}" aria-checked="${filter.person === p}" tabindex="${filter.person === p ? 0 : -1}"><span>${esc(p === 'all' ? 'Everyone' : PEOPLE[p].name)}</span></button>`;
  const shown = CLAIMS.filter(matches).length;
  return `<div class="filters">
  <div class="filter-row"><span class="label" id="cf-v">Verdict</span><div class="fchips" role="radiogroup" aria-labelledby="cf-v" data-bind="ui:verdict">${vOpts.map(([k, l, v]) => vc(k, l, v)).join('')}</div></div>
  <div class="filter-row"><span class="label" id="cf-p">Who</span><div class="fchips" role="radiogroup" aria-labelledby="cf-p" data-bind="ui:person">${people.map(pc).join('')}</div></div>
  <p class="muted small" role="status">${shown} of ${CLAIMS.length} claims shown</p>
</div>`;
}

/* ---------- Leader cards ---------- */
function arjunChart() {
  const id = 'cl-arjun';
  const months = [];
  for (const fy of ['FY24', 'FY25', 'FY26']) disc.months.forEach((m, i) => months.push({ fy, m, i, year: (fy === 'FY24' ? 2023 : fy === 'FY25' ? 2024 : 2025) + (i >= 9 ? 1 : 0) }));
  const mk = (key, label, cls, dash) => ({
    key, label, cls, dash, marker: 'none', hitR: 7, endLabel: `${label} ${disc[key].FY26[11]}%`,
    pts: months.map((mo, j) => ({ x: j, y: disc[key][mo.fy][mo.i], xLabel: `${mo.m} ${mo.year}`, text: `${disc[key][mo.fy][mo.i]}% off MRP`,
      tip: { title: `${label}, ${mo.m} ${mo.year}${mo.i === 6 || mo.i === 7 ? ' (festive)' : ''}`, value: `${disc[key][mo.fy][mo.i]}% discount to MRP`, src: ['F'] } })),
  });
  const series = [mk('d2c', 'D2C', 'ln-1', false), mk('amazon', 'Amazon', 'ln-2', false), mk('flipkart', 'Flipkart', 'ln-3', true)];
  const bands = [6, 18, 30].map((s, k) => ({ x0: s - 0.5, x1: s + 1.5, label: k === 0 ? 'Oct–Nov' : '', cls: 'xband' }));
  const svg = lineChart({ id, w: widthOf(id, 480), h: 230, title: 'Monthly discount to MRP, Apr 2023 to Mar 2026', desc: 'D2C, Amazon and Flipkart discounts. D2C everyday discount rose from about 13% to about 29%, stepping up after SAVE10 went to coupon aggregators in Feb 2025; Oct and Nov festive months are shaded.', xDomain: [-0.5, 35.5], xTicks: [{ v: 0, label: 'Apr 2023', anchor: 'start' }, { v: 12, label: 'Apr 2024' }, { v: 24, label: 'Apr 2025' }, { v: 35, label: 'Mar 2026', anchor: 'end' }], yDomain: [8, 34], yTicks: [10, 20, 30], yFmt: (v) => `${v}%`, series, bands, vlines: [{ x: 22, label: 'SAVE10 given to coupon aggregators', cls: 'acc', anchor: 'end', dy: 6 }], m: { t: 22 } });
  const head = ['Month', 'D2C %', 'Amazon %', 'Flipkart %'];
  const tbl = setTable(id, 'Monthly discount to MRP', head, months.map((mo) => [`${mo.m} ${mo.year}`, disc.d2c[mo.fy][mo.i], disc.amazon[mo.fy][mo.i], disc.flipkart[mo.fy][mo.i]]));
  return chartFrame({ id, title: 'Monthly discount to MRP', sub: 'Festive Oct and Nov shaded; marker at Feb 2025', item: 'ev-arjun-everyday', svg, table: tbl });
}

function rheaChart() {
  const id = 'cl-rhea';
  const yrs = ['FY24', 'FY25', 'FY26'];
  const w = widthOf(id, 480);
  const half = Math.max(160, Math.floor((w - 12) / 2));
  const a = lineChart({ id: `${id}-a`, w: half, h: 200, title: 'Existing customers’ share of platform-attributed purchases', desc: '24%, 42%, 59% from FY24 to FY26.', xDomain: [-0.3, 2.3], xTicks: yrs.map((y, i) => ({ v: i, label: y })), yDomain: [0, 70], yTicks: [0, 30, 60], yFmt: (v) => `${v}%`, endLabels: false, m: { r: 20, l: 36 },
    series: [{ key: 'ex', label: 'Existing customers’ share', cls: 'ln-1', marker: 'filled', r: 4, pts: G.existingShare.v.map((v, i) => ({ x: i, y: v, xLabel: yrs[i], text: `${v}%`, label: `${v}%`, item: 'ev-rhea-roas', tip: { title: `Existing customers’ share, ${yrs[i]}`, value: `${v}% of attributed purchases`, src: ['F'] } })) }] });
  const b = lineChart({ id: `${id}-b`, w: half, h: 200, title: 'Reported Meta ROAS, 7-day click', desc: '3.5, 3.4, 3.3 from FY24 to FY26.', xDomain: [-0.3, 2.3], xTicks: yrs.map((y, i) => ({ v: i, label: y })), yDomain: [0, 4], yTicks: [0, 2, 4], yFmt: (v) => `${v}x`, endLabels: false, m: { r: 20, l: 32 },
    series: [{ key: 'roas', label: 'Reported ROAS', cls: 'ln-2', marker: 'filled', r: 4, pts: G.roas.v.map((v, i) => ({ x: i, y: v, xLabel: yrs[i], text: `${num(v, { dp: 1 })}x`, label: `${num(v, { dp: 1 })}x`, item: 'ev-rhea-roas', tip: { title: `Reported Meta ROAS, ${yrs[i]}`, value: `${num(v, { dp: 1 })}x`, rows: [['On new buyers', `${num(nb[i], { dp: 2 })}x`]], src: ['F'], formula: 'new-buyer ROAS = ROAS × (1 − existing share)' } })) }] });
  const svg = `<div class="small-multiples"><div><p class="label">Existing customers’ share</p>${a}</div><div><p class="label">Reported ROAS</p>${b}</div></div>`;
  const tbl = setTable(id, 'Existing customers’ share against reported ROAS', ['Year', 'Existing customers’ share %', 'Reported ROAS x', 'ROAS on new buyers x'], yrs.map((y, i) => [y, G.existingShare.v[i], num(G.roas.v[i], { dp: 1 }), num(nb[i], { dp: 2 })]));
  return chartFrame({ id, title: 'Who the ads reached', sub: 'Platform-attributed purchases by existing customers, against reported ROAS', item: 'ev-rhea-roas', svg, table: tbl });
}

function karanChart() {
  const id = 'cl-karan';
  const yrs = ['FY24', 'FY25', 'FY26'];
  const series = [
    { key: 'cod', label: 'COD', endLabel: 'COD 26%', cls: 'ln-1', marker: 'filled', r: 4, pts: G.rtoCod.v.map((v, i) => ({ x: i, y: v, xLabel: yrs[i], text: `${v}% RTO`, label: `${v}%`, item: 'ev-karan-rto', tip: { title: `RTO on shipped COD orders, ${yrs[i]}`, value: `${v}%`, rows: [['COD share of D2C orders', `${G.codShare.v[i]}%`]], src: ['F'] } })) },
    { key: 'pre', label: 'Prepaid', endLabel: 'Prepaid 2%', cls: 'ln-3', dash: true, marker: 'filled', r: 4, pts: G.rtoPrepaid.v.map((v, i) => ({ x: i, y: v, xLabel: yrs[i], text: `${v}% RTO`, label: i === 0 ? `${v}%` : '', dy: 16, item: 'ev-karan-rto', tip: { title: `RTO on shipped prepaid orders, ${yrs[i]}`, value: `${v}%`, src: ['F'] } })) },
  ];
  const svg = lineChart({ id, w: widthOf(id, 480), h: 210, title: 'RTO rate on COD against prepaid D2C orders', desc: 'COD 8%, 17%, 26%; prepaid 2% in every year, FY24 to FY26.', xDomain: [-0.3, 2.3], xTicks: yrs.map((y, i) => ({ v: i, label: y })), yDomain: [0, 30], yTicks: [0, 10, 20, 30], yFmt: (v) => `${v}%`, series });
  const tbl = setTable(id, 'RTO rate, COD against prepaid', ['Year', 'COD RTO %', 'Prepaid RTO %', 'COD share of D2C orders %'], yrs.map((y, i) => [y, G.rtoCod.v[i], G.rtoPrepaid.v[i], G.codShare.v[i]]));
  return chartFrame({ id, title: 'RTO on shipped D2C orders', sub: 'Cash on delivery (COD) against prepaid', item: 'ev-karan-rto', svg, table: tbl });
}

function kunalChart() {
  const id = 'cl-kunal';
  const xs = [1, 13, 25, 42];
  const series = [{ key: 'dom', label: 'Domestic quote', endLabel: '', cls: 'ln-1', marker: 'filled', r: 4,
    pts: WPC80_DOMESTIC.points.map((p, i) => ({ x: xs[i], y: p.v, xLabel: p.when, text: `₹${num(p.v)}/kg`, label: `₹${num(p.v)}`, anchor: i === 3 ? 'end' : 'middle', dx: i === 3 ? -6 : 0, item: 'ev-kunal-quote', tip: { title: `Domestic WPC80 quote, ${p.when}`, value: `₹${num(p.v)} per kg of WPC80`, src: ['B3'] } })) }];
  const svg = lineChart({ id, w: widthOf(id, 480), h: 210, title: 'Domestic WPC80 quote against the imported landed price', desc: 'Domestic quote ₹790 (Q1 FY24), ₹853 (Q1 FY25), ₹928 (Q1 FY26), ₹1,024 (Oct 2026); imported landed price ₹843 (Sep 2026).', xDomain: [-1, 44], xTicks: WPC80_DOMESTIC.points.map((p, i) => ({ v: xs[i], label: p.when, anchor: i === 0 ? 'start' : i === 3 ? 'end' : 'middle' })), yDomain: [700, 1100], yTicks: [700, 800, 900, 1000, 1100], yFmt: (v) => `₹${num(v)}`, series, endLabels: false, refs: [{ y: WPC80_IMPORT.landed, label: 'Imported, landed: ₹843 (Sep 2026)', cls: 'accent', anchor: 'start', below: true }], m: { l: 52, r: 20 } });
  const tbl = setTable(id, 'WPC80 prices, ₹ per kg', ['When', 'Domestic quote ₹/kg', 'Source'], [...WPC80_DOMESTIC.points.map((p) => [p.when, num(p.v), 'B3']), ['Sep 2026, imported landed', '843', 'B3']]);
  return chartFrame({ id, title: 'WPC80, ₹ per kg', sub: 'Domestic quote, with the imported landed price as a reference', item: 'ev-kunal-quote', svg, table: tbl });
}

const EVIDENCE = {
  arjun: [['Everyday D2C discount, FY24 to FY26', '13.5% to 28.9%', 'ev-arjun-everyday'], ['Festive premium, D2C', '3.0 to 2.6 points', 'ev-arjun-festive'], ['CM3, festive Q3 FY26 against non-festive Q4', '−7% against −10%', 'quarters-q3']],
  rhea: [['Site-conversion data', null, null], ['Marketing rise, FY24 to FY26', '+₹10.4 cr of a −₹19.5 cr swing', 'ev-rhea-mkt'], ['ROAS on new buyers', '2.66 to 1.35 (−49%)', 'ev-rhea-roas']],
  karan: [['Whole FY26 logistics bill', '₹2.35 cr; rate rises ₹0.47 cr', 'ev-karan-logistics'], ['RTO on COD against prepaid', '8% → 26% against 2%', 'ev-karan-rto'], ['Paid CAC, FY24 to FY26', '₹1,948 to ₹2,520 (+29%)', 'ev-karan-cac']],
  kunal: [['Domestic WPC80 quote', '₹790 to ₹1,024 (+30%)', 'ev-kunal-quote'], ['Whey per kg of product', '₹740 to ₹870 (+17.6%)', 'ev-kunal-whey'], ['Marketplace fees per kg', '₹181 to ₹341', 'ev-kunal-fees']],
};
const CHARTS = { arjun: arjunChart, rhea: rheaChart, karan: karanChart, kunal: kunalChart };
const QUOTE_CHIP = { rhea: 'rhea-quote', karan: 'karan-quote', kunal: 'kunal-quote' };

function card(c) {
  const p = PEOPLE[c.person];
  const evid = EVIDENCE[c.id].map(([k, v, item]) => `<li><span class="ev-k">${T(k)}</span><span class="ev-v">${v ? `${esc(v)}${chip(item)}` : notInRecords('site-conversion data')}</span></li>`).join('');
  return `<article class="claim-card card" aria-labelledby="cc-${c.id}">
  <div class="claim-who"><h3 class="claim-name" id="cc-${c.id}">${esc(p.name)}</h3><span class="claim-role">${T(p.role === 'Amazon KAM' ? 'Amazon [[KAM]]' : p.role)} · ${esc(c.topic)}</span></div>
  <blockquote class="claim-quote">“${T(c.quote.replace('RTO', '[[RTO]]').replace('COD problem', '[[COD]] problem').replace('ROAS', '[[ROAS]]'))}”${QUOTE_CHIP[c.id] ? chip(QUOTE_CHIP[c.id]) : ''}</blockquote>
  <div class="verdicts">${verdictHTML(c)}</div>
  <ul class="evidence" role="list">${evid}</ul>
  <div data-region="chart:${c.id}"></div>
  <div class="records"><span class="label">What the records show</span>${esc(c.records)} ${chip(c.id)}</div>
  <div class="claim-foot"><button type="button" class="btn btn-sm" data-item="${c.id}">${icon('file-text', { size: 16 })}<span>See evidence</span></button></div>
</article>`;
}

function grid() {
  const featured = CLAIMS.filter((c) => c.featured && matches(c));
  if (!featured.length) return `<div class="card empty-state">No leader claims match these filters.</div>`;
  return `<div class="claims-grid">${featured.map(card).join('')}</div>`;
}

function others() {
  const rows = CLAIMS.filter((c) => !c.featured && matches(c));
  if (!rows.length) return `<div class="card empty-state">No other claims match these filters.</div>`;
  return `<div class="card"><div class="tbl-wrap"><table class="tbl stack"><caption class="sr-only">Other claims, with verdicts</caption>
  <thead><tr><th scope="col">Who</th><th scope="col">Claim</th><th scope="col">Verdict</th><th scope="col">What the records show</th><th scope="col" class="r">Source</th></tr></thead>
  <tbody>${rows.map((c) => `<tr class="row-link" data-item="${c.id}" tabindex="0" aria-label="${esc(`${who(c)}: ${c.topic}. ${verdictText(c)}. Open evidence`)}">
    <th scope="row" data-label="Who">${esc(PEOPLE[c.person].name)}<div class="muted small">${esc(PEOPLE[c.person].role)}</div></th>
    <td data-label="Claim" class="wrap">“${esc(c.quote)}”</td>
    <td data-label="Verdict">${verdictHTML(c)}</td>
    <td data-label="What the records show" class="wrap">${esc(c.records)}</td>
    <td data-label="Source" class="r">${chip(c.id)}</td></tr>`).join('')}</tbody></table></div></div>`;
}

export default {
  id: 'claims',
  title: 'Claims vs records',
  tab: 'Claims',
  group: 'Understand',
  icon: 'scale',
  keywords: 'claims verdicts leaders arjun rhea karan kunal vikram evidence',
  render() {
    return `${screenHead({
      headline: 'Each leader’s story holds a piece of the truth. None of them explains the fall.',
      meaning: 'The records point to everyday discounting, higher marketplace fees and marketing that stopped finding new buyers.',
    })}
<div data-region="filters"></div>
<div data-region="grid"></div>
${section({ id: 'cl-other-s', title: 'Other claims', sub: 'Chats are opinions, not records, unless they quote a record. Click a row for the evidence.', body: '<div data-region="others"></div>' })}`;
  },
  region(key) {
    if (key === 'filters') return filtersHTML();
    if (key === 'grid') return grid();
    if (key === 'others') return others();
    if (key.startsWith('chart:')) {
      const id = key.slice(6);
      const c = CLAIMS.find((x) => x.id === id);
      return c && matches(c) && CHARTS[id] ? CHARTS[id]() : '';
    }
    return null;
  },
  actions: {
    verdict: (el, e, ctx) => { filter.verdict = ctx.value; ctx.refresh(); },
    person: (el, e, ctx) => { filter.person = ctx.value; ctx.refresh(); },
  },
};

