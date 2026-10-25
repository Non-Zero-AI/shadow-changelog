// Namespaced command ids (e.g. "editor:toggle-bold", "app:open-settings") - a reliable list of user-facing actions.
import { scanLines } from './common.js';

export function extractCommands(sources) {
  return scanLines(sources, [
    { re: /\bid\s*:\s*["'`]([a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9:-]*)["'`]/g },
    { re: /\b(?:executeCommandById|registerCommand|addCommand)\(\s*["'`]([a-z0-9][a-z0-9._-]*[:.][a-z0-9][a-z0-9:._-]*)["'`]/g },
  ], { skipVendor: true });
}
