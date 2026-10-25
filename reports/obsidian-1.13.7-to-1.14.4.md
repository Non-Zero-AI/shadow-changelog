# Shadow Changelog: Obsidian 1.13.7 → 1.14.4

> What the update actually changed, read from the shipped code of two public releases. Every item cites the file and line (in the js-beautify output) where it was found. Automated heuristics: "possible", not "confirmed".

| | old | new |
|---|---|---|
| version | 1.13.7 | 1.14.4 |
| released | 2026-08-12 | 2026-10-05 |
| artifact | https://github.com/obsidianmd/obsidian-releases/releases/download/v1.13.7/obsidian-1.13.7.asar.gz | https://github.com/obsidianmd/obsidian-releases/releases/download/v1.14.4/obsidian-1.14.4.asar.gz |
| files in bundle | 358 | 368 |

Official notes: https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.14.4 · https://obsidian.md/changelog/

**Release-notes cross-check:** 2 of the 12 top findings checked were not found in the official notes for 1.13.7→1.14.4. The check is a plain-text match and can miss reworded announcements.

Generated 2026-10-25T15:14:55.558Z by shadow-changelog 0.1.0.

## At a glance

| category | added | removed | changed |
|---|---:|---:|---:|
| Telemetry, analytics & tracking | 0 | 0 |  |
| API endpoints (paths) | 0 | 0 |  |
| Contacted / referenced domains | 0 | 1 |  |
| Electron IPC channels & protocols | 2 | 0 |  |
| Feature-flag / experiment-like identifiers | 0 | 0 |  |
| Settings, config & storage keys | 1 | 1 |  |
| Commands | 5 | 1 |  |
| UI strings (localization) | 33 | 19 | 4 |
| Dependencies & bundled libraries | 0 | 0 |  |
| Full URLs | 4 | 24 |  |
| Files in bundle | 36 | 26 | 54 |

## Top findings

### 1. New UI string group `plugins.bases.kanban` (9 strings)

*Score 71 · 9 new UI strings under one prefix · keywords: kanban*

Official notes: mentioned (matched "kanban" in the 1.14.4 (public) notes)

- `plugins.bases.kanban.actionChooseProperty` = "Choose property"
- `plugins.bases.kanban.actionEditColumns` = "Edit groups..."
- `plugins.bases.kanban.actionHideColumn` = "Hide column"
- `plugins.bases.kanban.labelColumnWidth` = "Column width"
- `plugins.bases.kanban.name` = "Kanban"
- `plugins.bases.kanban.textNoColumns` = "Select groups to show as columns."
- `plugins.bases.kanban.textNoGroupBy` = "Choose a property to group by."
- `plugins.bases.kanban.titleNoColumns` = "No columns"
- `plugins.bases.kanban.titleNoGroupBy` = "Add columns"

Evidence: `i18n.js` in the new build.

### 2. Removed UI string group `plugins.markdownFormatImporter` (15 strings)

*Score 58 · 15 UI strings under one prefix were removed*

Official notes: mentioned (matched "format converter" in the 1.14.4 (public) notes)

- `plugins.markdownFormatImporter.actionOpen` = "Open format converter"
- `plugins.markdownFormatImporter.desc` = "Convert Markdown from other apps to Obsidian format."
- `plugins.markdownFormatImporter.labelTotalReplacements` = "Total replacements"
- `plugins.markdownFormatImporter.optionBearHighlightFixer` = "Bear highlight fixer"
- `plugins.markdownFormatImporter.optionBearHighlightFixerDescription` = "Converts “::highlight::” to “==highlight==”."
- `plugins.markdownFormatImporter.optionRoamHighlightFixer` = "Roam Research highlight fixer"
- `plugins.markdownFormatImporter.optionRoamHighlightFixerDescription` = "Converts “^^highlight^^” to “==highlight==”."
- `plugins.markdownFormatImporter.optionRoamTagFixer` = "Roam Research tag fixer"
- `plugins.markdownFormatImporter.optionRoamTagFixerDescription` = "Converts “#tag” and “#[[tag]]” to “[[tag]]”."
- `plugins.markdownFormatImporter.optionRoamTodoConverter` = "Roam Research TODO converter"
- …and 5 more (see UI strings section)

Evidence: `i18n.js` in the old build.

### 3. New code file `quicklook.js` (663.2 KB)

*Score 50 · new first-party code file · referenced from main.js, quicklook/index.html*

Official notes: mentioned (matched "quicklook" in the 1.14.4 (public) notes)

Evidence: file `quicklook.js` (679096 bytes) exists in the new build and not in the old one. Referenced from `main.js`, `quicklook/index.html`.

### 4. New UI string group `interface.formatting.highlightColor` (6 strings)

*Score 49 · 6 new UI strings under one prefix*

Official notes: mentioned (matched "highlightColor" in the 1.14.4 (public) notes)

- `interface.formatting.highlightColor.blue` = "Blue"
- `interface.formatting.highlightColor.green` = "Green"
- `interface.formatting.highlightColor.orange` = "Orange"
- `interface.formatting.highlightColor.purple` = "Purple"
- `interface.formatting.highlightColor.red` = "Red"
- `interface.formatting.highlightColor.yellow` = "Yellow"

Evidence: `i18n.js` in the new build.

### 5. New UI string group `plugins.bases` (6 strings)

*Score 49 · 6 new UI strings under one prefix*

Official notes: mentioned (matched "Add group" in the 1.14.4 (public) notes)

- `plugins.bases.actionAddGroup` = "Add group"
- `plugins.bases.labelDisplay` = "Display"
- `plugins.bases.labelGroup` = "Group"
- `plugins.bases.labelResults` = "Results"
- `plugins.bases.labelSortManual` = "Manual"
- `plugins.bases.msgErrorUnknownPropertyType` = "Unknown property type: {{ type }}"

Evidence: `i18n.js` in the new build.

### 6. UI text changed: `interface.startScreen.mobile.labelSyncPro3`

*Score 48 · keywords: sync, subscription · wording change touches: account, subscription*

Official notes: not found in the notes for 1.13.7→1.14.4 (searched for: "Requires a paid subscription.")

- before: "Requires an Obsidian account."
- after: "Requires a paid subscription."

Evidence: `i18n.js` in both builds.

### 7. New IPC channel `latest-public-version` (renderer, sendSync)

*Score 45 · Electron IPC channels & protocols*

Official notes: not found in the notes for 1.13.7→1.14.4 (searched for: "latest public version")

Evidence:
- `main.js:5284` → `}), l.ipcMain.on("latest-public-version", o => {`
- `app.js:136441` → `var n = t.ipcRenderer.sendSync("latest-public-version");`

### 8. New IPC channel `open-file` (renderer, send)

*Score 45 · Electron IPC channels & protocols*

Official notes: mentioned (matched "open file" in the 1.14.4 (public) notes)

Evidence:
- `main.js:5441` → `}), l.ipcMain.on("open-file", async (o, i) => {`
- `app.js:148850` → `activeWindow.electron.ipcRenderer.send("open-file", t)`

### 9. New code file `quicklook/index.html` (0.6 KB)

*Score 45 · new first-party code file · referenced from app.js, main.js, package.json*

Official notes: mentioned (matched "quicklook" in the 1.14.4 (public) notes)

Evidence: file `quicklook/index.html` (595 bytes) exists in the new build and not in the old one. Referenced from `app.js`, `main.js`, `package.json`.

### 10. New UI string group `commands` (4 strings)

*Score 41 · 4 new UI strings under one prefix*

Official notes: mentioned (matched "Decrease font size" in the 1.14.4 (public) notes)

- `commands.decreaseFontSize` = "Decrease font size"
- `commands.increaseFontSize` = "Increase font size"
- `commands.openFile` = "Open file from outside the vault..."
- `commands.toggleHighlightColor` = "Toggle {{color, lowercase}} highlight"

Evidence: `i18n.js` in the new build.

### 11. New command `app:decrease-font-size`

*Score 35 · Commands*

Official notes: mentioned (matched "decrease font size" in the 1.14.4 (public) notes)

Evidence:
- `app.js:148834` → `id: "app:decrease-font-size",`

### 12. New command `app:increase-font-size`

*Score 35 · Commands*

Official notes: mentioned (matched "increase font size" in the 1.14.4 (public) notes)

Evidence:
- `app.js:148828` → `id: "app:increase-font-size",`

## New UI string groups

Strings are grouped by key prefix. Groups whose strings no first-party code references yet are candidates for unreleased features.

| group | new strings | unreferenced | sample |
|---|---:|---:|---|
| `plugins.bases.kanban` | 9 | 0 | "Choose property" |
| `interface.formatting.highlightColor` | 6 | 0 | "Blue" |
| `plugins.bases` | 6 | 0 | "Add group" |
| `commands` | 4 | 0 | "Decrease font size" |
| `setting.account` | 1 | 0 | "Log in to Obsidian" |
| `setting.mobileToolbar` | 2 | 0 | "Take photo" |
| `dialogue` | 1 | 0 | "Obsidian can’t open “.{{extension}}” files." |
| `interface.formatting` | 1 | 0 | "Default" |
| `interface` | 1 | 0 | "Failed to export “{{filename}}”" |
| `main` | 1 | 0 | "Supported files" |
| `menuItems` | 1 | 0 | "Open File..." |

## Details by category

### Contacted / referenced domains

<details><summary>Removed (1)</summary>

| score | removed | evidence |
|---:|---|---|
| 31 | `help.obsidian.md` | `app.js:51520` → `window.open("https://help.obsidian.md/sync-notes", "_blank")` |

</details>

### Electron IPC channels & protocols

<details open><summary>Added (2)</summary>

| score | added | evidence |
|---:|---|---|
| 45 | `latest-public-version` | `main.js:5284` → `}), l.ipcMain.on("latest-public-version", o => {` |
| 45 | `open-file` | `main.js:5441` → `}), l.ipcMain.on("open-file", async (o, i) => {` |

</details>

### Settings, config & storage keys

<details open><summary>Added (1)</summary>

| score | added | evidence |
|---:|---|---|
| 30 | `base-font-size` | `app.js:149324` → `this.saveLocalStorage("base-font-size", Math.clamp(e, 10, 30)), this.updateFontSize()` |

</details>

<details><summary>Removed (1)</summary>

| score | removed | evidence |
|---:|---|---|
| 21 | `spellcheckLanguages` | `app.js:147072` → `this.vault.getConfig("spellcheckLanguages") && this.vault.setConfig("spellcheckLanguages", null), e && e.length > 0 ? localStorage.setItem("spellcheck-languages…` |

</details>

### Commands

<details open><summary>Added (5)</summary>

| score | added | evidence |
|---:|---|---|
| 35 | `app:decrease-font-size` | `app.js:148834` → `id: "app:decrease-font-size",` |
| 35 | `app:increase-font-size` | `app.js:148828` → `id: "app:increase-font-size",` |
| 35 | `app:migrate-frontmatter` | `app.js:148815` → `id: "app:migrate-frontmatter",` |
| 35 | `app:open-file` | `app.js:148846` → `id: "app:open-file",` |
| 35 | `editor:toggle-highlight-` | `app.js:79646` → `id: "editor:toggle-highlight-".concat(e),` |

</details>

<details><summary>Removed (1)</summary>

| score | removed | evidence |
|---:|---|---|
| 25 | `markdown-importer:open` | `app.js:130854` → `id: "markdown-importer:open",` |

</details>

### UI strings (localization)

<details open><summary>Added (33)</summary>

| score | added | evidence |
|---:|---|---|
| 30 | `plugins.bases.kanban.actionChooseProperty` | "Choose property" |
| 30 | `plugins.bases.kanban.actionEditColumns` | "Edit groups..." |
| 30 | `plugins.bases.kanban.actionHideColumn` | "Hide column" |
| 30 | `plugins.bases.kanban.labelColumnWidth` | "Column width" |
| 30 | `plugins.bases.kanban.name` | "Kanban" |
| 30 | `plugins.bases.kanban.textNoColumns` | "Select groups to show as columns." |
| 30 | `plugins.bases.kanban.textNoGroupBy` | "Choose a property to group by." |
| 30 | `plugins.bases.kanban.titleNoColumns` | "No columns" |
| 30 | `plugins.bases.kanban.titleNoGroupBy` | "Add columns" |
| 30 | `setting.account.titleLogIn` | "Log in to Obsidian" |
| 30 | `setting.mobileToolbar.optionAttachCamera` | "Take photo" |
| 15 | `commands.decreaseFontSize` | "Decrease font size" |
| 15 | `commands.increaseFontSize` | "Increase font size" |
| 15 | `commands.openFile` | "Open file from outside the vault..." |
| 15 | `commands.toggleHighlightColor` | "Toggle {{color, lowercase}} highlight" |
| 15 | `dialogue.msgUnsupportedFileType` | "Obsidian can’t open “.{{extension}}” files." |
| 15 | `interface.formatting.highlightColor.blue` | "Blue" |
| 15 | `interface.formatting.highlightColor.green` | "Green" |
| 15 | `interface.formatting.highlightColor.orange` | "Orange" |
| 15 | `interface.formatting.highlightColor.purple` | "Purple" |
| 15 | `interface.formatting.highlightColor.red` | "Red" |
| 15 | `interface.formatting.highlightColor.yellow` | "Yellow" |
| 15 | `interface.formatting.highlightColorDefault` | "Default" |
| 15 | `interface.msgFailedToExport` | "Failed to export “{{filename}}”" |
| 15 | `main.supportedFiles` | "Supported files" |
| 15 | `menuItems.openFile` | "Open File..." |
| 15 | `plugins.bases.actionAddGroup` | "Add group" |
| 15 | `plugins.bases.labelDisplay` | "Display" |
| 15 | `plugins.bases.labelGroup` | "Group" |
| 15 | `plugins.bases.labelResults` | "Results" |
| 15 | `plugins.bases.labelSortManual` | "Manual" |
| 15 | `plugins.bases.msgErrorUnknownPropertyType` | "Unknown property type: {{ type }}" |
| 15 | `setting.mobileToolbar.optionAttachFile` | "Choose file" |

</details>

<details><summary>Removed (19)</summary>

| score | removed | evidence |
|---:|---|---|
| 11 | `interface.emptyState.createNewFile` | "Create new note" |
| 11 | `interface.window.goBack` | "Go back" |
| 11 | `interface.window.goForward` | "Go forward" |
| 11 | `plugins.bases.labelViewTypeTable` | "Table" |
| 11 | `plugins.markdownFormatImporter.actionOpen` | "Open format converter" |
| 11 | `plugins.markdownFormatImporter.desc` | "Convert Markdown from other apps to Obsidian format." |
| 11 | `plugins.markdownFormatImporter.labelTotalReplacements` | "Total replacements" |
| 11 | `plugins.markdownFormatImporter.optionBearHighlightFixer` | "Bear highlight fixer" |
| 11 | `plugins.markdownFormatImporter.optionBearHighlightFixerDescription` | "Converts “::highlight::” to “==highlight==”." |
| 11 | `plugins.markdownFormatImporter.optionRoamHighlightFixer` | "Roam Research highlight fixer" |
| 11 | `plugins.markdownFormatImporter.optionRoamHighlightFixerDescription` | "Converts “^^highlight^^” to “==highlight==”." |
| 11 | `plugins.markdownFormatImporter.optionRoamTagFixer` | "Roam Research tag fixer" |
| 11 | `plugins.markdownFormatImporter.optionRoamTagFixerDescription` | "Converts “#tag” and “#[[tag]]” to “[[tag]]”." |
| 11 | `plugins.markdownFormatImporter.optionRoamTodoConverter` | "Roam Research TODO converter" |
| 11 | `plugins.markdownFormatImporter.optionRoamTodoConverterDescription` | "Converts “{{[[TODO]]}}” to “[ ]”." |
| 11 | `plugins.markdownFormatImporter.zettelkastenLinkBeautifier` | "Zettelkasten link beautifier" |
| 11 | `plugins.markdownFormatImporter.zettelkastenLinkBeautifierDescription` | "Fixes “[[UID]]” links and also beautify them “[[UID File Name\|File Name]]”." |
| 11 | `plugins.markdownFormatImporter.zettelkastenLinkFixer` | "Zettelkasten link fixer" |
| 11 | `plugins.markdownFormatImporter.zettelkastenLinkFixerDescription` | "Fixes “[[UID]]” links to full “[[UID File Name]]”." |

</details>

<details><summary>Changed (4)</summary>

| key | before | after |
|---|---|---|
| `interface.startScreen.mobile.labelSyncPro3` | "Requires an Obsidian account." | "Requires a paid subscription." |
| `dialogue.labelPermanentDelete` | "The file will be permanent deleted." | "The file will be permanently deleted." |
| `interface.starterContent.welcomeFileContent` | "This is your new *vault*.

Make a note of something, [[create a link]], or try [" | "This is your new *vault*.

Make a note of something, [[create a link]], or try [" |
| `setting.account.buttonLogin` | "Login" | "Log in" |

</details>

### Full URLs

<details open><summary>Added (4)</summary>

| score | added | evidence |
|---:|---|---|
| 20 | `https://obsidian.md/` | `help.js:333` → `M = "en" === t ? "https://obsidian.md/help" : "https://obsidian.md/".concat(t, "/help"),` |
| 20 | `https://obsidian.md/$` | `main.js:3776` → `` u = a === "en" ? "https://obsidian.md/help" : `https://obsidian.md/${a}/help`, `` |
| 20 | `https://obsidian.md/changelog/desktop/` | `app.js:110569` → `t = "https://obsidian.md/changelog/desktop/".concat(e, ".md"), i.label = 1;` |
| 20 | `https://obsidian.md/help` | `main.js:3776` → `` u = a === "en" ? "https://obsidian.md/help" : `https://obsidian.md/${a}/help`, `` |

</details>

<details><summary>Removed (24)</summary>

| score | removed | evidence |
|---:|---|---|
| 25 | `http://obsidian.md/account` | `app.js:134309` → `return window.open("http://obsidian.md/account", "_blank")` |
| 25 | `https://help.obsidian.md/Catalyst+license` | `app.js:133814` → `href: "https://help.obsidian.md/Catalyst+license",` |
| 25 | `https://help.obsidian.md/cli` | `app.js:133662` → `href: "https://help.obsidian.md/cli",` |
| 25 | `https://help.obsidian.md/Commercial+license` | `app.js:133997` → `href: "https://help.obsidian.md/Commercial+license",` |
| 25 | `https://help.obsidian.md/Obsidian+Publish/Set+up+a+custom+domain` | `app.js:135549` → `link: '<a href="https://help.obsidian.md/Obsidian+Publish/Set+up+a+custom+domain" target="_blank">'.concat(Uee.labelCustomDomainLinkName(), "</a>")` |
| 25 | `https://help.obsidian.md/sync-notes` | `app.js:51520` → `window.open("https://help.obsidian.md/sync-notes", "_blank")` |
| 25 | `https://help.obsidian.md/sync/migrate` | `app.js:137627` → `href: "https://help.obsidian.md/sync/migrate",` |
| 25 | `https://help.obsidian.md/sync/switch` | `app.js:136773` → `href: "https://help.obsidian.md/sync/switch",` |
| 25 | `https://help.obsidian.md/sync/troubleshoot` | `app.js:139669` → `…ming Sync may delete all files from your remote vault. See https://help.obsidian.md/sync/troubleshoot for more details.")), a = (o = this).serverFiles, s = o.lo…` |
| 25 | `https://obsidian.md/account` | `app.js:133807` → `window.open("https://obsidian.md/account")` |
| 25 | `https://obsidian.md/auth` | `app.js:137087` → `url: "https://obsidian.md/auth#signup"` |
| 25 | `https://obsidian.md/sync` | `app.js:137883` → `href: "https://obsidian.md/sync",` |
| 14 | `https://help.obsidian.md/` | `main.js:4737` → `click: () => l.shell.openExternal("https://help.obsidian.md/")` |
| 14 | `https://help.obsidian.md/bases/functions` | `app.js:97586` → `window.open("https://help.obsidian.md/bases/functions", "_blank")` |
| 14 | `https://help.obsidian.md/Extending+Obsidian/Obsidian+URI` | `app.js:143798` → `href: "https://help.obsidian.md/Extending+Obsidian/Obsidian+URI#Use+x-callback-url+parameters",` |
| 14 | `https://help.obsidian.md/Files+and+folders/How+Obsidian+stores+data` | `app.js:143818` → `href: "https://help.obsidian.md/Files+and+folders/How+Obsidian+stores+data#Metadata+cache",` |
| 14 | `https://help.obsidian.md/plugin-security` | `app.js:142857` → `href: "https://help.obsidian.md/plugin-security",` |
| 14 | `https://help.obsidian.md/Plugins/Importer)!` | `main.js:1747` → `…te of something, [[create a link]], or try [the Importer](https://help.obsidian.md/Plugins/Importer)!` |
| 14 | `https://help.obsidian.md/Plugins/Search` | `app.js:104712` → `window.open("https://help.obsidian.md/Plugins/Search", "_blank")` |
| 14 | `https://help.obsidian.md/Translations` | `app.js:133565` → `href: "https://help.obsidian.md/Translations",` |
| 14 | `https://obsidian.md/changelog` | `app.js:133756` → `href: "https://obsidian.md/changelog",` |
| 14 | `https://obsidian.md/community` | `main.js:4734` → `click: () => l.shell.openExternal("https://obsidian.md/community")` |
| 14 | `https://obsidian.md/download` | `main.js:4036` → `… download the latest installer which includes better CLI support: https://obsidian.md/download"), W && l.app.dock.hide(), e.emit("disable", !0), e.emit("silence…` |
| 14 | `https://obsidian.md/help/snippets` | `app.js:142328` → `href: "https://obsidian.md/help/snippets",` |

</details>

## File changes

**Added:** `i18n/bg.txt` (152.9 KB), `i18n/el.txt` (156.1 KB), `i18n/gl.txt` (85.1 KB), `i18n/kab.txt` (82.8 KB), `i18n/km.txt` (199.6 KB), `i18n/sa.txt` (210.6 KB), `i18n/si.txt` (195.6 KB), `i18n/ta.txt` (209.6 KB), `lib/mathjax/mhchem-font-extension/chtml/woff2/mjx-mhc-m.woff2` (2.3 KB), `lib/mathjax/mhchem-font-extension/chtml/woff2/mjx-mhc-n.woff2` (0.9 KB), `lib/mathjax/obsidian-mathjax.js` (1.1 MB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-b.woff2` (18.9 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-bi.woff2` (1.4 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-brk.woff2` (1.0 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-c.woff2` (6.5 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-cb.woff2` (6.9 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-f.woff2` (5.8 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-fb.woff2` (6.0 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-i.woff2` (7.3 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-lo.woff2` (5.0 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-m.woff2` (8.4 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-mi.woff2` (9.4 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-n.woff2` (161.0 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-ob.woff2` (8.2 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-os.woff2` (8.0 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-s3.woff2` (2.5 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-s4.woff2` (4.3 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-so.woff2` (6.3 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-ss.woff2` (6.0 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-ssb.woff2` (4.8 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-ssi.woff2` (8.3 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-v.woff2` (6.6 KB), `lib/mathjax/tex-font/chtml/woff2/mjx-tex-zero.woff2` (0.9 KB), `quicklook/index.html` (0.6 KB), `quicklook.css` (114.3 KB), `quicklook.js` (663.2 KB)

**Removed:** `i18n/kh.txt` (200.5 KB), `lib/mathjax/output/chtml/fonts/tex.js` (102.3 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_AMS-Regular.woff` (39.9 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Calligraphic-Bold.woff` (9.7 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Calligraphic-Regular.woff` (9.4 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Fraktur-Bold.woff` (21.8 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Fraktur-Regular.woff` (21.0 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Main-Bold.woff` (33.7 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Main-Italic.woff` (20.3 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Main-Regular.woff` (33.4 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Math-BoldItalic.woff` (19.3 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Math-Italic.woff` (18.9 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Math-Regular.woff` (18.8 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_SansSerif-Bold.woff` (15.6 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_SansSerif-Italic.woff` (14.3 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_SansSerif-Regular.woff` (12.4 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Script-Regular.woff` (11.6 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Size1-Regular.woff` (5.7 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Size2-Regular.woff` (5.3 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Size3-Regular.woff` (3.2 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Size4-Regular.woff` (5.0 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Typewriter-Regular.woff` (17.2 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Vector-Bold.woff` (1.1 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Vector-Regular.woff` (1.1 KB), `lib/mathjax/output/chtml/fonts/woff-v2/MathJax_Zero.woff` (1.3 KB), `lib/mathjax/tex-chtml-full.js` (1.3 MB)

<details><summary>Changed (54)</summary>

| file | before | after | Δ bytes |
|---|---:|---:|---:|
| `app.js` | 3.7 MB | 3.8 MB | +65667 |
| `app.css` | 622.2 KB | 652.6 KB | +31133 |
| `help.js` | 368.5 KB | 389.8 KB | +21808 |
| `starter.js` | 430.5 KB | 450.6 KB | +20540 |
| `main.js` | 195.0 KB | 198.9 KB | +3972 |
| `i18n/th.txt` | 177.7 KB | 176.6 KB | -1127 |
| `lib/codemirror/markdown.js` | 43.0 KB | 44.0 KB | +974 |
| `i18n/ne.txt` | 205.3 KB | 204.3 KB | -953 |
| `i18n/ka.txt` | 202.1 KB | 201.2 KB | -944 |
| `i18n/fa.txt` | 130.1 KB | 129.2 KB | -886 |
| `i18n/ru.txt` | 147.6 KB | 146.7 KB | -861 |
| `i18n/zh.txt` | 70.0 KB | 69.3 KB | -793 |
| `i18n/tr.txt` | 85.1 KB | 84.4 KB | -709 |
| `i18n/am.txt` | 125.2 KB | 124.6 KB | -688 |
| `i18n/bn.txt` | 188.6 KB | 188.0 KB | -685 |
| `i18n/uk.txt` | 141.0 KB | 140.4 KB | -682 |
| `i18n/vi.txt` | 101.8 KB | 101.1 KB | -673 |
| `i18n/fr.txt` | 92.2 KB | 92.8 KB | +670 |
| `i18n/ko.txt` | 94.5 KB | 93.8 KB | -654 |
| `i18n/zh-TW.txt` | 68.8 KB | 68.2 KB | -642 |
| `i18n/fi.txt` | 81.0 KB | 80.4 KB | -622 |
| `i18n/be.txt` | 142.3 KB | 141.7 KB | -616 |
| `i18n/hu.txt` | 94.6 KB | 94.0 KB | -601 |
| `i18n/ja.txt` | 111.0 KB | 110.4 KB | -588 |
| `i18n/ga.txt` | 88.2 KB | 87.6 KB | -578 |
| `i18n/es.txt` | 86.9 KB | 86.4 KB | -576 |
| `i18n/ar.txt` | 116.6 KB | 116.0 KB | -574 |
| `i18n/ms.txt` | 79.0 KB | 78.5 KB | -569 |
| `i18n/en-GB.txt` | 6.9 KB | 7.4 KB | +564 |
| `i18n/da.txt` | 75.3 KB | 74.8 KB | -547 |
| `i18n/ro.txt` | 91.4 KB | 90.9 KB | -535 |
| `i18n/ca.txt` | 88.3 KB | 87.8 KB | -531 |
| `i18n/uz.txt` | 87.0 KB | 86.4 KB | -531 |
| `i18n/pt-BR.txt` | 84.1 KB | 83.6 KB | -523 |
| `i18n/pt.txt` | 84.5 KB | 84.0 KB | -522 |
| `i18n/sq.txt` | 90.2 KB | 89.7 KB | -522 |
| `i18n/id.txt` | 77.3 KB | 76.8 KB | -514 |
| `i18n/it.txt` | 83.4 KB | 82.9 KB | -501 |
| `i18n/sr.txt` | 137.8 KB | 137.3 KB | -495 |
| `worker.js` | 233.7 KB | 234.2 KB | +494 |
| `i18n/nl.txt` | 82.2 KB | 81.7 KB | -486 |
| `i18n/no.txt` | 75.2 KB | 74.7 KB | -480 |
| `i18n/he.txt` | 103.1 KB | 102.6 KB | -477 |
| `i18n/de.txt` | 88.7 KB | 88.2 KB | -475 |
| `i18n/cs.txt` | 85.2 KB | 84.8 KB | -411 |
| `i18n/lv.txt` | 84.9 KB | 84.5 KB | -404 |
| `i18n/sk.txt` | 87.5 KB | 87.1 KB | -366 |
| `lib/codemirror/vim.js` | 243.4 KB | 243.1 KB | -289 |
| `i18n/sv.txt` | 78.6 KB | 78.3 KB | -281 |
| `i18n/mapping.txt` | 96.5 KB | 96.3 KB | -192 |
| `enhance.js` | 13.0 KB | 12.9 KB | -117 |
| `i18n/pl.txt` | 83.8 KB | 83.9 KB | +62 |
| `i18n.js` | 129.9 KB | 129.9 KB | -17 |
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
- JavaScript is beautified with js-beautify; line numbers refer to that output so anyone can reproduce them (`shadow-changelog fetch` + open `.cache/<app>/<ver>/pretty/<file>`).
- Findings come from static string/pattern extraction. A new string proves the code shipped, not that the feature is turned on, reachable, or will launch.
- "Unreferenced" UI strings: no first-party code token matches the key name. Keys built dynamically can show up as false positives.
- Third-party library code is marked _(vendor)_ and down-weighted.
- "Official notes" lines compare each finding against the vendor's published release notes with a plain-text search. "Not found" means the search terms did not appear, not that the vendor hid anything.
- Snippets are short excerpts for verification (commentary/reporting), not redistributions of the code.
