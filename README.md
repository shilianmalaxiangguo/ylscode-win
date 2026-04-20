# yls-desktop-widget (MVP)

## Development

```powershell
npm install
npm run dev
```

Manual verification requires a local desktop GUI session that can launch an Electron window (not headless/CLI-only).

## Test and Build

```powershell
npm test
npm run typecheck
npm run build
```

## Package Windows x64 EXE

```powershell
npm install
npm run dist:win
```

This writes Windows x64 artifacts into `release/`:

- NSIS installer `.exe`
- Portable `.exe`

## GitHub Actions

Repository workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

- `push` / `pull_request` to `main`: runs `npm ci`, `npm run typecheck`, `npm test`
- Manual run (`workflow_dispatch`): runs verification first, then builds Windows packages on `windows-latest` and uploads artifacts
- Tag release workflow: [`.github/workflows/release.yml`](.github/workflows/release.yml)
  Push `v*` tags to build Windows packages and publish a GitHub Release automatically

Manual run steps on GitHub:

1. Push the workflow file to the default branch.
2. Open `Actions` in the repository.
3. Select `CI`.
4. Click `Run workflow`.
5. After it finishes, download the artifact named `windows-package-<commit-sha>`.

Release tag steps:

1. Update `package.json` version and commit it.
2. Create a tag that exactly matches the package version, for example `v0.1.1`.
3. Push the tag:

```powershell
git tag v0.1.1
git push origin v0.1.1
```

The release workflow validates that `git tag` matches `package.json` version before packaging. If they do not match, the workflow fails instead of publishing the wrong artifact version.

## Verification Log (2026-04-20)

This verification log is bound to application code revision `1fa8cc0` (`fix: separate widget errors and settings busy state`). Later README-only edits must not be treated as a fresh product verification.

### Automated checks

| Command | Result | Notes |
| --- | --- | --- |
| `npm test` | PASS | 9 test files, 52 tests passed |
| `npm run typecheck` | PASS | No type errors |
| `npm run build` | PASS | Renderer and Electron build completed; plugin timings warning is non-blocking |

### Manual QA checklist

Note: this run only had CLI access. Interactive checks require a local desktop GUI session with an Electron window, so items below are recorded as not manually verified yet.

| Check item | Status | Record |
| --- | --- | --- |
| Window size and widget shape | NOT VERIFIED | Run `npm run dev`, then check initial window size/shape |
| Token save persistence (after restart) | NOT VERIFIED | Enter token, save, restart app, then confirm persistence |
| USD display for cards | NOT VERIFIED | Manually confirm remaining/current/week/package values are shown in USD |
| Polling options list | NOT VERIFIED | Confirm options include `5s`, `30s`, `60s`, `3min`, `5min`, `10min` |
| Default polling value is `60s` | NOT VERIFIED | Confirm selected default after app startup |
| Refresh button behavior | NOT VERIFIED | Click `Refresh` and confirm immediate fetch |
| Always-on-top toggle | NOT VERIFIED | Toggle and confirm window topmost behavior |
| Missing week data placeholder | NOT VERIFIED | Confirm week section shows `--` when week data is missing |
