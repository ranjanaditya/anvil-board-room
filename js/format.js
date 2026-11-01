// Display formatting. Values are rounded here and nowhere else.
// Rules: Indian digit grouping, a true minus sign (−), + on positive changes when asked.

import { TIME_ZONE } from './data.js';

export const MINUS = '−';

// Round half away from zero. The small epsilon absorbs binary error (1.005 → 1.01).
export function round(x, dp = 0) {
  const f = 10 ** dp;
  const r = (Math.sign(x) * Math.round(Math.abs(x) * f + 1e-7)) / f;
  return Object.is(r, -0) ? 0 : r;
}

export function groupIndian(digits) {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  let rest = digits.slice(0, -3);
  const parts = [];
  while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); }
  if (rest) parts.unshift(rest);
  return `${parts.join(',')},${last3}`;
}

// Core number: rounding, grouping, minus sign, optional plus sign.
export function num(x, { dp = 0, sign = false, group = true } = {}) {
  const r = round(x, dp);
  const [i, d] = Math.abs(r).toFixed(dp).split('.');
  const body = (group ? groupIndian(i) : i) + (d ? `.${d}` : '');
  if (r < 0) return MINUS + body;
  if (sign && r > 0) return `+${body}`;
  return body;
}

const signOf = (x, dp, sign) => {
  const r = round(x, dp);
  return r < 0 ? MINUS : sign && r > 0 ? '+' : '';
};

// ₹ with Indian grouping: ₹4,27,20,000
export const rupees = (x, { dp = 0, sign = false } = {}) => `${signOf(x, dp, sign)}₹${num(Math.abs(x), { dp })}`;
// ₹4.27 cr, −₹6.8 cr, +₹0.5 cr
export const crore = (x, { dp = 1, sign = false } = {}) => `${signOf(x, dp, sign)}₹${num(Math.abs(x), { dp })} cr`;
// ₹12.5 lakh
export const lakh = (x, { dp = 1, sign = false } = {}) => `${signOf(x, dp, sign)}₹${num(Math.abs(x), { dp })} lakh`;
// −5.3%, +1.7%; nr adds " of NR"
export const pct = (x, { dp = 1, sign = false, nr = false } = {}) => `${num(x, { dp, sign })}%${nr ? ' of NR' : ''}`;
// Points of NR: +10.0
export const pts = (x, { dp = 1, sign = true } = {}) => num(x, { dp, sign });
// ₹1,250/kg
export const perKg = (x, { dp = 0, sign = false } = {}) => `${signOf(x, dp, sign)}₹${num(Math.abs(x), { dp })}/kg`;
export const tonnes = (x, { dp = 0 } = {}) => `${num(x, { dp })} t`;

// Slider readouts: one decimal on the 0.1 grid, two for off-grid midpoints such as 1.95.
export function stepValue(x, { sign = true } = {}) {
  const dp = Math.abs(round(x, 1) - x) < 1e-9 ? 1 : 2;
  return num(x, { dp, sign });
}

// "−2.7 to +1.7"
export const range = (a, b, fmt) => `${fmt(a)} to ${fmt(b)}`;

// Accessible text: say "minus" for negative values and "crore" for cr.
export const spoken = (s) => String(s).replace(/−/g, 'minus ').replace(/(\d) cr\b/g, '$1 crore');

/* ---------- Dates ---------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}
export function fmtDate(iso, { year = true } = {}) {
  const { y, m, d } = parseISO(iso);
  return `${d} ${MONTHS[m - 1]}${year ? ` ${y}` : ''}`;
}
export function fmtMonth(iso) {
  const { y, m } = parseISO(iso);
  return `${MONTHS[m - 1]} ${y}`;
}
// Today's date in India, as YYYY-MM-DD, whatever the device's time zone.
export function todayISO(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function dayNumber(iso) {
  const { y, m, d } = parseISO(iso);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}
export const daysBetween = (fromISO, toISO) => dayNumber(toISO) - dayNumber(fromISO);
export function addDays(iso, n) {
  const t = new Date((dayNumber(iso) + n) * 86400000);
  return t.toISOString().slice(0, 10);
}
export function countdown(targetISO, today = todayISO()) {
  const n = daysBetween(today, targetISO);
  if (n > 1) return { n, text: `${num(n)} days left`, short: `${num(n)} days`, past: false };
  if (n === 1) return { n, text: '1 day left', short: '1 day', past: false };
  if (n === 0) return { n, text: 'Due today', short: 'Today', past: false };
  return { n, text: `${num(-n)} ${-n === 1 ? 'day' : 'days'} ago`, short: `${num(-n)}d ago`, past: true };
}
