// 4.2 Where CM3 went: the FY24 to FY26 bridge, by channel, per kg, by quarter, and the tonnes.
import { BRIDGE, BRIDGE_GROUPS, CHANNEL, FY26_QUARTERS, VOLUME_FY26, GROWTH } from '../../data.js';
import { bridgeSteps, bridgeGroupTotal, costRiseCr, everydayDiscount, pctChange } from '../../model.js';
import { num, pct, crore } from '../../format.js';
import { chip, T, section, screenHead, chartFrame, esc, icon } from '../components.js';
import { bridgeChart, columnChart, hbars, widthOf, setTable } from '../charts.js';
import { register } from '../registry.js';

const d2c = GROWTH.discounts.d2c;
const BRIDGE_CALC = {
  volume: [{ formula: 'volume and mix = volume + mix', inputs: '+19.2 − 4.8', result: '+₹14.4 cr' }],
  price: [
    { formula: 'price and discounts = D2C + marketplaces', inputs: '−6.0 − 4.0', result: '−₹10.0 cr' },
    { formula: 'everyday D2C discount = average of the ten non-festive months', inputs: `FY24 ${num(everydayDiscount(d2c.FY24), { dp: 1 })}%, FY26 ${num(everydayDiscount(d2c.FY26), { dp: 1 })}%`, result: '13.5% to 28.9%' },
    { formula: 'ex-GST price = MRP ÷ (1 + GST rate)', inputs: '₹3,260 ÷ 1.18 and ₹2,901 ÷ 1.05', result: `₹${num(3260 / 1.18)} and ₹${num(2901 / 1.05)}: the ex-GST price stayed ₹2,763` },
  ],
  marketing: [{ formula: 'marketing change = FY26 − FY24', inputs: '₹39.3 cr − ₹28.9 cr', result: '+₹10.4 cr of spend, −₹10.4 cr of CM3' }],
  whey: [{ formula: 'whey = (FY26 − FY24 whey per kg of product) × tonnes sold', inputs: '(₹870 − ₹740) × 590 t', result: `${crore(costRiseCr(130, 590), { dp: 2 })}, shown as −₹7.7 cr` }],
  conversion: [{ formula: 'conversion, flavour and pack = rise per kg × tonnes sold', inputs: '(+₹10 conversion + ₹5 flavour + ₹5 pack) × 590 t', result: `${crore(costRiseCr(20, 590), { dp: 2 })}, shown as −₹1.2 cr` }],
  fees: [{ formula: 'fee rates = fee-rate rise × marketplace NR', inputs: '5 points × ₹96.9 cr', result: `₹${num(0.05 * 96.9, { dp: 2 })} cr, shown as −₹4.8 cr` }],
  rounding: [{ formula: 'rounding = FY26 CM3 − FY24 CM3 − sum of the rounded bars', inputs: '−6.8 − 12.7 − (−19.6)', result: '+₹0.1 cr' }],
};
const BRIDGE_USED = {
  fy24: [['CM3, FY24', '+₹12.7 cr · 13.1% of NR', 'BP']],
  fy26: [['CM3, FY26', '−₹6.8 cr · −5.3% of NR', 'BP']],
  volume: [['Volume', '+₹19.2 cr', 'D · H · F'], ['Mix, as sales shifted to marketplaces', '−₹4.8 cr', 'D · H · F'], ['Tonnes sold', '410 t to 590 t', 'Calc'], ['Marketplace share of tonnes dispatched', '48% to 72%', 'Calc']],
  price: [['D2C', '−₹6.0 cr', 'F'], ['Marketplaces', '−₹4.0 cr', 'F'], ['Everyday D2C discount', '13.5% to 28.9%', 'F'], ['MRP of the 1 kg tub, with GST', '₹3,260 to ₹2,901 on 22 Sep 2025', 'F']],
  marketing: [['Marketing, FY24', '₹28.9 cr', 'F'], ['Marketing, FY26', '₹39.3 cr', 'F'], ['Share of NR', 'about 30% in both years', 'Calc']],
  whey: [['Whey per kg of product, FY24 actual', '₹740', 'D'], ['Whey per kg of product, FY26 standard', '₹870 (+17.6%)', 'D'], ['Tonnes sold, FY26', '590 t', 'D']],
  conversion: [['Conversion', '₹110 to ₹120 per kg', 'C1 · C2'], ['Flavour and premix', '₹100 to ₹105 per kg', 'D'], ['Tub, scoop, seal and label', '₹120 to ₹125 per kg', 'D'], ['Tonnes sold, FY26', '590 t', 'D']],
  fees: [['Amazon all-in fee rate', '15% to 20% of selling price ex-GST', 'A'], ['Flipkart all-in fee rate', '17% to 22% of selling price ex-GST', 'A'], ['Marketplace NR, FY26', '₹96.9 cr', 'A · G']],
  logistics: [['FY26 logistics bill', '₹2.35 cr (₹2,34,67,100 ex-GST)', 'H'], ['Rate rises, courier and warehouse contracts', '₹0.47 cr', 'H']],
  rounding: [['Rounded bars', 'tie to the total within ₹0.1 cr', 'Calc']],
};

const items = {};
for (const b of BRIDGE) {
  items[`bridge-${b.key}`] = {
    label: b.total ? b.label : `Bridge: ${b.label}`,
    search: `bridge ${b.label}`,
    value: `${crore(b.v, { sign: true })}`,
    src: b.src,
    note: b.basis,
    used: BRIDGE_USED[b.key],
    calc: BRIDGE_CALC[b.key],
    caveat: b.key === 'rounding' ? 'Bars are rounded; a ₹0.1 cr bar closes the bridge.' : undefined,
  };
}
items['bridge-growth'] = {
  label: 'Net cost of growth', search: 'growth volume price marketing bridge group',
  value: '−₹6.0 cr (−5.9 before rounding)', src: ['D', 'H', 'F', 'Calc'],
  used: [['Volume and mix', '+₹14.4 cr', 'D · H · F · Calc'], ['Price and discounts', '−₹10.0 cr', 'F · Calc'], ['Marketing', '−₹10.4 cr', 'F']],
  calc: [{ formula: 'net cost of growth = volume and mix + price + marketing', inputs: '+14.4 − 10.0 − 10.4', result: `${crore(bridgeGroupTotal('growth'), { sign: true })}` }],
};
items['bridge-cost'] = {
  label: 'Cost never priced through', search: 'whey conversion fee rates cost bridge group',
  value: '−₹13.7 cr', src: ['D', 'C1', 'C2', 'A', 'G'],
  used: [['Whey', '−₹7.7 cr', 'D'], ['Conversion, flavour and pack', '−₹1.2 cr', 'C1 · C2 · D'], ['Marketplace fee rates', '−₹4.8 cr', 'A · G']],
  calc: [{ formula: 'cost never priced through = whey + conversion, flavour and pack + fee rates', inputs: '−7.7 − 1.2 − 4.8', result: `${crore(bridgeGroupTotal('cost'), { sign: true })}` }],
};
items['bridge-other'] = {
  label: 'Logistics and rounding', value: '+₹0.2 cr', src: ['H', 'F', 'Calc'],
  used: [['Logistics, net of volume', '+₹0.1 cr', 'H · F'], ['Rounding', '+₹0.1 cr', 'Calc']],
};
items.channel = {
  label: 'CM3 by channel, FY24 and FY26', search: 'channel d2c marketplaces amazon flipkart cm2 cm3',
  value: 'D2C CM3 +₹7.3 cr to −₹9.6 cr; marketplaces +₹5.5 cr to +₹2.8 cr', src: CHANNEL.src,
  used: CHANNEL.rows.flatMap((r) => CHANNEL.cols.map((c, i) => [`${r.label}, ${c.ch} ${c.fy}`, crore(r.v[i], { sign: r.key === 'cm3' }), 'A · F · G'])),
  calc: [
    { formula: 'CM3 = CM2 − marketing aimed at the channel', inputs: 'D2C FY26: 9.2 − 18.8', result: '−₹9.6 cr' },
    { formula: 'CM3 = CM2 − marketing aimed at the channel', inputs: 'Marketplaces FY26: 23.3 − 20.5', result: '+₹2.8 cr' },
    { formula: 'marketing aimed at D2C, FY26 = performance to D2C + influencer to D2C + CRM', inputs: '12.6 + 4.2 + 2.0', result: '₹18.8 cr' },
  ],
  caveat: CHANNEL.footnote,
};
items['cm2-marketplace'] = {
  label: 'FY26 CM2 by marketplace', value: 'Amazon ₹14.5 cr, Flipkart ₹8.8 cr', src: ['A'],
  used: [['CM2, Amazon', '₹14.5 cr', 'A'], ['CM2, Flipkart', '₹8.8 cr', 'A'], ['CM2, D2C (by difference)', '₹9.2 cr', 'A'], ['CM2, total', '₹32.5 cr', 'A'], ['NR, Amazon', '₹58.4 cr', 'A · G'], ['NR, Flipkart', '₹38.5 cr', 'A · G']],
};
items['perkg-cm2'] = {
  label: 'CM2 per kg sold', search: 'cm2 per kg', value: 'about ₹1,015 (FY24) to about ₹550 (FY26)', src: ['Calc'],
  used: [['CM2, FY24', '43.1% of NR', 'BP'], ['NR, FY24, built up from orders', 'about ₹96.6 cr', 'F · Calc'], ['Tonnes sold, FY24', '410 t', 'Calc'], ['CM2, FY26', '25.2% of NR', 'BP'], ['NR, FY26', '₹128.7 cr', 'A'], ['Tonnes sold, FY26', '590 t', 'D']],
  calc: [
    { formula: 'CM2 per kg = CM2 share × NR ÷ tonnes sold', inputs: '43.1% × ₹96.6 cr ÷ 410 t', result: `about ₹${num(0.431 * 96.6e7 / 410e3)}` },
    { formula: 'CM2 per kg = CM2 share × NR ÷ tonnes sold', inputs: '25.2% × ₹128.7 cr ÷ 590 t', result: `about ₹${num(0.252 * 128.7e7 / 590e3)}` },
  ],
};
items['perkg-mkt'] = {
  label: 'Marketing per kg sold', value: 'about ₹705 (FY24) to ₹666 (FY26), about 30% of NR in both years', src: ['Calc', 'F'],
  used: [['Marketing, FY24', '₹28.9 cr', 'F'], ['Tonnes sold, FY24', '410 t', 'Calc'], ['Marketing, FY26', '₹39.3 cr', 'F'], ['Tonnes sold, FY26', '590 t', 'D']],
  calc: [
    { formula: 'marketing per kg = marketing ÷ tonnes sold', inputs: '₹28.9 cr ÷ 410 t', result: `about ₹${num(28.9e7 / 410e3)}` },
    { formula: 'marketing per kg = marketing ÷ tonnes sold', inputs: '₹39.3 cr ÷ 590 t', result: `₹${num(39.3e7 / 590e3)}` },
  ],
};
items['tonnes-sold'] = {
  label: 'Tonnes sold', value: '410 t (FY24) to 590 t (FY26), +44%', src: ['Calc', 'D'],
  used: [['Tonnes sold, FY24', '410 t', 'Calc'], ['Tonnes sold, FY26', '590 t', 'D']],
  calc: [{ formula: 'growth = FY26 ÷ FY24 − 1', inputs: '590 ÷ 410 − 1', result: `+${num(pctChange(410, 590))}%` }],
};
items['mp-share'] = {
  label: 'Marketplace share of tonnes dispatched', value: '48% (FY24) to 72% (FY26)', src: ['Calc', 'H'],
  used: [['Dispatched to Amazon, FY26', '261 t', 'H'], ['Dispatched to Flipkart, FY26', '172 t', 'H'], ['Dispatched to the D2C hub, FY26', '166 t', 'H'], ['Dispatched, FY26', '599 t', 'H'], ['Marketplace share, FY24', '48%', 'Calc']],
  calc: [{ formula: 'share = (Amazon + Flipkart) ÷ dispatched', inputs: '(261 + 172) ÷ 599', result: `${num((261 + 172) / 599 * 100)}%` }],
};
items['tonnes-flow'] = {
  label: 'Where the tonnes went, FY26', search: 'made dispatched sold destroyed tonnes overbuild', value: '636 t made, 599 t dispatched, 590 t sold; 9.4 t destroyed (about ₹1.2 cr)', src: ['C1', 'C2', 'H', 'D'],
  used: [['Made at Plant X', '356 t', 'C1'], ['Made at Plant Y', 'about 280 t (93.32 lakh servings of 30 g)', 'C2'], ['Picked up from the plants', '636 t', 'H'], ['Dispatched', '599 t', 'H'], ['Sold', '590 t', 'D'], ['Destroyed', '9,400 kg, about ₹1.2 cr', 'H · D'], ['Stock destroyed, FY25', '1,800 kg', 'H']],
  calc: [{ formula: 'overbuild = made − sold', inputs: '636 t − 590 t', result: '46 t, the overbuild L8 stops' }],
};
items['quarters-q3'] = {
  label: 'Festive Q3 against non-festive Q4, FY26', value: 'Q3 −7% of NR; Q4 −10% of NR', src: ['A'],
  used: FY26_QUARTERS.labels.map((l, i) => [l, `CM3 ${pct(FY26_QUARTERS.cm3Pct[i], { dp: 0 })} of NR · NR ₹${num(FY26_QUARTERS.nr[i], { dp: 1 })} cr`, 'A']),
};
register('diagnosis', items);

function bridge() {
  const id = 'dx-bridge';
  const steps = bridgeSteps().map((s) => ({
    ...s,
    short: { volume: 'Volume, mix', price: 'Price, discounts', conversion: 'Conv., flavour, pack', fees: 'Fee rates' }[s.key],
    text: `${s.total ? num(s.v, { dp: 1, sign: true }) : num(s.v, { dp: 1, sign: true })}`,
    item: `bridge-${s.key}`,
    tip: { title: s.label, value: `${crore(s.v, { sign: true })}`, rows: s.total ? [] : [['Running total', crore(s.to, { sign: true })]], src: s.src, formula: s.basis.length < 90 ? s.basis : `${s.basis.slice(0, 88)}…` },
  }));
  const groups = [
    { label: 'Net cost of growth', keys: BRIDGE_GROUPS.growth.keys, text: '−₹6.0 cr' },
    { label: 'Cost never priced through', keys: BRIDGE_GROUPS.cost.keys, text: '−₹13.7 cr' },
  ];
  const svg = bridgeChart({ id, w: widthOf(id, 760), steps, groups, title: 'FY24 to FY26 CM3 bridge', desc: 'Horizontal waterfall in ₹ crore ex-GST, read top to bottom: FY24 CM3 +12.7, volume and mix +14.4, price and discounts −10.0, marketing −10.4, whey −7.7, conversion, flavour and pack −1.2, marketplace fee rates −4.8, logistics +0.1, rounding +0.1, FY26 CM3 −6.8.' });
  const tbl = setTable(id, 'FY24 to FY26 CM3 bridge', ['Bar', '₹ cr', 'Group', 'Basis', 'Source'], BRIDGE.map((b) => [b.label, num(b.v, { dp: 1, sign: true }), b.group ? BRIDGE_GROUPS[b.group].label : b.total ? 'Total' : '', b.basis, b.src.join(', ')]));
  return chartFrame({
    id, title: 'The bridge, ₹ cr ex-GST', sub: 'Click or press Enter on a bar for its basis and working.', item: 'bridge-fy26', svg, table: tbl,
    legend: `<p class="chart-legend"><span class="lg"><span class="lg-sw" style="background:var(--positive)"></span>Adds to CM3</span><span class="lg"><span class="lg-sw" style="background:var(--negative)"></span>Takes away</span><span class="lg"><span class="lg-sw" style="background:var(--bar-neutral)"></span>Total</span></p>`,
    note: `<span>Groups: net cost of growth <b class="neg">−₹6.0 cr</b> ${chip('bridge-growth')} · cost never priced through <b class="neg">−₹13.7 cr</b> ${chip('bridge-cost')}</span>`,
  });
}

function channelTable() {
  const head = CHANNEL.cols;
  const cell = (r, i) => {
    const v = r.v[i];
    const hl = r.key === 'cm3' && i === 1;
    return `<td class="r${hl ? ' cell-neg' : ''}" data-label="${esc(`${head[i].ch} ${head[i].fy}`)}">${esc(r.key === 'cm3' ? num(v, { dp: 1, sign: true }) : num(v, { dp: 1 }))}${hl ? '<span class="sr-only"> (loss)</span>' : ''}</td>`;
  };
  return `<div class="card">
  <div class="chart-head"><div class="chart-heading"><h3 class="chart-title">By channel</h3><p class="chart-sub">₹ cr ex-GST</p></div><div class="chart-tools">${chip('channel')}</div></div>
  <div class="tbl-wrap"><table class="tbl stack compact"><caption class="sr-only">CM3 by channel, FY24 and FY26, ₹ crore ex-GST</caption>
  <thead><tr class="grp"><th></th><th colspan="2" scope="colgroup">D2C</th><th colspan="2" scope="colgroup">Marketplaces</th></tr>
  <tr><th scope="col"><span class="sr-only">Line</span></th>${head.map((c) => `<th scope="col" class="r">${esc(c.fy)}</th>`).join('')}</tr></thead>
  <tbody>${CHANNEL.rows.map((r) => `<tr${r.key === 'cm3' ? ' class="strong-row"' : ''}><th scope="row">${T(r.key === 'mkt' ? 'Marketing aimed at the channel' : r.key === 'nr' ? '[[NR]]' : r.key === 'cm2' ? '[[CM2]]' : '[[CM3]]')}</th>${head.map((_, i) => cell(r, i)).join('')}</tr>`).join('')}</tbody></table></div>
  <div class="chan-under"><div class="label">FY26 CM2 by marketplace ${chip('cm2-marketplace')}</div><div class="mp"><span>Amazon</span><b>₹14.5 cr</b></div><div class="mp"><span>Flipkart</span><b>₹8.8 cr</b></div></div>
  <p class="tbl-note">${esc(CHANNEL.footnote)}</p>
</div>`;
}

function tiles() {
  const t = (label, value, sub, item) => `<div class="tile card"><div class="label">${label}</div><div class="tile-value">${value}</div><div class="tile-sub">${sub}${chip(item)}</div></div>`;
  return `<div class="tiles">
  ${t('CM2 per kg sold', `₹1,015 <span class="arrow">to</span> ₹550`, 'About, FY24 to FY26', 'perkg-cm2')}
  ${t('Marketing per kg', `₹705 <span class="arrow">to</span> ₹666`, 'About; about 30% of NR in both years', 'perkg-mkt')}
  ${t('Tonnes sold', `410 <span class="arrow">to</span> 590 t`, '<b class="pos">+44%</b> from FY24 to FY26', 'tonnes-sold')}
  ${t('Marketplace share of tonnes dispatched', `48% <span class="arrow">to</span> 72%`, 'FY24 to FY26', 'mp-share')}
</div>`;
}

function quarters() {
  const id = 'dx-quarters';
  const cols = FY26_QUARTERS.labels.map((l, i) => ({
    label: l.replace(' FY26', ''), v: FY26_QUARTERS.cm3Pct[i], text: `${num(FY26_QUARTERS.cm3Pct[i], { sign: true })}%`, sub: `NR ₹${num(FY26_QUARTERS.nr[i], { dp: 1 })} cr`, item: 'fy26-quarters',
    tip: { title: `${l}${i === 2 ? ', festive quarter' : ''}`, value: `${pct(FY26_QUARTERS.cm3Pct[i], { dp: 0, sign: true })} of NR`, rows: [['NR', `₹${num(FY26_QUARTERS.nr[i], { dp: 1 })} cr`]], src: ['A'] },
  }));
  const svg = columnChart({ id, w: widthOf(id, 520), cols, yDomain: [-12, 2], yTicks: [-10, -5, 0], yFmt: (v) => `${num(v, { sign: true })}%`, title: 'FY26 CM3 by quarter', desc: 'CM3 as a share of NR: Q1 0%, Q2 −3%, Q3 −7%, Q4 −10%. NR ₹29.2, ₹31.4, ₹33.2 and ₹34.9 crore.', annotate: { index: 2, text: 'The festive quarter did better than Q4.' } });
  const tbl = setTable(id, 'FY26 CM3 by quarter', ['Quarter', 'CM3, % of NR', 'NR, ₹ cr', 'Source'], FY26_QUARTERS.labels.map((l, i) => [l, num(FY26_QUARTERS.cm3Pct[i], { sign: true }), num(FY26_QUARTERS.nr[i], { dp: 1 }), 'A']));
  return chartFrame({ id, title: 'CM3 as % of NR, with NR under each quarter', item: 'fy26-quarters', svg, table: tbl });
}

function flow() {
  const id = 'dx-flow';
  const rows = [
    { label: 'Made', v: VOLUME_FY26.madeT, text: '636 t', tone: 's-neu', item: 'tonnes-flow', tip: { title: 'Made, FY26', value: '636 t', rows: [['Plant X', '356 t'], ['Plant Y', 'about 280 t']], src: ['C1', 'C2'] } },
    { label: 'Dispatched', v: VOLUME_FY26.dispatchedT, text: '599 t', tone: 's-neu', item: 'tonnes-flow', tip: { title: 'Dispatched, FY26', value: '599 t', rows: [['Amazon', '261 t'], ['Flipkart', '172 t'], ['D2C hub', '166 t']], src: ['H'] } },
    { label: 'Sold', v: VOLUME_FY26.soldT, text: '590 t', tone: 's-neu', item: 'tonnes-flow', tip: { title: 'Sold, FY26', value: '590 t', src: ['D'] } },
    { label: 'Destroyed', v: VOLUME_FY26.destroyedT, text: '9.4 t', sub: 'about ₹1.2 cr', tone: 's-neg', valCls: 'neg', item: 'tonnes-flow', tip: { title: 'Destroyed, FY26', value: '9.4 t (9,400 kg), about ₹1.2 cr', rows: [['FY25', '1,800 kg']], src: ['H', 'D'] } },
  ];
  const svg = hbars({ id, w: widthOf(id, 520), rows, domain: [0, 700], title: 'Where the tonnes went, FY26', desc: '636 tonnes made, 599 dispatched, 590 sold; 9.4 tonnes destroyed, about ₹1.2 crore.', labelW: 96, rowH: 44 });
  const tbl = setTable(id, 'Where the tonnes went, FY26', ['Step', 'Tonnes', 'Source'], [['Made', '636', 'C1, C2'], ['Dispatched', '599', 'H'], ['Sold', '590', 'D'], ['Destroyed', '9.4 (about ₹1.2 cr)', 'H, D']]);
  return chartFrame({ id, title: 'Tonnes, FY26', item: 'tonnes-flow', svg, table: tbl, note: `<span>Made against sold leaves the 46 t overbuild that L8 stops. ${chip('L8')}</span>` });
}

export default {
  id: 'diagnosis',
  title: 'Where CM3 went',
  tab: 'Diagnosis',
  group: 'Understand',
  icon: 'trending-down',
  keywords: 'diagnosis bridge waterfall channel per kg quarters tonnes',
  render() {
    return `${screenHead({
      headline: `${T('Anvil paid for growth with discounts and ads while costs rose: [[CM3]] fell ₹19.5 cr')}${chip('ov-swing')} ${T('from FY24 to FY26.')}`,
      meaning: `₹13.7 cr ${chip('bridge-cost')} is cost that was never priced through. ₹6.0 cr ${chip('bridge-growth')} is the net cost of growth.`,
    })}
<div class="split split-8-4">
  ${section({ id: 'dx-bridge-s', title: 'The bridge from FY24 to FY26', body: '<div data-region="bridge"></div>' })}
  ${section({ id: 'dx-channel-s', title: 'By channel', body: '<div data-region="channel"></div>' })}
</div>
${section({ id: 'dx-tiles-s', title: 'Per kg and per tonne', sub: T('Volume grew 44%, but each kilo earned far less [[CM2|contribution margin 2 (CM2)]] while marketing per kilo barely moved.'), body: '<div data-region="tiles"></div>' })}
<div class="split split-6-6">
  ${section({ id: 'dx-q-s', title: 'FY26, quarter by quarter', body: '<div data-region="quarters"></div>' })}
  ${section({ id: 'dx-flow-s', title: 'Where the tonnes went, FY26', body: '<div data-region="flow"></div>' })}
</div>`;
  },
  region(key) {
    switch (key) {
      case 'bridge': return bridge();
      case 'channel': return channelTable();
      case 'tiles': return tiles();
      case 'quarters': return quarters();
      case 'flow': return flow();
      default: return null;
    }
  },
};

