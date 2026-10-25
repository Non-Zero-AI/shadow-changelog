# Agents working on Shadow Log

Shadow Log (`shadow-log`) diffs two builds of a desktop or Electron app and reports URLs, feature flags, telemetry, IPC, dependencies, and UI strings with file and line evidence.

## Layout

- `bin/shadow-log.js` — CLI entry. `src/cli.js` — `apps`, `versions`, `fetch`, `diff`, `latest`, `rss`.
- `src/adapters/` — where a release is downloaded. `local` reads a path. Register new apps in `src/adapters/index.js`.
- `src/extractors/` — regex passes. `record()` in `common.js` stores `{ file, line, snippet }`.
- `src/snapshot.js` — unpack, beautify, run extractors, cache `snapshot.json`.
- `src/diff.js` — compare snapshots, score, pick notable findings (`CATEGORY_INFO`, `topFindings`).
- `src/report/markdown.js` — human report. `src/report/json.js` — `--json` report (`SCHEMA_VERSION`). `src/report/rss.js` — `reports/feed.xml`.
- `schema/report.schema.json` — JSON Schema for that report.
- `test/*.test.js` — offline tests. `SKILL.md` — instructions for agents that run the tool.

## Tests

```bash
npm test
```

That is `node --test test/*.test.js`. The shell expands the glob, so Node receives a file list. Do not pass the directory: on Node 22, `node --test test/` tries to import `test/` and fails with `MODULE_NOT_FOUND`. Node 20 and Node 22 both pass the file list.

Node 20 or newer. Tests stay offline. Set `SHADOW_CACHE` to a temp directory and `SHADOW_QUIET=1` before importing `src/cli.js` (`CACHE_DIR` is read at import). New test files must match `test/*.test.js`.

## Style

ESM, semicolons, 2-space indent. Small functions, no classes. Comments say why. Extractors stay regex and string passes. `log()` writes to stderr and honors `SHADOW_QUIET`. Human output goes to stdout; with `--json`, stdout is only the JSON document.

## Add a detector or category

1. Add `src/extractors/<name>.js`. Record hits with `record()` so each value keeps a file, a line, and a snippet.
2. Call it from `buildSnapshot` in `src/snapshot.js`, store the Map on `categories`, and bump `SNAPSHOT_VERSION` so old caches rebuild.
3. Add the category to `CATEGORY_INFO` in `src/diff.js` (title and base score). `diffSnapshots` and `summary.counts` follow that list. File inventory is the separate `files` bucket.
4. Add a `describe()` case in `src/report/markdown.js` when the default prose title would be wrong.
5. Extend `test/e2e.test.js` or `test/json.test.js` with a synthetic bundle that should surface the new hit.

A new category id shows up in `findings` on its own. Renaming a field, removing one, or changing what a value means is a shape change: bump `SCHEMA_VERSION` in `src/report/json.js` and update `schema/report.schema.json` in the same change. `npm test` checks that the schema's `schemaVersion` const matches the code.

## JSON output

`--json` and the `.json` file next to the Markdown report are the same document (`schemaVersion` 1). Keep the schema file and `SCHEMA_VERSION` in sync. Reports checked in before that schema have no `schemaVersion`; `rss` still reads them. Do not hand-edit those samples into the new shape.
