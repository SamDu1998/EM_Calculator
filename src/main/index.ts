import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { BrowserWindow, Menu, app, shell } from 'electron'
import { join } from 'node:path'
import { registerIpcHandlers } from './ipc'
import { broadcastLanguage, buildAppMenu, type Language } from './menu'

let currentLanguage: Language = 'en'

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 720,
    minWidth: 720,
    minHeight: 540,
    show: false,
    autoHideMenuBar: false,
    backgroundColor: '#0b0f1a',
    title: 'EM Calculator',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    if (is.dev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone', details)
  })

  mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
    console.error('Preload error in', preloadPath, error)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
      event.preventDefault()
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

function setLanguage(lang: Language): void {
  currentLanguage = lang
  Menu.setApplicationMenu(
    buildAppMenu(currentLanguage, (next) => {
      setLanguage(next)
      broadcastLanguage(next)
    }),
  )
  broadcastLanguage(lang)
}

void app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.emCalculator.app')

  app.on('browser-window-created', (_event, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()

  Menu.setApplicationMenu(
    buildAppMenu(currentLanguage, (next) => {
      setLanguage(next)
      broadcastLanguage(next)
    }),
  )

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event) => {
    event.preventDefault()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
