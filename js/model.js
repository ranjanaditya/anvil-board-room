// Model module: every formula in the app as a pure function.
// Inputs come from data.js; results are unrounded. Screens round only for display.

import { PLAN, BRIDGE, BRIDGE_GROUPS } from './data.js';

export const RUPEES_PER_CRORE = 1e7;
export const RUPEES_PER_LAKH = 1e5;
export const CASES = ['cautious', 'central', 'favourable'];
export const FY28_CASES = ['momentum', 'cautious', 'central', 'favourable'];
export const SLIDER_KEYS = ['L2', 'L3', 'L4b', 'L7'];

export const sum = (xs) => xs.reduce((s, x) => s + x, 0);
export const mean = (xs) => sum(xs) / xs.length;
export const pctChange = (from, to) => (to / from - 1) * 100;

/* ---------- 5.1 Q4 FY27 CM3 walk (points of NR) ---------- */

// Momentum: Q4 FY26 CM3 less FY27 whey and flavour-and-pack cost, as points of FY26 NR per kg.
export function momentum(p = PLAN.q4.momentum) {
  const nrPerKg = (p.nrFy26Cr * RUPEES_PER_CRORE) / (p.soldFy26T * 1000);
  const wheyPerKgFy27 = p.wpc80Fy27 * p.wheyContent;
  const wheyDeltaPerKg = wheyPerKgFy27 - p.wheyPerKgFy26;
  const wheyPts = (wheyDeltaPerKg / nrPerKg) * 100;
  const flavourPts = (p.flavourPackPerKg / nrPerKg) * 100;
  return {
    value: p.q4Fy26Cm3Pct - wheyPts - flavourPts,
    base: p.q4Fy26Cm3Pct, nrPerKg, wheyPerKgFy27, wheyDeltaPerKg, wheyPts, flavourPts,
  };
}

export function l1Points(branch, q4 = PLAN.q4) {
  return branch === 'cm2' ? q4.l1.cm2 : q4.l1.mkt;
}

// Slider positions for a case: low end, midpoint or high end of every lever range.
export function caseSliders(name, ranges = PLAN.q4.sliders) {
  const out = {};
  for (const k of SLIDER_KEYS) {
    const r = ranges[k];
    out[k] = name === 'cautious' ? r.min : name === 'favourable' ? r.max : (r.min + r.max) / 2;
  }
  return out;
}

// The named case whose slider positions match, or 'custom'.
export function matchCase(sliders, ranges = PLAN.q4.sliders) {
  for (const name of CASES) {
    const c = caseSliders(name, ranges);
    if (SLIDER_KEYS.every((k) => Math.abs(c[k] - sliders[k]) < 1e-9)) return name;
  }
  return 'custom';
}

export function toQuarterCrore(points, q4 = PLAN.q4) {
  return (points * q4.nrCr) / 100;
}

export function q4Walk({ branch, backstop, L2, L3, L4b, L7 }, q4 = PLAN.q4) {
  const M = momentum(q4.momentum).value;
  const L1 = l1Points(branch, q4);
  const B = backstop ? q4.backstop.points : 0;
  const r = q4.sliders;
  const value = M + L1 + L2 + L3 + L4b + L7 + B;
  const low = M + L1 + r.L2.min + r.L3.min + r.L4b.min + r.L7.min + B;
  const high = M + L1 + r.L2.max + r.L3.max + r.L4b.max + r.L7.max + B;
  return {
    M, L1, L2, L3, L4b, L7, B, value, low, high,
    valueCr: toQuarterCrore(value, q4), lowCr: toQuarterCrore(low, q4), highCr: toQuarterCrore(high, q4),
  };
}

// The plan band and its central point for a branch and backstop setting.
export function q4Band(branch, backstop, q4 = PLAN.q4) {
  const central = q4Walk({ branch, backstop, ...caseSliders('central', q4.sliders) }, q4);
  return { low: central.low, high: central.high, central: central.value, lowCr: central.lowCr, highCr: central.highCr, centralCr: central.valueCr };
}

/* ---------- 5.2 FY28 full year ---------- */

export function fy28(caseName, marketingPct, p = PLAN.fy28) {
  const cm2 = p.cm2[caseName];
  const cm3 = cm2 - marketingPct;
  return { caseName, cm2, marketingPct, cm3, cm3Cr: (cm3 * p.nrCr) / 100, breakEvenMarketing: cm2 };
}

export function fy28Range(marketingPct, p = PLAN.fy28) {
  return { low: fy28('cautious', marketingPct, p), high: fy28('favourable', marketingPct, p) };
}

/* ---------- 5.3 Plant X draft calculator (rupees) ---------- */

export function plantXQuarter(t, p = PLAN.plantX) {
  const rate = t >= p.tierT ? p.rateTier : p.rateBelow;
  const shortfallT = Math.max(0, p.minT - t);
  const draft = t * 1000 * rate + shortfallT * 1000 * p.shortfallFactor * rate;
  const atToday = t * 1000 * p.today;
  const tier = t < p.minT ? 'below-min' : t >= p.tierT ? 'tier-low' : 'tier-high';
  return { t, rate, shortfallT, draft, atToday, tier };
}

export function plantXYear(tonnes, p = PLAN.plantX) {
  const quarters = tonnes.map((t) => plantXQuarter(t, p));
  const draft = sum(quarters.map((q) => q.draft));
  const atToday = sum(quarters.map((q) => q.atToday));
  const atTier = plantXQuarter(p.tierT, p).draft;
  return {
    quarters,
    tonnes: sum(tonnes),
    draft, atToday, diff: draft - atToday,
    routeFromY: sum(tonnes.map((t) => Math.max(0, p.holdT - t))),
    // For a quarter from 85 t to just under 90 t: what moving it up to 90 t saves.
    savingsTo90: quarters.map((q) => (q.t >= p.savingWindow[0] && q.t < p.savingWindow[1] ? q.draft - atTier : null)),
  };
}

export function matchPlantXPreset(tonnes, p = PLAN.plantX) {
  for (const [name, preset] of Object.entries(p.presets)) {
    if (preset.every((t, i) => Math.abs(t - tonnes[i]) < 1e-9)) return name;
  }
  return 'custom';
}

/* ---------- 5.4 Cash planner (₹ cr) ---------- */

export function importPipelineCr(share, p = PLAN.cash) {
  if (share <= 0) return 0;
  const needT = p.soldT * p.wheyContent;
  return (needT * 1000 * p.importPrice * share * (p.leadDays / 365) + p.bufferT * 1000 * p.importPrice) / RUPEES_PER_CRORE;
}
export const wheyNeedT = (p = PLAN.cash) => p.soldT * p.wheyContent;
export const gstBuildCr = (ratePerYear, months) => (ratePerYear * months) / 12;
export const sachetRunCr = (p = PLAN.cash) => (p.sachet.units * p.sachet.unitCost) / RUPEES_PER_CRORE;
export const plantTubRunCr = (p = PLAN.cash) => (p.plantTub.t * 1000 * p.plantTub.perKg) / RUPEES_PER_CRORE;
export const stockReleaseCr = (p = PLAN.cash) => (p.release.t * 1000 * p.release.perKg) / RUPEES_PER_CRORE;

export function cashAt({ date, share, gstRate, sachets, plantTub, release }, p = PLAN.cash) {
  const months = p.monthsFromNov2026[date];
  const cap = p.caps[date];
  const items = {
    import: importPipelineCr(share, p),
    gst: gstBuildCr(gstRate, months),
    sachet: sachets * sachetRunCr(p),
    tub: plantTub ? plantTubRunCr(p) : 0,
    release: release ? -stockReleaseCr(p) : 0,
  };
  const total = sum(Object.values(items));
  return { date, months, cap, items, total, withoutGst: total - items.gst, spare: cap - total, over: total > cap + 1e-12 };
}

// Cheapest set of changes that brings one date inside its cap. Each change is weighted by
// what it gives up: releasing stock gives up nothing, a test less than imports, and imports
// most, because they earn CM3. GST credit is an estimate, not a lever, so it is never changed.
const FIX_WEIGHTS = { release: 0.25, tub: 0.75, sachet: 1, import: { '0.5>0.3': 2, '0.3>0': 3, '0.5>0': 5 } };

export function cashFix(settings, date, p = PLAN.cash) {
  const base = cashAt({ date, ...settings }, p);
  if (!base.over) return null;
  const shares = p.importShares.filter((s) => s <= settings.share + 1e-9);
  const tubs = settings.plantTub ? [true, false] : [false];
  const releases = settings.release ? [true] : [false, true];
  let best = null;
  for (const share of shares) {
    for (let sachets = settings.sachets; sachets >= 0; sachets--) {
      for (const plantTub of tubs) {
        for (const release of releases) {
          const r = cashAt({ date, share, gstRate: settings.gstRate, sachets, plantTub, release }, p);
          if (r.over) continue;
          const changes = [];
          let cost = 0;
          if (release !== settings.release) { changes.push({ key: 'release', to: release }); cost += FIX_WEIGHTS.release; }
          if (share !== settings.share) { changes.push({ key: 'import', to: share }); cost += FIX_WEIGHTS.import[`${settings.share}>${share}`] ?? 5; }
          if (sachets !== settings.sachets) { changes.push({ key: 'sachet', to: sachets }); cost += FIX_WEIGHTS.sachet * (settings.sachets - sachets); }
          if (plantTub !== settings.plantTub) { changes.push({ key: 'tub', to: plantTub }); cost += FIX_WEIGHTS.tub; }
          const better = !best || cost < best.cost - 1e-9 || (Math.abs(cost - best.cost) < 1e-9 && changes.length < best.changes.length);
          if (better) best = { cost, changes, result: r };
        }
      }
    }
  }
  return best || { cost: Infinity, changes: [], result: null };
}

/* ---------- 5.5 Format lab ---------- */

export const priceForMargin = (cost, marginPct) => cost / (1 - marginPct / 100);
export const costPer100gProtein = (unitCost, proteinG) => (unitCost / proteinG) * 100;
export const marginPct = (price, cost) => ((price - cost) / price) * 100;
export function wheySensitivity(perWpc80 = PLAN.formats.wheySensitivity.perWpc80, wheyContent = PLAN.cash.wheyContent, soldT = PLAN.formats.wheySensitivity.soldT) {
  const perKgProduct = perWpc80 * wheyContent;
  return { perKgProduct, crYear: (perKgProduct * soldT * 1000) / RUPEES_PER_CRORE };
}

/* ---------- 5.6 Quick-commerce check (₹ per kg) ---------- */

export function qcContribution(takePct, discountPct, p = PLAN.qc) {
  return (p.mrp / (1 + p.gst)) * (1 - discountPct / 100) * (1 - takePct / 100) - p.costPerKg;
}
export function qcBreakEvenTake(discountPct, p = PLAN.qc) {
  return (1 - p.costPerKg / ((p.mrp / (1 + p.gst)) * (1 - discountPct / 100))) * 100;
}

/* ---------- Calculations behind the diagnosis and the claims ---------- */

export const crorePerKg = (crore, tonnes) => (crore * RUPEES_PER_CRORE) / (tonnes * 1000);
export const costRiseCr = (perKgDelta, tonnes) => (perKgDelta * tonnes * 1000) / RUPEES_PER_CRORE;

// Everyday discount: the average of all months except the festive ones (Oct and Nov).
export function everydayDiscount(months, festive = [6, 7]) {
  return mean(months.filter((_, i) => !festive.includes(i)));
}
export function festivePremium(months, festive = [6, 7]) {
  return mean(festive.map((i) => months[i])) - everydayDiscount(months, festive);
}
export const newBuyerRoas = (roas, existingSharePct) => roas * (1 - existingSharePct / 100);
export function codShareOfRto(codSharePct, rtoCodPct, rtoPrepaidPct) {
  const cod = codSharePct * rtoCodPct;
  return (cod / (cod + (100 - codSharePct) * rtoPrepaidPct)) * 100;
}
export const clicksIndex = (searchIndex, clickSharePct) => searchIndex * clickSharePct;
export const weightedMean = (values, weights) => sum(values.map((v, i) => v * weights[i])) / sum(weights);

export function bridgeGroupTotal(group) {
  const keys = BRIDGE_GROUPS[group].keys;
  return sum(BRIDGE.filter((b) => keys.includes(b.key)).map((b) => b.v));
}

// Running totals for the waterfall: each change starts where the previous one ended.
export function bridgeSteps(bars = BRIDGE) {
  let run = 0;
  return bars.map((b) => {
    if (b.total) { run = b.v; return { ...b, from: 0, to: b.v }; }
    const from = run;
    run += b.v;
    return { ...b, from, to: run };
  });
}
