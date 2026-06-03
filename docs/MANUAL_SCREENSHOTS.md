# Manual Screenshot Guide

If the automated screenshot script fails, follow these steps to capture screenshots manually:

## 1. Start the Application

```bash
npm run dev
# or if you want to test the built version:
npm run build && npm start
```

## 2. Prepare the Window

- Resize window to approximately 1200×800
- Wait 2-3 seconds for background animations to settle
- Ensure the Liquid Glass effects are visible

## 3. Capture Screenshots

### main-interface.png
- Keep the default bandwidth calculator view
- Show the full window including custom title bar
- Make sure animated background blobs are visible

### bandwidth-calculator.png
- Stay on the bandwidth calculator tab
- Fill in example values:
  - fmin: `2.4` GHz
  - fmax: `2.5` GHz
- Wait for results to display
- Capture the full form and results

### aperture-efficiency.png
- Click the "Aperture Efficiency" tab
- Fill in example values:
  - Frequency: `10` GHz
  - Gain: `30` dBi
  - Area: `1.5` m²
- Wait for results to display
- Capture the full form and results

### dynamic-background.png
- Can use any tab
- Focus on showing the Liquid Glass effect
- Ensure colorful animated blobs are prominent
- Show how the glass cards blur the background

## 4. Save Screenshots

Save all screenshots to: `D:\CODEX\EMCalc\docs\screenshots\`

File naming:
- `main-interface.png`
- `bandwidth-calculator.png`
- `aperture-efficiency.png`
- `dynamic-background.png`

## 5. Verify Quality

- ✓ Resolution: at least 1200×800
- ✓ Format: PNG
- ✓ Clear text (no blur or compression artifacts)
- ✓ Visible Liquid Glass effects
- ✓ Animated blobs are in frame

## 6. Commit and Push

```bash
git add docs/screenshots/*.png
git commit -m "docs: add application screenshots"
git push
```

Then update the README and Release notes to reference the actual screenshots.
