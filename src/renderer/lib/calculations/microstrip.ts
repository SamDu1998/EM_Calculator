import { err, ok, type Result } from '../result'
import { SPEED_OF_LIGHT_M_PER_S } from './units'

export type MicrostripErrorCode =
  | 'width_not_positive'
  | 'height_not_positive'
  | 'er_less_than_one'

export interface MicrostripResult {
  /** Characteristic impedance in ohms */
  z0Ohm: number
  /** Effective relative permittivity */
  epsilonEff: number
  /** Phase velocity in m/s */
  phaseVelocityMPerS: number
  /** True when W/h or εr is outside the validated Hammerstad–Jensen range */
  outsideValidatedRange: boolean
}

const VACUUM_IMPEDANCE_OHM = 376.730313668

/** Stated accuracy range of the Hammerstad–Jensen model (1980). */
const MIN_VALID_RATIO = 0.01
const MAX_VALID_RATIO = 100
const MAX_VALID_ER = 128

/**
 * Microstrip characteristic impedance and effective permittivity using the
 * Hammerstad–Jensen closed-form model ("Accurate Models for Microstrip
 * Computer-Aided Design", 1980). Conductor thickness is assumed negligible.
 *
 * @param widthM - Trace width W in meters
 * @param heightM - Substrate height h in meters
 * @param er - Substrate relative permittivity, must be ≥ 1
 */
export function computeMicrostrip(
  widthM: number,
  heightM: number,
  er: number,
): Result<MicrostripResult, MicrostripErrorCode> {
  if (!Number.isFinite(widthM) || widthM <= 0) {
    return err('width_not_positive')
  }
  if (!Number.isFinite(heightM) || heightM <= 0) {
    return err('height_not_positive')
  }
  if (!Number.isFinite(er) || er < 1) {
    return err('er_less_than_one')
  }

  const u = widthM / heightM

  // εeff(u, εr) per Hammerstad–Jensen
  const a =
    1 +
    Math.log((u ** 4 + (u / 52) ** 2) / (u ** 4 + 0.432)) / 49 +
    Math.log(1 + (u / 18.1) ** 3) / 18.7
  const b = 0.564 * ((er - 0.9) / (er + 3)) ** 0.053
  const epsilonEff = (er + 1) / 2 + ((er - 1) / 2) * (1 + 10 / u) ** (-a * b)

  // Z0 of the air-filled line, then scaled by √εeff
  const f = 6 + (2 * Math.PI - 6) * Math.exp(-((30.666 / u) ** 0.7528))
  const z0AirOhm =
    (VACUUM_IMPEDANCE_OHM / (2 * Math.PI)) * Math.log(f / u + Math.sqrt(1 + (2 / u) ** 2))

  const sqrtEeff = Math.sqrt(epsilonEff)
  const z0Ohm = z0AirOhm / sqrtEeff
  const phaseVelocityMPerS = SPEED_OF_LIGHT_M_PER_S / sqrtEeff

  const outsideValidatedRange = u < MIN_VALID_RATIO || u > MAX_VALID_RATIO || er > MAX_VALID_ER

  return ok({ z0Ohm, epsilonEff, phaseVelocityMPerS, outsideValidatedRange })
}
