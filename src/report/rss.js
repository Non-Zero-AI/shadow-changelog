import fs from 'node:fs';
import path from 'node:path';

const esc = s => String(s).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

// Build reports/feed.xml from every reports/*.json (written next to each Markdown report).
export function buildRss(dir, { baseUrl = '', title = 'Shadow Log' } = {}) {
  const items = fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
    .sort((a, b) => (b.meta.generatedAt || '').localeCompare(a.meta.generatedAt || '')).slice(0, 50);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(title)}</title><link>${esc(baseUrl || 'https://example.invalid/')}</link>
<description>What app updates really changed: hidden features, flags, endpoints, telemetry. With evidence.</description>
${items.map(r => `<item>
<title>${esc(`${r.appName} ${r.oldVersion} → ${r.newVersion}: ${r.top.slice(0, 3).map(t => t.title).join('; ')}`)}</title>
<link>${esc((baseUrl ? baseUrl.replace(/\/$/, '') + '/' : '') + r.reportFile)}</link>
<guid isPermaLink="false">${esc(`${r.app}-${r.oldVersion}-${r.newVersion}`)}</guid>
<pubDate>${new Date(r.meta.generatedAt).toUTCString()}</pubDate>
<description>${esc(r.top.map(t => `• ${t.title}`).join('\n'))}</description>
</item>`).join('\n')}
</channel></rss>
`;
  const out = path.join(dir, 'feed.xml');
  fs.writeFileSync(out, xml);
  return out;
}
