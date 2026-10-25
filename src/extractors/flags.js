// Feature flags / experiments / rollout gates / settings keys.
import { scanLines } from './common.js';

// Split identifiers into words (kebab, snake, dotted, camelCase) and look for flag vocabulary as whole words.
const FLAG_WORDS = new Set(['feature', 'features', 'flags', 'featureflag', 'experiment', 'experiments', 'experimental', 'beta', 'insider', 'insiders', 'lab', 'labs', 'rollout', 'canary', 'killswitch', 'dogfood', 'staging', 'gate', 'gated', 'gates', 'holdout', 'cohort', 'unreleased', 'early', 'debug']);
const words = v => v.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const isFlagLike = v => words(v).some(w => FLAG_WORDS.has(w)) || /^(enable|disable)[A-Z]\w+$/.test(v) || /(^|[-_.])(ff|exp)[-_.]/.test(v);
const STR = /["'`]([A-Za-z][A-Za-z0-9_.:-]{2,63})["'`]/g;
// CSS-ish class names and icon ids create noise; drop obvious ones
const CSSY = /^(is|mod|has|lucide|svg|icon|cm|markdown|nav|tree|view|workspace|setting|menu|modal|status-bar)-/;

export function extractFlags(sources) {
  const flags = scanLines(sources, [{
    re: STR,
    filter: v => isFlagLike(v) && !CSSY.test(v) && !/^(https?|data|blob):/.test(v) && !/\.(js|css|png|svg|md|json)$/.test(v),
  }], { skipVendor: true });

  const configKeys = scanLines(sources, [
    // app config / settings / persisted keys
    { re: /\b(?:getConfig|setConfig|getSetting|setSetting|getPref|setPref|getOption|setOption)\(\s*["'`]([\w.:-]{2,80})["'`]/g },
    { re: /\blocalStorage\.(?:getItem|setItem|removeItem)\(\s*["'`]([\w.:-]{2,80})["'`]/g, meta: () => ({ kind: 'localStorage' }) },
    { re: /\b(?:loadLocalStorage|saveLocalStorage)\(\s*["'`]([\w.:-]{2,80})["'`]/g, meta: () => ({ kind: 'localStorage' }) },
    // Electron / Chromium switches and feature toggles
    { re: /\bappendSwitch\(\s*["'`]([\w.:-]{2,80})["'`]/g, meta: () => ({ kind: 'chromium-switch' }) },
    { re: /\b(?:enable|disable)-features["'`]?\s*[,=:]\s*["'`]([\w,]{2,200})["'`]/g, meta: () => ({ kind: 'chromium-feature' }) },
  ], { skipVendor: true });
  return { flags, configKeys };
}
