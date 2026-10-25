// UI strings. New strings that no first-party code references yet are the classic tell for
// unreleased UI (translations ship before the feature is switched on).
import fs from 'node:fs';
import path from 'node:path';

function flatten(o, pre = '', out = {}) {
  for (const [k, v] of Object.entries(o || {})) {
    const key = pre ? `${pre}.${k}` : k;
    if (v && typeof v === 'object' && !('message' in v)) flatten(v, key, out);
    else out[key] = String(v && typeof v === 'object' ? v.message : v);
  }
  return out;
}

function genericI18n(root, files) {
  // English locale JSONs: en.json, en-US.json, locales/en/*.json, _locales/en/messages.json
  const cand = files.filter(f => /(^|\/)(_?locales?|i18n|lang|translations?)\/.*\ben([-_](US|GB))?\b[^/]*\.json$|(^|\/)en([-_]US)?\.json$/i.test(f) && !f.includes('node_modules'));
  if (!cand.length) return null;
  const strings = {};
  for (const f of cand) { try { Object.assign(strings, flatten(JSON.parse(fs.readFileSync(path.join(root, f), 'utf8')), path.basename(f, '.json'))); } catch {} }
  return { file: cand.join(', '), strings };
}

export function extractI18n(root, files, adapter, firstPartyTokens) {
  const res = (adapter.i18n && adapter.i18n(root)) || genericI18n(root, files);
  if (!res) return new Map();
  const out = new Map();
  for (const [key, text] of Object.entries(res.strings)) {
    const leaf = key.split('.').pop().replace(/_(plural|one|other|zero|few|many|two)$/, '');
    // is this key referenced from any first-party JS other than the string table itself?
    const referenced = firstPartyTokens.has(leaf);
    out.set(key, { value: key, count: 1, files: new Set([res.file]), evidence: [{ file: res.file, line: 0, snippet: `${key} = "${text.slice(0, 140)}"` }], vendorOnly: false, meta: { text, referenced } });
  }
  return out;
}
