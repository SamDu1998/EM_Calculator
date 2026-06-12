import { err, ok, type Result } from '../result'
import { SPEED_OF_LIGHT_M_PER_S } from './units'

export type WavelengthErrorCode = 'frequency_not_positive' | 'er_less_than_one'

export interface WavelengthResult {
  /** Free-space wavelength in meters */
  lambda0M: number
  /** Guided wavelength in meters (in dielectric) */
  lambdaGM: number
  /** Half guided wavelength in meters */
  halfLambdaGM: number
  /** Quarter guided wavelength in meters */
  quarterLambdaGM: number
  /** Phase velocity in m/s */
  phaseVelocityMPerS: number
}

/**
 * Calculate wavelength parameters for a given frequency and dielectric constant.
 *
 * @param frequencyHz - Frequency in Hz
 * @param er - Relative permittivity (dielectric constant), must be ≥ 1
 * @returns Wavelength calculations or error
 */
export function computeWavelength(
  frequencyHz: number,
  er: number,
): Result<WavelengthResult, WavelengthErrorCode> {
  // Validate frequency
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    return err('frequency_not_positive')
  }

  // Validate relative permittivity
  if (!Number.isFinite(er) || er < 1) {
    return err('er_less_than_one')
  }

  // Free-space wavelength: λ₀ = c / f
  const lambda0M = SPEED_OF_LIGHT_M_PER_S / frequencyHz

  // For TEM mode in a uniform dielectric: λg = λ₀ / √εr
  const sqrtEr = Math.sqrt(er)
  const lambdaGM = lambda0M / sqrtEr

  // Derived values
  const halfLambdaGM = lambdaGM / 2
  const quarterLambdaGM = lambdaGM / 4

  // Phase velocity: vp = c / √εr
  const phaseVelocityMPerS = SPEED_OF_LIGHT_M_PER_S / sqrtEr

  return ok({
    lambda0M,
    lambdaGM,
    halfLambdaGM,
    quarterLambdaGM,
    phaseVelocityMPerS,
  })
}
