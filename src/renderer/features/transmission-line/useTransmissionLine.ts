import { useMemo, useState } from 'react'
import { computeCoaxial, type CoaxialErrorCode } from '../../lib/calculations/coaxial'
import { computeCpw, type CoplanarErrorCode } from '../../lib/calculations/cpw'
import { computeGcpw } from '../../lib/calculations/gcpw'
import { computeMicrostrip, type MicrostripErrorCode } from '../../lib/calculations/microstrip'
import {
  LENGTH_UNITS,
  toMeters,
  type LengthUnit,
} from '../../lib/calculations/units'

export type TransmissionLineType = 'microstrip' | 'cpw' | 'gcpw' | 'coaxial'
export const TRANSMISSION_LINE_TYPES: readonly TransmissionLineType[] = [
  'microstrip',
  'cpw',
  'gcpw',
  'coaxial',
]

export type TransmissionLineErrorCode =
  | MicrostripErrorCode
  | CoaxialErrorCode
  | CoplanarErrorCode

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

export interface CoplanarInputs {
  widthRaw: string
  widthUnit: LengthUnit
  gapRaw: string
  gapUnit: LengthUnit
  heightRaw: string
  heightUnit: LengthUnit
  erRaw: string
}

export type TransmissionLineComputed =
  | { kind: 'idle' }
  | {
      kind: 'ok'
      z0Ohm: number
      epsilonEff: number
      phaseVelocityMPerS: number
      outsideValidatedRange: boolean
    }
  | { kind: 'error'; error: TransmissionLineErrorCode }

export interface TransmissionLineState {
  lineType: TransmissionLineType
  setLineType: (type: TransmissionLineType) => void
  microstrip: MicrostripInputs
  updateMicrostrip: (patch: Partial<MicrostripInputs>) => void
  coaxial: CoaxialInputs
  updateCoaxial: (patch: Partial<CoaxialInputs>) => void
  coplanar: CoplanarInputs
  updateCoplanar: (patch: Partial<CoplanarInputs>) => void
  computed: TransmissionLineComputed
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

// Defaults are classic designs: 50 Ω FR4 microstrip, solid-PE 50 Ω coax,
// and the alumina CPW geometry used widely in hybrid circuits.
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

const COPLANAR_DEFAULTS: CoplanarInputs = {
  widthRaw: '0.5',
  widthUnit: 'mm',
  gapRaw: '0.25',
  gapUnit: 'mm',
  heightRaw: '0.635',
  heightUnit: 'mm',
  erRaw: '9.8',
}

function computeMicrostripState(inputs: MicrostripInputs): TransmissionLineComputed {
  const widthM = parseLength(inputs.widthRaw, inputs.widthUnit)
  const heightM = parseLength(inputs.heightRaw, inputs.heightUnit)
  const er = parseNumber(inputs.erRaw)
  if (widthM == null || heightM == null || er == null) return { kind: 'idle' }
  const result = computeMicrostrip(widthM, heightM, er)
  if (result.ok) return { kind: 'ok', ...result.value }
  return { kind: 'error', error: result.error }
}

function computeCoaxialState(inputs: CoaxialInputs): TransmissionLineComputed {
  const innerM = parseLength(inputs.innerRaw, inputs.innerUnit)
  const outerM = parseLength(inputs.outerRaw, inputs.outerUnit)
  const er = parseNumber(inputs.erRaw)
  if (innerM == null || outerM == null || er == null) return { kind: 'idle' }
  const result = computeCoaxial(innerM, outerM, er)
  if (result.ok) return { kind: 'ok', ...result.value, outsideValidatedRange: false }
  return { kind: 'error', error: result.error }
}

function computeCoplanarState(
  inputs: CoplanarInputs,
  grounded: boolean,
): TransmissionLineComputed {
  const widthM = parseLength(inputs.widthRaw, inputs.widthUnit)
  const gapM = parseLength(inputs.gapRaw, inputs.gapUnit)
  const heightM = parseLength(inputs.heightRaw, inputs.heightUnit)
  const er = parseNumber(inputs.erRaw)
  if (widthM == null || gapM == null || heightM == null || er == null) return { kind: 'idle' }
  const compute = grounded ? computeGcpw : computeCpw
  const result = compute(widthM, gapM, heightM, er)
  if (result.ok) return { kind: 'ok', ...result.value, outsideValidatedRange: false }
  return { kind: 'error', error: result.error }
}

export function useTransmissionLine(): TransmissionLineState {
  const [lineType, setLineType] = useState<TransmissionLineType>('microstrip')
  const [microstrip, setMicrostrip] = useState<MicrostripInputs>(MICROSTRIP_DEFAULTS)
  const [coaxial, setCoaxial] = useState<CoaxialInputs>(COAXIAL_DEFAULTS)
  const [coplanar, setCoplanar] = useState<CoplanarInputs>(COPLANAR_DEFAULTS)

  const updateMicrostrip = (patch: Partial<MicrostripInputs>): void =>
    setMicrostrip((prev) => ({ ...prev, ...patch }))
  const updateCoaxial = (patch: Partial<CoaxialInputs>): void =>
    setCoaxial((prev) => ({ ...prev, ...patch }))
  const updateCoplanar = (patch: Partial<CoplanarInputs>): void =>
    setCoplanar((prev) => ({ ...prev, ...patch }))

  const computed = useMemo<TransmissionLineComputed>(() => {
    switch (lineType) {
      case 'microstrip':
        return computeMicrostripState(microstrip)
      case 'coaxial':
        return computeCoaxialState(coaxial)
      case 'cpw':
        return computeCoplanarState(coplanar, false)
      case 'gcpw':
        return computeCoplanarState(coplanar, true)
    }
  }, [lineType, microstrip, coaxial, coplanar])

  return {
    lineType,
    setLineType,
    microstrip,
    updateMicrostrip,
    coaxial,
    updateCoaxial,
    coplanar,
    updateCoplanar,
    computed,
  }
}

export { LENGTH_UNITS }
