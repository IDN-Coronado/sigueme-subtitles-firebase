# Desktop migration plan

Moving apostello from a Firebase-hosted PWA to an Electron desktop console, with
local assets and local program/song/theme data.

**What stays on Firebase:** `caption/caption` (the audience broadcast — the
product) and `songs` as a read-only shared repository operators import from.
Everything else goes local.

**Order rationale:** most of the offline machinery in this repo exists only to
fake local files in a browser. The desktop move *deletes* it rather than porting
it. Doing local assets first would mean writing File System Access API plumbing
that Electron makes obsolete.

Steps 3 and 4 are independent of each other; both depend on 1. Step 2 depends
only on 1.

---

## Step 1 — Electron shell, Firebase untouched

**Goal:** `npm run desktop` opens the existing app in a desktop window and
everything behaves exactly as it does in the browser today. No data or asset
changes. This step is deliberately boring — it exists so every later step has a
known-good baseline.

### 1.1 How the renderer is served

The app uses `createBrowserRouter` ([App.jsx:29](../src/App.jsx#L29)) with real
paths, and Firebase Hosting rewrites `**` → `/index.html`
([firebase.json](../firebase.json)). Under `file://` both the router and the
rewrite break, and Firebase Auth has no usable origin.

Three options were considered:

| Option | Verdict |
|---|---|
| `createHashRouter` + `file://` | ❌ changes the deployed `/caption` URL the audience uses |
| Custom `app://` protocol | ❌ not an authorized domain for Firebase Auth |
| **Loopback HTTP server in main, serving `dist/`** | ✅ |

Serve `dist/` over `http://127.0.0.1:<port>` from the main process with
`node:http`. `localhost` is an authorized domain in Firebase Auth by default
(port is not matched), the router keeps working unchanged, and the SPA fallback
is the same one-liner Hosting does.

```js
// electron/server.js — ~20 lines
// Any path that isn't a real file falls back to index.html (mirrors the
// firebase.json "**" -> "/index.html" rewrite).
```

Bind to `127.0.0.1` only, never `0.0.0.0`. Pick a fixed port so the origin is
stable across launches (localStorage and BroadcastChannel are origin-scoped —
this matters in step 2).

### 1.2 Google sign-in — the one hard part

[AuthGate.jsx:34](../src/components/AuthGate.jsx#L34) uses `signInWithPopup`.
Google blocks OAuth in embedded user agents, and Electron's UA identifies as
one. Spoofing the UA to get around that is circumventing a stated policy — not
the plan.

The sanctioned path is RFC 8252 (*OAuth 2.0 for Native Apps*): sign in via the
user's real browser with a loopback redirect.

1. Create a **Desktop app** OAuth client in Google Cloud Console for the
   existing Firebase project.
2. Main process starts a one-shot loopback listener, builds the Google auth URL
   with PKCE, and calls `shell.openExternal(url)`.
3. User signs in in their real browser (usually already signed in — one click).
4. Google redirects to `http://127.0.0.1:<port>/callback?code=…`; main exchanges
   the code for an ID token.
5. Main sends the ID token to the renderer; renderer calls
   `signInWithCredential(auth, GoogleAuthProvider.credential(idToken))`.

`useAuthUser`, `useOperatorStatus`, and the approval gate are all untouched —
only the *acquisition* of the credential changes. `AuthGate`'s `onSignIn`
becomes a call to the bridge instead of `signInWithPopup`.

> Budget ~100 lines plus Cloud Console setup. This is the largest single risk in
> the whole migration. Do it first; if it stalls, nothing later is unblocked.

#### Google Cloud setup (manual, one time)

1. Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   with the **`siguemesubtitles`** project selected — the same project Firebase
   uses.
2. **Create Credentials → OAuth client ID**, application type **Desktop app**,
   name it `Apostello Desktop`.
3. Copy the **Client ID** and **Client secret** into `.env` (already gitignored)
   with no `VITE_` prefix, so they are read by the Electron main process and
   never inlined into the renderer bundle:

   ```
   GOOGLE_DESKTOP_CLIENT_ID=…apps.googleusercontent.com
   GOOGLE_DESKTOP_CLIENT_SECRET=…
   ```

   The secret is not confidential in the usual sense — it ships inside the app.
   PKCE is what actually protects the exchange, which is why the flow uses it.
4. **No redirect URI to register.** Google matches loopback redirect URIs on
   host only, so the ephemeral port the app picks needs no entry.
5. If the OAuth consent screen is in **Testing**, add each operator's Google
   account under **Audience → Test users**. Internal/published apps need nothing.

If `signInWithCredential` later rejects with `auth/invalid-credential`, add the
desktop Client ID to **Firebase Console → Authentication → Sign-in method →
Google → Web SDK configuration** as an additional allowed client ID.

### 1.3 Smaller items

- **Service worker.** [index.jsx:44](../src/index.jsx#L44) registers `/sw.js` in
  PROD. Guard it so it never registers under Electron — it would start caching
  against localhost for no benefit, and it's deleted in step 4 anyway.
- **`window.open` for the live view.** Add `setWindowOpenHandler` allowing the
  `/live` URL so [openLiveView.js](../src/utils/openLiveView.js) keeps working
  verbatim. Step 2 replaces it properly.
- **`contextIsolation: true`, `nodeIntegration: false`.** All main-process
  access goes through a preload `contextBridge`. Non-negotiable — the renderer
  loads remote content (YouTube iframes).
- **Vite config.** No change needed; absolute asset paths work over http.
- **Env vars.** `VITE_*` are inlined at build time as today. Firebase config in
  a desktop binary is no more exposed than in the web bundle — the security
  boundary is [firestore.rules](../firestore.rules), unchanged.
- **Packaging.** `electron-builder` with an NSIS target for Windows. Only needed
  when you want to hand someone an installer; `electron .` is enough for now.

### 1.4 Files

| File | Change |
|---|---|
| `electron/main.js` | new — window, loopback server, window-open handler |
| `electron/server.js` | new — static `dist/` + SPA fallback |
| `electron/oauth.js` | new — RFC 8252 flow |
| `electron/preload.js` | new — `contextBridge` (`signIn`) |
| `package.json` | `electron` devDep, `desktop` script, build config |
| [src/index.jsx](../src/index.jsx) | guard SW registration |
| [src/components/AuthGate.jsx](../src/components/AuthGate.jsx) | `signInWithPopup` → bridge + `signInWithCredential` |

### 1.5 Running it

```bash
npm run desktop       # build, then launch
npm run desktop:dev   # attach to a running `npm start` (vite :5173) for HMR
```

First-time setup: this repo runs npm with an allow-scripts policy, so Electron's
postinstall — which downloads the ~100 MB binary — is blocked. Adding the
`allowScripts` entry for `electron` is necessary but **not sufficient**: npm
skips postinstalls for packages already on disk, so both `npm install` and
`npm rebuild electron` will report success while `node_modules/electron/dist`
stays empty. Run the installer directly once:

```bash
node node_modules/electron/install.js
```

### 1.6 Done when

App opens; sign-in completes and lands on the approved-operator console; an
existing program opens with its schedule; the live view opens on the second
display; a song line pushed from the console appears on a phone at
`/caption`.

---

## Step 2 — Live view as a real `BrowserWindow`

**Goal:** delete [openLiveView.js](../src/utils/openLiveView.js) (139 lines) and
the fullscreen-permission dance, replacing them with a real window.

### 2.1 What the browser forced, and what replaces it

| Today | Electron |
|---|---|
| `getScreenDetails()` + Window Management permission | `screen.getAllDisplays()`, no prompt |
| `window.open(url, name, "left=…,top=…")` + `moveTo/resizeTo` | `new BrowserWindow({ x, y, fullscreen: true, frame: false })` |
| 500ms `setInterval` polling `win.closed` | `win.on("closed")` → IPC push |
| `requestPageFullscreen()` + a hint banner because fullscreen needs a gesture ([Live.jsx:10](../src/pages/Live.jsx#L10)) | window opens fullscreen; banner deleted |

Target display: first non-primary from `screen.getAllDisplays()`, falling back to
primary in a windowed size when there's only one.

### 2.2 What survives untouched

The whole cross-window layer — [mediaSync.js](../src/utils/mediaSync.js),
[liveViewSize.js](../src/utils/liveViewSize.js),
[cacheProgressSync.js](../src/utils/cacheProgressSync.js) — keeps working
without edits, because both windows load from the same
`http://127.0.0.1:<port>` origin and `BroadcastChannel` is origin-scoped. This
is the payoff for choosing a loopback server in step 1.

`startLiveViewSizeReporter()` also still works as-is (`window.innerWidth` +
resize events). Don't replace it with `display.size` — the existing reporter is
already correct and costs nothing.

### 2.3 Keep the module's public API

[useLiveViewOpen.js](../src/hooks/useLiveViewOpen.js) consumes four exports:
`openLiveView`, `closeLiveView`, `isLiveViewOpen`, `subscribeLiveViewOpen`.
Reimplement those four over IPC and every consumer component compiles unchanged.

### 2.4 Deletions — deferred to step 4

This plan originally called for deleting
[openLiveView.js](../src/utils/openLiveView.js) and the `fullscreenHint` banner
outright. That was written assuming the desktop app had already replaced the web
console. It hasn't: the deployed web app is still what runs services, so
removing the browser popup path now would be a live regression.

So the module keeps both paths — the desktop branch delegates to
`window.desktop.liveView`, and the `window.open` + `getScreenDetails` +
close-polling implementation stays for the web console. The browser path
(and the `fullscreenHint` banner, already suppressed under Electron) comes out
in step 4, alongside the open decision about whether hosting still serves
anything beyond `/caption`.

Net for this step: no deletions, ~30 lines of IPC added. The payoff is real but
banked, not spent.

### 2.5 Done when

Clicking the live-view button puts a frameless fullscreen window on display 2
with no permission prompt and no banner; closing it updates the console button
state without polling; video play/pause/seek still mirrors between console and
live.

---

## Step 3 — Local programs, songs, themes + read-only song repository

**Goal:** `programs`, `songs`, `themes`, and YouTube `media` entries move to a
local JSON file. `preview` becomes a message. `caption` stays on Firestore. A
new read-only repository browser lets operators import songs.

### 3.1 The store

One `data.json` in `app.getPath('userData')`, atomic write:

```js
// main.js — ponytail: one file, full rewrite per save. Split songs.json out
// if the library ever makes the write cost visible (~5000 songs).
ipcMain.handle('db:load', async () =>
  JSON.parse(await fs.readFile(file, 'utf8').catch(() => '{}')));

ipcMain.handle('db:save', async (_e, data) => {
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data));
  await fs.rename(file, `${file}.bak`).catch(() => {});
  await fs.rename(tmp, file);            // atomic; survives crash mid-write
});
```

Temp-write-then-rename is the one place not to cut a corner — this file becomes
the only copy of the song library.

**Not SQLite.** The codebase contains zero queries: every hook loads a whole
collection into zustand and filters in JS
([useSongs.jsx:52](../src/firebase/useSongs.jsx#L52),
[useThemes.js:15](../src/firebase/useThemes.js#L15)). The data is
document-shaped (nested `sections`, nested `schedule`). SQLite would collapse to
`id TEXT, doc JSON` — a JSON file with a query planner bolted on.

**Sizing:** measured against the real schema, one song is 2,071 bytes; 100 songs
is ~202 KB. For scale, this repo already ships and parses
[src/bibles/ntv.json](../src/bibles/ntv.json) at 7.3 MB. Parse at boot and full
rewrite per save are both ~1ms. No debounce needed on `persistSchedule`.

### 3.2 Rewriting the hooks

Signatures stay **identical**; only the guts swap. No consumer component
changes.

| Hook | Firestore today | Local |
|---|---|---|
| `addDoc` | server-generated id | `crypto.randomUUID()` — reuse the existing `newItemId()`/`newSectionId()` pattern |
| `activateProgram` | `writeBatch` over all programs ([usePrograms.js:39](../src/firebase/usePrograms.js#L39)) | a `.map()` |
| `orderBy("date","desc"), limit(8)` | Firestore cost control | load all, keep the 8-slice so `OpenProgramModal` behaves the same |
| `deleteField()` on legacy `body` ([useSongs.jsx:76](../src/firebase/useSongs.jsx#L76)) | field delete | just don't write the key |
| `onSnapshot` | live subscription | zustand already holds in-window state; nothing else reads these |

No file watcher is needed: `programs`/`songs`/`themes` are console-window-only.
The Live window reads `preview` and nothing else.

### 3.3 `preview` → BroadcastChannel

[usePreview.js](../src/firebase/usePreview.js) is a single document written by
the console and read by the Live window — a message bus implemented as a
database. It becomes a `BroadcastChannel`, copying
[mediaSync.js](../src/utils/mediaSync.js) with a new channel name.

Two things fall out:

- The `updateDoc` vs `setDoc({merge:true})` subtlety documented at
  [usePreview.js:31](../src/firebase/usePreview.js#L31) — stale nested fields
  surviving a merge — disappears. A posted message is a whole-value replace by
  nature.
- ⚠️ **`BroadcastChannel` has no replay.** `onSnapshot` gave you
  last-value-on-subscribe for free; a channel does not. If the Live window opens
  *after* the console set a preview, it starts blank. Fix: on Live mount, post
  `{type:"request-state"}` and have the console answer. This exact pattern
  already exists as `request-size` in
  [liveViewSize.js:70](../src/utils/liveViewSize.js#L70) — copy it.

### 3.4 Song repository (read-only)

```js
// src/firebase/useSongRepository.js
const snap = await getDocs(query(collection(db, "songs"), orderBy("title")));
```

`getDocs`, not `onSnapshot` — a catalog you open, browse, and close doesn't need
a live subscription. Import reuses the local mutator verbatim:

```js
const importSong = (r) => addSong(r.title, r.sections, { sourceId: r.id });
```

Imported songs **keep their Firestore id as the local id**, which is better
than the `sourceId` field this plan originally called for: it answers "already
imported?" for free, and it means every `songId` already stored in a program
schedule keeps resolving after the migration. Locally created songs get a UUID,
which cannot collide with Firestore's 20-character ids.

Existing songs are skipped, never overwritten, so a local edit is not silently
replaced. To take a newer version, delete the local song first.

- **No new dependency** — the Firestore SDK is already in the bundle for
  `caption`.
- **No rules change** — [firestore.rules:33](../firestore.rules#L33) already has
  `allow read, write: if isOperator()`. Operator sign-in keeps earning its place.
- **Import needs internet**, so it's a prep-time activity. That's the right
  split: the local library is what makes Sunday morning immune to venue wifi.
- Operator *push* to the repository is explicitly deferred.

### 3.5 Migration

First run with an empty local library offers **"import all"** — that *is* the
data migration for songs. No separate export script.

Programs, themes and media are pulled by the same screen — no throwaway script.
Because every document keeps its Firestore id, program → song and program →
theme references survive the move untouched.

Program dates need converting: Firestore Timestamps do not survive JSON, so they
are stored as ISO strings and normalized on read by `toProgramDate`
(`src/i18n/formatProgramDate.js`). Three call sites formatted dates via
`.toDate()` — one of them unguarded, which would have thrown — and all three now
go through that helper.

### 3.6 Backup

`data.json` is now the only copy. Add one menu item that copies it somewhere the
user picks. One `fs.copyFile`.

### 3.7 Done when

Creating, editing, activating, and deleting programs/songs/themes all persist
across restart with the network off; the live window shows the right preview
when opened *after* a preview was set; the repository browser lists remote songs,
marks already-imported ones, and imports both singly and in bulk; captions still
reach a phone.

---

## Step 4 — Local assets

**Goal:** media and theme backgrounds come from a local folder. Then delete the
entire offline-caching subsystem.

### 4.1 Serving local files to the renderer

The renderer is on an `http://` origin, so `file://` URLs are blocked — and
disabling `webSecurity` to allow them is not on the table. Instead add a
`/media/<storagePath>` route to the loopback server from step 1.

Two requirements, both non-negotiable:

- **HTTP Range support.** `<video>` seeking depends on it. `fs.createReadStream`
  with `start`/`end` and a `206` response, ~25 lines. This replaces the entire
  `RangeRequestsPlugin` + `crossOrigin="anonymous"` apparatus documented at
  length in [sw.js](../src/sw.js).
- **Path traversal guard.** Resolve the requested path and verify it stays
  inside the media root before opening it. This is a trust boundary; the guard
  is three lines and stays.

### 4.2 Keep `storagePath` shape identical

Store media under a real `general/` subfolder inside the media root. Then every
`storagePath` already persisted in program schedules
([useProgramSchedule.js:95](../src/hooks/useProgramSchedule.js#L95),
[Program.jsx:328](../src/pages/Program.jsx#L328),
[useThemes.js:27](../src/firebase/useThemes.js#L27)) resolves verbatim after the
bucket is copied down. **`url` stops being persisted and becomes derived** —
`` `http://127.0.0.1:${port}/media/${storagePath}` ``. Existing `url` values in
old documents become ignorable legacy; readers prefer `storagePath`.

Never put an absolute path in `data.json`. The media root is a setting; only
root-relative paths are stored. Move the folder, change one setting.

### 4.3 Rewrites

| Location | Change |
|---|---|
| `useMedia.loadFileMedia` | `listAll(storage)` → `fs.readdir(mediaRoot)` |
| media titles | Storage `customMetadata.title` → a `mediaTitles: {fileName: title}` map in `data.json` |
| `useMedia.uploadMedia` | `uploadBytes` → copy into root, same `${Date.now()}_${base}${ext}` naming |
| `useMedia.removeMedia` | `deleteObject` → `fs.unlink` |
| `useThemes.addTheme` | same copy-into-root; `backgroundUrl` derived |
| [pptx.js:47](../src/utils/pptx.js#L47) | `getBytes(storageRef)` → the existing `fetch(url)` branch, pointed at the local URL |
| [defaultMainLogo.js](../src/firebase/defaultMainLogo.js) | hardcoded Storage path → local path; becomes synchronous |

### 4.4 Deletions

This is the payoff for doing desktop first:

- [src/sw.js](../src/sw.js) — whole file
- `VitePWA` block in [vite.config.js](../vite.config.js) + the five `workbox-*`
  devDeps
- [src/utils/precacheSchedule.js](../src/utils/precacheSchedule.js) (129 lines)
- [src/utils/mediaCache.js](../src/utils/mediaCache.js) + every
  `evictCachedMedia` call
- [src/utils/cacheProgressSync.js](../src/utils/cacheProgressSync.js) and
  [src/hooks/usePrecacheProgram.js](../src/hooks/usePrecacheProgram.js)
- the cache-progress indicator in [Live.jsx](../src/pages/Live.jsx)
- all 33 `crossOrigin="anonymous"` attributes
- [storage.cors.json](../storage.cors.json), and
  [storage.rules](../storage.rules) if the bucket is decommissioned

### 4.5 Migration

One-time copy of the bucket into the media root, preserving the `general/`
prefix:

```bash
gsutil -m cp -r gs://<your-bucket>/general ./media/general
```

### 4.6 Done when

Every media type (image, video, audio, pptx) plays from the local folder with
the network fully off; video seeks to arbitrary offsets; uploading adds a file
to the folder and it appears in the browser; deleting removes it; an existing
program opens with all its assets resolving through `storagePath`.

---

## Open decisions

| Question | Notes |
|---|---|
| Desktop OAuth client | Needs a Cloud Console entry before step 1 can finish. Do this first. |
| Does web hosting still serve anything besides `/caption`? | If not, hosting config and the deployed console can shrink a lot. |
| Is the Storage bucket decommissioned or kept as a backup mirror? | Affects whether `storage.rules` survives step 4. |
| Where do backups of `data.json` go? | Currently manual. Fine to start there. |

## Deferred, on purpose

Operator push-to-repository · SQLite · media sync between machines ·
content-hash asset IDs · auto-update · a migration framework · repository
song-update propagation.
