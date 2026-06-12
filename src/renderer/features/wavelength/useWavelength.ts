import { useMemo, useState } from 'react'
import {
  FREQUENCY_UNITS,
  toHz,
  type FrequencyUnit,
} from '../../lib/calculations/units'
import { computeWavelength, type WavelengthErrorCode } from '../../lib/calculations/wavelength'

export interface WavelengthInputs {
  frequencyRaw: string
  frequencyUnit: FrequencyUnit
  erRaw: string
}

export interface WavelengthState {
  inputs: WavelengthInputs
  setFrequencyRaw: (raw: string) => void
  setFrequencyUnit: (unit: FrequencyUnit) => void
  setErRaw: (raw: string) => void
  computed:
    | { kind: 'idle' }
    | {
        kind: 'ok'
        lambda0M: number
        lambdaGM: number
        halfLambdaGM: number
        quarterLambdaGM: number
        phaseVelocityMPerS: number
      }
    | { kind: 'error'; error: WavelengthErrorCode }
}

function parseNumber(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

export function useWavelength(): WavelengthState {
  const [frequencyRaw, setFrequencyRaw] = useState('2.4')
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>('GHz')
  const [erRaw, setErRaw] = useState('1.0')

  const frequencyParsed = parseNumber(frequencyRaw)
  const erParsed = parseNumber(erRaw)

  const frequencyHz = frequencyParsed != null ? toHz(frequencyParsed, frequencyUnit) : null

  const computed = useMemo<WavelengthState['computed']>(() => {
    if (frequencyHz == null || erParsed == null) return { kind: 'idle' }
    const result = computeWavelength(frequencyHz, erParsed)
    if (result.ok) return { kind: 'ok', ...result.value }
    return { kind: 'error', error: result.error }
  }, [frequencyHz, erParsed])

  return {
    inputs: { frequencyRaw, frequencyUnit, erRaw },
    setFrequencyRaw,
    setFrequencyUnit,
    setErRaw,
    computed,
  }
}

export { FREQUENCY_UNITS }
