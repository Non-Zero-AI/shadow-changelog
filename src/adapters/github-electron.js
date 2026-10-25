// Factory for Electron apps that publish versioned Linux builds as GitHub release assets.
// Add an app by calling githubElectron({ id, name, repo, asset: v => `pattern-${v}.tar.gz` }).
import path from 'node:path';
import { download, githubJson, semverCmp } from '../util.js';

export function githubElectron({ id, name, repo, asset, tagPrefix = 'v', homepage }) {
  return {
    id, name, homepage,
    releasePage: v => `https://github.com/${repo}/releases/tag/${tagPrefix}${v}`,
    async listVersions() {
      const rels = await githubJson(`https://api.github.com/repos/${repo}/releases?per_page=50`);
      return rels.filter(r => !r.draft && !r.prerelease)
        .map(r => ({ version: r.tag_name.replace(new RegExp('^' + tagPrefix), ''), date: r.published_at, assets: r.assets.map(a => a.name) }))
        .filter(r => r.assets.includes(asset(r.version)))
        .sort((a, b) => semverCmp(a.version, b.version));
    },
    async fetch(version, dir) {
      const file = asset(version);
      const url = `https://github.com/${repo}/releases/download/${tagPrefix}${version}/${file}`;
      return { artifact: await download(url, path.join(dir, file)), source: url };
    },
  };
}
