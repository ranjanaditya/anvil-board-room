// Data module: the app's only source of numbers.
// Every value comes from the data-room files A to L (or a stated calculation on them) and
// carries its unit and source code. Amounts are ₹ crore ex-GST unless the unit says otherwise.
// FY runs April to March; "Q1 CY26" in the plant files is FY26 Q4.
// To update a number, change it here; screens, charts and drawers read from this module.

export const AS_OF = { iso: '2026-11-01', label: '1 Nov 2026' };
export const TIME_ZONE = 'Asia/Kolkata';

/* ---------- 6.1 Source codes ---------- */
export const SOURCES = {
  BP: { file: 'Board pack, Exhibit 1', what: 'CM2 and CM3, FY24 to FY26' },
  A: { file: "CFO's blackboard", what: 'Board-preparation notes' },
  B1: { file: 'Procurement notebook', what: 'Plant contracts and terms' },
  B2: { file: 'Procurement notebook', what: 'New formats' },
  B3: { file: 'Procurement notebook', what: 'Unit costs and whey prices' },
  C1: { file: 'Plant X statement, FY26', what: 'Audited' },
  C2: { file: 'Plant Y statement, FY26', what: 'Audited' },
  D: { file: 'Finance cost sheet', what: 'Cost per kg, FY24 actual and FY26 standard' },
  E: { file: 'Plants X and Y ledger', what: 'Capacity, utilisation, output share' },
  F: { file: 'Growth data export', what: 'Spend, orders, customers, costs, search, BCAA pilot' },
  G: { file: 'Marketplace settlements, FY26', what: 'Amazon and Flipkart settlement reports' },
  H: { file: 'Logistics annual bill, FY26', what: 'Courier, warehouse and destruction lines' },
  I: { file: 'Growth team chat', what: 'Opinion, not a record, unless it quotes a record', opinion: true },
  J: { file: 'Sales team chat', what: 'Opinion, not a record, unless it quotes a record', opinion: true },
  K: { file: 'Board chat', what: 'Opinion, not a record, unless it quotes a record', opinion: true },
  L: { file: 'Strategy benchmark', what: 'Anvil against Brands B and C' },
  Calc: { file: 'Calculation', what: 'A calculation on figures shown here; the drawer shows its formula' },
  Model: { file: 'Plan model', what: 'The plan formulas listed under Data and method, Sources' },
  Ext: { file: 'External research estimate', what: 'Not a data-room record' },
};
export const SOURCE_ORDER = ['BP', 'A', 'B1', 'B2', 'B3', 'C1', 'C2', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'Calc', 'Model', 'Ext'];

/* ---------- 6.2 Company P&L ---------- */
export const PNL = {
  years: ['FY24', 'FY25', 'FY26'],
  nr: { unit: '₹ cr', src: ['Calc', 'A'], values: [96.9, 119.0, 128.7], about: [true, true, false] },
  cm2Pct: { unit: '% of NR', src: ['BP'], values: [43.1, 34.7, 25.2] },
  cm3Pct: { unit: '% of NR', src: ['BP'], values: [13.1, 4.2, -5.3] },
  cm3Cr: { unit: '₹ cr', src: ['BP'], values: [12.7, 5.0, -6.8] },
  marketing: { unit: '₹ cr', src: ['F'], values: [28.9, 36.0, 39.3] },
  nrBuiltUpFy24: { v: 96.6, unit: '₹ cr', src: ['F', 'Calc'] },
  cm3SwingCr: { v: -19.5, unit: '₹ cr', src: ['BP', 'Calc'] },
};

export const FY26_QUARTERS = {
  labels: ['Q1 FY26', 'Q2 FY26', 'Q3 FY26', 'Q4 FY26'],
  nr: [29.2, 31.4, 33.2, 34.9],
  cm3Pct: [0, -3, -7, -10],
  unit: { nr: '₹ cr', cm3Pct: '% of NR' },
  src: ['A'],
};

export const FY26_CHANNEL = {
  nr: { d2c: 31.9, amazon: 58.4, flipkart: 38.5, unit: '₹ cr', src: ['A', 'G', 'Calc'] },
  cm2: { amazon: 14.5, flipkart: 8.8, d2c: 9.2, total: 32.5, unit: '₹ cr', src: ['A'], note: 'D2C by difference' },
};

export const VOLUME_FY26 = {
  madeT: 636, dispatchedT: 599, soldT: 590, destroyedT: 9.4, destroyedCr: 1.2,
  unit: 't', src: ['C1', 'C2', 'H', 'D'],
};

export const PER_KG = {
  nrFy26: 2181, // ₹ per kg, 128.7 cr ÷ 590 t
  cm2: [1015, 550], marketing: [705, 666], // ₹ per kg sold, FY24 and FY26
  tonnesSold: [410, 590], tonnesGrowthPct: 44,
  marketplaceShareDispatched: [48, 72], // % of tonnes dispatched
  marketingShareOfNr: 30, // about 30% of NR in both years
  unit: '₹ per kg', src: ['Calc'],
};

/* ---------- 6.3 Bridge, FY24 to FY26 CM3 ---------- */
export const BRIDGE = [
  { key: 'fy24', label: 'FY24 CM3', v: 12.7, total: true, basis: 'Board pack', src: ['BP'] },
  { key: 'volume', label: 'Volume and mix', v: 14.4, group: 'growth', src: ['D', 'H', 'F', 'Calc'],
    basis: 'Volume +19.2; mix −4.8 as sales shifted to marketplaces', parts: [['Volume', 19.2], ['Mix', -4.8]] },
  { key: 'price', label: 'Price and discounts', v: -10.0, group: 'growth', src: ['F', 'Calc'],
    basis: 'D2C −6.0, marketplaces −4.0. Everyday D2C discount went from 13.5% to 28.9%. The 22 Sep 2025 MRP cut from ₹3,260 to ₹2,901 only passed on the GST cut: the ex-GST price stayed ₹2,763',
    parts: [['D2C', -6.0], ['Marketplaces', -4.0]] },
  { key: 'marketing', label: 'Marketing', v: -10.4, group: 'growth', src: ['F'],
    basis: '₹28.9 cr to ₹39.3 cr, about 30% of NR in both years' },
  { key: 'whey', label: 'Whey', v: -7.7, group: 'cost', src: ['D'],
    basis: '₹740 to ₹870 per kg of product (+17.6%) × 590 t' },
  { key: 'conversion', label: 'Conversion, flavour and pack', v: -1.2, group: 'cost', src: ['C1', 'C2', 'D'],
    basis: '+₹20/kg × 590 t: conversion ₹110 to ₹120, flavour ₹100 to ₹105, pack ₹120 to ₹125' },
  { key: 'fees', label: 'Marketplace fee rates', v: -4.8, group: 'cost', src: ['A', 'G'],
    basis: 'Amazon 15% to 20%, Flipkart 17% to 22% of selling price ex-GST: 5 points × ₹96.9 cr of marketplace NR' },
  { key: 'logistics', label: 'Logistics', v: 0.1, src: ['H', 'F'],
    basis: 'Net effect after volume. For scale: the whole FY26 logistics bill was ₹2.35 cr, and rate rises in the courier and warehouse contracts came to ₹0.47 cr' },
  { key: 'rounding', label: 'Rounding', v: 0.1, src: ['Calc'], basis: 'Bars are rounded and tie to the total within ₹0.1 cr' },
  { key: 'fy26', label: 'FY26 CM3', v: -6.8, total: true, basis: 'Board pack', src: ['BP'] },
];
export const BRIDGE_GROUPS = {
  growth: { label: 'Net cost of growth', keys: ['volume', 'price', 'marketing'], v: -6.0, beforeRounding: -5.9 },
  cost: { label: 'Cost never priced through', keys: ['whey', 'conversion', 'fees'], v: -13.7 },
  other: { label: 'Logistics and rounding', keys: ['logistics', 'rounding'], v: 0.2 },
};
export const BRIDGE_INPUTS = {
  wheyPerKg: [740, 870], soldT: 590, conversionDeltaPerKg: 20,
  feePointsUp: 5, marketplaceNrFy26: 96.9, marketing: [28.9, 39.3],
  mrp: { before: 3260, after: 2901, exGst: 2763 },
};

/* ---------- 6.4 By channel, ₹ cr ex-GST ---------- */
export const CHANNEL = {
  cols: [
    { key: 'd2c24', ch: 'D2C', fy: 'FY24' }, { key: 'd2c26', ch: 'D2C', fy: 'FY26' },
    { key: 'mp24', ch: 'Marketplaces', fy: 'FY24' }, { key: 'mp26', ch: 'Marketplaces', fy: 'FY26' },
  ],
  rows: [
    { key: 'nr', label: 'NR', v: [49.5, 31.9, 47.1, 96.9] },
    { key: 'cm2', label: 'CM2', v: [23.7, 9.2, 17.9, 23.3] },
    { key: 'mkt', label: 'Marketing aimed at the channel', v: [16.4, 18.8, 12.4, 20.5] },
    { key: 'cm3', label: 'CM3', v: [7.3, -9.6, 5.5, 2.8] },
  ],
  unit: '₹ cr ex-GST', src: ['A', 'F', 'G', 'Calc'],
  footnote: 'Rounded; channel lines can differ from company totals by up to ₹0.3 cr.',
};

/* ---------- 6.5 Costs and whey ---------- */
export const COST_PER_KG = {
  unit: '₹ per kg sold', src: ['D'], cols: ['FY24 actual', 'FY26 standard'],
  rows: [
    ['Whey (WPC80), per kg of product', 740, 870],
    ['Flavour and premix', 100, 105],
    ['Tub, scoop, seal and label', 120, 125],
    ['Plant conversion', 110, 104],
    ['Inbound freight', 30, 30],
    ['Total', 1100, 1234],
  ],
};
export const COST_ACTUAL_FY26 = { perKg: 1250, extraCr: 0.94, billedConversion: 120, standardConversion: 104, unit: '₹ per kg', src: ['C1', 'C2', 'D'] };
export const CONVERSION_RATES = {
  steps: [{ from: 'Apr 2023', v: 110 }, { from: '1 Oct 2024', v: 114 }, { from: '1 Apr 2025', v: 120 }],
  plantY: { perServing: 3.60, servingG: 30, perKg: 120 }, unit: '₹ per kg', src: ['B1'],
};
export const PLANT_X_FY26 = { q: [82, 88, 90, 96], totalT: 356, billRupees: 42720000, avgT: 89, unit: 't', src: ['C1'] };
export const PLANT_Y_FY26 = { servingsLakh: [21.33, 23.33, 24.33, 24.33], totalLakh: 93.32, approxT: 280, billRupees: 33595200, unit: 'lakh servings of 30 g', src: ['C2'] };
export const WPC80_DOMESTIC = {
  points: [{ when: 'Q1 FY24', v: 790 }, { when: 'Q1 FY25', v: 853 }, { when: 'Q1 FY26', v: 928 }, { when: 'Oct 2026', v: 1024 }],
  unit: '₹ per kg of WPC80', src: ['B3'], note: 'One distributor has been quoting since Mar 2025.', risePct: 30,
};
export const WPC80_IMPORT = { landed: 843, when: 'Sep 2026', containerT: 20, minContainers: 2, leadDays: 75, unit: '₹ per kg of WPC80', src: ['B3'] };
export const WHEY_CONTENT = { v: 0.9375, unit: 'kg of WPC80 per kg of product', basis: '₹870 ÷ ₹928', src: ['Calc'] };
export const WHEY_COST_RISE_PCT = 17.6;

/* ---------- 6.6 Marketplaces, FY26 ---------- */
export const MARKETPLACES = {
  cols: ['Amazon', 'Flipkart'],
  rows: [
    { key: 'h1', label: 'Net sales incl. GST, 1 Apr to 21 Sep 2025 (18% GST)', v: [30.99, 20.44] },
    { key: 'h2', label: 'Net sales incl. GST, 22 Sep 2025 to 31 Mar 2026 (5% GST)', v: [33.70, 22.23] },
    { key: 'nr', label: 'NR ex-GST', v: [58.36, 38.49] },
    { key: 'fees', label: 'Fees ex-GST: referral, closing, shipping, weight handling', v: [11.67, 8.47], pct: [20.0, 22.0] },
    { key: 'ads', label: 'Advertising ex-GST', v: [5.92, 4.28] },
    { key: 'settled', label: 'Amount settled (still includes output GST)', v: [50.92, 32.68] },
  ],
  unit: '₹ cr', src: ['G', 'A', 'J'],
  feeRatePct: { amazon: [15, 20], flipkart: [17, 22], src: ['A'] },
  feesPerKg: [181, 341], feesShareOfCompanyNr: [7.6, 15.6],
  feesAndAdsShare: { total: 31, fees: 20.8, ads: 10.5, src: ['Calc'] },
  notes: [
    { text: 'Flipkart added a weight-based handling fee on tubs from 1 Apr 2025.', src: ['J'] },
    { text: 'Amazon took 2% extra co-op for the Prime Day slot.', src: ['J'] },
  ],
};

/* ---------- 6.7 Growth and D2C ---------- */
export const GROWTH = {
  years: ['FY24', 'FY25', 'FY26'], src: ['F'],
  rows: {
    perf: { label: 'Performance marketing, Meta and Google', unit: '₹ cr', v: [15.1, 18.7, 20.4] },
    retail: { label: 'Retail media on Amazon and Flipkart', unit: '₹ cr', v: [7.5, 9.4, 10.2] },
    influencer: { label: 'Influencer and affiliate', unit: '₹ cr', v: [4.9, 6.1, 6.7] },
    crm: { label: 'CRM', unit: '₹ cr', v: [1.4, 1.8, 2.0] },
    newCust: { label: 'D2C new customers', unit: 'lakh', v: [0.8, 0.8, 0.7] },
    newPaid: { label: 'D2C new customers from paid sources', unit: 'lakh', v: [0.58, 0.57, 0.50] },
    roas: { label: 'Reported Meta ROAS, 7-day click', unit: 'x', v: [3.5, 3.4, 3.3] },
    existingShare: { label: 'Platform-attributed purchases by existing customers', unit: '%', v: [24, 42, 59] },
    repeat90: { label: 'New customers reordering within 90 days', unit: '%', v: [34, 26, 17] },
    codeOrders: { label: 'D2C orders with an affiliate or coupon code', unit: '%', v: [5, 15, 24] },
    noCodeInfluencer: { label: 'Influencer spend on creators with no trackable code', unit: '%', v: [28, 46, 62] },
    codShare: { label: 'COD share of D2C orders', unit: '%', v: [36, 44, 52] },
    rtoCod: { label: 'RTO on shipped COD orders', unit: '%', v: [8, 17, 26] },
    rtoPrepaid: { label: 'RTO on shipped prepaid orders', unit: '%', v: [2, 2, 2] },
  },
  spendByDestinationFy26: {
    unit: '₹ cr', src: ['F'],
    rows: [
      ['Performance to D2C', 12.6], ['Performance to marketplace listings', 7.8],
      ['Influencer to D2C', 4.2], ['Influencer to marketplaces', 2.5], ['CRM', 2.0],
      ['Retail media, Amazon', 5.9], ['Retail media, Flipkart', 4.3],
    ],
  },
  derived: {
    newBuyerRoas: [2.66, 1.35], newBuyerRoasChangePct: -49,
    paidCac: [1948, 2520], paidCacChangePct: 29,
    codShareOfRtoFy26: 93,
    src: ['Calc'],
  },
  cohortsFy26: {
    unit: { spend: '₹ cr', customers: 'lakh', repeat: '%', cac: '₹' }, src: ['F'],
    rows: [
      { label: 'Meta and Google prospecting', spend: 12.6, customers: 0.28, repeat: 13, cac: 4500 },
      { label: 'Influencer creators with a code', spend: 1.7, customers: 0.08, repeat: 18, cac: 2125, cacUpperBound: true },
      { label: 'Affiliate and coupon aggregators', spend: 2.5, customers: 0.14, repeat: 5, cac: 1786 },
      { label: 'Organic and brand search', spend: 0, customers: 0.2, repeat: 24, cac: null },
    ],
    weightedRepeat: 15.1,
  },
  orders: {
    unit: { orders: 'lakh', share: '% of orders', aov: '₹' }, src: ['F'],
    d2c: { orders: [1.31, 1.04], share: [41, 20], aov: [4058, 3766], tubsPerOrder: [1.74, 1.92] },
    amazon: { orders: [1.20, 2.54], share: [37, 48], aov: [2625, 2492] },
    flipkart: { orders: [0.71, 1.66], share: [22, 32], aov: [2642, 2537] },
  },
  mrp: { fy24: 3200, toSep2025: 3260, fromSep2025: 2901, unit: '₹ incl. GST', src: ['F'] },
  cancelRto: { d2c: [6, 17], amazon: [4, 5], flipkart: [5, 6], unit: '% of orders', src: ['F'] },
  returnsKg: { d2c: [1, 2], amazon: [2, 3], flipkart: [2, 3], unit: '% of kg', src: ['F'] },
  tests: {
    t1: { label: 'Test 1, WhatsApp nudge (Jun 2026)', orders: 10000, offer: 150, switched: 38, cancelled: 12, stayedCod: 50, perMessage: 6, src: ['F'] },
    t2: { label: 'Test 2, prepaid-only checkout in 14 tier-3 pincode clusters (Jul to Aug 2026)', clusters: 14, shareOfD2cOrders: 22, ordersFellPct: 34, rto: [29, 4], src: ['F'] },
  },
  discounts: {
    // Monthly discount to MRP, %, April to March of each year.
    months: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    festive: [6, 7], // Oct and Nov
    unit: '% of MRP', src: ['F'],
    d2c: {
      FY24: [13, 13, 14, 14, 14, 14, 17, 16, 14, 13, 13, 13],
      FY25: [16, 17, 17, 18, 18, 18, 22, 21, 19, 20, 26, 27],
      FY26: [28, 28, 29, 29, 29, 30, 32, 31, 29, 28, 29, 30],
    },
    amazon: {
      FY24: [11, 11, 12, 12, 12, 12, 15, 14, 11, 11, 11, 12],
      FY25: [13, 14, 14, 14, 15, 15, 18, 17, 15, 15, 16, 16],
      FY26: [17, 17, 18, 18, 18, 18, 20, 20, 18, 17, 17, 18],
    },
    flipkart: {
      FY24: [12, 12, 13, 13, 13, 13, 16, 15, 12, 12, 13, 13],
      FY25: [14, 14, 15, 15, 15, 16, 19, 18, 16, 16, 16, 17],
      FY26: [17, 17, 18, 18, 18, 18, 20, 20, 18, 17, 17, 18],
    },
    everydayD2c: [13.5, 28.9], festivePremium: [3.0, 2.6],
    save10: { when: 'Feb 2025', label: 'SAVE10 given to coupon aggregators' },
  },
  search: {
    quarters: ['Q1 FY25', 'Q2 FY25', 'Q3 FY25', 'Q4 FY25', 'Q1 FY26', 'Q2 FY26', 'Q3 FY26', 'Q4 FY26', 'Q1 FY27', 'Q2 FY27'],
    index: [100, 101, 104, 97, 94, 92, 95, 86, 82, 79],
    clickShare: [24, 24, 23, 22, 21, 20, 20, 19, 18, 18],
    clicksFellPct: 41, searchesFellPct: 21, src: ['F'],
  },
  d2cUnitCosts: {
    src: ['F'],
    courier: [['1 to 2 kg', 62, 86], ['2 to 3 kg', 74, 102], ['3 to 5 kg', 98, 134], ['Reverse pickup', 95, 130]],
    codFee: 35, pickPack: [38, 44, 50], gatewayPct: 2,
  },
  bcaa: {
    months: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'], year: '2026',
    jars: [1000, 900, 820, 740, 680, 600],
    nrLakh: [9.7, 8.7, 8.0, 7.2, 6.6, 5.8],
    marketingLakh: [1.9, 1.6, 1.4, 1.1, 0.9, 0.7],
    cm3Pct: [27, 28, 28, 29, 30, 30],
    jarsFellPct: 40, marketingCutPct: 63, shareOfNrPct: 0.5, d2cTubCm3Pct: -30,
    src: ['F'],
  },
};

/* ---------- 6.8 Logistics, FY26 ---------- */
export const LOGISTICS = {
  billRupees: 23467100, billCr: 2.35, billWithGstRupees: 27691178, rateRisesCr: 0.47, src: ['H'],
  lines: [
    'First mile from X, 356 t at ₹3,100/t, and from Y, 280 t at ₹2,400/t',
    'Line-haul to Amazon 261 t, Flipkart 172 t, D2C hub 166 t',
    'D2C last mile: 28,200 consignments at 1 to 2 kg (₹86), 52,500 at 2 to 3 kg (₹102), 20,200 at 3 to 5 kg (₹134)',
    '16,290 reverse pickups (₹130); 52,500 COD orders (₹35 fee); 1,00,900 orders picked and packed (₹50)',
    '42,000 pallet-days of storage (₹6); 9,400 kg destroyed (₹14/kg)',
  ],
  fy25to26: {
    pickedUpT: [535, 636], dispatchedT: [530, 599], amazonT: [198, 261], flipkartT: [128, 172], d2cT: [204, 166],
    palletDays: [24000, 42000], destroyedKg: [1800, 9400], certificates: [3, 11],
  },
  tiers: [
    { tier: 'Metro', share: 24, rto: 6 }, { tier: 'Tier 1', share: 31, rto: 10 },
    { tier: 'Tier 2', share: 26, rto: 18 }, { tier: 'Tier 3 and beyond', share: 19, rto: 31 },
  ],
};

/* ---------- 6.9 Plants ---------- */
export const PLANTS = {
  quarters: ['Q2 CY23', 'Q3 CY23', 'Q4 CY23', 'Q1 CY24', 'Q2 CY24', 'Q3 CY24', 'Q4 CY24', 'Q1 CY25', 'Q2 CY25', 'Q3 CY25', 'Q4 CY25', 'Q1 CY26'],
  capacity: {
    unit: 't a quarter', src: ['E'],
    tub: [380, 380, 400, 400, 420, 440, 440, 430, 420, 400, 400, 380],
    sachet: [0, 0, 0, 40, 80, 120, 160, 200, 240, 290, 320, 340],
    rtd: [0, 0, 0, 0, 0, 40, 60, 80, 110, 130, 160, 180],
  },
  share: {
    unit: '% of combined output', src: ['E'],
    anvil: [30, 32, 32, 30, 29, 25, 24, 24, 22, 22, 21, 21],
    brandB: [22, 21, 19, 17, 14, 11, 9, 8, 7, 6, 5, 5],
    brandC: [18, 17, 16, 14, 11, 9, 7, 6, 5, 5, 4, 4],
    others: [30, 30, 33, 39, 46, 55, 60, 62, 66, 67, 70, 70],
  },
  plantX: { capacityT: [209, 495], capexCr: [52, 150] },
  plantY: { capacityLakhServings: [57, 135], capexCr: [40, 108] },
  utilisationPct: [81, 89],
  anvilTubFill: { pct: 44, anvilT: 169, tubCapacityT: 380, atX: 96, atY: 73, when: 'Q1 CY26', src: ['C1', 'C2', 'Calc'] },
  brandsBCVolumeCutPct: 41,
  src: ['E'],
};

/* ---------- 6.10 Competitors ---------- */
export const COMPETITORS = {
  brands: ['Anvil', 'Brand B', 'Brand C'], src: ['L'],
  scoop: [{ protein: 24, scoop: 32 }, { protein: 25, scoop: 33 }, { protein: 22, scoop: 30 }],
  realisationPer100gProtein: { unit: '₹', from: 'FY24', to: 'FY26', v: [[314, 291], [308, 320], [307, 314]] },
  cm1Pct: { unit: '% of NR', from: 'FY24', to: 'FY26', v: [[53, 43], [48, 53], [46, 50]] },
  amazonRank: { from: 'Q1 FY25', to: 'Q2 FY27', v: [[3, 6], [6, 3], [8, 4]] },
  activeListings: { when: 'Q2 FY27', v: [6, 15, 12] },
};

/* ---------- 6.11 Claims ---------- */
export const VERDICTS = {
  contradicted: { label: 'Contradicted', icon: 'circle-x', tone: 'negative' },
  partly: { label: 'Partly supported', icon: 'circle-dashed', tone: 'caution' },
  unverifiable: { label: 'Unverifiable', icon: 'circle-help', tone: 'neutral' },
  notContradicted: { label: 'Not contradicted', icon: 'circle-check', tone: 'positive' },
  remark: { label: 'Remark only', icon: 'message-circle', tone: 'neutral' },
};
export const PEOPLE = {
  arjun: { name: 'Arjun', role: 'CEO' },
  rhea: { name: 'Rhea', role: 'CMO' },
  karan: { name: 'Karan', role: 'Performance marketing' },
  kunal: { name: 'Kunal', role: 'CFO' },
  vikram: { name: 'Vikram', role: 'Amazon KAM' },
  procurement: { name: 'Procurement note', role: 'Procurement' },
  plants: { name: 'Plants, via procurement', role: 'Plants X and Y' },
  sinha: { name: 'Mr Sinha', role: 'Plant Y' },
  meera: { name: 'Meera', role: 'Brand' },
  anita: { name: 'Anita', role: 'Lead independent director' },
};
export const CLAIMS = [
  { id: 'arjun', person: 'arjun', featured: true, topic: 'Festive-season discounting',
    quote: 'Agreed. That and the festive discounting.',
    verdicts: [{ v: 'contradicted' }],
    records: 'The everyday D2C discount rose from 13.5% to 28.9%, stepping up in Feb 2025 when SAVE10 went to coupon aggregators. The festive premium shrank from 3.0 to 2.6 points. Festive Q3 FY26 (−7%) beat non-festive Q4 (−10%). Anvil’s realisation per 100 g of protein fell from ₹314 to ₹291 while B and C raised theirs.',
    src: ['F', 'I', 'A', 'L', 'K'] },
  { id: 'rhea', person: 'rhea', featured: true, topic: 'Website conversion, “not media”',
    quote: 'Site conversion is down, 3.1% to 2.3%. That is the real leak, not media.',
    verdicts: [{ part: 'Conversion', v: 'unverifiable' }, { part: 'Not media', v: 'contradicted' }],
    records: 'No site-conversion data in the records. Marketing rose ₹10.4 cr, about half the ₹19.5 cr CM3 swing. ROAS on new buyers fell 49%; existing customers made 59% of attributed purchases, up from 24%; D2C new customers fell from 0.8 to 0.7 lakh.',
    src: ['F', 'I'] },
  { id: 'karan', person: 'karan', featured: true, topic: 'Couriers and returns; ROAS stable',
    quote: 'RTO is a courier problem, not a COD problem. Meta ROAS is still 3.4x on 7-day click. Stable.',
    verdicts: [{ part: 'Couriers', v: 'contradicted' }, { part: 'RTO', v: 'contradicted' }, { part: 'ROAS', v: 'partly' }],
    records: 'The whole logistics bill is ₹2.35 cr, and rate rises in the courier and warehouse contracts came to ₹0.47 cr, while marketplace fees rose from 7.6% to 15.6% of NR. COD RTO went from 8% to 26% while prepaid stayed at 2%; COD is 93% of RTOs. Reported ROAS held near 3.4x, but on new buyers it fell 49%, and paid CAC rose 29%.',
    src: ['H', 'F', 'G', 'A', 'I'] },
  { id: 'kunal', person: 'kunal', featured: true, topic: 'Whey prices',
    quote: 'Whey is up about 30% since FY24. That is the margin story.',
    verdicts: [{ v: 'partly' }],
    records: 'The domestic quote is up 30% (₹790 to ₹1,024, Q1 FY24 to Oct 2026), but cost per kg of product rose 17.6% through FY26 (₹740 to ₹870): ₹7.7 cr, or 6 of the 17.9 points of CM2 lost. Fees per kg rose more (₹181 to ₹341). Imports land at ₹843 against ₹1,024 from the sole domestic distributor.',
    src: ['B3', 'D', 'G', 'BP', 'K'] },
  { id: 'kunal-growth', person: 'kunal', topic: 'Cut spend across the board',
    quote: 'Growth is eating us. Cut spend 20% across the board??',
    verdicts: [{ v: 'partly' }],
    records: 'Marketing stayed about 30% of NR but rose ₹10.4 cr, about half the CM3 swing.',
    src: ['F', 'A'] },
  { id: 'kunal-bcaa', person: 'kunal', topic: 'Scale BCAA',
    quote: 'BCAA pilot ~29% CM3 vs tubs −10%. Scale BCAA, cut tub stock?',
    verdicts: [{ v: 'partly' }],
    records: 'The 27% to 30% CM3 is real, but monthly jars fell 40% as D2C marketing was cut 63%. The fair comparison is D2C tubs at about −30% CM3, not −10%. BCAA is about 0.5% of NR at its September run-rate.',
    src: ['F', 'A'] },
  { id: 'kunal-qc', person: 'kunal', topic: 'Quick-commerce take',
    quote: 'Quick-commerce apps take 30%+ before ads anyway.',
    verdicts: [{ v: 'unverifiable' }],
    records: 'No rate card on file; external estimates put the take at 45% to 55%.',
    src: ['K', 'Ext'] },
  { id: 'vikram-rank', person: 'vikram', topic: 'Amazon rank',
    quote: 'Amazon rank slipped from #3 to #6. Seasonal.',
    verdicts: [{ v: 'contradicted' }],
    records: 'Over the same period B climbed from 6th to 3rd and C from 8th to 4th. Anvil’s click share fell from 24% to 18%.',
    src: ['L', 'F', 'J'] },
  { id: 'vikram-search', person: 'vikram', topic: 'Search report',
    quote: 'Nothing unusual in it.',
    verdicts: [{ v: 'contradicted' }],
    records: 'Whey searches fell 21% and Anvil’s clicks 41%; half the fall in clicks came in the last three quarters.',
    src: ['F', 'J'] },
  { id: 'procurement', person: 'procurement', topic: 'Volume at Plant X',
    quote: 'Today Anvil ~96 t/qtr at X.',
    verdicts: [{ v: 'partly' }],
    records: '96 t was one quarter. FY26 averaged 89 t, with two quarters under the 90 t tier.',
    src: ['C1', 'B1'] },
  { id: 'plants', person: 'plants', topic: 'Rate rises',
    quote: 'Rate rises for “capex recovery”.',
    verdicts: [{ v: 'partly' }],
    records: 'Plant X capex rose from ₹52 cr to ₹150 cr, but tub-line capacity ended where it started (380 t a quarter); the new capacity is sachet and RTD.',
    src: ['E', 'B1'] },
  { id: 'sinha', person: 'sinha', topic: 'Plant Y load',
    quote: 'We are running flat out on every line right now.',
    verdicts: [{ v: 'notContradicted' }],
    records: 'Reported utilisation reached 89%.',
    src: ['E', 'J'] },
  { id: 'meera', person: 'meera', topic: 'Reels',
    quote: 'Sachet and plant-protein reels are doing 3x our tub reels.',
    verdicts: [{ v: 'remark' }],
    records: 'No reel data in the records.',
    src: ['I'] },
];

/* ---------- 6.12 Options for FY28 ---------- */
export const OPTIONS = [
  { id: 'A', name: 'Cut-only tub brand', verdict: 'Reject as framed', tone: 'negative', icon: 'circle-x',
    why: 'A flat 20% cut saves ₹7.9 cr a year and pays unless it loses ₹31 cr of NR, but it also cuts the retail media that defends Amazon rank.',
    src: ['A', 'F', 'Calc'] },
  { id: 'B', name: 'Format-first pivot', verdict: 'Test first', tone: 'caution', icon: 'circle-dashed',
    why: 'One sachet run is 5.6 lakh sachets and ₹2.6 cr of cash, against 0.7 lakh new D2C customers a year. RTD cannot start before Apr 2027.',
    src: ['B2', 'F'] },
  { id: 'C', name: 'Marketplace and quick-commerce led', verdict: 'No for tubs', tone: 'negative', icon: 'circle-x',
    why: 'Marketplaces already take 31% of their sales in fees and ads. At a 45% to 55% quick-commerce take, a tub clears +₹270 to −₹7 a kg on ₹1,250 of cost.',
    src: ['G', 'Ext', 'Calc'] },
  { id: 'D', name: 'Tub-led brand that earns its volume', verdict: 'Recommended', tone: 'positive', icon: 'circle-check', recommended: true,
    why: 'Reprice and re-cost the tub core; a plant tub as a whey hedge (CM2 about 38% against about 24% for the whey tub); one sachet flavour as a trial; BCAA parked (about 0.5% of NR at its September run-rate).',
    src: ['B2', 'B3', 'F', 'Model'] },
];
export const ANITA_QUOTE = { text: 'I would rather earn 1% on a business that doubles than 7% on one that shrinks.', who: 'Anita, lead independent director, in the board chat', src: ['K'] };

/* ---------- 6.13 Levers ---------- */
export const LEVERS = [
  { id: 'L1', short: 'Marketing back to 25% of NR', what: 'Redeploy spend with no proof that it works (coupon-aggregator codes ₹2.5 cr a year, creators with no code about ₹4.2 cr, other untested pools), bringing marketing back to 25% of NR',
    crYear: '+6.8 to +12.9 gross, assuming at most ₹3 cr of CM2 lost; +6 to +8 net', q4: '+10.0 (marketing branch) or +5.3 (CM2 branch)',
    starts: 'Holdout tests Nov 2026; live Jan 2027', cash: 'None', stop: 'A pool loses more CM2 than it saves' },
  { id: 'L2', short: 'D2C discount from 29% to 22%', what: 'D2C: switch off aggregator codes; everyday discount from 29% to 22%',
    crYear: '+2 to +3', q4: '+1.5 to +2.4', starts: 'Test Dec 2026', cash: 'None', stop: 'Contribution per visitor falls' },
  { id: 'L3', short: 'Marketplace discount depth 18% to 15%', what: 'Marketplace discount depth from 18% to 15%, Flipkart first',
    crYear: 'Up to +2.8', q4: '+0.2 to +2.2', starts: 'Jan 2027', cash: 'None', stop: 'Volume falls 11% or rank drops 2 places' },
  { id: 'L4a', short: 'Reprice domestic whey', what: 'Reprice domestic whey: show the incumbent the ₹843 import quote, get a second quote',
    crYear: '+2.8 per ₹50/kg off WPC80', q4: 'Upside +0.5 to +1.6, not counted', starts: 'Nov 2026', cash: 'None', stop: 'Distributor holds ₹1,024' },
  { id: 'L4b', short: 'Import whey', what: 'Import whey: order by 20 Nov 2026, landing about 3 Feb 2027; 30% of need by Mar 2027, 50% in FY28',
    crYear: '+3.0 at 30%; +5.0 at 50%', q4: '0 to +1.1 (sold from March)', starts: 'Order 20 Nov 2026', cash: '₹4.6 cr at 30%; ₹6.5 cr at 50%', stop: 'Landed at ₹960/kg or more, or clearance over 90 days' },
  { id: 'L5', short: 'Plant X: counter, then hold 92 t', what: 'Plant X: counter the draft, then hold at least 92 t a quarter by routing volume from Y',
    crYear: '+0.6 from Apr 2027', q4: '0, starts after Q4', starts: 'Decide by 31 Dec 2026', cash: 'None', stop: 'X refuses and falls under 90 t twice' },
  { id: 'L6', short: 'Pack changes', what: 'Pack: 2 kg tub and lighter packs against the weight-handling fee',
    crYear: '+1 to +2 from FY28', q4: '0', starts: 'Once fee lines are confirmed', cash: 'Small', stop: 'The weight fee is under 2 of the 5 fee points' },
  { id: 'L7', short: 'COD to prepaid', what: 'COD to prepaid, and stop paying for RTOs in tier-3 clusters',
    crYear: 'COD to prepaid −0.2 to +0.5; tier-3 clusters +1.4', q4: '0 to +0.4', starts: 'Dec 2026', cash: 'None', stop: 'Test 1 cancellers had normal delivery records' },
  { id: 'L8', short: 'Match production to sales', what: 'Match production to sales: stop the 46 t overbuild (9.4 t destroyed in FY26)',
    crYear: '+0.9 of margin', q4: 'Not in the P&L', starts: 'Now', cash: '₹3.5 cr released', stop: 'The write-off is already inside CM2' },
  { id: 'L9', short: 'Amazon range', what: 'Amazon range: 2 kg, 500 g, 2 to 3 flavours (6 listings against 15 and 12)',
    crYear: '+0.8 per point of click share', q4: 'Not counted', starts: 'Jan 2027', cash: 'Small', stop: 'Click share flat after 2 quarters' },
  { id: 'Tests', short: 'Plant-tub and sachet tests', what: '8 t plant-tub run and one sachet flavour at Y (Jan 2027 slot), funded from L1',
    crYear: 'Cost ₹1.5 to 2 cr at most, inside the 25% marketing budget', q4: 'Not counted', starts: 'Within Q4 FY27', cash: '₹0.6 cr + ₹2.6 cr', stop: 'Cost per converted tub buyer above ₹3,360' },
];

/* ---------- 6.14 Roadmap ---------- */
export const LANES = [
  { key: 'data', label: 'Data and governance' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'price', label: 'Price' },
  { key: 'whey', label: 'Whey and plants' },
  { key: 'channel', label: 'Channel and operations' },
  { key: 'tests', label: 'Tests' },
];
// kind: milestone (diamond on a date), window (bar), gate (labelled vertical line), band (shaded period)
export const ROADMAP = [
  { when: 'Now', lane: 'whey', kind: 'milestone', start: '2026-11-01', label: 'L8: match production to sales', lever: 'L8' },
  { when: 'Nov 2026', lane: 'marketing', kind: 'window', start: '2026-11-01', end: '2026-11-30', label: 'L1 holdout tests start', lever: 'L1' },
  { when: 'Nov 2026', lane: 'whey', kind: 'window', start: '2026-11-01', end: '2026-11-30', label: 'L4a: reprice domestic whey with the ₹843 quote; ask for a second quote', lever: 'L4a' },
  { when: '15 Nov 2026', lane: 'data', kind: 'milestone', start: '2026-11-15', label: 'FY26 marketing by quarter and H1 FY27 P&L by channel arrive; set the branch', lever: 'data' },
  { when: '20 Nov 2026', lane: 'whey', kind: 'milestone', start: '2026-11-20', label: 'L4b: import order placed', lever: 'L4b' },
  { when: 'Dec 2026', lane: 'marketing', kind: 'window', start: '2026-12-01', end: '2026-12-31', label: 'L2 discount test', lever: 'L2' },
  { when: 'Dec 2026', lane: 'channel', kind: 'window', start: '2026-12-01', end: '2026-12-31', label: 'L7: COD to prepaid', lever: 'L7' },
  { when: '31 Dec 2026', lane: 'whey', kind: 'milestone', start: '2026-12-31', label: 'Plant X answer due (L5)', lever: 'L5' },
  { when: 'Jan 2027', lane: 'marketing', kind: 'window', start: '2027-01-01', end: '2027-01-31', label: 'L1 live', lever: 'L1' },
  { when: 'Jan 2027', lane: 'price', kind: 'window', start: '2027-01-01', end: '2027-01-31', label: 'L3, Flipkart first', lever: 'L3' },
  { when: 'Jan 2027', lane: 'channel', kind: 'window', start: '2027-01-01', end: '2027-01-31', label: 'L9: Amazon range', lever: 'L9' },
  { when: 'Jan 2027', lane: 'tests', kind: 'window', start: '2027-01-01', end: '2027-01-31', label: 'Sachet slot at Plant Y opens; plant-tub run within Q4 FY27', lever: 'Tests' },
  { when: '15 Jan 2027', lane: 'data', kind: 'milestone', start: '2027-01-15', label: 'Q3 check: decide the backstop', lever: 'backstop' },
  { when: 'About 3 Feb 2027', lane: 'whey', kind: 'milestone', start: '2027-02-03', label: 'Imported whey lands; in product sold from March', lever: 'L4b' },
  { when: 'Jan to Mar 2027', lane: 'target', kind: 'band', start: '2027-01-01', end: '2027-03-31', label: 'Q4 FY27, the break-even quarter' },
  { when: '31 Mar 2027', lane: 'guardrail', kind: 'gate', start: '2027-03-31', label: 'Working-capital cap of ₹10 cr' },
  { when: '1 Apr 2027', lane: 'whey', kind: 'milestone', start: '2027-04-01', label: 'New Plant X terms start; L5 begins', lever: 'L5' },
  { when: 'Apr 2027', lane: 'tests', kind: 'window', start: '2027-04-01', end: '2027-04-30', label: 'First RTD slot at Plant X (not in the plan)' },
  { when: 'FY28', lane: 'channel', kind: 'window', start: '2027-04-01', end: '2028-03-31', label: 'L6: pack changes', lever: 'L6' },
  { when: 'Apr 2027 to Mar 2028', lane: 'target', kind: 'band', start: '2027-04-01', end: '2028-03-31', label: 'FY28, the full-year test' },
  { when: '31 Mar 2028', lane: 'guardrail', kind: 'gate', start: '2028-03-31', label: 'Working-capital cap of ₹16 cr; Plant Y contract ends' },
];
export const NEXT_DECISIONS = [
  { date: '2026-11-15', label: 'FY26 marketing by quarter and H1 FY27 P&L by channel (settles the branch)', tracker: 'data' },
  { date: '2026-11-20', label: 'Import whey purchase order (lands about 3 Feb 2027)', tracker: 'L4b' },
  { date: '2026-12-31', label: 'Plant X answer', tracker: 'L5' },
  { date: '2027-01-15', label: 'Q3 check: switch on the backstop if needed', tracker: 'backstop' },
  { date: '2027-04-01', label: 'New Plant X terms start', tracker: 'L5' },
];
export const TIMELINE_RANGE = { start: '2026-11-01', end: '2028-03-31' };

/* ---------- Tracker rows (owners and status start empty) ---------- */
export const TRACKER_STATUSES = ['Not started', 'In test', 'Live', 'Stopped', 'Done'];
export const TRACKER_ROWS = [
  { id: 'data', lever: 'Branch data', next: '2026-11-15', stop: 'If Q4 FY26 marketing was 31% of NR or less, switch to Costs inside CM2' },
  { id: 'L1', lever: 'L1', next: '' }, { id: 'L2', lever: 'L2', next: '' }, { id: 'L3', lever: 'L3', next: '' },
  { id: 'L4a', lever: 'L4a', next: '' }, { id: 'L4b', lever: 'L4b', next: '2026-11-20' },
  { id: 'L5', lever: 'L5', next: '2026-12-31' }, { id: 'L6', lever: 'L6', next: '' }, { id: 'L7', lever: 'L7', next: '' },
  { id: 'L8', lever: 'L8', next: '' }, { id: 'L9', lever: 'L9', next: '' }, { id: 'Tests', lever: 'Tests', next: '' },
  { id: 'backstop', lever: 'Backstop', next: '2027-01-15', stop: 'Decided at the 15 Jan 2027 check' },
];

/* ---------- 6.15 Assumptions ---------- */
export const ASSUMPTIONS = [
  { text: 'Target: break-even CM3 in Q4 FY27 (Jan to Mar 2027) is the milestone; a positive full-year FY28 is the two-year test.', src: ['A', 'Model'] },
  { text: 'Branch: the Q4 FY26 slide came from a marketing step-up, from about 25% to 35% of NR. This is inferred, because discounts were flat across FY26 and CM2 held near 25.2%. If Q4 FY26 marketing was 31% of NR or less, switch to Costs inside CM2.', src: ['A', 'F', 'BP'] },
  { text: 'Revenue: NR of about ₹33 cr a quarter and ₹129 cr a year, held flat into FY28.', src: ['A', 'Model'] },
  { text: 'Whey: 0.9375 kg of WPC80 per kg of product; FY27 domestic whey at ₹1,024/kg.', src: ['B3', 'D', 'Calc'] },
  { text: 'Imports: landed at ₹843/kg; ordered by 20 Nov 2026 and landing about 3 Feb 2027; capped at 30% of need by Mar 2027 and 50% in FY28.', src: ['B3', 'Model'] },
  { text: 'Plant X: counter the draft and hold at least 92 t a quarter by routing volume from Y, which has no minimum and charges the equivalent of ₹120/kg.', src: ['B1', 'C2', 'Model'] },
  { text: 'Price resets: stop L3 if volume falls 11% or Amazon rank drops two places.', src: ['Model'] },
  { text: 'Quick commerce: a take of 45% to 55% of selling price, an external estimate; no signed rate card.', src: ['Ext'] },
  { text: 'GST: input credit builds by about ₹10 cr a year after the 22 Sep 2025 rate cut; needs a specialist’s sign-off.', src: ['Model'] },
  { text: 'Tier 3: sized on Test 2’s 14 clusters (22% of D2C orders), not the logistics bill’s tier 3 (19% of consignments), because the definitions and periods differ.', src: ['F', 'H'] },
  { text: 'Plants: X and Y report identical utilisation, so only combined plant figures are used.', src: ['E'] },
  { text: 'Payment gateway: the 2% fee on prepaid orders sits outside reported CM2 and is in the FY28 momentum case (−0.3 points).', src: ['F', 'Model'] },
];

/* ---------- 6.16 Data health ---------- */
export const DATA_HEALTH = {
  conflicts: [
    { title: 'Goal wording', text: 'The board brief asks for CM3 positive “within two years”; the CFO’s guardrail says CM3 at or above zero by Q4 FY27, “the quarter, not the year”. Handled by assumption 1.', src: ['A'] },
    { title: 'FY26 conversion', text: 'The cost standard uses ₹104/kg, a tier never agreed; both plants billed ₹120/kg in audited statements. Actual FY26 cost is about ₹1,250/kg.', src: ['D', 'C1', 'C2'] },
    { title: 'Tier 3', text: '22% of D2C orders (F, Test 2) against 19% of consignments (H). Different definitions and periods; handled by assumption 10.', src: ['F', 'H'] },
    { title: 'Cost-cutting', text: 'The brief rules out a cost-cutting list; the CFO’s note floats a 20% cut. Shown as option A and rejected as framed.', src: ['A'] },
  ],
  errors: [
    { file: 'E', text: 'X and Y utilisation are identical in all twelve quarters, and Y’s capacity is exactly 45% of the total in ten of them, so the per-plant split looks allocated rather than reported.', src: ['E'] },
    { file: 'F', text: 'The FY26 cohort-weighted 90-day repeat is 15.1%, but the funnel sheet says 17%.', src: ['F'] },
    { file: 'F', text: 'The influencer CAC of ₹2,125 is an upper bound: the spend includes creators with no code, but the customer count does not.', src: ['F'] },
    { file: 'H', text: '“avg 116 pallets” against 42,000 pallet-days ÷ 365 = 115.1. Immaterial.', src: ['H'] },
    { file: 'K', text: 'The chat header has no “You”; the unlabelled messages read as Anita’s.', src: ['K'] },
  ],
  rules: [
    'G’s “amount settled” still includes output GST.',
    'Plant Y bills per 30 g serving, not per 32 g scoop.',
    '“Q1 CY26” in C and E is FY26 Q4.',
    'Where two files differ, they are measuring different things.',
  ],
};

/* ---------- 6.17 Open requests ---------- */
export const OPEN_REQUESTS = [
  { id: 'branch-data', request: 'FY26 marketing by quarter and the H1 FY27 P&L by channel', why: 'Settles the branch, which moves Q4 FY27 by 4.7 points', due: '2026-11-15', src: ['Model'] },
  { id: 'owners', request: 'An owner and review cadence for each lever', why: 'The tracker starts with no owners', due: null },
  { id: 'conversion', request: 'Website conversion data', why: 'Tests the 3.1% to 2.3% claim', due: null, src: ['I'] },
  { id: 'why-left', request: 'Customer evidence on why D2C buyers left', why: 'Shows what makes the tub earn its volume', due: null },
  { id: 'qc-card', request: 'A signed quick-commerce rate card for protein', why: 'Replaces the external take-rate estimate', due: null },
  { id: 'fy28-revenue', request: 'FY28 revenue scenarios', why: 'The plan holds NR flat at about ₹129 cr', due: null, src: ['Model'] },
  { id: 'market-size', request: 'Market size by format', why: 'Sizes the sachet, RTD and plant-tub tests', due: null },
  { id: 'gst', request: 'A tax specialist’s sign-off on the GST credit', why: 'It is the binding cash limit by Mar 2028', due: null },
  { id: 'plant-tub-protein', request: 'Protein content of the plant tub', why: 'Needed for cost per 100 g of protein', due: null },
];

/* ---------- 6.18 Glossary ---------- */
export const GLOSSARY = [
  { term: 'CM1', full: 'Contribution margin 1', def: 'Net revenue less cost of goods.' },
  { term: 'CM2', full: 'Contribution margin 2', def: 'CM1 less channel fees, delivery, returns and other variable selling costs.' },
  { term: 'CM3', full: 'Contribution margin 3', def: 'CM2 less marketing; what Anvil keeps after paying for its product, its deliveries and its customers.' },
  { term: 'NR', full: 'Net revenue', def: 'Sales after discounts and returns, excluding GST.' },
  { term: 'D2C', full: 'Direct to consumer', def: 'Anvil’s own website.' },
  { term: 'COD', full: 'Cash on delivery', def: 'The customer pays the courier when the order arrives.' },
  { term: 'RTO', full: 'Return to origin', def: 'An order that comes back undelivered.' },
  { term: 'ROAS', full: 'Return on ad spend', def: 'Revenue attributed to ads divided by what the ads cost.' },
  { term: 'CAC', full: 'Customer acquisition cost', def: 'Cost to acquire a customer.' },
  { term: 'AOV', full: 'Average order value', def: 'Average value of an order.' },
  { term: 'MRP', full: 'Maximum retail price', def: 'The printed price, including GST.' },
  { term: 'GST', full: 'Goods and Services Tax', def: 'India’s indirect tax. Amounts here are ex-GST unless stated.' },
  { term: 'WPC80', full: 'Whey protein concentrate, 80%', def: 'Whey protein concentrate with 80% protein, the main raw material.' },
  { term: 'MOQ', full: 'Minimum order quantity', def: 'The smallest order a supplier will accept.' },
  { term: 'PO', full: 'Purchase order', def: 'A buyer’s formal order to a supplier.' },
  { term: 'LC', full: 'Letter of credit', def: 'A bank’s promise to pay a supplier; “at sight” means paid when documents are presented.' },
  { term: 'KAM', full: 'Key account manager', def: 'The person who manages a marketplace relationship.' },
  { term: 'FC', full: 'Fulfilment centre', def: 'A marketplace warehouse that stores and ships orders.' },
  { term: 'RTD', full: 'Ready to drink', def: 'A protein shake sold ready to drink.' },
  { term: 'BCAA', full: 'Branched-chain amino acids', def: 'A supplement sold in a 250 g jar in the D2C pilot.' },
  { term: 't', full: 'Tonne', def: '1,000 kg.' },
  { term: 'Lakh', full: 'Lakh', def: '1,00,000.' },
  { term: 'Crore', full: 'Crore', def: '1,00,00,000 (100 lakh). Shown as “cr”.' },
  { term: 'FY', full: 'Financial year', def: 'April to March, so FY27 is Apr 2026 to Mar 2027 and Q4 FY27 is Jan to Mar 2027.' },
  { term: 'CY', full: 'Calendar year', def: 'January to December. “Q1 CY26” in the plant files is FY26 Q4.' },
  { term: 'Points of NR', full: 'Percentage points of net revenue', def: 'A change in a margin, measured as a share of net revenue.' },
];

/* ---------- Plan model inputs (formulas live in model.js) ---------- */
export const PLAN = {
  q4: {
    nrCr: 33, // Q4 FY27 net revenue, ₹ cr
    momentum: {
      q4Fy26Cm3Pct: -10.0, // [A]
      wpc80Fy27: 1024, // ₹ per kg of WPC80 [B3]
      wheyContent: 0.9375, // kg of WPC80 per kg of product [Calc]
      wheyPerKgFy26: 870, // ₹ per kg of product, FY26 standard [D]
      flavourPackPerKg: 5, // ₹ per kg of product, FY27 rise [D]
      nrFy26Cr: 128.7, soldFy26T: 590, // NR per kg sold [A, D]
    },
    l1: { mkt: 10.0, cm2: 5.3 },
    l1Basis: { mkt: 'Marketing from 35% back to 25% of NR', cm2: 'Marketing from 30.5% to 25.2% of NR' },
    sliders: {
      L2: { min: 1.5, max: 2.4, label: 'L2 · D2C price', desc: 'Aggregator codes off; everyday D2C discount from 29% to 22%' },
      L3: { min: 0.2, max: 2.2, label: 'L3 · Marketplace price', desc: 'Discount depth from 18% to 15%, Flipkart first' },
      L4b: { min: 0, max: 1.1, label: 'L4b · Imported whey', desc: 'Lands about 3 Feb 2027; in product sold from March' },
      L7: { min: 0, max: 0.4, label: 'L7 · COD to prepaid', desc: 'COD to prepaid; stop paying for tier-3 RTOs' },
    },
    step: 0.1,
    backstop: { points: 3.5, savesCr: 6.3, cm2LostCr: 1.7, customers: 14000, cm2PerCustomer: 1200, netCrYear: 4.6, netCrQuarter: 1.15 },
    upsideL4a: [0.5, 1.6],
  },
  fy28: {
    nrCr: 129,
    cm2: { momentum: 20.6, cautious: 25.4, central: 28.2, favourable: 30.5 },
    marketing: { min: 20, max: 35, step: 0.5, default: 25, plan: 25, fy26Actual: 30.5, ticks: [25, 28, 30.5] },
    crPerPoint: 1.29,
    buildUp: {
      momentum: 'Whey at ₹1,024 and nothing else, including −0.3 points of payment-gateway fee.',
      cautious: 'Momentum + price 2.0 points + imports at 30% (₹3.0 cr) + Plant X (₹0.6 cr).',
      central: 'Momentum + price 3.3 points + imports at 50% (₹5.0 cr) + Plant X ₹0.6 cr.',
      favourable: 'Momentum + price 4.6 points + imports at 50% + Plant X ₹0.6 cr + pack ₹1.3 cr.',
    },
  },
  plantX: {
    draftReceived: '2026-10-09', termYears: 3, termStart: '2027-04-01', decideBy: '2026-12-31',
    minT: 70, tierT: 90, rateTier: 104, rateBelow: 118, shortfallFactor: 0.9, today: 120,
    slider: { min: 0, max: 140, step: 1 },
    presets: { fy26: [82, 88, 90, 96], even89: [89, 89, 89, 89], hold92: [92, 92, 92, 92], floor70: [70, 70, 70, 70] },
    holdT: 92, savingWindow: [85, 90],
  },
  cash: {
    soldT: 590, wheyContent: 0.9375, importPrice: 843, leadDays: 75, bufferT: 20,
    importShares: [0, 0.3, 0.5],
    gst: { min: 6, max: 14, step: 0.5, default: 10 },
    monthsFromNov2026: { mar27: 5, mar28: 17 },
    sachet: { units: 562500, unitCost: 46.7 },
    plantTub: { t: 8, perKg: 800 },
    release: { t: 28, perKg: 1250 },
    caps: { mar27: 10, mar28: 16 },
    gstFlows: { inCr: 16.4, outCr: 6.4 },
  },
  formats: {
    margin: { min: 20, max: 70, step: 1, default: 50 },
    tubRealisedPerKg: 2181, tubCm1Pct: 43,
    wheySensitivity: { perWpc80: 50, perKgProduct: 47, crYear: 2.8, soldT: 590 },
  },
  qc: {
    mrp: 2901, gst: 0.05, costPerKg: 1250,
    take: { min: 25, max: 65, step: 1, default: 50, extBand: [45, 55] },
    discount: { min: 0, max: 30, step: 1, default: 0 },
    cfoRemarkPct: 30,
  },
};

/* ---------- 5.5 Format lab ---------- */
export const FORMATS = [
  { key: 'tub', name: 'Whey tub, 1 kg (today)', unitCost: 1250, costNote: null, perKg: 1250, protein: '24 g per 32 g scoop', proteinPerUnitG: 750,
    per100gProtein: 167, minRun: 'Current product', where: 'X or Y, now', shelf: '18 months', src: ['D', 'C1', 'C2'] },
  { key: 'plant', name: 'Plant tub, 1 kg, pea and rice', unitCost: 800, costNote: '₹675 + ₹125 conversion', perKg: 800, protein: null, proteinPerUnitG: null,
    per100gProtein: null, minRun: '8 t, ₹0.64 cr', where: 'X or Y', shelf: '12 months', src: ['B2'] },
  { key: 'sachet', name: 'Sachet, 32 g stick', unitCost: 46.7, costNote: '₹38.2 + ₹8.5', perKg: 1459, protein: '24 g, assuming the tub’s blend', proteinPerUnitG: 24,
    per100gProtein: 195, minRun: '18 t per flavour (5.6 lakh sachets), ₹2.63 cr', where: 'Y only, two slots from Jan 2027', shelf: '12 months', src: ['B2', 'B3'] },
  { key: 'rtd', name: 'RTD shake, 250 ml', unitCost: 56, costNote: '₹41 + ₹15', perKg: null, perKgNote: 'Not meaningful', protein: '20 g', proteinPerUnitG: 20,
    per100gProtein: 280, minRun: '60,000 units per flavour, ₹33.6 lakh', where: 'X only, first slot Apr 2027', shelf: '6 months', src: ['B2'] },
];

/* ---------- Plant X terms (B1) ---------- */
export const PLANT_X_TERMS = {
  draft: [
    'Received 9 Oct 2026',
    'Three years from 1 Apr 2027',
    'Minimum 70 t a quarter; any shortfall billed at 90% of the rate',
    '₹104/kg on all kg at 90 t a quarter or more',
    '₹118/kg on all kg below 90 t',
  ],
  today: '₹120/kg since 1 Apr 2025, after ₹110 and then ₹114 from 1 Oct 2024, both rises billed as “capex recovery”',
  plantY: 'Contract to Mar 2028, no minimum, ₹3.60 per 30 g serving (₹120/kg)',
  procurement: 'No volume deal is on offer, and three calls went unanswered.',
  src: ['B1'],
};

/* ---------- GST note ---------- */
export const GST_NOTE = {
  rateCut: { from: 18, to: 5, date: '22 Sep 2025' },
  inCr: 16.4, outCr: 6.4,
};
