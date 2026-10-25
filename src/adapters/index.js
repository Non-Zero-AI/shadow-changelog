import obsidian from './obsidian.js';
import local from './local.js';
import { githubElectron } from './github-electron.js';

// Registered adapters. Obsidian is the tested reference adapter. The GitHub-release entries below
// use the generic factory and are untested templates: verify the asset name before relying on them.
const adapters = {
  obsidian,
  local,
  'obsidian-full': githubElectron({ id: 'obsidian-full', name: 'Obsidian (full Linux tarball incl. Electron shell)', repo: 'obsidianmd/obsidian-releases', asset: v => `obsidian-${v}.tar.gz` }),
  logseq: githubElectron({ id: 'logseq', name: 'Logseq', repo: 'logseq/logseq', tagPrefix: '', asset: v => `Logseq-linux-x64-${v}.zip` }),
};

export function getAdapter(id) {
  const a = adapters[id];
  if (!a) throw new Error(`Unknown app "${id}". Known: ${Object.keys(adapters).join(', ')}`);
  return a;
}
export function listAdapters() { return Object.values(adapters); }
