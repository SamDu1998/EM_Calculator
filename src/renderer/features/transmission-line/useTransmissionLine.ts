import { useMemo, useState } from 'react'
import { computeCoaxial, type CoaxialErrorCode } from '../../lib/calculations/coaxial'
import { computeMicrostrip, type MicrostripErrorCode } from '../../lib/calculations/microstrip'
import {
  LENGTH_UNITS,
  toMeters,
  type LengthUnit,
} from '../../lib/calculations/units'

export type TransmissionLineType = 'microstrip' | 'coaxial'
export const TRANSMISSION_LINE_TYPES: readonly TransmissionLineType[] = ['microstrip', 'coaxial']

export type TransmissionLineErrorCode = MicrostripErrorCode | CoaxialErrorCode

export interface MicrostripInputs {
  widthRaw: string
  widthUnit: LengthUnit
  heightRaw: string
  heightUnit: LengthUnit
  erRaw: string
}

export interface CoaxialInputs {
  innerRaw: string
  innerUnit: LengthUnit
  outerRaw: string
  outerUnit: LengthUnit
  erRaw: string
}

export interface TransmissionLineState {
  lineType: TransmissionLineType
  setLineType: (type: TransmissionLineType) => void
  microstrip: MicrostripInputs
  updateMicrostrip: (patch: Partial<MicrostripInputs>) => void
  coaxial: CoaxialInputs
  updateCoaxial: (patch: Partial<CoaxialInputs>) => void
  computed:
    | { kind: 'idle' }
    | {
        kind: 'ok'
        z0Ohm: number
        epsilonEff: number
        phaseVelocityMPerS: number
        outsideValidatedRange: boolean
      }
    | { kind: 'error'; error: TransmissionLineErrorCode }
}

function parseNumber(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

function parseLength(raw: string, unit: LengthUnit): number | null {
  const parsed = parseNumber(raw)
  return parsed != null ? toMeters(parsed, unit) : null
}

// Defaults are the classic 50 Ω designs: FR4 microstrip and solid-PE coax.
const MICROSTRIP_DEFAULTS: MicrostripInputs = {
  widthRaw: '3.06',
  widthUnit: 'mm',
  heightRaw: '1.6',
  heightUnit: 'mm',
  erRaw: '4.4',
}

const COAXIAL_DEFAULTS: CoaxialInputs = {
  innerRaw: '1.0',
  innerUnit: 'mm',
  outerRaw: '3.49',
  outerUnit: 'mm',
  erRaw: '2.25',
}

export function useTransmissionLine(): TransmissionLineState {
  const [lineType, setLineType] = useState<TransmissionLineType>('microstrip')
  const [microstrip, setMicrostrip] = useState<MicrostripInputs>(MICROSTRIP_DEFAULTS)
  const [coaxial, setCoaxial] = useState<CoaxialInputs>(COAXIAL_DEFAULTS)

  const updateMicrostrip = (patch: Partial<MicrostripInputs>): void =>
    setMicrostrip((prev) => ({ ...prev, ...patch }))
  const updateCoaxial = (patch: Partial<CoaxialInputs>): void =>
    setCoaxial((prev) => ({ ...prev, ...patch }))

  const computed = useMemo<TransmissionLineState['computed']>(() => {
    if (lineType === 'microstrip') {
      const widthM = parseLength(microstrip.widthRaw, microstrip.widthUnit)
      const heightM = parseLength(microstrip.heightRaw, microstrip.heightUnit)
      const er = parseNumber(microstrip.erRaw)
      if (widthM == null || heightM == null || er == null) return { kind: 'idle' }
      const result = computeMicrostrip(widthM, heightM, er)
      if (result.ok) return { kind: 'ok', ...result.value }
      return { kind: 'error', error: result.error }
    }

    const innerM = parseLength(coaxial.innerRaw, coaxial.innerUnit)
    const outerM = parseLength(coaxial.outerRaw, coaxial.outerUnit)
    const er = parseNumber(coaxial.erRaw)
    if (innerM == null || outerM == null || er == null) return { kind: 'idle' }
    const result = computeCoaxial(innerM, outerM, er)
    if (result.ok) return { kind: 'ok', ...result.value, outsideValidatedRange: false }
    return { kind: 'error', error: result.error }
  }, [lineType, microstrip, coaxial])

  return {
    lineType,
    setLineType,
    microstrip,
    updateMicrostrip,
    coaxial,
    updateCoaxial,
    computed,
  }
}

export { LENGTH_UNITS }
