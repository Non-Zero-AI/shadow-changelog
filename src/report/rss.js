import fs from 'node:fs';
import path from 'node:path';

const esc = s => String(s).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

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

// Build reports/feed.xml from every reports/*.json (written next to each Markdown report).
export function buildRss(dir, { baseUrl = '', title = 'Shadow Log' } = {}) {
  const items = fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
    .map(asItem).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 50);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(title)}</title><link>${esc(baseUrl || 'https://example.invalid/')}</link>
<description>What app updates really changed: hidden features, flags, endpoints, telemetry. With evidence.</description>
${items.map(r => `<item>
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
