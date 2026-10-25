// Build a "snapshot" of one release: unpack, beautify JS, run all extractors, persist facts + evidence.
import fs from 'node:fs';
import path from 'node:path';
import beautify from 'js-beautify';
import { CACHE_DIR, ensureDir, log, walk, sha256 } from './util.js';
import { unpackArtifact } from './unpack.js';
import { isVendor } from './extractors/common.js';
import { extractUrls } from './extractors/urls.js';
import { extractFlags } from './extractors/flags.js';
import { extractIpc } from './extractors/ipc.js';
import { extractTelemetry } from './extractors/telemetry.js';
import { extractCommands } from './extractors/commands.js';
import { extractDeps } from './extractors/deps.js';
import { extractI18n } from './extractors/i18n.js';

const SNAPSHOT_VERSION = 4;
const TEXT_EXT = /\.(m?js|cjs|html?|json)$/i;
const MAX_BEAUTIFY = 25 * 1024 * 1024;

export function versionDir(appId, version) { return path.join(CACHE_DIR, appId, version.replace(/[^\w.@-]/g, '_')); }

export async function buildSnapshot(adapter, version, { force = false } = {}) {
  const dir = ensureDir(versionDir(adapter.id, adapter.id === 'local' ? path.basename(version) : version));
  const snapFile = path.join(dir, 'snapshot.json');
  if (!force && fs.existsSync(snapFile)) {
    const s = JSON.parse(fs.readFileSync(snapFile, 'utf8'));
    if (s.snapshotVersion === SNAPSHOT_VERSION) { log('snapshot cached', adapter.id, version); return reviveSnapshot(s); }
  }
  const { artifact, source } = await adapter.fetch(version, dir);
  const root = await unpackArtifact(artifact, path.join(dir, 'unpacked'));
  const files = walk(root).filter(f => f !== '.unpacked');
  const prettyRoot = ensureDir(path.join(dir, 'pretty'));

  // File inventory
  const inventory = {};
  for (const f of files) {
    const buf = fs.readFileSync(path.join(root, f));
    inventory[f] = { size: buf.length, sha256: sha256(buf) };
    if (/\.(m?js|css)$/.test(f)) { const b = buf.subarray(0, 300).toString('utf8').match(/^\s*\/\*!?\s*([^\n*]{3,120})/); if (b) inventory[f].banner = b[1].trim(); }
  }

  // Beautify JS so evidence has meaningful line numbers; load text sources
  const sources = [];
  for (const f of files.filter(f => TEXT_EXT.test(f))) {
    const raw = fs.readFileSync(path.join(root, f), 'utf8');
    let text = raw;
    if (/\.(m?js|cjs)$/i.test(f) && raw.length < MAX_BEAUTIFY && !isVendor(f)) {
      const out = path.join(prettyRoot, f);
      if (fs.existsSync(out)) text = fs.readFileSync(out, 'utf8');
      else {
        log('beautifying', f, `(${(raw.length / 1024) | 0} KB)`);
        text = beautify.js(raw, { indent_size: 2, max_preserve_newlines: 1, wrap_line_length: 0 });
        ensureDir(path.dirname(out)); fs.writeFileSync(out, text);
      }
    }
    sources.push({ file: f, lines: text.split('\n') });
  }

  log('extracting facts from', sources.length, 'text files');
  const { urls, domains, apiPaths } = extractUrls(sources);
  const { flags, configKeys } = extractFlags(sources);
  const ipc = extractIpc(sources);
  const telemetry = extractTelemetry(sources, domains);
  const commands = extractCommands(sources);
  const deps = extractDeps(root, files);

  const tokens = new Set();
  for (const s of sources) {
    if (isVendor(s.file) || !/\.(m?js|cjs|html?)$/.test(s.file) || /(^|\/)i18n\.js$/.test(s.file)) continue;
    for (const l of s.lines) for (const m of l.matchAll(/[.\["'`]([A-Za-z_$][\w$-]*)/g)) tokens.add(m[1]);
  }
  const i18n = extractI18n(root, files, adapter, tokens);

  // Which files does first-party code/HTML actually reference by name? A newly shipped file that
  // nothing references is "dormant": staged ahead of a feature that is not wired up yet.
  const fpText = sources.filter(s => !isVendor(s.file) && /\.(m?js|cjs|html?|json)$/.test(s.file)).map(s => ({ file: s.file, text: s.lines.join('\n') }));
  for (const f of files) {
    const base = path.basename(f);
    const stem = base.replace(/\.(min\.)?(m?js|css|html|json|wasm)$/, '');
    inventory[f].referencedBy = fpText.filter(t => t.file !== f && (t.text.includes(base) || (stem.length > 3 && t.text.includes(stem + '.')))).map(t => t.file).slice(0, 5);
  }

  const snap = {
    snapshotVersion: SNAPSHOT_VERSION, app: adapter.id, appName: adapter.name, version, source,
    createdAt: new Date().toISOString(), inventory,
    categories: { domains, urls, apiPaths, telemetry, flags, configKeys, ipc, commands, i18n, deps },
  };
  fs.writeFileSync(snapFile, JSON.stringify(serialize(snap)));
  return snap;
}

function serialize(snap) {
  const cats = {};
  for (const [k, m] of Object.entries(snap.categories)) cats[k] = [...m.values()].map(e => ({ ...e, files: [...e.files] }));
  return { ...snap, categories: cats };
}
function reviveSnapshot(s) {
  const cats = {};
  for (const [k, arr] of Object.entries(s.categories)) cats[k] = new Map(arr.map(e => [e.value, { ...e, files: new Set(e.files) }]));
  return { ...s, categories: cats };
}
