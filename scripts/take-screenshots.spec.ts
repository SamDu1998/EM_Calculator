import { _electron as electron } from 'playwright'
import { test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('Take application screenshots', async () => {
  // Launch Electron app
  const electronApp = await electron.launch({
    args: [path.join(__dirname, '../out/main/index.js')],
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  })

  // Get the first window
  const window = await electronApp.firstWindow()

  // Wait for app to load
  await window.waitForLoadState('domcontentloaded')
  await window.waitForTimeout(3000) // Wait for animations and blobs to settle

  // Set window size
  await window.setViewportSize({ width: 1200, height: 800 })

  // Screenshot 1: Main interface with bandwidth calculator
  await window.screenshot({
    path: path.join(__dirname, '../docs/screenshots/main-interface.png'),
    fullPage: false,
  })

  console.log('✓ Captured main-interface.png')

  // Fill in bandwidth calculator example
  const inputs = await window.locator('.field__input').all()
  if (inputs.length >= 2) {
    await inputs[0].fill('2.4')
    await inputs[1].fill('2.5')
    await window.waitForTimeout(1000) // Wait for calculation
  }

  // Screenshot 2: Bandwidth calculator with data
  await window.screenshot({
    path: path.join(__dirname, '../docs/screenshots/bandwidth-calculator.png'),
    fullPage: false,
  })

  console.log('✓ Captured bandwidth-calculator.png')

  // Switch to aperture efficiency tab
  const tabs = await window.locator('button[role="tab"]').all()
  if (tabs.length > 1) {
    await tabs[1].click()
    await window.waitForTimeout(800) // Wait for tab animation

    // Fill in aperture efficiency example
    const effInputs = await window.locator('.field__input').all()
    if (effInputs.length >= 3) {
      await effInputs[0].fill('10') // Frequency
      await effInputs[1].fill('30') // Gain in dBi
      await effInputs[2].fill('1.5') // Area
      await window.waitForTimeout(1000) // Wait for calculation

      // Screenshot 3: Aperture efficiency
      await window.screenshot({
        path: path.join(__dirname, '../docs/screenshots/aperture-efficiency.png'),
        fullPage: false,
      })

      console.log('✓ Captured aperture-efficiency.png')
    }
  }

  // Screenshots 4-6: the v0.3.0 calculators render valid results from their defaults
  const newTabShots: Array<{ index: number; file: string }> = [
    { index: 2, file: 'wavelength-calculator.png' },
    { index: 3, file: 'transmission-line-calculator.png' },
    { index: 4, file: 'siw-calculator.png' },
  ]
  for (const shot of newTabShots) {
    const tab = tabs[shot.index]
    if (!tab) continue
    await tab.click()
    await window.waitForTimeout(800)
    await window.screenshot({
      path: path.join(__dirname, `../docs/screenshots/${shot.file}`),
      fullPage: false,
    })
    console.log(`✓ Captured ${shot.file}`)
  }

  // Screenshot 7: Dynamic background - switch back to first tab for variety
  await tabs[0].click()
  await window.waitForTimeout(500)

  await window.screenshot({
    path: path.join(__dirname, '../docs/screenshots/dynamic-background.png'),
    fullPage: false,
  })

  console.log('✓ Captured dynamic-background.png')

  // Close the app
  await electronApp.close()

  console.log('\n✅ All screenshots captured successfully!')
  console.log('Screenshots saved to: docs/screenshots/')
})

