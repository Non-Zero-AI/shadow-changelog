import { scanLines } from './common.js';

const NOISE_HOSTS = /(^|\.)(w3\.org|example\.(com|org|net)|localhost|schema\.org|purl\.org|xmlns\.com|ns\.adobe\.com|openxmlformats\.org|mozilla\.org\/MPL|apache\.org\/licenses|opensource\.org|creativecommons\.org)$/i;

export function urlRules() {
  return [{
    re: /\bhttps?:\/\/[A-Za-z0-9.-]+(?::\d+)?(?:\/[A-Za-z0-9._~%!$&'()*+,;=:@\/-]*)?(?:\?[A-Za-z0-9._~%!$&'()*+,;=:@\/?-]*)?/g,
    group: 0,
    map: v => v.replace(/[)'",;.]+$/, ''),
    filter: v => { try { const h = new URL(v).hostname; return h.includes('.') && !NOISE_HOSTS.test(h); } catch { return false; } },
  }];
}

// Relative API-ish paths in string literals: "/api/...", "/v1/...", "/graphql", "/rpc/..."
const API_PATH = /["'`](\/(?:api|v\d+|graphql|rpc|rest|internal|_api|auth|oauth|user|users|account|billing|sync|publish|telemetry|metrics|events|track|collect|log|logs|feature|flags|experiments)(?:\/[A-Za-z0-9_.{}:$-]*)*)["'`]/g;

export function extractUrls(sources) {
  const urls = scanLines(sources, urlRules());
  const domains = new Map();
  for (const [u, e] of urls) {
    let host; try { host = new URL(u).hostname.toLowerCase(); } catch { continue; }
    let d = domains.get(host);
    if (!d) { d = { value: host, count: 0, files: new Set(), evidence: [], vendorOnly: true, meta: {} }; domains.set(host, d); }
    d.count += e.count; e.files.forEach(f => d.files.add(f));
    if (!e.vendorOnly) d.vendorOnly = false;
    if (d.evidence.length < 3) d.evidence.push(...e.evidence.slice(0, 3 - d.evidence.length));
  }
  const apiPaths = scanLines(sources, [{ re: API_PATH, filter: v => v.length > 4 && v.length < 120 }]);
  return { urls, domains, apiPaths };
}
