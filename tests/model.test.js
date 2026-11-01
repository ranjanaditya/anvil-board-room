// Model tests: the plan formulas must reproduce their published test values exactly,
// at display precision, from unrounded inputs. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  momentum, q4Walk, q4Band, caseSliders, matchCase, fy28, plantXQuarter, plantXYear, matchPlantXPreset,
  importPipelineCr, cashAt, cashFix, priceForMargin, costPer100gProtein, marginPct, wheySensitivity,
  qcContribution, qcBreakEvenTake, everydayDiscount, festivePremium, newBuyerRoas, codShareOfRto,
  clicksIndex, pctChange, bridgeGroupTotal, bridgeSteps, crorePerKg, costRiseCr, weightedMean, sum,
} from '../js/model.js';
import { num, pct, crore, lakh, rupees, perKg, pts, round, stepValue, countdown, daysBetween, todayISO } from '../js/format.js';
import { PLAN, GROWTH, BRIDGE, PLANT_X_FY26, PLANT_Y_FY26, FORMATS, PER_KG } from '../js/data.js';

const p1 = (x) => pts(x); // +1.7 style
const cr1 = (x) => crore(x, { sign: true }); // +₹0.6 cr style
const central = caseSliders('central');

test('5.1 momentum is −14.36, shown as −14.4', () => {
  const m = momentum();
  assert.equal(num(m.value, { dp: 2 }), '−14.36');
  assert.equal(num(m.value, { dp: 1 }), '−14.4');
  assert.equal(m.wheyDeltaPerKg, 90);
  assert.equal(num(m.wheyPts, { dp: 2 }), '4.13');
  assert.equal(num(m.flavourPts, { dp: 2 }), '0.23');
  assert.equal(num(m.nrPerKg), '2,181');
});

test('5.1 case slider positions', () => {
  assert.deepEqual(caseSliders('cautious'), { L2: 1.5, L3: 0.2, L4b: 0, L7: 0 });
  assert.deepEqual(caseSliders('favourable'), { L2: 2.4, L3: 2.2, L4b: 1.1, L7: 0.4 });
  assert.equal(num(central.L2, { dp: 2 }), '1.95');
  assert.equal(num(central.L3, { dp: 2 }), '1.20');
  assert.equal(num(central.L4b, { dp: 2 }), '0.55');
  assert.equal(num(central.L7, { dp: 2 }), '0.20');
  assert.equal(matchCase(central), 'central');
  assert.equal(matchCase({ ...central, L2: 2.0 }), 'custom');
  assert.equal(stepValue(1.95), '+1.95');
  assert.equal(stepValue(2.0), '+2.0');
});

const BAND_TABLE = [
  { branch: 'mkt', backstop: false, band: ['−2.7', '+1.7'], cr: ['−₹0.9 cr', '+₹0.6 cr'], central: '−0.5' },
  { branch: 'mkt', backstop: true, band: ['+0.8', '+5.2'], cr: ['+₹0.3 cr', '+₹1.7 cr'], central: '+3.0' },
  { branch: 'cm2', backstop: false, band: ['−7.4', '−3.0'], cr: ['−₹2.4 cr', '−₹1.0 cr'], central: '−5.2' },
  { branch: 'cm2', backstop: true, band: ['−3.9', '+0.5'], cr: ['−₹1.3 cr', '+₹0.2 cr'], central: '−1.7' },
];
for (const row of BAND_TABLE) {
  test(`5.1 band: ${row.branch}, backstop ${row.backstop ? 'on' : 'off'}`, () => {
    const b = q4Band(row.branch, row.backstop);
    assert.deepEqual([p1(b.low), p1(b.high)], row.band);
    assert.deepEqual([cr1(b.lowCr), cr1(b.highCr)], row.cr);
    assert.equal(p1(b.central), row.central);
  });
}

test('Acceptance 1: default meter label', () => {
  const w = q4Walk({ branch: 'mkt', backstop: false, ...central });
  const label = `Q4 FY27 CM3: ${pct(w.low, { sign: true })} to ${pct(w.high, { sign: true })} of NR · at these settings ${pct(w.value, { sign: true })}`;
  assert.equal(label, 'Q4 FY27 CM3: −2.7% to +1.7% of NR · at these settings −0.5%');
});

test('Acceptance 2: CM2 branch, then backstop on', () => {
  const off = q4Walk({ branch: 'cm2', backstop: false, ...central });
  assert.equal(`${pct(off.low, { sign: true })} to ${pct(off.high, { sign: true })}`, '−7.4% to −3.0%');
  assert.equal(pct(off.value, { sign: true }), '−5.2%');
  const on = q4Walk({ branch: 'cm2', backstop: true, ...central });
  assert.equal(`${pct(on.low, { sign: true })} to ${pct(on.high, { sign: true })}`, '−3.9% to +0.5%');
});

test('Acceptance 3: marketing branch, cautious and favourable', () => {
  const lo = q4Walk({ branch: 'mkt', backstop: false, ...caseSliders('cautious') });
  assert.equal(pct(lo.value, { sign: true }), '−2.7%');
  assert.equal(cr1(lo.valueCr), '−₹0.9 cr');
  const hi = q4Walk({ branch: 'mkt', backstop: false, ...caseSliders('favourable') });
  assert.equal(pct(hi.value, { sign: true }), '+1.7%');
  assert.equal(cr1(hi.valueCr), '+₹0.6 cr');
});

test('5.2 and acceptance 4: FY28 by case', () => {
  const at25 = { momentum: ['20.6', '−4.4', '−₹5.7 cr'], cautious: ['25.4', '+0.4', '+₹0.5 cr'], central: ['28.2', '+3.2', '+₹4.1 cr'], favourable: ['30.5', '+5.5', '+₹7.1 cr'] };
  const at28 = { momentum: '−7.4', cautious: '−2.6', central: '+0.2', favourable: '+2.5' };
  for (const [name, [cm2, cm3, cr]] of Object.entries(at25)) {
    const r = fy28(name, 25);
    assert.equal(num(r.cm2, { dp: 1 }), cm2);
    assert.equal(pts(r.cm3), cm3);
    assert.equal(cr1(r.cm3Cr), cr);
    assert.equal(r.breakEvenMarketing, r.cm2);
    assert.equal(pts(fy28(name, 28).cm3), at28[name]);
  }
});

test('5.3 Plant X presets and acceptance 5', () => {
  const expect = {
    fy26: [356, '₹3.94 cr', '₹4.27 cr', '−₹0.33 cr'],
    even89: [356, '₹4.20 cr', '₹4.27 cr', '−₹0.07 cr'],
    hold92: [368, '₹3.83 cr', '₹4.42 cr', '−₹0.59 cr'],
    floor70: [280, '₹3.30 cr', '₹3.36 cr', '−₹0.06 cr'],
  };
  for (const [name, [t, draft, at120, diff]] of Object.entries(expect)) {
    const y = plantXYear(PLAN.plantX.presets[name]);
    assert.equal(y.tonnes, t);
    assert.equal(crore(y.draft / 1e7, { dp: 2 }), draft);
    assert.equal(crore(y.atToday / 1e7, { dp: 2 }), at120);
    assert.equal(crore(y.diff / 1e7, { dp: 2, sign: true }), diff);
    assert.equal(matchPlantXPreset(PLAN.plantX.presets[name]), name);
  }
  assert.equal(matchPlantXPreset([82, 88, 90, 95]), 'custom');
});

test('5.3 Plant X edge checks', () => {
  const step = (a, b) => lakh((plantXQuarter(a).draft - plantXQuarter(b).draft) / 1e5);
  assert.equal(step(89, 90), '₹11.4 lakh');
  assert.equal(step(89.9, 90), '₹12.5 lakh');
  assert.equal(lakh(plantXQuarter(0).draft / 1e5), '₹74.3 lakh');
  assert.equal(plantXQuarter(89.9).rate, 118);
  assert.equal(plantXQuarter(90).rate, 104);
  assert.equal(plantXQuarter(69).tier, 'below-min');
  const y = plantXYear([82, 88, 90, 96]);
  assert.equal(y.routeFromY, 10 + 4 + 2 + 0);
  assert.equal(lakh(y.savingsTo90[1] / 1e5), '₹10.2 lakh');
  assert.equal(y.savingsTo90[0], null);
  assert.equal(rupees(y.atToday), '₹4,27,20,000');
  assert.equal(rupees(PLANT_X_FY26.billRupees), '₹4,27,20,000');
  assert.equal(PLANT_X_FY26.q.reduce((a, b) => a + b, 0), PLANT_X_FY26.totalT);
  assert.equal(round(PLANT_Y_FY26.totalLakh * 1e5 * 3.6), PLANT_Y_FY26.billRupees);
});

test('5.4 cash planner and acceptance 6', () => {
  const base = { share: 0.3, gstRate: 10, plantTub: true, release: true };
  const m27 = cashAt({ date: 'mar27', ...base, sachets: 1 });
  assert.equal(crore(m27.total), '₹8.5 cr');
  assert.equal(crore(m27.spare), '₹1.5 cr');
  assert.equal(crore(m27.withoutGst), '₹4.3 cr');
  assert.equal(m27.over, false);
  const m28 = cashAt({ date: 'mar28', ...base, sachets: 0 });
  assert.equal(crore(m28.total), '₹15.9 cr');
  assert.equal(crore(m28.spare), '₹0.1 cr');
  assert.equal(crore(m28.withoutGst), '₹1.7 cr');
  const hot = cashAt({ date: 'mar28', ...base, share: 0.5, sachets: 1 });
  assert.equal(crore(hot.total), '₹20.4 cr');
  assert.equal(crore(-hot.spare), '₹4.4 cr');
  assert.equal(crore(hot.withoutGst), '₹6.2 cr');
  assert.equal(hot.over, true);
  assert.equal(crore(importPipelineCr(0.3)), '₹4.6 cr');
  assert.equal(crore(importPipelineCr(0.5)), '₹6.5 cr');
  assert.equal(importPipelineCr(0), 0);
  const fix = cashFix({ ...base, share: 0.5, sachets: 1 }, 'mar28');
  assert.deepEqual(fix.changes.map((c) => [c.key, c.to]).sort(), [['import', 0.3], ['sachet', 0]]);
  assert.equal(cashFix({ ...base, sachets: 0 }, 'mar28'), null);
});

test('5.5 format lab', () => {
  const [tub, plant, sachet, rtd] = FORMATS;
  assert.equal(rupees(priceForMargin(tub.unitCost, 50)), '₹2,500');
  assert.equal(rupees(priceForMargin(plant.unitCost, 50)), '₹1,600');
  assert.equal(rupees(priceForMargin(sachet.unitCost, 50), { dp: 1 }), '₹93.4');
  assert.equal(rupees(priceForMargin(rtd.unitCost, 50)), '₹112');
  assert.equal(rupees(costPer100gProtein(tub.unitCost, tub.proteinPerUnitG)), '₹167');
  assert.equal(rupees(costPer100gProtein(sachet.unitCost, sachet.proteinPerUnitG)), '₹195');
  assert.equal(rupees(costPer100gProtein(rtd.unitCost, rtd.proteinPerUnitG)), '₹280');
  assert.equal(perKg(sachet.unitCost / 0.032), '₹1,459/kg');
  assert.equal(num(marginPct(PER_KG.nrFy26, tub.unitCost)), '43');
  const w = wheySensitivity();
  assert.equal(num(w.perKgProduct), '47');
  assert.equal(crore(w.crYear), '₹2.8 cr');
});

test('5.6 quick-commerce check and acceptance 7', () => {
  assert.equal(num(qcContribution(30, 0), { sign: true }), '+684');
  assert.equal(num(qcContribution(45, 0), { sign: true }), '+270');
  assert.equal(num(qcContribution(55, 0), { sign: true }), '−7');
  assert.equal(pct(qcBreakEvenTake(0)), '54.8%');
});

test('Acceptance 8: bridge runs from +12.7 to −6.8, groups −6.0 and −13.7', () => {
  const steps = bridgeSteps();
  assert.equal(pts(steps[0].to), '+12.7');
  assert.equal(pts(steps.at(-1).to), '−6.8');
  assert.equal(pts(steps.at(-2).to), '−6.8'); // the last change lands on the total
  assert.equal(pts(bridgeGroupTotal('growth')), '−6.0');
  assert.equal(pts(bridgeGroupTotal('cost')), '−13.7');
  assert.equal(pts(sum(BRIDGE.filter((b) => !b.total).map((b) => b.v))), '−19.5');
});

test('Calculations behind the records reproduce the stated figures', () => {
  const d = GROWTH.discounts.d2c;
  assert.equal(num(everydayDiscount(d.FY24), { dp: 1 }), '13.5');
  assert.equal(num(everydayDiscount(d.FY26), { dp: 1 }), '28.9');
  assert.equal(num(festivePremium(d.FY24), { dp: 1 }), '3.0');
  assert.equal(num(festivePremium(d.FY26), { dp: 1 }), '2.6');
  const g = GROWTH.rows;
  const nb24 = newBuyerRoas(g.roas.v[0], g.existingShare.v[0]);
  const nb26 = newBuyerRoas(g.roas.v[2], g.existingShare.v[2]);
  assert.equal(num(nb24, { dp: 2 }), '2.66');
  assert.equal(num(nb26, { dp: 2 }), '1.35');
  assert.equal(num(pctChange(nb24, nb26)), '−49');
  assert.equal(num(codShareOfRto(52, 26, 2)), '93');
  const s = GROWTH.search;
  assert.equal(num(pctChange(clicksIndex(s.index[0], s.clickShare[0]), clicksIndex(s.index.at(-1), s.clickShare.at(-1)))), '−41');
  assert.equal(num(pctChange(s.index[0], s.index.at(-1))), '−21');
  assert.equal(num((12.6 * 1e7) / (g.newPaid.v[2] * 1e5)), '2,520'); // paid CAC: D2C performance spend ÷ paid new customers
  assert.equal(num(crorePerKg(128.7, 590)), '2,181');
  assert.equal(crore(costRiseCr(870 - 740, 590)), '₹7.7 cr');
  assert.equal(crore(costRiseCr(20, 590)), '₹1.2 cr');
  const c = GROWTH.cohortsFy26.rows;
  assert.equal(num(weightedMean(c.map((r) => r.repeat), c.map((r) => r.customers)), { dp: 1 }), '15.1');
  assert.equal(num(pctChange(740, 870), { dp: 1 }), '17.6');
  assert.equal(num(GROWTH.bcaa.nrLakh[5] * 12 * 1e5 / 128.7e7 * 100, { dp: 1 }), '0.5');
});

test('Formats: Indian grouping, minus sign, units', () => {
  assert.equal(rupees(42720000), '₹4,27,20,000');
  assert.equal(rupees(100000), '₹1,00,000');
  assert.equal(crore(4.272, { dp: 2 }), '₹4.27 cr');
  assert.equal(crore(-6.8), '−₹6.8 cr');
  assert.equal(crore(0.5, { sign: true }), '+₹0.5 cr');
  assert.equal(lakh(12.5), '₹12.5 lakh');
  assert.equal(pct(-5.3, { nr: true }), '−5.3% of NR');
  assert.equal(perKg(1250), '₹1,250/kg');
  assert.equal(num(-0.04, { dp: 1 }), '0.0');
  assert.equal(round(1.005, 2), 1.01);
});

test('Dates and countdowns', () => {
  assert.equal(daysBetween('2026-11-02', '2026-12-31'), 59);
  assert.equal(countdown('2026-12-31', '2026-11-02').text, '59 days left');
  assert.equal(countdown('2026-11-15', '2026-11-15').text, 'Due today');
  assert.equal(countdown('2026-11-15', '2026-11-20').past, true);
  assert.match(todayISO(new Date('2026-11-01T20:00:00Z')), /^2026-11-02$/); // 1:30 am in India
});
