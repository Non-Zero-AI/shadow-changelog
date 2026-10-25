// End-to-end test on two tiny synthetic "app bundles" (no network): checks that the extractors,
// diff, dormant-file detection and the release-notes cross-check behave.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shadow-test-'));
process.env.SHADOW_CACHE = path.join(tmp, 'cache');
process.env.SHADOW_QUIET = '1';

function writeApp(dir, files) {
  for (const [f, body] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), body); }
}

writeApp(path.join(tmp, 'v1'), {
  'package.json': JSON.stringify({ name: 'demo', version: '1.0.0', dependencies: { left: '1.0.0' } }),
  'main.js': 'const {ipcMain}=require("electron");ipcMain.on("get-version",()=>1);fetch("https://api.demo-app.io/v1/user");',
  'locales/en.json': JSON.stringify({ menu: { open: 'Open' } }),
});
writeApp(path.join(tmp, 'v2'), {
  'package.json': JSON.stringify({ name: 'demo', version: '2.0.0', dependencies: { left: '1.1.0', newdep: '3.0.0' } }),
  'main.js': 'const {ipcMain}=require("electron");ipcMain.on("get-version",()=>1);ipcMain.handle("ai-assistant:ask",()=>2);fetch("https://api.demo-app.io/v1/user");fetch("https://telemetry.demo-app.io/collect");if(isFeatureEnabled("labs-ai-assistant")){}',
  'lib/shiny.min.js': '/*! Shiny 2.1.0 | MIT */ var shiny=1;',
  'locales/en.json': JSON.stringify({ menu: { open: 'Open' }, aiAssistant: { title: 'AI assistant', askButton: 'Ask the assistant', disclaimer: 'Answers may be wrong' } }),
});

process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));

test('diff finds new IPC, flag, deps, strings and a dormant library', async () => {
  const { runDiff } = await import('../src/cli.js');
  const out = path.join(tmp, 'reports');
  const { mdFile, top } = await runDiff(path.join(tmp, 'v1'), path.join(tmp, 'v2'), { out, llm: false, notes: false });
  const md = fs.readFileSync(mdFile, 'utf8');
  assert.match(md, /ai-assistant:ask/);
  assert.match(md, /labs-ai-assistant/);
  assert.match(md, /newdep/);
  assert.match(md, /telemetry\.demo-app\.io/);
  assert.match(md, /Ask the assistant/);
  const lib = top.find(t => t.cat === 'file' && t.value === 'lib/shiny.min.js');
  assert.ok(lib, 'dormant library is a top finding');
  assert.equal(lib.file.referencedBy.length, 0);
  assert.ok(fs.existsSync(path.join(out, 'feed.xml')));
});

test('release-notes cross-check separates announced, later, and absent', async () => {
  const { crossCheck } = await import('../src/officialNotes.js');
  const findings = [
    { cat: 'commands', value: 'app:increase-font-size' },
    { cat: 'deps', value: 'bundled:lib/pele.min.js (Pele)' },
    { cat: 'ipc', value: 'renderer: latest-public-version' },
  ];
  crossCheck(findings, [
    { version: '1.2.0', text: 'Added Increase font size command.' },
    { version: '1.3.0', text: 'Diagrams now use Pele.' },
  ], '1.1.0', '1.2.0');
  assert.equal(findings[0].officialStatus, 'mentioned');
  assert.equal(findings[1].officialStatus, 'later');
  assert.equal(findings[2].officialStatus, 'absent');
});

test('obsidian changelog parser splits per-version blocks', async () => {
  const { parseChangelog } = await import('../src/adapters/obsidian.js');
  const html = '<a href="/changelog/2026-10-22-desktop-v1.15.0/" class="font-semibold">x</a> 1.15.0 Desktop catalyst Pele <a href="/changelog/2026-10-22-desktop-v1.14.5/">inline</a>' +
    '<a href="/changelog/2026-10-22-desktop-v1.14.5/" class="font-semibold">y</a> 1.14.5 Desktop public Electron';
  const b = parseChangelog(html);
  assert.deepEqual(b.map(x => [x.version, x.channel]), [['1.15.0', 'catalyst'], ['1.14.5', 'public']]);
  assert.match(b[0].text, /Pele/);
  assert.doesNotMatch(b[1].text, /Pele/);
});
