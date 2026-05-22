import { useMemo, useState } from 'react'
import {
  computeApertureEfficiency,
  type ApertureEfficiencyErrorCode,
} from '../../lib/calculations/apertureEfficiency'
import {
  AREA_UNITS,
  FREQUENCY_UNITS,
  toHz,
  toMetersSquared,
  type AreaUnit,
  type FrequencyUnit,
} from '../../lib/calculations/units'

export interface ApertureEfficiencyInputs {
  frequencyRaw: string
  frequencyUnit: FrequencyUnit
  gainRaw: string
  areaRaw: string
  areaUnit: AreaUnit
}

export interface ApertureEfficiencyState {
  inputs: ApertureEfficiencyInputs
  setFrequencyRaw: (raw: string) => void
  setFrequencyUnit: (unit: FrequencyUnit) => void
  setGainRaw: (raw: string) => void
  setAreaRaw: (raw: string) => void
  setAreaUnit: (unit: AreaUnit) => void
  computed:
    | { kind: 'idle' }
    | {
        kind: 'ok'
        wavelengthM: number
        effectiveAreaM2: number
        efficiencyPercent: number
        exceedsPhysicalLimit: boolean
      }
    | { kind: 'error'; error: ApertureEfficiencyErrorCode }
  resolved: {
    frequencyHz: number | null
    gainDbi: number | null
    physicalAreaM2: number | null
  }
}

function parseNumber(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const v = Number(trimmed)
  return Number.isFinite(v) ? v : null
}

export function useApertureEfficiency(): ApertureEfficiencyState {
  const [frequencyRaw, setFrequencyRaw] = useState('10')
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>('GHz')
  const [gainRaw, setGainRaw] = useState('30')
  const [areaRaw, setAreaRaw] = useState('1')
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('m2')

  const fParsed = parseNumber(frequencyRaw)
  const gParsed = parseNumber(gainRaw)
  const aParsed = parseNumber(areaRaw)

  const frequencyHz = fParsed != null ? toHz(fParsed, frequencyUnit) : null
  const gainDbi = gParsed
  const physicalAreaM2 = aParsed != null ? toMetersSquared(aParsed, areaUnit) : null

  const computed = useMemo<ApertureEfficiencyState['computed']>(() => {
    if (frequencyHz == null || gainDbi == null || physicalAreaM2 == null) {
      return { kind: 'idle' }
    }
    const result = computeApertureEfficiency(frequencyHz, gainDbi, physicalAreaM2)
    if (result.ok) return { kind: 'ok', ...result.value }
    return { kind: 'error', error: result.error }
  }, [frequencyHz, gainDbi, physicalAreaM2])

  return {
    inputs: { frequencyRaw, frequencyUnit, gainRaw, areaRaw, areaUnit },
    setFrequencyRaw,
    setFrequencyUnit,
    setGainRaw,
    setAreaRaw,
    setAreaUnit,
    computed,
    resolved: { frequencyHz, gainDbi, physicalAreaM2 },
  }
}

export { AREA_UNITS, FREQUENCY_UNITS }
