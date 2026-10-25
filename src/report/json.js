// Machine-readable diff report. Printed by `--json` / `--format json` and written
// next to the Markdown report. schemaVersion and schema/report.schema.json move together.
import { describe } from './markdown.js';

export const SCHEMA_VERSION = 1;
export const TOOL_NAME = 'shadow-log';

const CHANGE = ['added', 'removed', 'changed'];

export function formatReport(report) {
  return JSON.stringify(report, null, 1) + '\n';
}

function defined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && v !== null) out[k] = v;
  return out;
}

function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

// Line numbers are 1-based in beautified sources. Extractors that have no line (deps, locale JSON) store 0; omit those.
function locations(list) {
  const out = [];
  for (const e of (list || []).slice(0, 3)) {
    if (!e?.file) continue;
    const loc = { file: e.file };
    if (Number.isInteger(e.line) && e.line > 0) loc.line = e.line;
    if (e.snippet) loc.snippet = e.snippet;
    out.push(loc);
  }
  return out;
}

function baseFinding(category, change, value, evidence) {
  return { category, change, value: String(value), evidence: locations(evidence) };
}

function extra(it) {
  const f = {};
  if (Number.isInteger(it.score)) f.score = it.score;
  if (it.why?.length) f.why = it.why;
  if (it.before != null) f.before = String(it.before);
  if (it.after != null) f.after = String(it.after);
  if (it.version) f.version = String(it.version);
  if (it.meta?.text) f.text = it.meta.text;
  if (typeof it.meta?.referenced === 'boolean') f.referenced = it.meta.referenced;
  if (it.vendorOnly) f.vendorOnly = true;
  if (it.officialStatus) f.officialStatus = it.officialStatus;
  if (it.official) f.official = it.official;
  return f;
}

function fileFinding(change, f) {
  const finding = baseFinding('files', change, f.file, [{ file: f.file }]);
  if (change === 'changed') { finding.beforeSize = f.before; finding.afterSize = f.after; }
  else if (Number.isInteger(f.size)) finding.size = f.size;
  if (f.referencedBy) finding.referencedBy = f.referencedBy;
  if (f.banner) finding.banner = f.banner;
  return finding;
}

function notableFinding(t) {
  const category = t.cat === 'file' ? 'files' : t.cat;
  let evidence = t.evidence;
  if (!evidence?.length && t.cluster?.items?.[0]?.evidence) evidence = t.cluster.items[0].evidence;
  if (!evidence?.length && t.cat === 'file') evidence = [{ file: t.value }];
  const finding = { ...baseFinding(category, t.kind, t.value, evidence), title: describe(t).replace(/`/g, ''), ...extra(t) };
  if (t.cat === 'file' && t.file) {
    if (Number.isInteger(t.file.size)) finding.size = t.file.size;
    if (t.file.referencedBy) finding.referencedBy = t.file.referencedBy;
    if (t.file.banner) finding.banner = t.file.banner;
  }
  if (t.cluster) finding.strings = t.cluster.items.slice(0, 20).map(i => ({ key: i.value, text: i.meta?.text ?? '', referenced: !!i.meta?.referenced }));
  return finding;
}

function side(s) {
  return defined({ spec: s.spec, app: s.app, version: s.version, path: s.path, source: s.source, date: s.date || undefined, files: s.files });
}

export function buildJsonReport({ toolVersion, app, old, new: newer, diff, top, reportFile, generatedAt, notes, llm }) {
  const findings = [];
  for (const [cat, d] of Object.entries(diff.categories)) {
    for (const change of CHANGE) for (const it of d[change]) findings.push({ ...baseFinding(cat, change, it.value, it.evidence), ...extra(it) });
  }
  for (const change of CHANGE) for (const f of diff.files[change]) findings.push(fileFinding(change, f));
  findings.sort((a, b) => cmp(a.category, b.category) || cmp(a.change, b.change) || cmp(a.value, b.value));

  const counts = {};
  for (const [c, n] of Object.entries(diff.headline.counts)) counts[c] = { added: n.added, removed: n.removed, changed: n.changed };
  counts.files = { added: diff.headline.files.added, removed: diff.headline.files.removed, changed: diff.headline.files.changed };

  const summary = { counts };
  if (llm) summary.llm = llm;
  const report = {
    schemaVersion: SCHEMA_VERSION,
    tool: { name: TOOL_NAME, version: toolVersion },
    generatedAt,
    app: { id: app.id, name: app.name },
    inputs: { old: side(old), new: side(newer) },
    summary,
    findings,
    notable: (top || []).map(notableFinding),
    reportFile,
  };
  if (Array.isArray(notes)) report.notes = notes;
  return report;
}
