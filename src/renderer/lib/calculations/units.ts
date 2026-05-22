export const SPEED_OF_LIGHT_M_PER_S = 299_792_458

export type FrequencyUnit = 'Hz' | 'kHz' | 'MHz' | 'GHz'
export type AreaUnit = 'm2' | 'cm2'

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

export const FREQUENCY_UNITS: readonly FrequencyUnit[] = ['Hz', 'kHz', 'MHz', 'GHz']
export const AREA_UNITS: readonly AreaUnit[] = ['m2', 'cm2']

export function toHz(value: number, unit: FrequencyUnit): number {
  return value * FREQUENCY_UNIT_FACTORS[unit]
}

export function toMetersSquared(value: number, unit: AreaUnit): number {
  return value * AREA_UNIT_FACTORS[unit]
}

export function fromHz(hz: number, unit: FrequencyUnit): number {
  return hz / FREQUENCY_UNIT_FACTORS[unit]
}
