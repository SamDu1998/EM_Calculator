import { err, ok, type Result } from '../result'
import { SPEED_OF_LIGHT_M_PER_S } from './units'

export type ApertureEfficiencyErrorCode =
  | 'frequency_not_positive'
  | 'gain_not_finite'
  | 'area_not_positive'

export interface ApertureEfficiencyResult {
  /** Wavelength λ in meters */
  wavelengthM: number
  /** Effective aperture area Ae in m² */
  effectiveAreaM2: number
  /** Aperture efficiency η as a percentage. Values > 100% imply gain or area inputs are physically inconsistent. */
  efficiencyPercent: number
  /** True when the computed efficiency exceeds 100%; UI should surface a warning. */
  exceedsPhysicalLimit: boolean
}

/**
 * Compute aperture efficiency from frequency, antenna gain (dBi), and physical aperture area.
 *
 * η = Ae / A_phys, where Ae = λ² / (4π) · 10^(G/10) and λ = c / f.
 */
export function computeApertureEfficiency(
  frequencyHz: number,
  gainDbi: number,
  physicalAreaM2: number,
): Result<ApertureEfficiencyResult, ApertureEfficiencyErrorCode> {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    return err('frequency_not_positive')
  }
  if (!Number.isFinite(gainDbi)) {
    return err('gain_not_finite')
  }
  if (!Number.isFinite(physicalAreaM2) || physicalAreaM2 <= 0) {
    return err('area_not_positive')
  }

  const wavelengthM = SPEED_OF_LIGHT_M_PER_S / frequencyHz
  const linearGain = Math.pow(10, gainDbi / 10)
  const effectiveAreaM2 = ((wavelengthM * wavelengthM) / (4 * Math.PI)) * linearGain
  const efficiencyRatio = effectiveAreaM2 / physicalAreaM2
  const efficiencyPercent = efficiencyRatio * 100

  return ok({
    wavelengthM,
    effectiveAreaM2,
    efficiencyPercent,
    exceedsPhysicalLimit: efficiencyRatio > 1,
  })
}
