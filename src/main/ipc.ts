import { ipcMain } from 'electron'
import { isPythonAvailable, runPythonAction } from './python'

export interface IpcPythonOk<T> {
  ok: true
  value: T
}

export interface IpcPythonErr {
  ok: false
  error: string
}

export type IpcPythonResult<T> = IpcPythonOk<T> | IpcPythonErr

interface BandwidthValue {
  absoluteHz: number
  centerHz: number
  fractional: number
  relativePercent: number
}

interface ApertureEfficiencyValue {
  wavelengthM: number
  effectiveAreaM2: number
  efficiencyPercent: number
  exceedsPhysicalLimit: boolean
}

function adaptError(
  error:
    | { kind: 'spawn_failed'; detail: string }
    | { kind: 'timeout' }
    | { kind: 'non_zero_exit'; code: number | null; stderr: string }
    | { kind: 'invalid_json'; stdout: string },
): IpcPythonErr {
  switch (error.kind) {
    case 'spawn_failed':
      return { ok: false, error: `python_spawn_failed:${error.detail}` }
    case 'timeout':
      return { ok: false, error: 'python_timeout' }
    case 'non_zero_exit':
      return { ok: false, error: `python_exit_${error.code}:${error.stderr}` }
    case 'invalid_json':
      return { ok: false, error: 'python_invalid_json' }
  }
}

export function registerIpcHandlers(): void {
  ipcMain.handle('py:available', async () => {
    return isPythonAvailable()
  })

  ipcMain.handle(
    'py:bandwidth',
    async (_event, fminHz: number, fmaxHz: number): Promise<IpcPythonResult<BandwidthValue>> => {
      const result = await runPythonAction('bandwidth', [
        '--fmin-hz',
        String(fminHz),
        '--fmax-hz',
        String(fmaxHz),
      ])
      if (!result.ok) return adaptError(result.error)
      const raw = result.raw
      if (!raw.ok) {
        return { ok: false, error: `validation:${raw.error ?? 'unknown'}` }
      }
      return { ok: true, value: raw.value as BandwidthValue }
    },
  )

  ipcMain.handle(
    'py:aperture-efficiency',
    async (
      _event,
      frequencyHz: number,
      gainDbi: number,
      physicalAreaM2: number,
    ): Promise<IpcPythonResult<ApertureEfficiencyValue>> => {
      const result = await runPythonAction('aperture-efficiency', [
        '--frequency-hz',
        String(frequencyHz),
        '--gain-dbi',
        String(gainDbi),
        '--area-m2',
        String(physicalAreaM2),
      ])
      if (!result.ok) return adaptError(result.error)
      const raw = result.raw
      if (!raw.ok) {
        return { ok: false, error: `validation:${raw.error ?? 'unknown'}` }
      }
      return { ok: true, value: raw.value as ApertureEfficiencyValue }
    },
  )
}
