import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  // App info
  getVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => ipcRenderer.invoke('app:platform'),
  isPackaged: () => ipcRenderer.invoke('app:isPackaged'),

  // Auto-update
  checkForUpdate: () => ipcRenderer.invoke('update:check'),
  onUpdateDownloading: (callback: () => void) =>
    ipcRenderer.on('update:downloading', callback),
  onUpdateProgress: (callback: (_event: unknown, percent: number) => void) =>
    ipcRenderer.on('update:progress', callback),

  // Navigation from tray
  onNavigate: (callback: (_event: unknown, path: string) => void) =>
    ipcRenderer.on('navigate', callback),

  // File dialog
  showSaveDialog: (options: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) =>
    ipcRenderer.invoke('dialog:save', options),
})
