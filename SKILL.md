---
name: shadow-log
description: >-
  Compare two versions of a desktop or Electron app to find what an update
  really changed beyond the release notes: hidden URLs, feature flags,
  telemetry, IPC channels, dependencies, and UI strings, with file and line
  evidence. Use when the user wants a diff of two builds, an asar, or
  consecutive public releases of an Electron or desktop app.
---

# Shadow Log

Shadow Log (`shadow-log`) diffs two builds of a desktop app (Electron first) and reports what the shipped files changed: endpoints, domains, feature-flag-like identifiers, telemetry, IPC channels, dependencies, UI strings, and new files. Every hit cites a file and, when the extractor has one, a line.

Release notes are not the source of truth. The report is static string matching. A string in a bundle means those bytes shipped. It does not mean a feature is enabled, reachable, or announced.

## Install

Node 20 or newer.

```bash
git clone https://github.com/Non-Zero-AI/shadow-log.git
cd shadow-log
npm install
npx shadow-log --help
```

`npx shadow-log` runs the local install. The package is not published to npm; clone the repo first. `node bin/shadow-log.js` is the same command.

## Commands

```bash
npx shadow-log apps
npx shadow-log versions obsidian
npx shadow-log diff obsidian@1.14.4 obsidian@1.14.5 --json --no-llm
npx shadow-log latest obsidian --json --no-llm
npx shadow-log diff ./old/app.asar ./new/app.asar --json --no-llm --no-notes
npx shadow-log diff ./old/unpacked ./new/unpacked --json --no-llm --no-notes
```

`<old>` and `<new>` are `app@version` (see `apps`) or a local path. Local inputs: directory, `.asar`, `.asar.gz`, `.tar.gz`, `.deb`, `.zip`.

Always pass `--json` (or `--format json`) when you will read the result. Stdout is one JSON document. Progress and errors go to stderr (`error: …`, exit code 1). Do not parse stderr. `--no-llm` skips the optional prose call even if an API key is set.

`--json` also writes `reports/<app>-<old>-to-<new>.md` and the same JSON beside it, plus `reports/feed.xml`. `--out <dir>` changes that directory. `--top <n>` caps the `notable` array (default 10). It does not cap `findings`.

Other flags: `--force` rebuilds cached snapshots, `--no-notes` skips the release-notes cross-check, `--base-url` is only for `rss`.

## Read the JSON report

Schema: `schema/report.schema.json`. `schemaVersion` is `1`. Ignore a report whose `schemaVersion` you do not know. Checked-in Obsidian samples from the initial commit have no `schemaVersion`; re-run the diff if you need the current shape.

| Field | Meaning |
|---|---|
| `tool.name` / `tool.version` | `shadow-log` and the package version that produced the report |
| `inputs.old` / `inputs.new` | `spec` (the argument you passed), `version`, and `path` when the input was a local build. `source` is the URL or artifact path. `files` is the unpacked file count |
| `summary.counts` | `{ added, removed, changed }` per category: `telemetry`, `apiPaths`, `domains`, `ipc`, `flags`, `configKeys`, `commands`, `i18n`, `deps`, `urls`, `files` |
| `findings` | Every extracted change, sorted by category, change, value |
| `notable` | Ranked subset, same items as the Markdown "Top findings" |
| `notes` | Release-note pages used for the cross-check. Omitted when notes were not loaded |
| `summary.llm` | Optional model prose. Unverified. Prefer `findings` |

Each finding:

- `category` — one of the count keys. `notable` may also use `i18n-cluster` for a group of new UI strings.
- `change` — `added`, `removed`, or `changed`.
- `value` — the identifier (channel, flag, domain, key, path, dependency name).
- `evidence` — array of `{ file, line, snippet }`. `line` is a 1-based line in the js-beautify output at `.cache/<app>/<version>/pretty/<file>`. `line` is omitted for `package.json` dependencies and locale JSON. Cite `file:line` when `line` is present, otherwise the file only.
- `officialStatus` on `notable` — `mentioned` (notes for this range), `later` (only a newer version's notes), `absent` (search terms not found). `absent` is a failed text search, not proof of concealment.
- `referenced: false` on a UI string — no first-party code token matched the key. Keys built at runtime are false positives.
- `vendorOnly: true` — the only hits were inside third-party code.
- `why` — scoring notes, such as a cosmetic wording change.

`findings` includes every URL and every UI string. `notable` drops raw URLs (domains cover them) and folds UI strings into clusters. Do not treat "missing from `notable`" as "not in the build".

## Summarize for a human

Lead with notable changes the release notes did not mention (`officialStatus` of `absent` or `later`), then the rest of `notable`. Name the category and the `value`. Cite evidence as `file:line` (or `file` when there is no line) and quote the short `snippet` when it helps. Give the `summary.counts` so the reader can see scale.

Say what the bytes show. "The new build contains the string `labs-ai-assistant`" is fair. "The AI assistant is now live" is not. A new unreferenced UI string is a candidate for unreleased UI, not a shipped feature. A new file nothing references is staged code, not proof it runs. Wording changes whose `why` starts with "cosmetic" are case or punctuation.

Skip `summary.llm` unless the user asked for prose, and if you include it, label it as unverified.

## Safety

- Analyze only builds the user legitimately obtained: a public release the vendor already publishes, or a file they gave you. Do not fetch private, leaked, or paid-only artifacts, and do not bypass login, DRM, licensing, encryption, or anti-tamper. If a bundle is encrypted or sign-locked, stop.
- The tool runs on the local machine. The only network is the existing adapter download of a public release, the existing official-notes fetch, and the optional LLM summary when a key is already in the environment. A path diff with `--no-notes` and `--no-llm` makes no network calls. Prefer `--no-llm` unless the user asked for a prose summary.
- Do not commit `.cache/`. Do not paste whole source files into the reply. Snippets in the report are already short on purpose.
