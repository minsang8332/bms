import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import electronUpdater from 'electron-updater'
import { createStoreRepository } from './modules/store/create-store-repository'
import { registerAppHandlers } from './handlers/app'
import { registerTabHandlers } from './handlers/tabs'
import { registerItemHandlers } from './handlers/item'
import { registerSettingHandlers } from './handlers/setting'
import { registerServiceCenterHandlers } from './handlers/service-center'

import { createAppTray, destroyAppTray } from './modules/tray'
import { startPolling as startSerialPortPolling, stopPolling as stopSerialPortPolling } from './modules/serial-port'
import { migrateLocalDataToApi } from './modules/store/migration'

const { autoUpdater } = electronUpdater
let mainWindow: BrowserWindow | null = null
let isQuitting = false

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 620,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  mainWindow = window

  window.on('ready-to-show', () => {
    window.show()
  })

  window.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      window.hide()
    }
  })

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev) {
    window.webContents.once('did-finish-load', () => {
      window.webContents.openDevTools({ mode: 'detach' })
    })
  }

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.bms.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const storeRepository = createStoreRepository()
  registerAppHandlers({
    getMainWindow: () => mainWindow
  })
  registerTabHandlers(storeRepository)
  registerItemHandlers()
  registerSettingHandlers({ storeRepository })
  registerServiceCenterHandlers()

  const window = createWindow()

  createAppTray(window)
  startSerialPortPolling()
  migrateLocalDataToApi()

  if (!is.dev) {
    autoUpdater.checkForUpdatesAndNotify().catch(() => undefined)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  stopSerialPortPolling()
  destroyAppTray()
})
