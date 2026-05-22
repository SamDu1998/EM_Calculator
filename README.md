# EM Calculator

Electron desktop application that calculates common electromagnetic engineering quantities — **relative bandwidth** and **aperture efficiency** — with bilingual UI (English / 中文) and a glassmorphism interface. Ships as a portable executable; no installer, no user data stored.

## Features

- **Relative bandwidth**: enter `fmin` and `fmax` (with selectable Hz/kHz/MHz/GHz units); the app reports absolute bandwidth, center frequency, and the standard fractional bandwidth `(fmax − fmin) / fcenter`.
- **Aperture efficiency**: enter frequency, antenna gain in dBi, and physical aperture area (m² or cm²); the app reports wavelength λ, effective aperture area Aₑ, and efficiency η, flagging over-unity inputs as physically inconsistent.
- **Bilingual UI** — switch via the in-app `EN / 中` toggle or the OS menu. The active language persists across sessions.
- **Python reference verification (dev only)** — each calculation tab exposes a "Verify with Python" button in development. The renderer spawns the Python implementation over IPC and reports the absolute delta against the in-process TypeScript result. Packaged builds drop Python entirely to keep the binary small.
- **Accessibility** — full keyboard navigation, ARIA roles, `prefers-reduced-motion` and `prefers-reduced-transparency` fallbacks.

## Tech stack

- Electron 33 with `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, and a strict CSP meta in the renderer HTML.
- electron-vite + Vite 6 + TypeScript + React 18.
- Glassmorphism layered surfaces (animated gradient blobs, SVG turbulence grain, real backdrop-filter cards).
- Vitest for renderer/lib tests; pytest for Python tests; shared `fixtures.json` ensures both implementations agree to within machine precision.

## Project layout

```
src/
├── main/                 # Electron main process: BrowserWindow, IPC, menu, Python subprocess wrapper
├── preload/              # contextBridge surface exposed as window.emApi
├── shared/               # IPC payload types shared between preload and renderer
└── renderer/             # React UI
    ├── components/       # Reusable UI parts (Tabs, GlassCard, NumberInput, ...)
    ├── features/         # bandwidth/, aperture-efficiency/, tbd/
    ├── lib/              # Pure calculation functions, formatting, unit conversion
    ├── i18n/             # Custom Context-based translation provider
    └── styles/           # Design tokens + glass system
python/
├── em_calc.py            # CLI: actions = bandwidth | aperture-efficiency
└── tests/                # pytest, consumes the same fixtures.json as Vitest
build/
└── afterPack.cjs         # Strips unused Chromium locales during packaging
```

## Getting started

Prerequisites: Node 20+ and (for development) Python 3.10+.

```sh
npm install
npm run dev            # Launches Electron pointing at the Vite dev server
```

### Useful scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Hot-reloading dev mode (Electron + Vite) |
| `npm run build` | Production bundle into `out/` (no installer) |
| `npm run dist:win` | Windows portable `.exe` + `.zip` into `release/` |
| `npm run dist:linux` | Linux `.tar.gz` into `release/` |
| `npm test` | Vitest unit tests with v8 coverage |
| `npm run lint` | ESLint flat config across `src/` |
| `npm run typecheck` | Composite tsc check for both node and web tsconfigs |
| `python -m pytest python/` | Run the Python reference test suite (dev only) |

## Distribution

The app ships **without an installer** — pick whichever shape suits you:

| Artifact | Size | How to run |
|---|---|---|
| `EM Calculator-<v>-portable-x64.exe` | ~65 MB | Double-click. Self-extracts to `%TEMP%` and cleans up on close. |
| `EM Calculator-<v>-x64.zip` | ~98 MB | Unzip, run `EM Calculator.exe` from the extracted folder. |
| `EM Calculator-<v>-x64.tar.gz` | ~90 MB | Extract, run `./em-calculator` from the extracted folder. |

The portable `.exe` uses LZMA compression for the smallest single-file footprint. A custom `afterPack` hook in `build/afterPack.cjs` strips ~40 MB of unused Chromium locale files (keeping only `en-*` and `zh-*`), so the packaged app starts at ~75 MB on disk rather than the default ~115 MB.

**Linux AppImage** is supported by electron-builder but requires running the build on Linux (or via Docker / WSL with a real distribution) because the `mksquashfs` tool is Linux-only. The Windows host falls back to `.tar.gz`.

**No user data is stored.** Calculations are stateless — closing the app leaves nothing behind besides the OS-managed Chromium cache. The portable build keeps that cache in `%TEMP%` and discards it on exit.

## Calculation details

Relative bandwidth uses the engineering convention `(fmax − fmin) / fcenter × 100%` where `fcenter = (fmax + fmin) / 2`.

Aperture efficiency follows `η = Aₑ / Aphys` where `Aₑ = (λ² / 4π) · 10^(G/10)` and `λ = c / f` with `c = 299_792_458 m/s`.

When the computed efficiency exceeds 100% the UI surfaces a warning, since this implies the supplied gain or physical area is physically inconsistent rather than the calculator being wrong.

## Roadmap

- **Linux AppImage** packaging via Docker or a Linux/WSL host (Windows host currently falls back to `tar.gz`).
- GitHub Actions CI matrix to publish releases.
- Playwright E2E tests for tab switch, language switch, and Python verification.
- The `More` tab is reserved for additional calculators (candidates: Friis path loss, antenna radiation pattern, impedance matching).

## License

MIT
