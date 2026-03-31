import {
  app,
  BrowserWindow,
  shell,
  Tray,
  Menu,
  nativeImage,
  dialog,
  ipcMain,
  type MenuItemConstructorOptions,
} from 'electron'
import path from 'path'

// ==================== GLOBALS ====================

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

const isDev = !app.isPackaged
const APP_NAME = 'Studio Post'
const ICON_PATH = path.join(__dirname, '../public/icon.png')

// ==================== SINGLE INSTANCE ====================

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

// ==================== AUTO-UPDATER ====================

let autoUpdater: typeof import('electron-updater').autoUpdater | null = null

async function initAutoUpdater() {
  try {
    const mod = await import('electron-updater')
    autoUpdater = mod.autoUpdater

    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('update-available', (info) => {
      if (!mainWindow) return
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: 'Atualização disponível',
          message: `Versão ${info.version} está disponível. Deseja baixar agora?`,
          buttons: ['Baixar', 'Mais tarde'],
          defaultId: 0,
        })
        .then(({ response }) => {
          if (response === 0) {
            autoUpdater!.downloadUpdate()
            mainWindow?.webContents.send('update:downloading')
          }
        })
    })

    autoUpdater.on('update-downloaded', () => {
      if (!mainWindow) return
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: 'Atualização pronta',
          message: 'A atualização foi baixada. Reiniciar agora para instalar?',
          buttons: ['Reiniciar', 'Mais tarde'],
          defaultId: 0,
        })
        .then(({ response }) => {
          if (response === 0) {
            isQuitting = true
            autoUpdater!.quitAndInstall()
          }
        })
    })

    autoUpdater.on('download-progress', (progress) => {
      mainWindow?.webContents.send('update:progress', progress.percent)
      mainWindow?.setProgressBar(progress.percent / 100)
    })

    autoUpdater.on('error', (err) => {
      console.error('Auto-updater error:', err)
    })

    // Check for updates silently on startup (only in production)
    if (!isDev) {
      autoUpdater.checkForUpdates()
    }
  } catch {
    console.log('electron-updater not available (dev mode)')
  }
}

// ==================== TRAY ====================

function createTray() {
  const icon = nativeImage.createFromPath(ICON_PATH).resize({ width: 16, height: 16 })
  tray = new Tray(icon)
  tray.setToolTip(APP_NAME)

  const contextMenu: MenuItemConstructorOptions[] = [
    {
      label: 'Abrir Studio Post',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        } else {
          createWindow()
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Gerar Criativos',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
          mainWindow.webContents.send('navigate', '/dashboard/generate')
        }
      },
    },
    {
      label: 'Histórico',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
          mainWindow.webContents.send('navigate', '/dashboard/history')
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Verificar Atualizações',
      click: () => {
        if (autoUpdater) {
          autoUpdater.checkForUpdates()
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ]

  tray.setContextMenu(Menu.buildFromTemplate(contextMenu))

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

// ==================== WINDOW ====================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: APP_NAME,
    icon: ICON_PATH,
    show: false, // show after ready-to-show to avoid flicker
    backgroundColor: '#0a0a1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 12, y: 12 },
  })

  // Anti-flicker: only show once DOM is painted
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  const url = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`

  mainWindow.loadURL(url)

  // Security: only open http(s) links in external browser
  mainWindow.webContents.setWindowOpenHandler(({ url: linkUrl }) => {
    if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
      shell.openExternal(linkUrl)
    }
    return { action: 'deny' }
  })

  // Prevent navigation away from app
  mainWindow.webContents.on('will-navigate', (event, navUrl) => {
    const parsedUrl = new URL(navUrl)
    const appUrl = isDev ? 'localhost' : ''
    if (parsedUrl.hostname !== appUrl && parsedUrl.protocol !== 'file:') {
      event.preventDefault()
      shell.openExternal(navUrl)
    }
  })

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ==================== IPC HANDLERS ====================

ipcMain.handle('app:version', () => app.getVersion())
ipcMain.handle('app:platform', () => process.platform)
ipcMain.handle('app:isPackaged', () => app.isPackaged)

ipcMain.handle('update:check', async () => {
  if (autoUpdater) {
    const result = await autoUpdater.checkForUpdates()
    return result?.updateInfo?.version ?? null
  }
  return null
})

ipcMain.handle('dialog:save', async (_event, options: Electron.SaveDialogOptions) => {
  if (!mainWindow) return null
  const result = await dialog.showSaveDialog(mainWindow, options)
  return result.canceled ? null : result.filePath
})

// ==================== APP LIFECYCLE ====================

app.whenReady().then(async () => {
  createWindow()
  createTray()
  await initAutoUpdater()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  } else {
    mainWindow.show()
  }
})

app.on('before-quit', () => {
  isQuitting = true
})
