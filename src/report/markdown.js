import { CATEGORY_INFO, topFindings } from '../diff.js';

const code = s => { s = String(s).replace(/\n/g, ' '); const t = s.includes('`') ? '``' : '`'; return `${t}${s.includes('`') ? ' ' + s + ' ' : s}${t}`; };
const loc = e => e.line ? `${e.file}:${e.line}` : e.file;
const kb = n => n >= 1024 * 1024 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1024).toFixed(1)} KB`;
const sign = n => (n >= 0 ? '+' : '') + n;

function evidence(it, max = 1) {
  return (it.evidence || []).slice(0, max).map(e => `${code(loc(e))} → ${code(e.snippet)}`).join('<br>');
}

export function describe(f) {
  const v = f.value;
  const verb = f.kind === 'added' ? 'New' : f.kind === 'removed' ? 'Removed' : 'Changed';
  switch (f.cat) {
    case 'telemetry': return `${verb} telemetry/analytics signal ${code(v)}`;
    case 'apiPaths': return `${verb} API path ${code(v)}`;
    case 'domains': return `${verb} domain referenced: ${code(v)}`;
    case 'ipc': return `${verb} IPC channel ${code(v)}${f.meta?.side ? ` (${f.meta.side}, ${f.meta.how})` : ''}`;
    case 'flags': return `${verb} flag/experiment-like identifier ${code(v)}`;
    case 'configKeys': return `${verb} setting/storage key ${code(v)}${f.meta?.kind ? ` (${f.meta.kind})` : ''}`;
    case 'commands': return `${verb} command ${code(v)}`;
    case 'deps': return f.kind === 'changed' ? `Dependency ${code(v)} ${f.before} → ${f.after}` : `${verb} dependency ${code(v)} ${f.version || ''}`;
    case 'i18n-cluster': return `${f.kind === 'removed' ? 'Removed' : 'New'} UI string group ${code(v)} (${f.cluster.items.length} strings)`;
    case 'i18n': return `UI text changed: ${code(v)}`;
    case 'file': return `New ${/(^|\/)(lib|vendor|node_modules)\//.test(v) ? 'bundled library' : 'code'} file ${code(v)} (${kb(f.file.size)})${f.file.referencedBy?.length ? '' : ', not referenced by app code'}`;
    default: return `${verb} ${code(v)}`;
  }
}

function findingBlock(f, i) {
  const lines = [`### ${i + 1}. ${describe(f)}`, '', `*Score ${f.score} · ${f.why?.length ? f.why.join(' · ') : CATEGORY_INFO[f.cat]?.title || f.cat}*`, ''];
  if (f.official) lines.push(`Official notes: ${f.official}`, '');
  if (f.cat === 'i18n-cluster') {
    for (const it of f.cluster.items.slice(0, 10)) lines.push(`- ${code(it.value)} = "${it.meta.text.slice(0, 120)}"${f.kind === 'added' && !it.meta.referenced ? ' *(no code reference found)*' : ''}`);
    if (f.cluster.items.length > 10) lines.push(`- …and ${f.cluster.items.length - 10} more (see UI strings section)`);
    lines.push('', `Evidence: ${code(f.cluster.items[0].evidence[0].file)} in the ${f.kind === 'removed' ? 'old' : 'new'} build.`);
  } else if (f.cat === 'i18n' && f.kind === 'changed') {
    lines.push(`- before: "${f.before.slice(0, 200)}"`, `- after: "${f.after.slice(0, 200)}"`, '', `Evidence: ${code(f.evidence[0].file)} in both builds.`);
  } else if (f.cat === 'file') {
    lines.push(`Evidence: file ${code(f.value)} (${f.file.size} bytes) exists in the new build and not in the old one.` + (f.file.banner ? ` Header: ${code(f.file.banner)}` : '') + (f.file.referencedBy?.length ? ` Referenced from ${f.file.referencedBy.map(code).join(', ')}.` : ' A search of every first-party JS/HTML/JSON file for its file name found no reference.'));
  } else {
    lines.push('Evidence' + (f.kind === 'removed' ? ' (old build)' : '') + ':');
    for (const e of (f.evidence || []).slice(0, 2)) lines.push(`- ${code(loc(e))} → ${code(e.snippet)}`);
    if (f.files?.length > 2 || f.files?.size > 2) lines.push(`- seen in ${[...(f.files || [])].length} file(s), ${f.count} occurrence(s)`);
  }
  return lines.join('\n');
}

function table(items, kind, cat, limit = 60) {
  if (!items.length) return '_none_\n';
  const rows = items.slice(0, limit).map(it => {
    const extra = cat === 'i18n' ? `"${(it.meta.text || '').slice(0, 90).replace(/\|/g, '\\|')}"${kind === 'added' && !it.meta.referenced ? ' **(unreferenced)**' : ''}` : '';
    const val = cat === 'deps' && kind === 'changed' ? `${code(it.value)} ${it.before} → ${it.after}` : code(it.value) + (it.vendorOnly ? ' _(vendor)_' : '');
    const ev = cat === 'i18n' ? extra : evidence(it).replace(/\|/g, '\\|');
    return `| ${it.score} | ${val} | ${ev} |`;
  });
  let s = `| score | ${kind} | evidence |\n|---:|---|---|\n${rows.join('\n')}\n`;
  if (items.length > limit) s += `\n_…${items.length - limit} more in the JSON report._\n`;
  return s;
}

export function renderMarkdown({ app, oldV, newV, diff, meta, llmSummary, topN = 10, top }) {
  top = top || topFindings(diff, topN);
  const silent = top.filter(t => t.officialStatus && t.officialStatus !== 'mentioned').length;
  const h = diff.headline;
  const out = [];
  out.push(`# Shadow Log: ${app.name} ${oldV} → ${newV}`, '');
  out.push(`> What the update actually changed, read from the shipped code of two public releases. Every item cites the file and line (in the js-beautify output) where it was found. Automated heuristics: "possible", not "confirmed".`, '');
  out.push(`| | old | new |`, `|---|---|---|`);
  out.push(`| version | ${oldV} | ${newV} |`);
  if (meta.oldDate || meta.newDate) out.push(`| released | ${meta.oldDate || '?'} | ${meta.newDate || '?'} |`);
  out.push(`| artifact | ${meta.oldSource} | ${meta.newSource} |`);
  out.push(`| files in bundle | ${meta.oldFiles} | ${meta.newFiles} |`, '');
  if (app.releasePage) out.push(`Official notes: ${app.releasePage(newV)}${app.officialChangelog ? ` · ${app.officialChangelog(newV)}` : ''}`, '');
  if (meta.notesUsed) {
    const checked = top.filter(t => t.officialStatus).length;
    out.push(`**Release-notes cross-check:** ${silent} of the ${checked} top findings checked were not found in the official notes for ${oldV}→${newV}${top.some(t => t.officialStatus === 'later') ? ' (some show up only in notes for a *later* version)' : ''}. The check is a plain-text match and can miss reworded announcements.`, '');
  }
  out.push(`Generated ${meta.generatedAt} by shadow-log ${meta.toolVersion}.`, '');

  out.push('## At a glance', '', '| category | added | removed | changed |', '|---|---:|---:|---:|');
  for (const [c, n] of Object.entries(h.counts)) out.push(`| ${CATEGORY_INFO[c].title} | ${n.added} | ${n.removed} | ${n.changed || ''} |`);
  out.push(`| Files in bundle | ${h.files.added} | ${h.files.removed} | ${h.files.changed} |`, '');

  if (llmSummary) out.push('## Summary (LLM-written from the findings below; verify against evidence)', '', llmSummary.trim(), '');

  out.push('## Top findings', '');
  if (!top.length) out.push('_No notable changes detected. The two builds differ only in ways these extractors do not track (see file changes)._', '');
  top.forEach((f, i) => out.push(findingBlock(f, i), ''));

  if (diff.clusters.length) {
    out.push('## New UI string groups', '', 'Strings are grouped by key prefix. Groups whose strings no first-party code references yet are candidates for unreleased features.', '');
    out.push('| group | new strings | unreferenced | sample |', '|---|---:|---:|---|');
    for (const c of diff.clusters.slice(0, 40)) out.push(`| ${code(c.prefix)} | ${c.items.length} | ${c.unreferenced} | "${c.items[0].meta.text.slice(0, 80).replace(/\|/g, '\\|')}" |`);
    out.push('');
  }

  out.push('## Details by category', '');
  for (const [c, info] of Object.entries(CATEGORY_INFO)) {
    const d = diff.categories[c];
    if (!d.added.length && !d.removed.length && !d.changed.length) continue;
    out.push(`### ${info.title}`, '');
    if (d.added.length) out.push('<details open><summary>Added (' + d.added.length + ')</summary>', '', table(d.added, 'added', c), '</details>', '');
    if (d.removed.length) out.push('<details><summary>Removed (' + d.removed.length + ')</summary>', '', table(d.removed, 'removed', c), '</details>', '');
    if (d.changed.length) out.push('<details><summary>Changed (' + d.changed.length + ')</summary>', '', c === 'i18n'
      ? '| key | before | after |\n|---|---|---|\n' + d.changed.slice(0, 60).map(x => `| ${code(x.value)} | "${x.before.slice(0, 80).replace(/\|/g, '\\|')}" | "${x.after.slice(0, 80).replace(/\|/g, '\\|')}" |`).join('\n') + '\n'
      : table(d.changed, 'changed', c), '</details>', '');
  }

  out.push('## File changes', '');
  const f = diff.files;
  if (f.added.length) out.push('**Added:** ' + f.added.map(x => `${code(x.file)} (${kb(x.size)})`).join(', '), '');
  if (f.removed.length) out.push('**Removed:** ' + f.removed.map(x => `${code(x.file)} (${kb(x.size)})`).join(', '), '');
  if (f.changed.length) {
    out.push('<details><summary>Changed (' + f.changed.length + ')</summary>', '', '| file | before | after | Δ bytes |', '|---|---:|---:|---:|');
    for (const x of f.changed.sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before))) out.push(`| ${code(x.file)} | ${kb(x.before)} | ${kb(x.after)} | ${sign(x.after - x.before)} |`);
    out.push('', '</details>', '');
  }

  if (diff.telemetryBaseline?.length) {
    out.push('## Telemetry already present in both builds', '', 'Not new in this update, listed so readers know the baseline:', '');
    for (const t of diff.telemetryBaseline.slice(0, 15)) { const e = t.evidence?.[0]; out.push(`- ${code(t.value)}${t.vendorOnly ? ' _(vendor)_' : ''}${e ? ` (${code(e.file + ':' + e.line)})` : ''}`); }
    out.push('');
  }
  out.push('## Method & caveats', '',
    '- Inputs are the vendor\'s own public release artifacts, downloaded unmodified. No DRM, encryption, licensing or anti-tamper mechanism is touched.',
    '- JavaScript is beautified with js-beautify; line numbers refer to that output so anyone can reproduce them (`shadow-log fetch` + open `.cache/<app>/<ver>/pretty/<file>`).',
    '- Findings come from static string/pattern extraction. A new string proves the code shipped, not that the feature is turned on, reachable, or will launch.',
    '- "Unreferenced" UI strings: no first-party code token matches the key name. Keys built dynamically can show up as false positives.',
    '- Third-party library code is marked _(vendor)_ and down-weighted.',
    '- "Official notes" lines compare each finding against the vendor\'s published release notes with a plain-text search. "Not found" means the search terms did not appear, not that the vendor hid anything.',
    '- Snippets are short excerpts for verification (commentary/reporting), not redistributions of the code.', '');
  return out.join('\n');
}
