# Shadow Log

Formerly Shadow Changelog.

**What did that update actually change?**

Release notes are marketing copy. The shipped bundle is the real story. Shadow Log downloads two consecutive **public** releases of a desktop app (Electron first), diffs what's inside them, and writes a readable Markdown report covering:

- new or removed **feature flags and experiment-like identifiers**
- **endpoints, API paths and domains** the app references
- **telemetry and analytics** SDKs, hosts and event calls
- new **Electron IPC channels** and protocol handlers
- new or bumped **dependencies and bundled libraries**, including ones **shipped before anything uses them**
- new **UI strings**, grouped by feature, flagged when no code references them yet (unreleased UI)
- **wording changes** in the UI (e.g. "Requires an Obsidian account." → "Requires a paid subscription.")
- **removals**: commands, strings, domains, files

Every claim cites **file, line and a short snippet** so anyone can verify it. Each top finding is also **checked against the vendor's own release notes**, so you can tell "announced" from "shipped quietly".

### Example: Obsidian 1.14.5

The official 1.14.5 notes say only: *"This release updates Electron from 43.7.5 to 43.8.3."*
Shadow Log found the app bundle also gained `lib/pele.min.js` (683 KB, `Pele 1.8.0 | MIT License`). No app code references it yet. Pele is the Mermaid replacement first announced in the **1.15.0 Catalyst (early-access)** notes, so the public build is pre-staging next release's renderer.
→ [`reports/obsidian-1.14.4-to-1.14.5.md`](reports/obsidian-1.14.4-to-1.14.5.md) · bigger diff: [`reports/obsidian-1.13.7-to-1.14.4.md`](reports/obsidian-1.13.7-to-1.14.4.md)

## Install

```bash
git clone https://github.com/Non-Zero-AI/shadow-log && cd shadow-log
npm install
node bin/shadow-log.js --help      # or: npm link && shadow-log --help
```

Requires Node 20+. Optional: `dpkg-deb` for `.deb` inputs, `tar` for tarballs.

## Usage

```bash
shadow-log apps                                  # list adapters
shadow-log versions obsidian                     # public versions the adapter can fetch
shadow-log fetch obsidian 1.14.5                 # download + unpack + extract (cached in .cache/)
shadow-log diff obsidian@1.14.4 obsidian@1.14.5  # write reports/obsidian-1.14.4-to-1.14.5.md (+ .json, feed.xml)
shadow-log diff ./old/app.asar ./new/app.asar    # any local .asar / .asar.gz / .tar.gz / .deb / .zip / directory
shadow-log latest obsidian                       # diff the two newest versions (no-op if already reported)
shadow-log rss --base-url https://example.com/reports
```

Options: `--out <dir>`, `--top <n>`, `--force` (rebuild snapshots), `--no-notes` (skip release-notes cross-check), `--no-llm`.

Evidence line numbers refer to the js-beautify output in `.cache/<app>/<version>/pretty/<file>`, so you can open the exact line yourself.

### Optional LLM summary

If `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is **already set** in the environment, the report gets a short summary written from the extracted findings (only finding titles, UI strings and short evidence snippets are sent, never whole files). Without a key, the report is fully deterministic. `--no-llm` turns it off.

## How it works

```
adapter.fetch(version) → unpack (asar/tar/deb/zip) → inventory + sha256
  → beautify first-party JS → extractors (urls, flags, config keys, ipc, telemetry, commands, deps, i18n)
  → snapshot.json (cached) → diff two snapshots → score → cross-check official notes → Markdown/JSON/RSS
```

- **Adapters** (`src/adapters/`) know where an app publishes releases. `obsidian` uses the `obsidian-<ver>.asar.gz` asset on `obsidianmd/obsidian-releases`. `github-electron.js` is a small factory for any app that ships release assets on GitHub (see the `logseq` and `obsidian-full` examples, which haven't been tested yet). `local` takes a path.
- **Extractors** (`src/extractors/`) are plain regex/AST-free passes over text. They're fast, but heuristic.
- **Scoring** (`src/diff.js`) favors telemetry, endpoints, IPC, flags, clusters of new UI strings, dormant new files and sensitive wording changes (account, subscription, pricing…). Vendor code is down-weighted.

### Adding an app

```js
// src/adapters/index.js
myapp: githubElectron({ id: 'myapp', name: 'My App', repo: 'org/myapp', asset: v => `MyApp-${v}-linux-x64.tar.gz` }),
```

For apps that don't publish on GitHub, write a module with `listVersions()` and `fetch(version, dir)` (see `obsidian.js`). Optional hooks: `i18n(rootDir)` for custom string tables and `officialNotes()` returning `[{version, text, url}]` for the release-notes cross-check.

## Run it on a schedule

`.github/workflows/shadow-log.yml` runs every 6 hours. It diffs the newest pair for each app in the matrix, commits `reports/*.md|json`, and rebuilds `reports/feed.xml`, so people can subscribe to "what changed" for their favorite apps.

## Ethics and legal

- **Public artifacts only.** It downloads the same release files the vendor offers to everyone, unmodified.
- **No circumvention.** It doesn't touch DRM, licensing checks, encryption, obfuscation-removal services or anti-tamper. Apps that encrypt or sign-lock their bundles are out of scope. Electron `.asar` is a plain archive format.
- **Facts, not code.** Reports quote short snippets (≤160 chars) as evidence for commentary and interoperability research. They don't republish source files. Don't commit `.cache/` (it's in `.gitignore`).
- **Heuristic, not accusation.** A string in a bundle proves the code shipped, not that a feature is live, enabled or coming. "Not in the official notes" means a text search didn't find it, nothing more. Write findings up that way.
- Check the app's EULA. Some licenses restrict reverse engineering, and the law varies by country (in the EU and US, interoperability and research carve-outs usually cover this kind of static inspection). If in doubt, analyze open-source apps.

## Limitations

- Static string analysis only: dynamically built keys/URLs are missed, and some unreferenced-string flags are false positives.
- Release-notes cross-check is a normalized substring match, so it can miss rewordings or match a common word.
- Only Obsidian is tested end to end. Native modules and binaries (`.node`, `.dll`) are inventoried but not analyzed.
- Electron-specific extractors (IPC). Other stacks still get URLs, strings, deps and files.

## Tests

```bash
npm test   # offline end-to-end test on synthetic bundles + parser tests
```

MIT licensed.
