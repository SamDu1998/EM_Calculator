import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type {
  ApertureEfficiencyValue,
  BandwidthValue,
  EmApi,
  Language,
  PythonReply,
} from '../shared/ipc'

const emApi: EmApi = {
  isPythonAvailable: (): Promise<boolean> => ipcRenderer.invoke('py:available'),

  pythonBandwidth: (fminHz: number, fmaxHz: number): Promise<PythonReply<BandwidthValue>> =>
    ipcRenderer.invoke('py:bandwidth', fminHz, fmaxHz),

  pythonApertureEfficiency: (
    frequencyHz: number,
    gainDbi: number,
    physicalAreaM2: number,
  ): Promise<PythonReply<ApertureEfficiencyValue>> =>
    ipcRenderer.invoke('py:aperture-efficiency', frequencyHz, gainDbi, physicalAreaM2),

  onSetLanguage: (handler: (lang: Language) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, lang: Language) => handler(lang)
    ipcRenderer.on('app:set-language', listener)
    return () => ipcRenderer.removeListener('app:set-language', listener)
  },

  windowMinimize: (): void => {
    ipcRenderer.send('window:minimize')
  },

  windowMaximize: (): void => {
    ipcRenderer.send('window:maximize')
  },

  windowClose: (): void => {
    ipcRenderer.send('window:close')
  },

  onWindowMaximized: (handler: (isMaximized: boolean) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, isMaximized: boolean) => handler(isMaximized)
    ipcRenderer.on('window:maximized', listener)
    return () => ipcRenderer.removeListener('window:maximized', listener)
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('emApi', emApi)
  } catch (error) {
    console.error('Failed to expose preload bridge', error)
  }
} else {
  // Should never happen — contextIsolation is true in main/index.ts
  ;(globalThis as unknown as { emApi: EmApi }).emApi = emApi
}
