// Items that open in the source drawer and appear in search. Each item states its label,
// value, source codes, the figures used, the formula with its inputs, and any caveat.
// Any field can be a function of the scenario, so Model and Calc items stay live.

const ITEMS = new Map();

export function register(screen, defs) {
  for (const [id, d] of Object.entries(defs)) ITEMS.set(id, { screen, ...d });
}

const val = (x, s) => (typeof x === 'function' ? x(s) : x);
const FIELDS = ['label', 'value', 'src', 'note', 'used', 'calc', 'caveat', 'quote', 'verdicts', 'records', 'who', 'search'];

export function resolveItem(id, s) {
  const d = ITEMS.get(id);
  if (!d) return null;
  const out = { id, screen: d.screen, kind: d.kind || 'figure', group: d.group };
  for (const k of FIELDS) out[k] = val(d[k], s);
  out.src = out.src || [];
  return out;
}

export const hasItem = (id) => ITEMS.has(id);
export const itemIds = () => [...ITEMS.keys()];
export function itemCodes(id, s) {
  const d = ITEMS.get(id);
  return d ? val(d.src, s) || [] : [];
}
export function itemLabel(id, s) {
  const d = ITEMS.get(id);
  return d ? val(d.label, s) : '';
}
