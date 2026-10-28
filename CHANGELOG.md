# Changelog

## 0.7.0 — 2026-10-28

- Add a uniform linear-array estimator for spacing, scan phase, aperture, and grating-lobe risk.

## 0.6.0 — 2026-10-28
- Add an initial rectangular microstrip patch sizing calculator with a TM₁₀ dimension schematic.

## 0.5.0 — 2026-10-28

- Add adaptive structure schematics for Microstrip, CPW, GCPW, Coaxial, and SIW via fences, with labels following current inputs.
- Center the calculator content and switch between stacked and side-by-side parameter/result layouts as the window changes size.
- Use compact navigation, responsive headings, DPI-aware startup dimensions, and Windows text scaling.
- Include the package manifest only for MSIX builds so unpackaged app builds pass the Windows App SDK configuration check.

## 0.4.1 — 2026-10-27

- Add a single-project MSIX package target for Windows-managed installation and uninstall.
- Let packaged releases share the Windows App SDK runtime; keep the .NET runtime self-contained.
- Store packaged language preferences in app-managed local data so Windows removes them on uninstall.
- Import the existing portable language preference on first packaged launch.
- Add an application screenshot to the project introduction.
- Provide a self-signed MSIX trial package; Store submission will require a Partner Center identity.

## 0.4.0 — 2026-10-27

- Make WinUI 3 the sole application implementation and move it into `src/EMCalculator`.
- Remove Electron, React, TypeScript, Python, their toolchains and the legacy UI screenshots.
- Extract a pure C# core for all five calculator pages and all four transmission-line types.
- Preserve the previous 31 numerical fixtures and add regression, boundary and unit-conversion checks (120 test cases).
- Keep the Windows Mica/card interface and prominent primary results; add per-line-type session state and persistent language preference.
- Add a .NET solution, a unified PowerShell development entry point, Windows CI and Windows-native release packaging.
- Change distribution to a self-contained Windows x64 ZIP. Linux builds are no longer produced. Unzip the complete folder to run the application.

Historical v0.3.0 and earlier releases remain available in GitHub history and Releases.
