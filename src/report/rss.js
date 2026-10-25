import fs from 'node:fs';
import path from 'node:path';
import { SCHEMA_VERSION, TOOL_NAME } from './json.js';
import { log } from '../util.js';

const esc = s => String(s).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
const str = v => typeof v === 'string';

// schemaVersion 1 reports, plus the older on-disk shape (no schemaVersion) still in reports/.
function asItem(r) {
  if (r.schemaVersion) {
    const notable = r.notable || [];
    const titles = notable.slice(0, 3).map(t => t.title || t.value);
    return {
      title: `${r.app?.name || r.app?.id || 'app'} ${r.inputs.old.version} → ${r.inputs.new.version}${titles.length ? ': ' + titles.join('; ') : ''}`,
      file: r.reportFile, guid: `${r.app.id}-${r.inputs.old.version}-${r.inputs.new.version}`, date: r.generatedAt,
      description: notable.map(t => `• ${t.title || t.value}`).join('\n'),
    };
  }
  const top = r.top || [];
  return {
    title: `${r.appName} ${r.oldVersion} → ${r.newVersion}${top.length ? ': ' + top.slice(0, 3).map(t => t.title).join('; ') : ''}`,
    file: r.reportFile, guid: `${r.app}-${r.oldVersion}-${r.newVersion}`, date: r.meta?.generatedAt,
    description: top.map(t => `• ${t.title}`).join('\n'),
  };
}

// schemaVersion 1 (tool name + the fields the feed reads), or the pre-schema on-disk shape.
// Anything else in --out (package.json, a redirected non-report, a partial write) is not an item.
function problem(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return 'not a shadow-log report';
  if (r.schemaVersion == null) {
    if (!str(r.app) || !str(r.appName) || !str(r.oldVersion) || !str(r.newVersion) || !str(r.reportFile)) return 'not a shadow-log report';
    if (r.top != null && !Array.isArray(r.top)) return 'not a shadow-log report';
    return null;
  }
  if (r.schemaVersion !== SCHEMA_VERSION) return 'unknown schemaVersion';
  if (r.tool?.name !== TOOL_NAME) return 'unexpected tool name';
  if (!str(r.app?.id) || !str(r.inputs?.old?.version) || !str(r.inputs?.new?.version) || !str(r.reportFile)) return 'missing report fields';
  if (!r.summary || typeof r.summary !== 'object' || Array.isArray(r.summary) || !Array.isArray(r.findings) || !Array.isArray(r.notable)) return 'missing report fields';
  return null;
}

function loadReport(dir, name) {
  let data;
  try { data = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')); }
  catch { log('warning: skip', `${name}: invalid JSON`); return null; }
  const why = problem(data);
  if (why) { log('warning: skip', `${name}: ${why}`); return null; }
  return data;
}

// Build reports/feed.xml from report JSON written next to each Markdown report.
export function buildRss(dir, { baseUrl = '', title = 'Shadow Log' } = {}) {
  const items = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    const report = loadReport(dir, name);
    if (report) items.push(asItem(report));
  }
  items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(title)}</title><link>${esc(baseUrl || 'https://example.invalid/')}</link>
<description>What app updates really changed: hidden features, flags, endpoints, telemetry. With evidence.</description>
${items.slice(0, 50).map(r => `<item>
<title>${esc(r.title)}</title>
<link>${esc((baseUrl ? baseUrl.replace(/\/$/, '') + '/' : '') + r.file)}</link>
<guid isPermaLink="false">${esc(r.guid)}</guid>
<pubDate>${new Date(r.date).toUTCString()}</pubDate>
<description>${esc(r.description)}</description>
</item>`).join('\n')}
</channel></rss>
`;
  const out = path.join(dir, 'feed.xml');
  fs.writeFileSync(out, xml);
  return out;
}
