// The shared scenario: controls (used in the top-bar popover and on the Plan simulator),
// live plan figures, and the drawer items behind them.

import { PLAN, AS_OF } from '../data.js';
import { q4Walk, q4Band, momentum, fy28, fy28Range, CASES } from '../model.js';
import { pct, pts, crore, num, stepValue, fmtDate } from '../format.js';
import { segmented, switchCtl, chip, T } from './components.js';
import { icon } from './icons.js';
import { register } from './registry.js';

export const walk = (s) => q4Walk({ branch: s.branch, backstop: s.backstop, ...s.sliders });
export const caseTitle = (c) => (c === 'custom' ? 'Custom' : c[0].toUpperCase() + c.slice(1));
export const branchTitle = (b) => (b === 'cm2' ? 'Costs inside CM2' : 'Marketing step-up');
export const rangeText = (lo, hi, unit = '%') => `${pct(lo, { sign: true }).replace('%', unit === '%' ? '%' : '')} to ${pct(hi, { sign: true }).replace('%', unit === '%' ? '%' : '')}`;
export const ptsRange = (lo, hi) => `${pts(lo)} to ${pts(hi)}`;
export const crRange = (lo, hi) => `${crore(lo, { sign: true })} to ${crore(hi, { sign: true })}`;

export function meterLabel(s) {
  const w = walk(s);
  return `Q4 FY27 CM3: ${pct(w.low, { sign: true })} to ${pct(w.high, { sign: true })} of NR · at these settings ${pct(w.value, { sign: true })}`;
}

export const BRANCH_NOTE = 'Unconfirmed until FY26 marketing by quarter and the H1 FY27 P&L by channel arrive (due 15 Nov 2026). If Q4 FY26 marketing was 31% of NR or less, switch to Costs inside CM2.';

export function scenarioControls(s, { idp = 'sc', full = false } = {}) {
  const caseOpts = CASES.map((c) => ({ value: c, label: caseTitle(c) }));
  return `<div class="sc ${full ? 'sc-full' : ''}">
  <div class="sc-block">
    <div class="sc-label" id="${idp}-branch">What drove the Q4 FY26 slide?</div>
    ${segmented({ bind: 'branch', labelId: `${idp}-branch`, value: s.branch, options: [{ value: 'mkt', label: 'Marketing step-up (inferred)' }, { value: 'cm2', label: 'Costs inside CM2' }] })}
    <p class="sc-note">${icon('triangle-alert', { size: 16, cls: 'caution-ic' })}<span>${T(BRANCH_NOTE.replace('31% of NR', '31% of [[NR]]'))} ${chip('branch-test')}</span></p>
    ${full ? `<p class="sc-desc">${T('Marketing step-up assumes [[CM2]] held near 25.2% of NR and marketing rose from about 25% to 35%, so L1 is worth +10.0 points. Costs inside CM2 assumes the slide sat in CM2, so L1 is worth +5.3.')} ${chip('l1-value')}</p>` : ''}
  </div>
  <div class="sc-block">
    <div class="sc-label" id="${idp}-case">Case ${s.caseName === 'custom' ? '<span class="custom-tag">Custom</span>' : ''}</div>
    ${segmented({ bind: 'caseName', labelId: `${idp}-case`, value: s.caseName, options: caseOpts })}
    ${full ? '<p class="sc-desc">Sets every lever slider to its low end, midpoint or high end, and picks the matching FY28 case. Moving a slider by hand shows Custom.</p>' : ''}
  </div>
  <div class="sc-block sc-switch">
    <div><div class="sc-label" id="${idp}-bs">Backstop</div><p class="sc-desc" id="${idp}-bs-d">${T('Pause half of [[D2C]] paid prospecting at the 15 Jan check')}${full ? ` (+3.5 points when on) ${chip('backstop')}` : ''}</p></div>
    ${switchCtl({ bind: 'backstop', checked: s.backstop, labelId: `${idp}-bs`, describedBy: `${idp}-bs-d` })}
  </div>
  <div class="sc-foot"><button type="button" class="link-btn" data-action="reset">${icon('rotate-ccw', { size: 16 })}<span>Reset to defaults</span></button></div>
</div>`;
}

/* ---------- Drawer items for the shared plan figures ---------- */
const sliderRows = (w) => [
  ['L2 · D2C price', stepValue(w.L2), 'Model'],
  ['L3 · Marketplace price', stepValue(w.L3), 'Model'],
  ['L4b · Imported whey', stepValue(w.L4b), 'Model'],
  ['L7 · COD to prepaid', stepValue(w.L7), 'Model'],
];

register('plan', {
  'q4-plan': {
    label: 'CM3, Q4 FY27 plan',
    search: 'q4 fy27 cm3 target meter break-even plan range',
    value: (s) => { const w = walk(s); return `${pct(w.low, { sign: true })} to ${pct(w.high, { sign: true })} of NR · at these settings ${pct(w.value, { sign: true })} (${crore(w.valueCr, { sign: true })})`; },
    src: ['Model'],
    note: (s) => `${branchTitle(s.branch)} · ${caseTitle(s.caseName)} · Backstop ${s.backstop ? 'on' : 'off'}. A slider position is a what-if; the plan range is the low and high end of every slider.`,
    used: (s) => {
      const w = walk(s);
      return [
        ['Momentum, M', num(w.M, { dp: 2, sign: true }), 'Model'],
        [`L1 · Marketing back to 25% of NR (${branchTitle(s.branch)})`, pts(w.L1), 'Model'],
        ...sliderRows(w),
        ['Backstop, B', s.backstop ? pts(w.B) : '0 (off)', 'Model'],
        ['Q4 FY27 NR', `₹${PLAN.q4.nrCr} cr`, 'Model'],
      ];
    },
    calc: (s) => {
      const w = walk(s);
      return [
        { formula: 'q4 = M + L1 + L2 + L3 + L4b + L7 + B', inputs: `${num(w.M, { dp: 2 })} ${pts(w.L1)} ${stepValue(w.L2)} ${stepValue(w.L3)} ${stepValue(w.L4b)} ${stepValue(w.L7)} ${s.backstop ? pts(w.B) : '+0'}`, result: `${pct(w.value, { sign: true })} of NR` },
        { formula: 'q4_cr = q4 × 33 ÷ 100', inputs: `${num(w.value, { dp: 3 })} × 33 ÷ 100`, result: crore(w.valueCr, { sign: true }) },
        { formula: 'band_low = M + L1 + 1.5 + 0.2 + 0 + 0 + B', inputs: `${num(w.M, { dp: 2 })} ${pts(w.L1)} + 1.5 + 0.2 + 0 + 0 ${s.backstop ? pts(w.B) : '+ 0'}`, result: `${pct(w.low, { sign: true })} (${crore(w.lowCr, { sign: true })})` },
        { formula: 'band_high = M + L1 + 2.4 + 2.2 + 1.1 + 0.4 + B', inputs: `${num(w.M, { dp: 2 })} ${pts(w.L1)} + 2.4 + 2.2 + 1.1 + 0.4 ${s.backstop ? pts(w.B) : '+ 0'}`, result: `${pct(w.high, { sign: true })} (${crore(w.highCr, { sign: true })})` },
      ];
    },
    caveat: 'The branch is an inference until FY26 marketing by quarter and the H1 FY27 P&L by channel arrive (due 15 Nov 2026). Values are computed unrounded and rounded only for display.',
  },
  momentum: {
    label: 'Momentum, Q4 FY27',
    search: 'momentum m whey 1024 flavour pack',
    value: () => `${pts(momentum().value)} points of NR`,
    src: ['A', 'B3', 'D', 'Model'],
    note: 'Where Q4 FY27 lands with no levers: Q4 FY26 CM3, less FY27 whey and flavour and pack costs.',
    used: () => {
      const m = momentum();
      return [
        ['Q4 FY26 CM3', '−10.0% of NR', 'A'],
        ['FY27 domestic WPC80 quote', '₹1,024/kg', 'B3'],
        ['WPC80 per kg of product', '0.9375 kg', 'Calc'],
        ['FY26 whey per kg of product', '₹870', 'D'],
        ['Flavour and pack rise', '₹5/kg', 'D'],
        ['NR per kg sold, FY26', `about ${num(m.nrPerKg)} (₹128.7 cr ÷ 590 t)`, 'A · D'],
      ];
    },
    calc: () => {
      const m = momentum();
      return [
        { formula: 'whey rise = 1,024 × 0.9375 − 870', inputs: `${num(m.wheyPerKgFy27)} − 870`, result: `₹${num(m.wheyDeltaPerKg)} per kg of product` },
        { formula: 'whey points = whey rise ÷ NR per kg × 100', inputs: `90 ÷ ${num(m.nrPerKg, { dp: 1 })} × 100`, result: num(m.wheyPts, { dp: 2 }) },
        { formula: 'flavour and pack points = 5 ÷ NR per kg × 100', inputs: `5 ÷ ${num(m.nrPerKg, { dp: 1 })} × 100`, result: num(m.flavourPts, { dp: 2 }) },
        { formula: 'M = −10.0 − whey points − flavour and pack points', inputs: `−10.0 − ${num(m.wheyPts, { dp: 2 })} − ${num(m.flavourPts, { dp: 2 })}`, result: `${num(m.value, { dp: 2 })}, shown as ${pts(m.value)}` },
      ];
    },
  },
  'l1-value': {
    label: 'L1 effect on Q4 FY27, by branch',
    value: (s) => `${pts(s.branch === 'cm2' ? PLAN.q4.l1.cm2 : PLAN.q4.l1.mkt)} points of NR (${branchTitle(s.branch)})`,
    src: ['Model', 'F'],
    used: [
      ['Marketing step-up branch', '+10.0: marketing from 35% back to 25% of NR', 'Model'],
      ['Costs inside CM2 branch', '+5.3: marketing from 30.5% to 25.2% of NR', 'Model'],
      ['Difference between branches', '4.7 points', 'Model'],
    ],
    caveat: 'The marketing step-up is inferred, because discounts were flat across FY26 and CM2 held near 25.2%.',
  },
  'branch-test': {
    label: 'The test that settles the branch',
    search: 'branch test 31% marketing 15 nov',
    value: 'Q4 FY26 marketing at 31% of NR or less → switch to Costs inside CM2',
    src: ['A', 'F', 'BP'],
    note: `Data due ${fmtDate('2026-11-15')}: FY26 marketing by quarter and the H1 FY27 P&L by channel. Data as of ${AS_OF.label}.`,
    used: [
      ['CM2, FY26', '25.2% of NR', 'BP'],
      ['Marketing, FY26', '₹39.3 cr, about 30% of NR', 'F'],
      ['Inferred Q4 FY26 marketing step-up', 'about 25% to 35% of NR', 'Model'],
      ['Threshold', '31% of NR', 'Model'],
    ],
    caveat: 'The marketing step-up is an inference, not a record.',
  },
  backstop: {
    label: 'Backstop: pause half of D2C paid prospecting',
    search: 'backstop pause prospecting 15 jan',
    value: '+3.5 points of NR in Q4 FY27 when switched on',
    src: ['F', 'Model'],
    used: [
      ['D2C paid prospecting, Meta and Google', '₹12.6 cr a year', 'F'],
      ['Saving from pausing half', '₹6.3 cr a year', 'Calc'],
      ['New customers lost', 'about 14,000', 'Calc'],
      ['CM2 per new customer', 'about ₹1,200', 'Model'],
      ['CM2 lost', 'about ₹1.7 cr a year', 'Calc'],
      ['Q4 FY27 NR', '₹33 cr', 'Model'],
    ],
    calc: [
      { formula: 'net saving = 6.3 − 1.7', inputs: '₹6.3 cr − ₹1.7 cr', result: '₹4.6 cr a year, or ₹1.15 cr a quarter' },
      { formula: 'B = quarterly saving ÷ Q4 NR × 100', inputs: '1.15 ÷ 33 × 100', result: '+3.5 points of NR' },
    ],
    caveat: 'Decided at the 15 Jan 2027 check. CM2 per new customer is an approximation.',
  },
  'fy28-range': {
    label: 'CM3, FY28 at 25% marketing',
    search: 'fy28 full year two-year test cautious central favourable',
    value: '+0.4% to +5.5% of NR (+₹0.5 cr to +₹7.1 cr), cautious to favourable',
    src: ['Model'],
    used: () => ['momentum', 'cautious', 'central', 'favourable'].map((c) => {
      const r = fy28(c, 25);
      return [`${caseTitle(c)}: CM2 ${num(r.cm2, { dp: 1 })}% of NR`, `${pct(r.cm3, { sign: true })} (${crore(r.cm3Cr, { sign: true })})`, 'Model'];
    }),
    calc: () => {
      const r = fy28Range(25);
      return [
        { formula: 'cm3 = cm2 − marketing', inputs: `cautious 25.4 − 25; favourable 30.5 − 25`, result: `${pts(r.low.cm3)} to ${pts(r.high.cm3)}` },
        { formula: 'cm3_cr = cm3 × 129 ÷ 100', inputs: `${num(r.low.cm3, { dp: 1 })} × 1.29; ${num(r.high.cm3, { dp: 1 })} × 1.29`, result: `${crore(r.low.cm3Cr, { sign: true })} to ${crore(r.high.cm3Cr, { sign: true })}` },
      ];
    },
    caveat: 'FY28 NR is held flat at ₹129 cr; no FY28 revenue scenarios are on file yet.',
  },
});

export function bandFor(branch, backstop) { return q4Band(branch, backstop); }
