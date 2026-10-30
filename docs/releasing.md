# Releasing

Two things ship, and they are not the same thing:

| | reaches | needs |
| --- | --- | --- |
| **Renderer bundle** | installed apps over the air | a signed publish |
| **Electron shell** | only a new installer | a reinstall on every machine |

A change under `src/` ships over the air. A change under `electron/` — main,
preload, the updater — does not, and never can: it is the part that performs
the update. If a release touches both, the bundle still goes out, but the
shell half only arrives when someone installs.

## One-time setup

**`production` environment.** Settings → Environments → New environment →
`production`. Add yourself under **Required reviewers**, then add the secret
`APOSTELLO_UPDATE_KEY` *to the environment*, not to the repository.

That gating is the point. The key signs code that runs on every operator
machine, so publishing waits for a human. Repository secrets are readable by
any workflow; environment secrets are not readable until the job is approved.

The other secrets (`API_KEY`, `AUTH_DOMAIN`, … and
`FIREBASE_SERVICE_ACCOUNT_SIGUEMESUBTITLES`) stay at repository level — they
are already used by the hosting workflows.

## Publishing a version

### 1. Decide the version

```bash
npm version patch    # or minor
```

Always **before** `release:bundle`, never after. Publishing a version that is
not newer than the live one is silent: installed apps compare, find nothing
newer, and report "up to date" forever while the files sit there unreachable.
`scripts/build-update-manifest.mjs` now refuses that, but the habit is what
keeps you out of it.

**`minShell` is a separate decision.** Raise it only when the renderer starts
calling something on `window.desktop` that older shells do not have — a new
preload method or IPC channel. Raising it needlessly locks older shells out of
updates they could have taken; forgetting it lets a bundle reach a shell that
will throw at the call. The manifest script warns when `electron/preload.js`
changed since the last tag and `minShell` did not.

### 2. Tag and push

```bash
git push origin main
git tag -a v3.1.3 -m "3.1.3" && git push origin v3.1.3
```

The tag triggers `.github/workflows/release.yml`. Tags are not optional: the
`minShell` warning reads `git describe --tags` and does nothing without them.

### 3. Watch the three jobs

**Verify** — checks the tag matches `package.json`, runs `npm ci` and the
tests. Fails the whole release if the tag and the version disagree.

**Installer** — builds on Windows and attaches
`Apostello Setup <version>.exe` to the GitHub release. `release/` is
gitignored, so this is the only durable copy.

**Publish update bundle** — **waits for your approval.** Approve it in the
run's page. It then builds, signs the manifest, deploys only the `updates`
target, and verifies what went live by fetching it back.

### 4. Install, if the shell changed

Download the installer from the release page and install it on each machine.
Only needed when something under `electron/` moved — check the diff.

## Doing it by hand

CI is the normal path; this is the fallback.

```bash
$env:APOSTELLO_UPDATE_KEY = Read-Host "paste key"
```

Use `Read-Host`. Pasting the key on the command line writes it to
`ConsoleHost_history.txt` in plain text.

```bash
npm run release:bundle
```

```bash
node scripts/verify-published.mjs
```

That last one is not optional. "`firebase deploy` exited zero" does not mean
an operator can install it — verify fetches the manifest, checks the signature
against the key compiled into `electron/update.js`, and hashes every file.

## When something is wrong

**"Ya tienes la última versión" after publishing.** The published version is
not newer than what the machine has. Check `update.json` against the app's own
version in Settings.

**"No se pudo conectar con el servidor de actualizaciones."** The manifest is
missing, or the machine is on an older shell pointing at a previous
`BASE_URL`. `node scripts/verify-published.mjs` distinguishes the two.

**A bundle that does not boot** rolls itself back within 20 seconds and the
app relaunches on the previous one. That version is then recorded as `failed`
and skipped until a newer one is published — so the fix is to publish forward,
never to republish the same number.

**The website and the updates channel are separate Hosting sites**
(`apostello` and `apostello-updates`). They used to share one, and each deploy
wiped the other. If you ever see the desktop gate on the website, or the
website's HTML where `update.json` should be, something is deploying to the
wrong target.
