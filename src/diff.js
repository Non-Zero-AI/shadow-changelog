// Compare two snapshots and score every change by how interesting it probably is.
import { isVendor } from './extractors/common.js';

export const CATEGORY_INFO = {
  telemetry: { title: 'Telemetry, analytics & tracking', base: 60 },
  apiPaths: { title: 'API endpoints (paths)', base: 50 },
  domains: { title: 'Contacted / referenced domains', base: 45 },
  ipc: { title: 'Electron IPC channels & protocols', base: 45 },
  flags: { title: 'Feature-flag / experiment-like identifiers', base: 35 },
  configKeys: { title: 'Settings, config & storage keys', base: 30 },
  commands: { title: 'Commands', base: 35 },
  i18n: { title: 'UI strings (localization)', base: 15 },
  deps: { title: 'Dependencies & bundled libraries', base: 30 },
  urls: { title: 'Full URLs', base: 20 },
};

const HOT = /\b(ai|llm|gpt|openai|anthropic|claude|gemini|assistant|copilot|account|login|log in|log-in|signin|license|licen[cs]e|catalyst|pay|payment|billing|subscription|price|pricing|trial|sync|publish|beta|insider|experiment\w*|telemetry|analytics|track\w*|camera|microphone|location|clipboard|keychain|secret|token|password|auth\w*|cloud|share|sharing|collab\w*|kanban|webview|browser|web viewer|quicklook|cli|terminal|agent|mcp|plugin store|ads?|adblock)\b/i;

function hotWords(s) { const m = String(s).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_.:/]/g, ' ').match(new RegExp(HOT.source, 'gi')); return m ? [...new Set(m.map(x => x.toLowerCase()))] : []; }

function scoreItem(cat, item, kind) {
  let s = CATEGORY_INFO[cat].base;
  const why = [];
  const hw = hotWords(item.value + ' ' + (item.meta?.text || ''));
  if (hw.length) { s += 15; why.push(`keywords: ${hw.join(', ')}`); }
  if (item.vendorOnly) { s *= 0.25; why.push('only in bundled third-party code'); }
  if (cat === 'i18n' && kind === 'added' && item.meta && !item.meta.referenced) { s += 25; why.push('string ships but no first-party code references it yet (possible unreleased UI)'); }
  if (cat === 'telemetry' && kind === 'added') { s += 10; }
  if (cat === 'i18n' && kind === 'changed') { const hw2 = hotWords((item.before || '') + ' ' + (item.after || '')); const nz = x => (x || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (nz(item.before) === nz(item.after)) { s = Math.round(s * 0.3); why.length = 0; why.push('cosmetic wording change (case/spacing/punctuation)'); }
    else if (hw2.length) { s += 30; why.push(`wording change touches: ${hw2.join(', ')}`); } }
  if (kind === 'removed') s *= cat === 'telemetry' ? 1 : 0.7;
  if (kind === 'changed') s *= 0.8;
  return { score: Math.round(s), why };
}

export function diffSnapshots(oldS, newS) {
  const categories = {};
  for (const cat of Object.keys(CATEGORY_INFO)) {
    const a = oldS.categories[cat] || new Map(), b = newS.categories[cat] || new Map();
    const added = [], removed = [], changed = [];
    for (const [k, v] of b) if (!a.has(k)) added.push({ ...v, ...scoreItem(cat, v, 'added') });
    for (const [k, v] of a) if (!b.has(k)) removed.push({ ...v, ...scoreItem(cat, v, 'removed') });
    if (cat === 'deps' || cat === 'i18n') {
      for (const [k, v] of b) {
        const o = a.get(k); if (!o) continue;
        const before = cat === 'deps' ? o.version : o.meta.text, after = cat === 'deps' ? v.version : v.meta.text;
        if (before !== after) changed.push({ ...v, before, after, ...scoreItem(cat, { ...v, before, after }, 'changed') });
      }
    }
    const by = (x, y) => y.score - x.score || x.value.localeCompare(y.value);
    categories[cat] = { added: added.sort(by), removed: removed.sort(by), changed: changed.sort(by) };
  }

  // file inventory changes
  const fa = oldS.inventory, fb = newS.inventory;
  const files = { added: [], removed: [], changed: [] };
  for (const f of Object.keys(fb)) {
    if (!fa[f]) files.added.push({ file: f, size: fb[f].size });
    else if (fa[f].sha256 !== fb[f].sha256) files.changed.push({ file: f, before: fa[f].size, after: fb[f].size });
  }
  for (const f of Object.keys(fa)) if (!fb[f]) files.removed.push({ file: f, size: fa[f].size });

  const tOld = oldS.categories.telemetry || new Map(), tNew = newS.categories.telemetry || new Map();
  const telemetryBaseline = [...tNew].filter(([k]) => tOld.has(k)).map(([, v]) => v);
  for (const x of files.added) { x.referencedBy = fb[x.file].referencedBy || []; if (fb[x.file].banner) x.banner = fb[x.file].banner; }
  return { categories, files, telemetryBaseline, clusters: i18nClusters(categories.i18n), removedClusters: i18nClusters({ added: categories.i18n.removed }), headline: headline(categories, files) };
}

// Group new UI strings by key prefix. A cluster of several new strings under one prefix is usually a new feature.
function i18nClusters(i18n) {
  const groups = new Map();
  for (const it of i18n.added) {
    const parts = it.value.split('.');
    const prefix = parts.slice(0, Math.min(parts.length - 1, 3)).join('.') || parts[0];
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix).push(it);
  }
  const out = [];
  for (const [prefix, items] of groups) {
    const unref = items.filter(i => !i.meta.referenced).length;
    const hw = hotWords(prefix + ' ' + items.map(i => i.meta.text).join(' '));
    let score = 25 + Math.min(items.length, 12) * 4 + (unref ? 15 : 0) + (hw.length ? 10 : 0);
    out.push({ prefix, items, unreferenced: unref, hot: hw, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

function headline(categories, files) {
  const counts = {};
  for (const [c, d] of Object.entries(categories)) counts[c] = { added: d.added.length, removed: d.removed.length, changed: d.changed.length };
  return { counts, files: { added: files.added.length, removed: files.removed.length, changed: files.changed.length } };
}

// Top findings across all categories, merged with i18n clusters (which replace their individual strings).
export function topFindings(diff, n = 12) {
  const all = [];
  for (const [cat, d] of Object.entries(diff.categories)) {
    if (cat === 'i18n' || cat === 'urls') continue; // represented via clusters / domains
    for (const kind of ['added', 'removed', 'changed']) for (const it of d[kind]) all.push({ cat, kind, ...it });
  }
  for (const c of diff.clusters) if (c.items.length >= 2) all.push({ cat: 'i18n-cluster', kind: 'added', value: c.prefix, score: c.score, cluster: c, why: [`${c.items.length} new UI strings under one prefix`, ...(c.unreferenced ? [`${c.unreferenced} not referenced by code yet`] : []), ...(c.hot.length ? [`keywords: ${c.hot.join(', ')}`] : [])] });
  for (const c of diff.removedClusters || []) if (c.items.length >= 3) all.push({ cat: 'i18n-cluster', kind: 'removed', value: c.prefix, score: Math.round(c.score * 0.8), cluster: c, why: [`${c.items.length} UI strings under one prefix were removed`] });
  for (const it of diff.categories.i18n.changed) if (it.why.length && !it.why[0].startsWith('cosmetic')) all.push({ cat: 'i18n', kind: 'changed', ...it });
  for (const f of diff.files.added) {
    if (!/\.(m?js|html)$/.test(f.file)) continue;
    const dormant = !f.referencedBy?.length;
    const vendor = isVendor(f.file);
    const why = [vendor ? 'new bundled library file' : 'new first-party code file'];
    if (dormant) why.push('no first-party code references it by name (shipped but possibly not wired up yet)');
    else why.push(`referenced from ${f.referencedBy.join(', ')}`);
    all.push({ cat: 'file', kind: 'added', value: f.file, score: (vendor ? 30 : 45) + (dormant ? 25 : 0) + (f.size > 200000 ? 5 : 0), file: f, why });
  }
  // A newly bundled library shows up both as a file and as a dep; keep the file finding.
  const addedFiles = new Set(diff.files.added.map(f => f.file));
  const deduped = all.filter(x => !(x.cat === 'deps' && x.kind === 'added' && x.evidence?.some(e => addedFiles.has(e.file))));
  return deduped.sort((a, b) => b.score - a.score).slice(0, n);
}
