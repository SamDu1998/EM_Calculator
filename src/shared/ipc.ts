/** Shared IPC payload types used by both preload and renderer code. */

export interface PythonOk<T> {
  ok: true
  value: T
}

export interface PythonErr {
  ok: false
  error: string
}

export type PythonReply<T> = PythonOk<T> | PythonErr

export interface BandwidthValue {
  absoluteHz: number
  centerHz: number
  fractional: number
  relativePercent: number
}

export interface ApertureEfficiencyValue {
  wavelengthM: number
  effectiveAreaM2: number
  efficiencyPercent: number
  exceedsPhysicalLimit: boolean
}

export type Language = 'en' | 'zh'

export interface EmApi {
  isPythonAvailable: () => Promise<boolean>
  pythonBandwidth: (fminHz: number, fmaxHz: number) => Promise<PythonReply<BandwidthValue>>
  pythonApertureEfficiency: (
    frequencyHz: number,
    gainDbi: number,
    physicalAreaM2: number,
  ) => Promise<PythonReply<ApertureEfficiencyValue>>
  onSetLanguage: (handler: (lang: Language) => void) => () => void
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void
  onWindowMaximized: (handler: (isMaximized: boolean) => void) => () => void
}
