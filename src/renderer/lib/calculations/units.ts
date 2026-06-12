export const SPEED_OF_LIGHT_M_PER_S = 299_792_458

export type FrequencyUnit = 'Hz' | 'kHz' | 'MHz' | 'GHz'
export type AreaUnit = 'm2' | 'cm2'
export type LengthUnit = 'mm' | 'um' | 'mil'

const FREQUENCY_UNIT_FACTORS: Readonly<Record<FrequencyUnit, number>> = {
  Hz: 1,
  kHz: 1e3,
  MHz: 1e6,
  GHz: 1e9,
}

const AREA_UNIT_FACTORS: Readonly<Record<AreaUnit, number>> = {
  m2: 1,
  cm2: 1e-4,
}

const LENGTH_UNIT_FACTORS: Readonly<Record<LengthUnit, number>> = {
  mm: 1e-3,
  um: 1e-6,
  mil: 2.54e-5,
}

export const FREQUENCY_UNITS: readonly FrequencyUnit[] = ['Hz', 'kHz', 'MHz', 'GHz']
export const AREA_UNITS: readonly AreaUnit[] = ['m2', 'cm2']
export const LENGTH_UNITS: readonly LengthUnit[] = ['mm', 'um', 'mil']

export function toHz(value: number, unit: FrequencyUnit): number {
  return value * FREQUENCY_UNIT_FACTORS[unit]
}

export function toMetersSquared(value: number, unit: AreaUnit): number {
  return value * AREA_UNIT_FACTORS[unit]
}

export function toMeters(value: number, unit: LengthUnit): number {
  return value * LENGTH_UNIT_FACTORS[unit]
}

export function fromHz(hz: number, unit: FrequencyUnit): number {
  return hz / FREQUENCY_UNIT_FACTORS[unit]
}
