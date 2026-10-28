# EM Calculator — project handoff

**Updated:** 2026-10-28  
**Repository:** https://github.com/SamDu1998/EM_Calculator  
**Current branch:** `main`  
**Latest release:** [v0.7.0 MSIX trial](https://github.com/SamDu1998/EM_Calculator/releases/tag/v0.7.0)

## What this project is

A Windows x64 electromagnetic engineering calculator for antenna engineers. The current app is C# / WinUI 3 with a pure C# calculation core. It has Chinese and English UI and includes basic estimates, rectangular patch sizing, uniform linear-array estimates, transmission-line impedance, and SIW design. The README has the product overview and calculation model notes; its screenshot still shows the prior layout and needs refreshing.

## Current state

- v0.7.0 is published as a **GitHub prerelease** for trial. It is an MSIX signed by the local development certificate, not a Microsoft Store release and not signed by a public code-signing authority.
- The release download is `EM-Calculator-0.7.0-MSIX-trial.zip` (~65.4 MiB). It contains the app MSIX (~41.9 MiB), the public `.cer` certificate, x64 Windows App Runtime dependency, and Chinese installation instructions.
- Installing requires manually trusting the certificate on each PC. Importing it into Local Computer / Trusted People requires administrator access. The certificate is not removed when the app is uninstalled. The signing private key is not in the release archive.
- The app packages .NET self-contained and uses Windows App SDK 1.7 as a shared framework dependency. The installer may need the bundled x64 runtime dependency if it is missing on the target PC.
- MSIX language preferences live in Windows-managed app data and are cleaned up on uninstall. First launch attempts to migrate the prior portable language preference. Legacy portable settings are not removed by MSIX uninstall.
- The package identity currently uses `EMCalculator` / `CN=EM Calculator Development`. A future Microsoft Store listing must use the exact identity assigned by Partner Center; changing identity may mean Store installation will not update this trial package in place.
- `.github/workflows/release.yml` now supports manual builds of **unsigned** MSIX artifacts. The GitHub trial release was signed locally and uploaded separately. Review the workflow before changing release automation.
- v0.6.0 added rectangular TM₁₀ patch sizing and grouped calculator navigation. v0.7.0 adds uniform linear-array estimates for 2–32 elements and a scan-angle schematic. The array model assumes uniform excitation and ignores element patterns and mutual coupling. v0.5.0 introduced responsive layout; the UI still needs manual review across window sizes and display scales, and the README screenshot is outdated.
- The v0.7.0 package was built locally and signed with the existing development certificate. `signtool verify /pa` reports the expected untrusted self-signed certificate chain on machines that have not trusted the certificate.
- `AppxManifest` is now included only when `WindowsPackageType` is not `None`, allowing unpackaged builds and MSIX builds to use the same project file.
- The current source includes the linear-array calculator with element count limited to 2–32, spacing relative to free-space wavelength, broadside-referenced scan angle, phase step, aperture length, and grating-lobe warning.
- Post-release follow-up adds regression fixtures and boundary/use-case checks for the patch and linear-array models; `./build.ps1 -Task Verify` passes 172 checks. `Package` now runs the calculation suite before packaging. v0.7.0 itself was published before these tests were added; no application-code bug was found by the new suite. Future feature releases must pass `Verify` before packaging.

## Build and run

On Windows with the .NET 8 SDK, from the repository root in PowerShell:

```powershell
./build.ps1 -Task Build
./build.ps1 -Task Run -Configuration Debug
./build.ps1 -Task Package -Version 0.7.0
```

`Package` creates an unsigned MSIX under `artifacts/publish/msix/win-x64`. It does not create the signed GitHub trial archive. `./build.ps1 -Task Verify` runs the calculation regression runner and builds the app. Do not use `dotnet test` for the repository's console-based test runner; see README.

## Where to look

- `README.md` — product overview, screenshot, features, build instructions, distribution notes.
- `CHANGELOG.md` — version history.
- `docs/releases/v0.7.0.md` — release notes and certificate fingerprint.
- `src/EMCalculator/` — WinUI app, package manifest, assets, and preference storage.
- `src/EMCalculator.Core/` — calculation logic.
- `tests/EMCalculator.Tests/` — numeric regression and boundary checks.
- `build.ps1` — local build, verify, publish, and package tasks.
- `.github/workflows/` — CI and release workflows.

## Product direction and roadmap

Build a compact antenna-engineering toolbox around the workflow **estimate requirements → size an antenna → design its feed → estimate array/system behavior**. Keep each tool focused and use a consistent pattern for inputs and units, key results, a schematic, and model assumptions. This is a calculator toolbox, not a full-wave simulator or general RF suite. Every new calculation must add representative numerical fixtures plus invalid-input, boundary, and physical-relationship tests. Run `./build.ps1 -Task Verify` before release; `Package` now enforces the test run.

1. **UI acceptance:** review compact/standard/wide layouts at multiple display scales, check Chinese/English, keyboard and high-contrast behavior, then refresh the README screenshot.
2. **Toolbox organization:** v0.6.0 groups tools under basic estimates, antenna design, and feed/guided structures. Add search only when the growing tool list needs it.
3. **Next feature:** transmission-line width synthesis to connect impedance calculations with physical feed design.
4. **Later tools:** Friis link budget, then rectangular-waveguide modes and cutoff calculations.
5. **Defer:** Smith chart, complex matching networks, full simulation, cloud sync, and project management. Add favorites, history, or export when actual use calls for them.

For release follow-up, install the GitHub archive on a clean Windows x64 machine and record runtime or upgrade issues. Keep releases labeled as trials until installation and upgrade behavior are validated. If moving to Microsoft Store, first reserve the app in Partner Center and then apply its assigned package identity.

No Store submission is currently in progress. Check the remote and checkout before assuming this note is still current.
