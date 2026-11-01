// 4.8 Roadmap and tracker: the dated plan, owners, status and stop rules.
import { ROADMAP, LANES, NEXT_DECISIONS, TIMELINE_RANGE, TRACKER_ROWS, TRACKER_STATUSES, LEVERS } from '../../data.js';
import { fmtDate, fmtMonth, todayISO, dayNumber, addDays, countdown } from '../../format.js';
import { chip, T, section, screenHead, chartFrame, esc, icon, statusChip } from '../components.js';
import { timelineChart, widthOf, setTable } from '../charts.js';
import { register } from '../registry.js';
import { getTracker, setTracker, importTracker, resetTracker, trackerRow } from '../../state.js';
import { download, toCSV, parseCSV } from '../dom.js';

const laneLabel = (k) => (LANES.find((l) => l.key === k) || { label: k === 'target' ? 'Target' : 'Guardrail' }).label;
const leverName = (id) => (id === 'data' ? 'Branch data' : id === 'backstop' ? 'Backstop' : id);
const srcFor = (it) => (it.lane === 'guardrail' ? ['A', 'Model'] : it.lever === 'L5' ? ['B1', 'Model'] : it.lever === 'L4b' ? ['B3', 'Model'] : ['Model']);

const items = {
  roadmap: { label: 'Roadmap, Nov 2026 to Mar 2028', search: 'roadmap timeline dates', value: '15 Nov, 20 Nov, 31 Dec and 15 Jan run the next 90 days', src: ['Model'], used: ROADMAP.map((r) => [r.when, `${laneLabel(r.lane)}: ${r.label}`, 'Model']) },
};
ROADMAP.forEach((r, i) => {
  items[`rm-${i}`] = { label: `${r.when}: ${r.label}`, value: `${r.when} · ${laneLabel(r.lane)}`, src: srcFor(r),
    used: (s) => [['When', r.when, 'Model'], ['Lane', laneLabel(r.lane), ''], ...(r.lever ? [['Tracker status', (trackerRow(r.lever) || {}).status || 'Not started', ''], ['Owner', (trackerRow(r.lever) || {}).owner || 'Unassigned', '']] : [])] };
});
NEXT_DECISIONS.forEach((d) => {
  items[`dec-${d.date}`] = { label: `Next decision, ${fmtDate(d.date)}`, value: d.label, src: d.tracker === 'L5' ? ['B1', 'Model'] : d.tracker === 'L4b' ? ['B3', 'Model'] : ['Model'],
    used: () => [['Date', fmtDate(d.date), 'Model'], ['Countdown', countdown(d.date).text, ''], ['Tracker row', leverName(d.tracker), ''], ['Status', (trackerRow(d.tracker) || {}).status || 'Not started', '']] };
});
register('roadmap', items);

function monthTicks() {
  const out = [];
  let y = 2026;
  let m = 11;
  while (y < 2028 || (y === 2028 && m <= 3)) {
    const iso = `${y}-${String(m).padStart(2, '0')}-01`;
    out.push({ iso, month: fmtMonth(iso).slice(0, 3), year: m === 1 || out.length === 0 ? String(y) : '' });
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

function timeline() {
  const id = 'rm-tl';
  const today = todayISO();
  const its = ROADMAP.map((r, i) => ({ ...r, i })).filter((r) => r.kind === 'milestone' || r.kind === 'window').map((r) => {
    const t = r.lever ? trackerRow(r.lever) : null;
    return { ...r, laneLabel: laneLabel(r.lane), item: `rm-${r.i}`, done: t && t.status === 'Done',
      tip: { title: r.when, value: r.label, rows: [['Lane', laneLabel(r.lane)], ...(t ? [['Status', t.status], ['Owner', t.owner]] : [])], src: srcFor(r) } };
  });
  const gates = ROADMAP.map((r, i) => ({ ...r, i })).filter((r) => r.kind === 'gate').map((r) => ({ ...r, short: r.label.startsWith('Working-capital cap of ₹10') ? 'Cap ₹10 cr' : 'Cap ₹16 cr; Plant Y ends', item: `rm-${r.i}`, tip: { title: r.when, value: r.label, src: ['A', 'Model'] } }));
  const bands = ROADMAP.filter((r) => r.kind === 'band').map((r) => ({ ...r, short: r.label.startsWith('Q4 FY27') ? 'Q4 FY27 target' : 'FY28, the full-year test' }));
  const w = Math.max(940, widthOf(id, 1100));
  const svg = timelineChart({ id, w, lanes: LANES, items: its, gates, bands, start: TIMELINE_RANGE.start, end: TIMELINE_RANGE.end, today: { iso: today, label: fmtDate(today) }, dayNum: dayNumber, monthTicks: monthTicks(),
    title: 'Roadmap, Nov 2026 to Mar 2028', desc: 'Lanes for data and governance, marketing, price, whey and plants, channel and operations, and tests. Milestones are diamonds, working windows are bars, guardrails are vertical lines; Q4 FY27 and FY28 are shaded.' });
  const tbl = setTable(id, 'Roadmap', ['When', 'Lane', 'Item'], ROADMAP.map((r) => [r.when, laneLabel(r.lane), r.label]));
  return chartFrame({ id, title: 'Nov 2026 to Mar 2028', sub: 'Diamonds are milestones, bars are working windows, dashed lines are guardrails. The red line is today.', item: 'roadmap', svg: `<div class="tl-scroll" tabindex="-1"><div class="tl-inner">${svg}</div></div>`, table: tbl,
    legend: `<p class="chart-legend"><span class="lg"><svg width="12" height="12" aria-hidden="true"><path d="M6 0 12 6 6 12 0 6Z" fill="var(--accent)"/></svg>Milestone</span><span class="lg"><span class="lg-band"></span>Working window</span><span class="lg"><span class="lg-line" style="border-top:2px dashed var(--caution)"></span>Guardrail</span><span class="lg"><span class="lg-line" style="border-color:var(--negative)"></span>Today</span><span class="lg"><span class="lg-sw" style="background:var(--neutral-fill);border:1px solid var(--neutral)"></span>Done in the tracker</span></p>` });
}

function tracker() {
  const rows = getTracker().map((r) => {
    const def = TRACKER_ROWS.find((x) => x.id === r.id);
    const lever = LEVERS.find((l) => l.id === r.id);
    const stop = def.stop || (lever ? lever.stop : '');
    const name = r.id === 'data' ? 'Branch data' : r.id === 'backstop' ? 'Backstop' : r.id;
    const what = r.id === 'data' ? 'FY26 marketing by quarter and H1 FY27 P&L by channel' : r.id === 'backstop' ? 'Pause half of D2C paid prospecting at the 15 Jan check' : lever ? lever.short : '';
    return `<tr>
      <th scope="row" data-label="Lever"><b>${esc(name)}</b><div class="muted small">${esc(what)}</div></th>
      <td data-label="Owner"><input class="input" type="text" value="${esc(r.owner === 'Unassigned' ? '' : r.owner)}" placeholder="Unassigned" data-tracker="${r.id}" data-field="owner" aria-label="Owner for ${esc(name)}" maxlength="80" autocomplete="off"></td>
      <td data-label="Status"><select class="select" data-tracker="${r.id}" data-field="status" aria-label="Status for ${esc(name)}">${TRACKER_STATUSES.map((st) => `<option${st === r.status ? ' selected' : ''}>${esc(st)}</option>`).join('')}</select></td>
      <td data-label="Next check"><input class="input" type="date" value="${esc(r.next)}" data-tracker="${r.id}" data-field="next" aria-label="Next check for ${esc(name)}" min="2026-01-01" max="2029-12-31"></td>
      <td data-label="Stop rule" class="stop">${esc(stop)}${chip(r.id === 'data' ? 'branch-test' : r.id === 'backstop' ? 'backstop' : r.id)}</td>
      <td data-label="Notes"><input class="input" type="text" value="${esc(r.notes)}" data-tracker="${r.id}" data-field="notes" aria-label="Notes for ${esc(name)}" maxlength="500" autocomplete="off"></td>
    </tr>`;
  }).join('');
  return `<div class="card">
  <div class="section-head" style="margin-bottom:12px"><p class="muted small">Edits save in this browser. Export the table to share it, and import a returned copy. Owners start as Unassigned.</p>
  <div class="tracker-actions"><button type="button" class="btn btn-sm" data-action="tracker-export">${icon('download', { size: 16 })}<span>Export CSV</span></button>
  <input id="tracker-file" type="file" accept=".csv,text/csv" class="sr-only file-input" data-tracker-import><label class="btn btn-sm" for="tracker-file">${icon('upload', { size: 16 })}<span>Import CSV</span></label>
  <button type="button" class="btn btn-sm" data-action="tracker-reset">${icon('rotate-ccw', { size: 16 })}<span>Clear edits</span></button></div></div>
  <div class="tbl-wrap"><table class="tbl stack tracker"><caption class="sr-only">Lever tracker: owner, status, next check, stop rule and notes</caption>
  <thead><tr><th scope="col">Lever</th><th scope="col">Owner</th><th scope="col">Status</th><th scope="col">Next check</th><th scope="col">Stop rule</th><th scope="col">Notes</th></tr></thead>
  <tbody>${rows}</tbody></table></div></div>`;
}

function next30() {
  const today = todayISO();
  const end = addDays(today, 30);
  const t0 = dayNumber(today);
  const t1 = dayNumber(end);
  const list = ROADMAP.map((r, i) => ({ ...r, i })).filter((r) => {
    const s = dayNumber(r.start);
    const e = r.end ? dayNumber(r.end) : s;
    if (r.when === 'Now') return true;
    return e >= t0 && s <= t1;
  }).sort((a, b) => dayNumber(a.start) - dayNumber(b.start));
  if (!list.length) return `<div class="card empty-state">Nothing on the roadmap falls between ${fmtDate(today)} and ${fmtDate(end)}.</div>`;
  return `<div class="card"><p class="muted small">From ${fmtDate(today)} to ${fmtDate(end)}, counted from today’s date in India.</p><ul class="next30" role="list">${list.map((r) => {
    const t = r.lever ? trackerRow(r.lever) : null;
    const c = r.kind === 'milestone' && r.when !== 'Now' ? countdown(r.start, today) : null;
    const when = r.kind === 'milestone' ? (r.when === 'Now' ? 'Now' : fmtDate(r.start)) : `${r.when}${dayNumber(r.start) <= t0 ? ', under way' : ''}`;
    return `<li><div><div class="n30-date">${esc(when)}</div>${c ? `<div class="n30-lane">${esc(c.text)}</div>` : ''}</div><div><div>${T(r.label)} ${chip(`rm-${r.i}`)}</div><div class="n30-lane">${esc(laneLabel(r.lane))}</div></div><div>${t ? statusChip(t.status) : ''}</div></li>`;
  }).join('')}</ul></div>`;
}

export default {
  id: 'roadmap',
  title: 'Roadmap and tracker',
  tab: 'Roadmap',
  group: 'Deliver',
  icon: 'calendar-range',
  keywords: 'roadmap timeline tracker owners status stop rules next 30 days',
  render() {
    return `${screenHead({
      headline: `Four dates run the next 90 days: 15 Nov, 20 Nov, 31 Dec and 15 Jan.${chip('roadmap')}`,
      meaning: 'The branch data, the import order, the Plant X answer and the Q3 check decide whether Q4 FY27 can reach break-even.',
    })}
${section({ id: 'rm-tl-s', title: 'Timeline', body: '<div data-region="timeline"></div>' })}
${section({ id: 'rm-30-s', title: 'Next 30 days', body: '<div data-region="next30"></div>' })}
${section({ id: 'rm-tr-s', title: 'Tracker', sub: 'Owner, status, next check, stop rule and notes for every lever. Status feeds the Plan simulator and the Overview.', body: '<div data-region="tracker"></div>' })}`;
  },
  region(key) {
    switch (key) {
      case 'timeline': return timeline();
      case 'next30': return next30();
      case 'tracker': return tracker();
      default: return null;
    }
  },
  actions: {
    'tracker-export': (el, e, ctx) => {
      const head = ['Lever id', 'Lever', 'Owner', 'Status', 'Next check', 'Stop rule', 'Notes'];
      const rows = getTracker().map((r) => {
        const def = TRACKER_ROWS.find((x) => x.id === r.id);
        const lever = LEVERS.find((l) => l.id === r.id);
        return [r.id, r.id === 'data' ? 'Branch data' : r.id === 'backstop' ? 'Backstop' : lever ? `${r.id} · ${lever.short}` : r.id, r.owner, r.status, r.next, def.stop || (lever ? lever.stop : ''), r.notes];
      });
      download(`anvil-tracker-${todayISO()}.csv`, toCSV(head, rows));
      ctx.toast('Tracker exported');
    },
    'tracker-reset': (el, e, ctx) => {
      if (window.confirm('Clear every tracker edit saved in this browser?')) { resetTracker(); ctx.toast('Tracker edits cleared'); }
    },
  },
  onChange(e, ctx) {
    const el = e.target;
    if (el.matches('[data-tracker][data-field]')) { setTracker(el.dataset.tracker, el.dataset.field, el.value); return; }
    if (el.matches('[data-tracker-import]') && el.files && el.files[0]) {
      const file = el.files[0];
      file.text().then((text) => {
        const rows = parseCSV(text);
        const head = (rows.shift() || []).map((h) => h.trim().toLowerCase());
        const col = (name) => head.indexOf(name);
        const idCol = col('lever id') >= 0 ? col('lever id') : col('lever');
        if (idCol < 0) { ctx.toast('Import failed: no “Lever id” column'); return; }
        const parsed = rows.map((r) => ({ id: (r[idCol] || '').split(' · ')[0].trim(), owner: r[col('owner')] ?? '', status: r[col('status')] ?? '', next: r[col('next check')] ?? '', notes: r[col('notes')] ?? '' }));
        const n = importTracker(parsed);
        ctx.toast(n ? `Imported ${n} tracker rows` : 'No matching rows in that file');
        el.value = '';
      }).catch(() => ctx.toast('Could not read that file'));
    }
  },
};
