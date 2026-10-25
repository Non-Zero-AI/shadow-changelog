// Declared dependencies (package.json files) and versions of bundled third-party libraries.
import fs from 'node:fs';
import path from 'node:path';

export function extractDeps(root, files) {
  const deps = new Map();
  const add = (k, version, file, meta) => deps.set(k, { value: k, version, count: 1, files: new Set([file]), evidence: [{ file, line: 0, snippet: `${k} ${version}` }], vendorOnly: false, meta });
  for (const f of files.filter(f => f.endsWith('package.json') && !f.includes('/test/'))) {
    let pj; try { pj = JSON.parse(fs.readFileSync(path.join(root, f), 'utf8')); } catch { continue; }
    if (f.split('/').filter(Boolean).length === 1 || /(^|\/)[^/]+\/package\.json$/.test(f) && !f.includes('node_modules')) {
      for (const sec of ['dependencies', 'optionalDependencies', 'devDependencies']) for (const [n, v] of Object.entries(pj[sec] || {})) add(`${n}`, String(v), f, { kind: sec });
    }
    if (f.includes('node_modules/') && pj.name && pj.version) add(`${pj.name}`, pj.version, f, { kind: 'installed' });
  }
  // bundled libs: version.json files and banner comments like /*! foo v1.2.3 */ or "@license foo 1.2"
  for (const f of files.filter(f => /\.(m?js|json)$/.test(f) && /(^|\/)(lib|vendor|libs)\//.test(f))) {
    const p = path.join(root, f);
    const head = fs.readFileSync(p, 'utf8').slice(0, 4000);
    let m;
    if (f.endsWith('version.json') && (m = head.match(/"version"\s*:\s*"([^"]+)"/))) add(`bundled:${f}`, m[1], f, { kind: 'bundled' });
    else if ((m = head.match(/(?:\/\*!?|\/\/|\*)\s*@?(?:license\s+)?([A-Za-z][\w.\- ]{1,40}?)\s+v?(\d+\.\d+\.\d+[\w.-]*)/))) add(`bundled:${f} (${m[1].trim()})`, m[2], f, { kind: 'bundled', banner: m[1].trim() });
  }
  return deps;
}
