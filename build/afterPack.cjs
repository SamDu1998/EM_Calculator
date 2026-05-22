'use strict'

// Strip unused Electron locales from the packaged output. Chromium ships
// ~50 .pak language files (~280 KB each, ~14 MB total). EM Calculator only
// surfaces English and Simplified Chinese, so we keep just those two.

const fs = require('node:fs')
const path = require('node:path')

const KEEP = new Set(['en-US.pak', 'zh-CN.pak'])

/** @param {import('electron-builder').AfterPackContext} context */
exports.default = async function afterPack(context) {
  const productName = context.packager.appInfo.productFilename
  const platformDir = context.electronPlatformName

  /** @type {string[]} */
  const localeDirs = []
  // Windows / Linux: <appOutDir>/locales
  localeDirs.push(path.join(context.appOutDir, 'locales'))
  // macOS would also have <appOutDir>/<ProductName>.app/Contents/Frameworks/Electron Framework.framework/Resources
  if (platformDir === 'darwin') {
    localeDirs.push(
      path.join(
        context.appOutDir,
        `${productName}.app`,
        'Contents',
        'Frameworks',
        'Electron Framework.framework',
        'Resources',
      ),
    )
  }

  let removed = 0
  let kept = 0
  let bytesFreed = 0
  for (const dir of localeDirs) {
    if (!fs.existsSync(dir)) continue
    for (const entry of fs.readdirSync(dir)) {
      if (!entry.endsWith('.pak') && !entry.endsWith('.lproj')) continue
      const full = path.join(dir, entry)
      if (KEEP.has(entry) || entry.startsWith('en') || entry.startsWith('zh')) {
        kept += 1
        continue
      }
      const stat = fs.statSync(full)
      bytesFreed += stat.isDirectory() ? 0 : stat.size
      fs.rmSync(full, { recursive: true, force: true })
      removed += 1
    }
  }

  console.log(
    `[afterPack] Pruned ${removed} locale files (kept ${kept}); freed ~${Math.round(bytesFreed / 1024)} KB`,
  )
}
