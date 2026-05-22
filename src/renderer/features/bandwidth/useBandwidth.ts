import { useMemo, useState } from 'react'
import { computeBandwidth, type BandwidthErrorCode } from '../../lib/calculations/bandwidth'
import {
  FREQUENCY_UNITS,
  toHz,
  type FrequencyUnit,
} from '../../lib/calculations/units'

export interface BandwidthInputs {
  fminRaw: string
  fminUnit: FrequencyUnit
  fmaxRaw: string
  fmaxUnit: FrequencyUnit
}

export interface BandwidthState {
  inputs: BandwidthInputs
  setFminRaw: (raw: string) => void
  setFminUnit: (unit: FrequencyUnit) => void
  setFmaxRaw: (raw: string) => void
  setFmaxUnit: (unit: FrequencyUnit) => void
  computed:
    | { kind: 'idle' }
    | {
        kind: 'ok'
        absoluteHz: number
        centerHz: number
        fractional: number
        relativePercent: number
      }
    | { kind: 'error'; error: BandwidthErrorCode }
  /** Resolved frequencies in Hz, exposed for Python cross-verification. */
  resolved: { fminHz: number | null; fmaxHz: number | null }
}

function parseNumber(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

export function useBandwidth(): BandwidthState {
  const [fminRaw, setFminRaw] = useState('2.4')
  const [fminUnit, setFminUnit] = useState<FrequencyUnit>('GHz')
  const [fmaxRaw, setFmaxRaw] = useState('2.4835')
  const [fmaxUnit, setFmaxUnit] = useState<FrequencyUnit>('GHz')

  const fminParsed = parseNumber(fminRaw)
  const fmaxParsed = parseNumber(fmaxRaw)

  const fminHz = fminParsed != null ? toHz(fminParsed, fminUnit) : null
  const fmaxHz = fmaxParsed != null ? toHz(fmaxParsed, fmaxUnit) : null

  const computed = useMemo<BandwidthState['computed']>(() => {
    if (fminHz == null || fmaxHz == null) return { kind: 'idle' }
    const result = computeBandwidth(fminHz, fmaxHz)
    if (result.ok) return { kind: 'ok', ...result.value }
    return { kind: 'error', error: result.error }
  }, [fminHz, fmaxHz])

  return {
    inputs: { fminRaw, fminUnit, fmaxRaw, fmaxUnit },
    setFminRaw,
    setFminUnit,
    setFmaxRaw,
    setFmaxUnit,
    computed,
    resolved: { fminHz, fmaxHz },
  }
}

export { FREQUENCY_UNITS }
