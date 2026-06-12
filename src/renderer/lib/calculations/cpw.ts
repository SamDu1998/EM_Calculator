import { err, ok, type Result } from '../result'
import { ellipticKRatio } from './elliptic'
import { SPEED_OF_LIGHT_M_PER_S } from './units'

export type CoplanarErrorCode =
  | 'width_not_positive'
  | 'gap_not_positive'
  | 'height_not_positive'
  | 'er_less_than_one'

export interface CoplanarResult {
  /** Characteristic impedance in ohms */
  z0Ohm: number
  /** Effective relative permittivity */
  epsilonEff: number
  /** Phase velocity in m/s */
  phaseVelocityMPerS: number
}

export function validateCoplanar(
  widthM: number,
  gapM: number,
  heightM: number,
  er: number,
): CoplanarErrorCode | null {
  if (!Number.isFinite(widthM) || widthM <= 0) return 'width_not_positive'
  if (!Number.isFinite(gapM) || gapM <= 0) return 'gap_not_positive'
  if (!Number.isFinite(heightM) || heightM <= 0) return 'height_not_positive'
  if (!Number.isFinite(er) || er < 1) return 'er_less_than_one'
  return null
}

/** sinh(x)/sinh(y) for 0 < x < y, switching to exp(x − y) before sinh overflows. */
export function sinhRatio(x: number, y: number): number {
  if (y > 350) return Math.exp(x - y)
  return Math.sinh(x) / Math.sinh(y)
}

/**
 * Conventional coplanar waveguide on a finite substrate (no bottom ground),
 * via the conformal-mapping model of Ghione & Naldi ("Analytical Formulas
 * for Coplanar Lines in Hybrid and Monolithic MICs", 1987).
 *
 * @param widthM - Center conductor width W in meters
 * @param gapM - Gap S between center conductor and ground in meters
 * @param heightM - Substrate height h in meters
 * @param er - Substrate relative permittivity, must be ≥ 1
 */
export function computeCpw(
  widthM: number,
  gapM: number,
  heightM: number,
  er: number,
): Result<CoplanarResult, CoplanarErrorCode> {
  const validationError = validateCoplanar(widthM, gapM, heightM, er)
  if (validationError != null) return err(validationError)

  const k0 = widthM / (widthM + 2 * gapM)
  const k1 = sinhRatio(
    (Math.PI * widthM) / (4 * heightM),
    (Math.PI * (widthM + 2 * gapM)) / (4 * heightM),
  )

  // εeff = 1 + (εr − 1)/2 · [K(k1)/K(k1')] · [K(k0')/K(k0)]
  const epsilonEff = 1 + ((er - 1) / 2) * (ellipticKRatio(k1) / ellipticKRatio(k0))

  const sqrtEeff = Math.sqrt(epsilonEff)
  // Z0 = 30π/√εeff · K(k0')/K(k0)
  const z0Ohm = (30 * Math.PI) / sqrtEeff / ellipticKRatio(k0)
  const phaseVelocityMPerS = SPEED_OF_LIGHT_M_PER_S / sqrtEeff

  return ok({ z0Ohm, epsilonEff, phaseVelocityMPerS })
}
