// Turn a downloaded artifact (.asar, .asar.gz, .tar.gz, .deb, .zip, directory) into a plain directory
// of app files. Only standard archive formats are handled; nothing here bypasses encryption,
// DRM, or anti-tamper. If an app ships its code encrypted, we stop and say so.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import asar from '@electron/asar';
import { ensureDir, gunzipFile, log, walk } from './util.js';

export async function unpackArtifact(artifact, outDir) {
  ensureDir(outDir);
  const done = path.join(outDir, '.unpacked');
  if (fs.existsSync(done)) return outDir;
  const st = fs.statSync(artifact);
  if (st.isDirectory()) {
    fs.cpSync(artifact, outDir, { recursive: true });
  } else if (artifact.endsWith('.asar.gz')) {
    const tmp = path.join(path.dirname(outDir), path.basename(artifact, '.gz'));
    await gunzipFile(artifact, tmp);
    extractAsar(tmp, outDir);
  } else if (artifact.endsWith('.asar')) {
    extractAsar(artifact, outDir);
  } else if (/\.(tar\.gz|tgz|tar\.xz|tar)$/.test(artifact)) {
    const raw = path.join(path.dirname(outDir), 'raw'); ensureDir(raw);
    execFileSync('tar', ['-xf', artifact, '-C', raw]);
    expandAsarsFrom(raw, outDir);
  } else if (artifact.endsWith('.deb')) {
    const raw = path.join(path.dirname(outDir), 'raw'); ensureDir(raw);
    execFileSync('dpkg-deb', ['-x', artifact, raw]);
    expandAsarsFrom(raw, outDir);
  } else if (artifact.endsWith('.zip')) {
    const raw = path.join(path.dirname(outDir), 'raw'); ensureDir(raw);
    execFileSync('unzip', ['-q', '-o', artifact, '-d', raw]);
    expandAsarsFrom(raw, outDir);
  } else {
    throw new Error(`Don't know how to unpack ${artifact}`);
  }
  fs.writeFileSync(done, new Date().toISOString());
  return outDir;
}

function extractAsar(file, dest) {
  log('extracting asar', path.basename(file));
  asar.extractAll(file, dest);
}

// For full installers: locate every *.asar (app.asar, obsidian.asar, ...) and extract each into
// <out>/<asar-name>/ so evidence paths stay unambiguous.
function expandAsarsFrom(raw, out) {
  const asars = walk(raw).filter(f => f.endsWith('.asar'));
  if (!asars.length) {
    log('no .asar found; using raw resources directory');
    fs.cpSync(raw, out, { recursive: true });
    return;
  }
  for (const a of asars) {
    const name = path.basename(a, '.asar');
    extractAsar(path.join(raw, a), path.join(out, name));
  }
}
