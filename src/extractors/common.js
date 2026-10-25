// Shared helpers for line-oriented extractors over beautified sources.
import { snippetAround } from '../util.js';

export const VENDOR_RE = /(^|\/)(lib|libs|vendor|vendors|node_modules|third_party|thirdparty)\/|\.min\.m?js$/i;
export const isVendor = f => VENDOR_RE.test(f);

// Record a finding value -> { count, files:Set, evidence:[first 3 {file,line,snippet}] }
export function record(map, value, file, lineNo, line, idx, len, meta = {}) {
  let e = map.get(value);
  if (!e) { e = { value, count: 0, files: new Set(), evidence: [], vendorOnly: true, meta }; map.set(value, e); }
  e.count++;
  e.files.add(file);
  if (!isVendor(file)) e.vendorOnly = false;
  // prefer first-party evidence
  if (e.evidence.length < 3 || (e.evidence.every(x => isVendor(x.file)) && !isVendor(file))) {
    const ev = { file, line: lineNo, snippet: snippetAround(line, idx, len) };
    if (e.evidence.length >= 3) e.evidence.pop();
    if (!isVendor(file)) e.evidence.unshift(ev); else e.evidence.push(ev);
  }
}

// Run a set of {re, group, filter, map} rules over every line of every source file.
export function scanLines(sources, rules, { skipVendor = false } = {}) {
  const out = new Map();
  for (const { file, lines } of sources) {
    if (skipVendor && isVendor(file)) continue;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length > 20000) continue; // giant data blobs (fonts, base64)
      for (const r of rules) {
        r.re.lastIndex = 0;
        let m;
        while ((m = r.re.exec(line))) {
          let v = m[r.group ?? 1];
          if (v == null) continue;
          if (r.map) v = r.map(v, m);
          if (!v || (r.filter && !r.filter(v, m, file))) continue;
          record(out, v, file, i + 1, line, m.index, m[0].length, r.meta ? r.meta(v, m) : {});
        }
      }
    }
  }
  return out;
}
