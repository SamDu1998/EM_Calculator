# Changelog

## 0.4.0 — 2026-10-27

- Make WinUI 3 the sole application implementation and move it into `src/EMCalculator`.
- Remove Electron, React, TypeScript, Python, their toolchains and the legacy UI screenshots.
- Extract a pure C# core for all five calculator pages and all four transmission-line types.
- Preserve the previous 31 numerical fixtures and add regression, boundary and unit-conversion checks (120 test cases).
- Keep the Windows Mica/card interface and prominent primary results; add per-line-type session state and persistent language preference.
- Add a .NET solution, a unified PowerShell development entry point, Windows CI and Windows-native release packaging.
- Change distribution to a self-contained Windows x64 ZIP. Linux builds are no longer produced. Unzip the complete folder to run the application.

Historical v0.3.0 and earlier releases remain available in GitHub history and Releases.
