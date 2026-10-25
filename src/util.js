import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import zlib from 'node:zlib';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const CACHE_DIR = process.env.SHADOW_CACHE || path.join(ROOT, '.cache');

export function log(...a) { if (!process.env.SHADOW_QUIET) console.error('[shadow]', ...a); }

export function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); return d; }

export async function download(url, dest, { headers = {} } = {}) {
  ensureDir(path.dirname(dest));
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { log('cached', path.basename(dest)); return dest; }
  log('downloading', url);
  const res = await fetch(url, { headers: { 'user-agent': 'shadow-changelog/0.1 (+research; public releases only)', ...headers }, redirect: 'follow' });
  if (!res.ok) throw new Error(`download failed ${res.status} ${url}`);
  const tmp = dest + '.part';
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(tmp));
  fs.renameSync(tmp, dest);
  return dest;
}

export async function gunzipFile(src, dest) {
  await pipeline(fs.createReadStream(src), zlib.createGunzip(), fs.createWriteStream(dest));
  return dest;
}

export async function githubJson(url) {
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'shadow-changelog/0.1' };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${url}`);
  return res.json();
}

export function walk(dir, base = dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, base, out);
    else if (ent.isFile()) out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out;
}

export function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

export function snippetAround(line, idx, len, max = 160) {
  const s = line.replace(/\s+/g, ' ');
  // idx is relative to the original line; approximate after whitespace collapse
  const lead = line.length - line.trimStart().length;
  let start = Math.max(0, idx - lead - Math.floor((max - len) / 2));
  let snip = s.trim().slice(start, start + max);
  if (start > 0) snip = '…' + snip;
  if (start + max < s.trim().length) snip += '…';
  return snip;
}

export function semverCmp(a, b) {
  const pa = a.split(/[.-]/).map(x => (isNaN(+x) ? x : +x));
  const pb = b.split(/[.-]/).map(x => (isNaN(+x) ? x : +x));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if (pa[i] === undefined) return -1; if (pb[i] === undefined) return 1;
    if (pa[i] < pb[i]) return -1; if (pa[i] > pb[i]) return 1;
  }
  return 0;
}
