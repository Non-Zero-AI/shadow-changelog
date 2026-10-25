# Shadow Log: Obsidian 1.14.4 → 1.14.5

> What the update actually changed, read from the shipped code of two public releases. Every item cites the file and line (in the js-beautify output) where it was found. Automated heuristics: "possible", not "confirmed".

| | old | new |
|---|---|---|
| version | 1.14.4 | 1.14.5 |
| released | 2026-10-05 | 2026-10-22 |
| artifact | https://github.com/obsidianmd/obsidian-releases/releases/download/v1.14.4/obsidian-1.14.4.asar.gz | https://github.com/obsidianmd/obsidian-releases/releases/download/v1.14.5/obsidian-1.14.5.asar.gz |
| files in bundle | 368 | 369 |

Official notes: https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.14.5 · https://obsidian.md/changelog/

**Release-notes cross-check:** 1 of the 1 top findings checked were not found in the official notes for 1.14.4→1.14.5 (some show up only in notes for a *later* version). The check is a plain-text match and can miss reworded announcements.

Generated 2026-10-25T15:14:56.257Z by shadow-log 0.1.0.

## At a glance

| category | added | removed | changed |
|---|---:|---:|---:|
| Telemetry, analytics & tracking | 0 | 0 |  |
| API endpoints (paths) | 0 | 0 |  |
| Contacted / referenced domains | 0 | 0 |  |
| Electron IPC channels & protocols | 0 | 0 |  |
| Feature-flag / experiment-like identifiers | 0 | 0 |  |
| Settings, config & storage keys | 0 | 0 |  |
| Commands | 0 | 0 |  |
| UI strings (localization) | 0 | 0 |  |
| Dependencies & bundled libraries | 1 | 0 |  |
| Full URLs | 1 | 0 |  |
| Files in bundle | 1 | 0 | 2 |

## Top findings

### 1. New bundled library file `lib/pele.min.js` (683.3 KB), not referenced by app code

*Score 60 · new bundled library file · no first-party code references it by name (shipped but possibly not wired up yet)*

Official notes: **not in the notes for 1.14.4→1.14.5**; first appears in the 1.15.0 (catalyst) notes (matched "pele")

Evidence: file `lib/pele.min.js` (699670 bytes) exists in the new build and not in the old one. Header: `Pele 1.8.0 | MIT License | https://github.com/obsidianmd/pele` A search of every first-party JS/HTML/JSON file for its file name found no reference.

## Details by category

### Dependencies & bundled libraries

<details open><summary>Added (1)</summary>

| score | added | evidence |
|---:|---|---|
| 30 | `bundled:lib/pele.min.js (Pele)` | `lib/pele.min.js` → `bundled:lib/pele.min.js (Pele) 1.8.0` |

</details>

### Full URLs

<details open><summary>Added (1)</summary>

| score | added | evidence |
|---:|---|---|
| 5 | `https://github.com/obsidianmd/pele` _(vendor)_ | `lib/pele.min.js:1` → `/*! Pele 1.8.0 \| MIT License \| https://github.com/obsidianmd/pele */` |

</details>

## File changes

**Added:** `lib/pele.min.js` (683.3 KB)

<details><summary>Changed (2)</summary>

| file | before | after | Δ bytes |
|---|---:|---:|---:|
| `app.js` | 3.8 MB | 3.8 MB | +0 |
| `package.json` | 0.3 KB | 0.3 KB | +0 |

</details>

## Telemetry already present in both builds

Not new in this update, listed so readers know the baseline:

- `sdk:gtag` (`app.js:97765`)
- `event:js` (`app.js:97641`)
- `event:config` (`app.js:97641`)
- `event:event` (`app.js:97765`)
- `host:www.googletagmanager.com` (`app.js:97641`)
- `host:www.google-analytics.com` (`app.js:97643`)

## Method & caveats

- Inputs are the vendor's own public release artifacts, downloaded unmodified. No DRM, encryption, licensing or anti-tamper mechanism is touched.
- JavaScript is beautified with js-beautify; line numbers refer to that output so anyone can reproduce them (`shadow-log fetch` + open `.cache/<app>/<ver>/pretty/<file>`).
- Findings come from static string/pattern extraction. A new string proves the code shipped, not that the feature is turned on, reachable, or will launch.
- "Unreferenced" UI strings: no first-party code token matches the key name. Keys built dynamically can show up as false positives.
- Third-party library code is marked _(vendor)_ and down-weighted.
- "Official notes" lines compare each finding against the vendor's published release notes with a plain-text search. "Not found" means the search terms did not appear, not that the vendor hid anything.
- Snippets are short excerpts for verification (commentary/reporting), not redistributions of the code.
