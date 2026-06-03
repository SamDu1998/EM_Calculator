# Release v0.2.0 - Liquid Glass Design Update

## 🎨 Major Visual Overhaul

This release brings a complete redesign inspired by **Apple's Liquid Glass** design language, featuring enhanced vibrancy, dynamic backgrounds, and a modern frameless window experience.

## ✨ New Features

### 🪟 Frameless Window Design
- **Custom Title Bar** - Sleek glass-effect title bar with window controls
- **Drag & Drop** - Drag the title bar to move the window
- **Double-click to Maximize** - Quick window management
- **Smooth Animations** - Polished window state transitions

### 🎨 Apple Liquid Glass Design
- **Dynamic Background** - Flowing gradient blobs with 20-25s animation cycles
- **Real-time Glass Effect** - `backdrop-filter: blur(24px) saturate(200%) brightness(1.1)`
- **Enhanced Colors** - Vibrant violet, cyan, and amber blobs with increased saturation
- **Adaptive Transparency** - 65-75% opacity following Apple's design guidelines
- **Depth & Layering** - Clear spatial hierarchy with proper z-indexing

### 📝 Typography Improvements
- **Microsoft YaHei Font** - Better CJK (Chinese, Japanese, Korean) rendering
- **Unified Font System** - Consistent sans-serif typography throughout

### 📐 Responsive Layout
- **Fluid Scaling** - CSS `clamp()` functions for adaptive sizing
- **Window Size Support** - Optimized for 720x540 to 1600x900
- **Smart Grid** - Form and result grids adapt to window width
- **No Scrollbars** - Content stays within viewport at all supported sizes

## 🐛 Bug Fixes

- Fixed tab transition flicker (removed opacity animation)
- Improved glass card hover effects
- Enhanced visual consistency across components

## 🛠️ Technical Details

### Dependencies
- Electron 33.3.1
- React 18.3.1
- Vite 6.0.7
- electron-vite 5.0.0

### Build Artifacts
- Windows: Portable `.exe` + `.zip`
- Linux: `.tar.gz`

---

## 📥 Installation

### Windows
1. Download `EM-Calculator-0.2.0-portable-x64.exe`
2. Run directly - no installation required

### Linux
1. Download `EM-Calculator-0.2.0-x64.tar.gz`
2. Extract and run: `./EM-Calculator`

---

## 🌟 Screenshots

(Screenshots to be added after user provides them)

---

## 🔗 Links

- [Repository](https://github.com/SamDu1998/EM_Calculator)
- [Report Issues](https://github.com/SamDu1998/EM_Calculator/issues)
- [Documentation](https://github.com/SamDu1998/EM_Calculator#readme)

---

## 📄 Full Changelog

**Commit**: `84caedf`

### UI Improvements
- Switch font to Microsoft YaHei (微软雅黑) for better CJK rendering
- Implement responsive layout with clamp() for fluid scaling
- Add dynamic animated background with enhanced color blobs
- Apply Apple Liquid Glass design system (blur 24px, 65-75% opacity)
- Enhance backdrop-filter with saturate(200%) + brightness(1.1)

### Frameless Window
- Remove system title bar (frame: false)
- Add custom TitleBar component with drag region
- Implement window controls (minimize, maximize/restore, close)
- Add IPC handlers for window management
- Apply Liquid Glass effect to title bar

### Visual Enhancements
- Increase blob saturation and brightness for vivid colors
- Faster animation cycles (20-25s) with 3-keyframe paths
- Add rotation to blob animations for more dynamic movement
- Smooth tab transition animation (removed opacity flicker)
- Hover effects on glass cards with subtle lift

### Technical
- Extend EmApi with windowMinimize/Maximize/Close methods
- Add maximize state tracking via IPC events
- Support double-click title bar to maximize/restore

---

**Full Diff**: https://github.com/SamDu1998/EM_Calculator/compare/0040273...84caedf
