import fs from 'node:fs';
import path from 'node:path';
import { getAdapter, listAdapters } from './adapters/index.js';
import { buildSnapshot } from './snapshot.js';
import { diffSnapshots, topFindings } from './diff.js';
import { renderMarkdown, describe } from './report/markdown.js';
import { buildJsonReport, formatReport } from './report/json.js';
import { buildRss } from './report/rss.js';
import { llmSummary } from './report/llm.js';
import { crossCheck } from './officialNotes.js';
import { ROOT, ensureDir, log } from './util.js';

const TOOL_VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;

const HELP = `shadow-log: what did that update really change?

Usage:
  shadow-log apps                              list app adapters
  shadow-log versions <app>                    list public versions the adapter can fetch
  shadow-log fetch <app> <version>             download + unpack + extract one release (cached)
  shadow-log diff <old> <new> [options]        diff two releases and write a report
        <old>/<new> are app@version (e.g. obsidian@1.13.7) or local paths (.asar, .asar.gz, .tar.gz, .deb, dir)
  shadow-log latest <app> [options]            diff the two newest public versions (skips if report exists)
  shadow-log rss [--out reports] [--base-url URL]   rebuild reports/feed.xml

Options:
  --out <dir>       report directory (default: ./reports)
  --top <n>         number of notable findings (default 10)
  --json            print the report as JSON on stdout (logs stay on stderr)
  --format json     same as --json (--format md is the text report)
  --no-notes        skip the official release-notes cross-check
  --no-llm          never call an LLM even if OPENAI_API_KEY/ANTHROPIC_API_KEY is set
  --force           rebuild cached snapshots
  --base-url <url>  public URL of the reports dir (for RSS links)

--json still writes the Markdown and JSON files. Stdout is only the JSON document
(schema/report.schema.json). Progress lines go to stderr.
`;

function wantsJson(opt) {
  if (opt.format != null && opt.format !== 'json' && opt.format !== 'md' && opt.format !== 'markdown') throw new Error(`unknown --format "${opt.format}" (json or md)`);
  return opt.json === true || opt.format === 'json';
}

function readJsonStdout(mdPath) {
  const text = fs.readFileSync(mdPath.replace(/\.md$/, '.json'), 'utf8').trim();
  JSON.parse(text);
  return text + '\n';
}

const BOOL_OPTS = new Set(['json', 'force']);

function parseArgs(argv) {
  const pos = [], opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--no-')) opt[a.slice(5)] = false;
    else if (a.startsWith('--')) {
      const k = a.slice(2), n = argv[i + 1];
      // Boolean flags must not swallow the next positional (`diff --json ./old ./new`).
      if (!BOOL_OPTS.has(k) && n && !n.startsWith('--')) { opt[k] = n; i++; }
      else opt[k] = true;
    } else pos.push(a);
  }
  return { pos, opt };
}

function resolveTarget(spec, defaultApp) {
  const at = spec.lastIndexOf('@');
  if (at > 0 && !fs.existsSync(spec)) return { adapter: getAdapter(spec.slice(0, at)), version: spec.slice(at + 1) };
  if (fs.existsSync(spec)) return { adapter: getAdapter('local'), version: path.resolve(spec) };
  if (defaultApp) return { adapter: getAdapter(defaultApp), version: spec };
  throw new Error(`Can't resolve "${spec}": use app@version or a path`);
}

async function dates(adapter, versions) {
  try { const vs = await adapter.listVersions(); return versions.map(v => vs.find(x => x.version === v)?.date?.slice(0, 10)); } catch { return []; }
}

export async function runDiff(oldSpec, newSpec, opt = {}) {
  const o = resolveTarget(oldSpec, opt.app), n = resolveTarget(newSpec, opt.app || (o.adapter.id !== 'local' ? o.adapter.id : undefined));
  const [oldS, newS] = [await buildSnapshot(o.adapter, o.version, { force: opt.force }), await buildSnapshot(n.adapter, n.version, { force: opt.force })];
  const diff = diffSnapshots(oldS, newS);
  const app = n.adapter.id === 'local' ? { id: 'local', name: 'Local build' } : n.adapter;
  const oldV = o.adapter.id === 'local' ? path.basename(o.version) : o.version;
  const newV = n.adapter.id === 'local' ? path.basename(n.version) : n.version;
  const [oldDate, newDate] = app.id === 'local' ? [] : await dates(n.adapter, [oldV, newV]);
  const topN = +(opt.top || 10);
  const top = topFindings(diff, topN);
  let notesUsed = null;
  if (opt.notes !== false && n.adapter.officialNotes) {
    try {
      const notes = await n.adapter.officialNotes();
      crossCheck(top, notes, oldV, newV);
      notesUsed = notes.filter(x => x.version && x.url).map(x => ({ version: x.version, url: x.url }));
    } catch (e) { log('could not load official notes:', e.message); }
  }
  const meta = { notesUsed, generatedAt: new Date().toISOString(), toolVersion: TOOL_VERSION, oldSource: oldS.source, newSource: newS.source, oldDate, newDate, oldFiles: Object.keys(oldS.inventory).length, newFiles: Object.keys(newS.inventory).length };
  let summary = null;
  if (opt.llm !== false && (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY)) {
    log('LLM key found in env; asking for a summary');
    summary = await llmSummary(top.map(t => ({ title: describe(t).replace(/`/g, ''), why: t.why, evidence: t.evidence?.slice(0, 1), strings: t.cluster?.items.slice(0, 8).map(i => i.meta.text) })));
  }
  const md = renderMarkdown({ app, oldV, newV, diff, meta, llmSummary: summary, topN, top });
  const outDir = ensureDir(path.resolve(opt.out || path.join(process.cwd(), 'reports')));
  const base = `${app.id}-${oldV}-to-${newV}`.replace(/[^\w.@-]/g, '_');
  const mdFile = path.join(outDir, base + '.md');
  fs.writeFileSync(mdFile, md);
  const side = (spec, resolved, version, source, date, files) => ({ spec, app: resolved.adapter.id, version, path: resolved.adapter.id === 'local' ? resolved.version : undefined, source, date, files });
  const report = buildJsonReport({
    toolVersion: TOOL_VERSION, generatedAt: meta.generatedAt, app: { id: app.id, name: app.name },
    old: side(oldSpec, o, oldV, meta.oldSource, oldDate, meta.oldFiles),
    new: side(newSpec, n, newV, meta.newSource, newDate, meta.newFiles),
    diff, top, reportFile: base + '.md', notes: notesUsed, llm: summary,
  });
  fs.writeFileSync(path.join(outDir, base + '.json'), formatReport(report));
  buildRss(outDir, { baseUrl: opt['base-url'] || process.env.SHADOW_BASE_URL || '' });
  return { mdFile, top, report };
}

export async function main(argv) {
  const { pos, opt } = parseArgs(argv);
  const [cmd, ...rest] = pos;
  switch (cmd) {
    case 'apps':
      for (const a of listAdapters()) console.log(`${a.id.padEnd(16)} ${a.name}`); break;
    case 'versions': {
      const vs = await getAdapter(rest[0]).listVersions();
      for (const v of vs) console.log(`${v.version}\t${(v.date || '').slice(0, 10)}`); break;
    }
    case 'fetch': {
      if (rest.length < 2) throw new Error('usage: fetch <app> <version>');
      const s = await buildSnapshot(getAdapter(rest[0]), rest[1], { force: opt.force });
      console.log(`${s.appName} ${s.version}: ${Object.keys(s.inventory).length} files`);
      for (const [k, m] of Object.entries(s.categories)) console.log(`  ${k.padEnd(12)} ${m.size}`);
      break;
    }
    case 'diff': {
      if (rest.length < 2) throw new Error('usage: diff <old> <new>');
      const json = wantsJson(opt);
      const { mdFile, top, report } = await runDiff(rest[0], rest[1], opt);
      if (json) process.stdout.write(formatReport(report));
      else {
        console.log(`Report: ${mdFile}`);
        top.slice(0, 5).forEach((t, i) => console.log(`  ${i + 1}. [${t.score}] ${describe(t).replace(/`/g, '')}`));
      }
      break;
    }
    case 'latest': {
      const json = wantsJson(opt);
      const adapter = getAdapter(rest[0]);
      const vs = await adapter.listVersions();
      if (vs.length < 2) throw new Error('need at least two versions');
      const [a, b] = vs.slice(-2).map(v => v.version);
      const outDir = path.resolve(opt.out || 'reports');
      const target = path.join(outDir, `${adapter.id}-${a}-to-${b}.md`);
      if (fs.existsSync(target) && !opt.force) {
        if (json) process.stdout.write(readJsonStdout(target));
        else console.log(`Up to date: ${target}`);
        break;
      }
      const { mdFile, report } = await runDiff(`${adapter.id}@${a}`, `${adapter.id}@${b}`, opt);
      if (json) process.stdout.write(formatReport(report));
      else console.log(`Report: ${mdFile}`);
      break;
    }
    case 'rss':
      console.log(buildRss(path.resolve(opt.out || 'reports'), { baseUrl: opt['base-url'] || '' })); break;
    default:
      console.log(HELP);
  }
}
