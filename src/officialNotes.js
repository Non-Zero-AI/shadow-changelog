// Cross-check findings against the vendor's own release notes, so a reader can tell "announced"
// from "shipped silently". This is a plain-text match and can miss rewordings; we say so in the report.
import { semverCmp } from './util.js';

const norm = s => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');

// Terms that would show up in prose if the finding were announced.
export function termsFor(f) {
  const t = new Set();
  const add = s => { if (s && norm(s).length >= 4) t.add(s); };
  const v = String(f.value || '');
  switch (f.cat) {
    case 'i18n-cluster': {
      const leaf = f.value.split('.').pop();
      const GENERIC = /^(commands?|plugins?|bases|settings?|interface|menuitems|dialogue|app|editor|general|options?|labels?|messages?|mobile|desktop|core)$/i;
      if (!GENERIC.test(leaf)) { add(leaf); add(leaf.replace(/([a-z])([A-Z])/g, '$1 $2')); }
      for (const it of f.cluster.items) if ((it.meta.text || '').split(/\s+/).length >= 2 && it.meta.text.length <= 60) {
        const txt = it.meta.text.replace(/[.…]+$/, '').replace(/\{\{[^}]*\}\}/g, '').trim();
        add(txt);
        const noVerb = txt.replace(/^(open|toggle|add|show|hide|edit|choose|create|set)\s+/i, '');
        if (noVerb !== txt && noVerb.split(/\s+/).length >= 2) add(noVerb);
      }
      break;
    }
    case 'commands': { const id = v.split(':').pop(); add(id.replace(/-/g, ' ')); break; }
    case 'ipc': add(v.replace(/^[^:]*:\s*/, '').replace(/-/g, ' ')); break;
    case 'file': { const b = v.split('/').pop().replace(/\.(min\.)?(m?js|html|css)$/, ''); if (b !== 'index') add(b); else add(v.split('/').slice(-2, -1)[0]); if (f.file?.banner) add(f.file.banner.split(/\s+/)[0]); break; }
    case 'deps': add(v.replace(/^bundled:.*\(([^)]+)\)$/, '$1').replace(/^bundled:/, '')); break;
    case 'domains': add(v); break;
    case 'i18n': add(f.after); break;
    default: add(v);
  }
  return [...t];
}

export function crossCheck(findings, notes, oldV, newV) {
  if (!notes?.length) return;
  const inRange = notes.filter(n => semverCmp(n.version, oldV) > 0 && semverCmp(n.version, newV) <= 0);
  const later = notes.filter(n => semverCmp(n.version, newV) > 0).sort((a, b) => semverCmp(a.version, b.version));
  const hay = arr => arr.map(n => ({ ...n, version: n.channel ? `${n.version} (${n.channel})` : n.version, n: norm(n.text) }));
  const R = hay(inRange), L = hay(later);
  for (const f of findings) {
    const terms = termsFor(f);
    if (!terms.length) continue;
    const hit = (blocks) => { for (const b of blocks) for (const term of terms) if (b.n.includes(norm(term))) return { b, term }; return null; };
    const h = hit(R);
    if (h) { f.official = `mentioned (matched "${h.term}" in the ${h.b.version} notes)`; f.officialStatus = "mentioned"; continue; }
    const l = hit(L);
    f.official = l
      ? `**not in the notes for ${oldV}→${newV}**; first appears in the ${l.b.version} notes (matched "${l.term}")`
      : `not found in the notes for ${oldV}→${newV} (searched for: ${terms.slice(0, 4).map(x => `"${x}"`).join(', ')})`;
    f.officialStatus = l ? 'later' : 'absent';
  }
}
