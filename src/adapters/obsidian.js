// Obsidian publishes every desktop release on GitHub (obsidianmd/obsidian-releases), including a
// gzipped copy of its app bundle (obsidian-<ver>.asar.gz) used by the in-app updater.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { download, githubJson, semverCmp } from '../util.js';

const REPO = 'obsidianmd/obsidian-releases';

export default {
  id: 'obsidian',
  name: 'Obsidian',
  homepage: 'https://obsidian.md',
  officialChangelog: v => `https://obsidian.md/changelog/`,
  releasePage: v => `https://github.com/${REPO}/releases/tag/v${v}`,

  // Official release notes, one block per version, from obsidian.md/changelog (public HTML page).
  async officialNotes() {
    const res = await fetch('https://obsidian.md/changelog/', { headers: { 'user-agent': 'shadow-log (+https://github.com/Non-Zero-AI/shadow-log)' } });
    if (!res.ok) throw new Error(`changelog HTTP ${res.status}`);
    return parseChangelog(await res.text());
  },

  async listVersions() {
    const rels = await githubJson(`https://api.github.com/repos/${REPO}/releases?per_page=50`);
    return rels
      .filter(r => !r.draft && !r.prerelease && r.assets.some(a => a.name === `obsidian-${r.tag_name.replace(/^v/, '')}.asar.gz`))
      .map(r => ({ version: r.tag_name.replace(/^v/, ''), date: r.published_at }))
      .sort((a, b) => semverCmp(a.version, b.version));
  },

  async fetch(version, dir) {
    const name = `obsidian-${version}.asar.gz`;
    const url = `https://github.com/${REPO}/releases/download/v${version}/${name}`;
    const file = await download(url, path.join(dir, name));
    return { artifact: file, source: url };
  },

  // Obsidian keeps its English UI strings in i18n.js as window.OBSIDIAN_DEFAULT_I18N = {...}.
  // We evaluate only that data file inside an empty, network-less VM context with a timeout.
  i18n(rootDir) {
    const f = path.join(rootDir, 'i18n.js');
    if (!fs.existsSync(f)) return null;
    const ctx = { window: {} };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { timeout: 5000 });
    const obj = ctx.window.OBSIDIAN_DEFAULT_I18N;
    return obj ? { file: 'i18n.js', strings: flatten(obj) } : null;
  },
};

function flatten(o, pre = '', out = {}) {
  for (const [k, v] of Object.entries(o)) {
    const key = pre ? `${pre}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out); else out[key] = String(v);
  }
  return out;
}

export function parseChangelog(html) {
  const re = /href="\/changelog\/(\d{4}-\d{2}-\d{2})-(desktop|mobile)-v([\d.]+)\/"\s+class="[^"]*font-semibold/g;
  const marks = [];
  for (const m of html.matchAll(re)) {
    const key = m[1] + m[2] + m[3];
    if (marks.length && marks[marks.length - 1].key === key) continue;
    marks.push({ key, index: m.index, date: m[1], platform: m[2], version: m[3] });
  }
  const text = h => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/\s+/g, ' ');
  return marks.map((m, i) => ({
    version: m.version, platform: m.platform, date: m.date,
    url: `https://obsidian.md/changelog/${m.date}-${m.platform}-v${m.version}/`,
    text: text(html.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : html.length).replace(/^[^>]*>/, '')).trim(),
  })).map(b => ({ ...b, channel: (b.text.match(/Desktop (public|catalyst)/) || [])[1] })).filter(b => b.platform === 'desktop');
}
