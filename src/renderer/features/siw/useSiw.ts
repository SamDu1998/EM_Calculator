import { useMemo, useState } from 'react'
import { computeSiw, type SiwErrorCode } from '../../lib/calculations/siw'
import {
  FREQUENCY_UNITS,
  LENGTH_UNITS,
  toHz,
  toMeters,
  type FrequencyUnit,
  type LengthUnit,
} from '../../lib/calculations/units'

export interface SiwInputs {
  frequencyRaw: string
  frequencyUnit: FrequencyUnit
  erRaw: string
  widthRaw: string
  widthUnit: LengthUnit
}

export interface SiwState {
  inputs: SiwInputs
  setFrequencyRaw: (raw: string) => void
  setFrequencyUnit: (unit: FrequencyUnit) => void
  setErRaw: (raw: string) => void
  setWidthRaw: (raw: string) => void
  setWidthUnit: (unit: LengthUnit) => void
  computed:
    | { kind: 'idle' }
    | {
        kind: 'ok'
        viaDiameterM: number
        viaPitchM: number
        effectiveWidthM: number
        cutoffFrequencyHz: number
        belowCutoff: boolean
      }
    | { kind: 'error'; error: SiwErrorCode }
}

function parseNumber(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

export function useSiw(): SiwState {
  const [frequencyRaw, setFrequencyRaw] = useState('10')
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>('GHz')
  const [erRaw, setErRaw] = useState('3.38')
  const [widthRaw, setWidthRaw] = useState('13')
  const [widthUnit, setWidthUnit] = useState<LengthUnit>('mm')

  const frequencyParsed = parseNumber(frequencyRaw)
  const erParsed = parseNumber(erRaw)
  const widthParsed = parseNumber(widthRaw)

  const frequencyHz = frequencyParsed != null ? toHz(frequencyParsed, frequencyUnit) : null
  const widthM = widthParsed != null ? toMeters(widthParsed, widthUnit) : null

  const computed = useMemo<SiwState['computed']>(() => {
    if (frequencyHz == null || erParsed == null || widthM == null) return { kind: 'idle' }
    const result = computeSiw(frequencyHz, erParsed, widthM)
    if (result.ok) return { kind: 'ok', ...result.value }
    return { kind: 'error', error: result.error }
  }, [frequencyHz, erParsed, widthM])

  return {
    inputs: { frequencyRaw, frequencyUnit, erRaw, widthRaw, widthUnit },
    setFrequencyRaw,
    setFrequencyUnit,
    setErRaw,
    setWidthRaw,
    setWidthUnit,
    computed,
  }
}

export { FREQUENCY_UNITS, LENGTH_UNITS }
