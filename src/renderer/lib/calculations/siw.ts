import { err, ok, type Result } from '../result'
import { SPEED_OF_LIGHT_M_PER_S } from './units'

export type SiwErrorCode =
  | 'frequency_not_positive'
  | 'er_less_than_one'
  | 'width_not_positive'
  | 'width_too_small_for_vias'

export interface SiwResult {
  /** Recommended via diameter d in meters (λd/10) */
  viaDiameterM: number
  /** Recommended via pitch p in meters (1.5 · d) */
  viaPitchM: number
  /** Equivalent rectangular waveguide width in meters */
  effectiveWidthM: number
  /** TE10 cutoff frequency in Hz for the equivalent waveguide */
  cutoffFrequencyHz: number
  /** True when the operating frequency is at or below cutoff — the wave does not propagate */
  belowCutoff: boolean
}

/** Via diameter rule d ≈ λd/10 — conservative against the d < λg/5 leakage limit. */
const VIA_DIAMETER_FRACTION = 10
/** Pitch rule p = 1.5 · d, mid-range of the typical 1.5d – 2d window. */
const VIA_PITCH_RATIO = 1.5

/**
 * SIW via design rules and equivalent-waveguide parameters following
 * Deslandes & Wu ("Integrated Microstrip and Rectangular Waveguide in
 * Planar Form", 2001): aeff = a − d²/(0.95·p), fc = c/(2·aeff·√εr).
 *
 * @param frequencyHz - Operating frequency in Hz
 * @param er - Substrate relative permittivity, must be ≥ 1
 * @param widthM - Via center-to-center waveguide width a in meters
 */
export function computeSiw(
  frequencyHz: number,
  er: number,
  widthM: number,
): Result<SiwResult, SiwErrorCode> {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    return err('frequency_not_positive')
  }
  if (!Number.isFinite(er) || er < 1) {
    return err('er_less_than_one')
  }
  if (!Number.isFinite(widthM) || widthM <= 0) {
    return err('width_not_positive')
  }

  const sqrtEr = Math.sqrt(er)
  const lambdaDielectricM = SPEED_OF_LIGHT_M_PER_S / (frequencyHz * sqrtEr)

  const viaDiameterM = lambdaDielectricM / VIA_DIAMETER_FRACTION
  const viaPitchM = VIA_PITCH_RATIO * viaDiameterM

  const effectiveWidthM = widthM - (viaDiameterM * viaDiameterM) / (0.95 * viaPitchM)
  if (effectiveWidthM <= 0) {
    return err('width_too_small_for_vias')
  }

  const cutoffFrequencyHz = SPEED_OF_LIGHT_M_PER_S / (2 * effectiveWidthM * sqrtEr)
  const belowCutoff = frequencyHz <= cutoffFrequencyHz

  return ok({ viaDiameterM, viaPitchM, effectiveWidthM, cutoffFrequencyHz, belowCutoff })
}
