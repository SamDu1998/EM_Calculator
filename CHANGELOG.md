# Changelog

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
