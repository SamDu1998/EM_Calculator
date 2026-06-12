import { err, ok, type Result } from '../result'
import { SPEED_OF_LIGHT_M_PER_S } from './units'

export type CoaxialErrorCode =
  | 'inner_not_positive'
  | 'outer_not_greater_than_inner'
  | 'er_less_than_one'

export interface CoaxialResult {
  /** Characteristic impedance in ohms */
  z0Ohm: number
  /** Effective relative permittivity (= εr for the TEM mode) */
  epsilonEff: number
  /** Phase velocity in m/s */
  phaseVelocityMPerS: number
}

/**
 * Coaxial line characteristic impedance for the TEM mode:
 * Z₀ = 60/√εr · ln(D/d).
 *
 * @param innerDiameterM - Inner conductor diameter d in meters
 * @param outerDiameterM - Outer conductor inner diameter D in meters, must exceed d
 * @param er - Dielectric relative permittivity, must be ≥ 1
 */
export function computeCoaxial(
  innerDiameterM: number,
  outerDiameterM: number,
  er: number,
): Result<CoaxialResult, CoaxialErrorCode> {
  if (!Number.isFinite(innerDiameterM) || innerDiameterM <= 0) {
    return err('inner_not_positive')
  }
  if (!Number.isFinite(outerDiameterM) || outerDiameterM <= innerDiameterM) {
    return err('outer_not_greater_than_inner')
  }
  if (!Number.isFinite(er) || er < 1) {
    return err('er_less_than_one')
  }

  const sqrtEr = Math.sqrt(er)
  const z0Ohm = (60 / sqrtEr) * Math.log(outerDiameterM / innerDiameterM)
  const phaseVelocityMPerS = SPEED_OF_LIGHT_M_PER_S / sqrtEr

  return ok({ z0Ohm, epsilonEff: er, phaseVelocityMPerS })
}
