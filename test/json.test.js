// `--json` / `--format json` stdout contract. Offline, on the same kind of synthetic bundles as e2e.test.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SCHEMA_VERSION } from '../src/report/json.js';
import { buildRss } from '../src/report/rss.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const bin = path.join(root, 'bin/shadow-log.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shadow-json-'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function writeApp(dir, files) {
  for (const [f, body] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), body); }
}

const v1 = path.join(tmp, 'v1');
const v2 = path.join(tmp, 'v2');
writeApp(v1, {
  'package.json': JSON.stringify({ name: 'demo', version: '1.0.0', dependencies: { left: '1.0.0' } }),
  'main.js': 'const {ipcMain}=require("electron");ipcMain.on("get-version",()=>1);fetch("https://api.demo-app.io/v1/user");',
  'locales/en.json': JSON.stringify({ menu: { open: 'Open' } }),
});
writeApp(v2, {
  'package.json': JSON.stringify({ name: 'demo', version: '2.0.0', dependencies: { left: '1.1.0', newdep: '3.0.0' } }),
  'main.js': 'const {ipcMain}=require("electron");ipcMain.on("get-version",()=>1);ipcMain.handle("ai-assistant:ask",()=>2);fetch("https://api.demo-app.io/v1/user");fetch("https://telemetry.demo-app.io/collect");if(isFeatureEnabled("labs-ai-assistant")){}',
  'lib/shiny.min.js': '/*! Shiny 2.1.0 | MIT */ var shiny=1;',
  'locales/en.json': JSON.stringify({ menu: { open: 'Open' }, aiAssistant: { title: 'AI assistant', askButton: 'Ask the assistant', disclaimer: 'Answers may be wrong' } }),
});

process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));

function run(args) {
  const e = { ...process.env, SHADOW_CACHE: fs.mkdtempSync(path.join(tmp, 'cache-')) };
  delete e.SHADOW_QUIET;
  delete e.OPENAI_API_KEY;
  delete e.ANTHROPIC_API_KEY;
  return spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8', env: e });
}

function assertFindingShape(f) {
  assert.equal(typeof f.category, 'string');
  assert.ok(['added', 'removed', 'changed'].includes(f.change), f.change);
  assert.equal(typeof f.value, 'string');
  assert.ok(Array.isArray(f.evidence));
  for (const e of f.evidence) {
    assert.equal(typeof e.file, 'string');
    if ('line' in e) assert.ok(Number.isInteger(e.line) && e.line >= 1);
  }
}

test('schema file matches SCHEMA_VERSION', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(root, 'schema/report.schema.json'), 'utf8'));
  assert.equal(schema.properties.schemaVersion.const, SCHEMA_VERSION);
  assert.equal(schema.properties.tool.properties.name.const, 'shadow-log');
  for (const key of ['schemaVersion', 'tool', 'inputs', 'summary', 'findings']) assert.ok(schema.required.includes(key));
});

test('diff --json prints one report on stdout and keeps logs on stderr', () => {
  const out = path.join(tmp, 'reports');
  const r = run(['diff', '--json', v1, v2, '--out', out, '--no-llm', '--no-notes']);
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(r.stdout, /Report:|\[shadow\]/);
  assert.match(r.stderr, /\[shadow\]/);
  const report = JSON.parse(r.stdout);
  assert.equal(r.stdout, JSON.stringify(report, null, 1) + '\n');
  assert.equal(report.schemaVersion, 1);
  assert.deepEqual(report.tool, { name: 'shadow-log', version: pkg.version });
  assert.equal(report.inputs.old.version, 'v1');
  assert.equal(report.inputs.new.version, 'v2');
  assert.ok(report.inputs.old.path.endsWith(`${path.sep}v1`));
  assert.equal(report.inputs.new.spec, v2);
  for (const cat of ['telemetry', 'apiPaths', 'domains', 'ipc', 'flags', 'configKeys', 'commands', 'i18n', 'deps', 'urls', 'files']) {
    const n = report.summary.counts[cat];
    assert.equal(typeof n.added, 'number', cat);
    assert.equal(typeof n.removed, 'number', cat);
    assert.equal(typeof n.changed, 'number', cat);
  }
  assert.ok(report.findings.length > 0);
  for (const f of report.findings) assertFindingShape(f);
  const ipc = report.findings.find(f => f.category === 'ipc' && f.value === 'ai-assistant:ask');
  assert.ok(ipc, 'ipc finding present');
  assert.equal(ipc.change, 'added');
  assert.equal(ipc.evidence[0].file, 'main.js');
  assert.ok(ipc.evidence[0].line >= 1);
  const dep = report.findings.find(f => f.category === 'deps' && f.value === 'newdep');
  assert.equal(dep.change, 'added');
  assert.equal(dep.evidence[0].file, 'package.json');
  assert.equal('line' in dep.evidence[0], false);
  const flag = report.findings.find(f => f.category === 'flags' && f.value === 'labs-ai-assistant');
  assert.equal(flag.change, 'added');
  const lib = report.notable.find(f => f.category === 'files' && f.value === 'lib/shiny.min.js');
  assert.ok(lib);
  assert.equal(lib.change, 'added');
  assert.deepEqual(lib.referencedBy, []);
  const written = fs.readFileSync(path.join(out, 'local-v1-to-v2.json'), 'utf8');
  assert.equal(written, r.stdout);
  assert.equal(report.notes, undefined);
});

test('--format json matches --json findings', () => {
  const out = path.join(tmp, 'reports-format');
  const r = run(['diff', v1, v2, '--format', 'json', '--out', out, '--no-llm', '--no-notes']);
  assert.equal(r.status, 0, r.stderr);
  const report = JSON.parse(r.stdout);
  assert.equal(report.schemaVersion, SCHEMA_VERSION);
  const ipc = report.findings.find(f => f.category === 'ipc' && f.value === 'ai-assistant:ask');
  assert.equal(ipc.change, 'added');
  assert.equal(ipc.evidence[0].file, 'main.js');
  assert.doesNotMatch(r.stdout, /Report:/);
});

test('unknown --format fails without writing a report to stdout', () => {
  const r = run(['diff', v1, v2, '--format', 'xml', '--no-llm']);
  assert.notEqual(r.status, 0);
  assert.equal(r.stdout, '');
  assert.match(r.stderr, /unknown --format/);
});

test('rss reads a schemaVersion 1 report and a legacy report', () => {
  const dir = path.join(tmp, 'rss');
  fs.mkdirSync(dir);
  const legacy = { app: 'demo', appName: 'Demo', oldVersion: '1', newVersion: '2', reportFile: 'demo-1-to-2.md', meta: { generatedAt: '2020-01-01T00:00:00.000Z' }, top: [{ title: 'New flag x' }] };
  const current = {
    schemaVersion: 1, tool: { name: 'shadow-log', version: '0.1.0' }, generatedAt: '2026-01-02T00:00:00.000Z',
    app: { id: 'local', name: 'Local build' },
    inputs: { old: { spec: 'v1', app: 'local', version: 'v1', files: 1 }, new: { spec: 'v2', app: 'local', version: 'v2', files: 2 } },
    summary: { counts: {} }, findings: [], reportFile: 'local-v1-to-v2.md',
    notable: [{ category: 'ipc', change: 'added', value: 'ai-assistant:ask', title: 'New IPC channel ai-assistant:ask', evidence: [{ file: 'main.js', line: 4 }] }],
  };
  fs.writeFileSync(path.join(dir, 'legacy.json'), JSON.stringify(legacy));
  fs.writeFileSync(path.join(dir, 'current.json'), JSON.stringify(current));
  const feed = fs.readFileSync(buildRss(dir, { title: 'Shadow Log' }), 'utf8');
  assert.match(feed, /Shadow Log/);
  assert.match(feed, /New flag x/);
  assert.match(feed, /ai-assistant:ask/);
  assert.match(feed, /Demo 1 → 2/);
  assert.match(feed, /Local build v1 → v2/);
});
