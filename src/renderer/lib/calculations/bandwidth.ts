import { err, ok, type Result } from '../result'

export type BandwidthErrorCode = 'fmin_not_positive' | 'fmax_not_greater_than_fmin'

export interface BandwidthResult {
  /** Absolute bandwidth in Hz (fmax − fmin) */
  absoluteHz: number
  /** Relative bandwidth as a percentage: (fmax − fmin) / fcenter × 100 */
  relativePercent: number
  /** Center frequency in Hz: (fmin + fmax) / 2 */
  centerHz: number
  /** Fractional bandwidth: (fmax − fmin) / fcenter, in 0..2 */
  fractional: number
}

export function computeBandwidth(
  fminHz: number,
  fmaxHz: number,
): Result<BandwidthResult, BandwidthErrorCode> {
  if (!Number.isFinite(fminHz) || fminHz <= 0) {
    return err('fmin_not_positive')
  }
  if (!Number.isFinite(fmaxHz) || fmaxHz <= fminHz) {
    return err('fmax_not_greater_than_fmin')
  }

  const absoluteHz = fmaxHz - fminHz
  const centerHz = (fmaxHz + fminHz) / 2
  const fractional = absoluteHz / centerHz
  const relativePercent = fractional * 100

  return ok({ absoluteHz, relativePercent, centerHz, fractional })
}
