// Analyze any artifact you already have on disk: .asar, .asar.gz, .tar.gz, .deb, .zip, or a directory.
// Usage: shadow-log diff ./old/app.asar ./new/app.asar
import fs from 'node:fs';
import path from 'node:path';

export default {
  id: 'local',
  name: 'Local artifact',
  async listVersions() { return []; },
  async fetch(p) {
    const abs = path.resolve(p);
    if (!fs.existsSync(abs)) throw new Error(`No such file: ${abs}`);
    return { artifact: abs, source: abs };
  },
  // generic i18n lookup handled by extractors/i18n.js
};
