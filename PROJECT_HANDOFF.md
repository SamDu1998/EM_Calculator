# EM Calculator — project handoff

**Updated:** 2026-10-28  
**Repository:** https://github.com/SamDu1998/EM_Calculator  
**Current branch:** `main`  
**Latest release:** [v0.5.0 MSIX trial](https://github.com/SamDu1998/EM_Calculator/releases/tag/v0.5.0)

## What this project is

A Windows x64 electromagnetic engineering calculator. The current app is C# / WinUI 3 with a pure C# calculation core. It has Chinese and English UI and includes bandwidth, aperture efficiency, wavelength, transmission-line impedance (Microstrip, CPW, GCPW, Coaxial), and SIW via design calculations. The README has the current UI screenshot and calculation model notes.

## Current state

- v0.5.0 is published as a **GitHub prerelease** for trial. It is an MSIX signed by the local development certificate, not a Microsoft Store release and not signed by a public code-signing authority.
- The release download is `EM-Calculator-0.5.0-MSIX-trial.zip` (~65.4 MiB). It contains the app MSIX (~41.9 MiB), the public `.cer` certificate, x64 Windows App Runtime dependency, and Chinese installation instructions.
- Installing requires manually trusting the certificate on each PC. Importing it into Local Computer / Trusted People requires administrator access. The certificate is not removed when the app is uninstalled. The signing private key is not in the release archive.
- The app packages .NET self-contained and uses Windows App SDK 1.7 as a shared framework dependency. The installer may need the bundled x64 runtime dependency if it is missing on the target PC.
- MSIX language preferences live in Windows-managed app data and are cleaned up on uninstall. First launch attempts to migrate the prior portable language preference. Legacy portable settings are not removed by MSIX uninstall.
- The package identity currently uses `EMCalculator` / `CN=EM Calculator Development`. A future Microsoft Store listing must use the exact identity assigned by Partner Center; changing identity may mean Store installation will not update this trial package in place.
- `.github/workflows/release.yml` now supports manual builds of **unsigned** MSIX artifacts. The GitHub trial release was signed locally and uploaded separately. Review the workflow before changing release automation.
- v0.5.0 adds vector diagrams for all transmission-line types and SIW plus a responsive UI, DPI-aware startup size, and Windows text scaling. The UI has not yet been manually reviewed across window sizes and display scales.
- The v0.5.0 package was built locally and signed with the existing development certificate. `signtool verify /pa` reports the expected untrusted self-signed certificate chain on machines that have not trusted the certificate.
- `AppxManifest` is now included only when `WindowsPackageType` is not `None`, allowing unpackaged builds and MSIX builds to use the same project file.

## Build and run

On Windows with the .NET 8 SDK, from the repository root in PowerShell:

```powershell
./build.ps1 -Task Build
./build.ps1 -Task Run -Configuration Debug
./build.ps1 -Task Package -Version 0.5.0
```

`Package` creates an unsigned MSIX under `artifacts/publish/msix/win-x64`. It does not create the signed GitHub trial archive. `./build.ps1 -Task Verify` runs the calculation regression runner and builds the app. Do not use `dotnet test` for the repository's console-based test runner; see README.

## Where to look

- `README.md` — product overview, screenshot, features, build instructions, distribution notes.
- `CHANGELOG.md` — version history.
- `docs/releases/v0.5.0.md` — release notes and certificate fingerprint.
- `src/EMCalculator/` — WinUI app, package manifest, assets, and preference storage.
- `src/EMCalculator.Core/` — calculation logic.
- `tests/EMCalculator.Tests/` — numeric regression and boundary checks.
- `build.ps1` — local build, verify, publish, and package tasks.
- `.github/workflows/` — CI and release workflows.

## Next sensible work

1. Review the v0.5.0 UI at compact, standard, and wide window sizes, and at more than one Windows display scale; check the line and SIW diagrams in both languages.
2. Check keyboard navigation and high-contrast behavior; add native UI automation if appropriate.
3. Install the GitHub archive on a clean Windows x64 machine, follow its certificate instructions, and record any runtime or install issues.
4. If moving to Microsoft Store: create the personal Partner Center account, reserve the app, then replace the manifest and build properties with the assigned package identity before preparing Store submission.
5. Keep the GitHub releases labeled as trials until installation and upgrade behavior have been validated.

No Store submission is currently in progress. Check the remote and checkout before assuming this note is still current.
