import { err, ok, type Result } from '../result'
import {
  validateCoplanar,
  type CoplanarErrorCode,
  type CoplanarResult,
} from './cpw'
import { ellipticKRatio } from './elliptic'
import { SPEED_OF_LIGHT_M_PER_S } from './units'

/**
 * Conductor-backed (grounded) coplanar waveguide using the standard
 * conformal-mapping model (Ghione/Simons): the bottom ground adds a
 * tanh-mapped parallel capacitance to the CPW half-spaces.
 *
 * @param widthM - Center conductor width W in meters
 * @param gapM - Gap S between center conductor and ground in meters
 * @param heightM - Substrate height h in meters
 * @param er - Substrate relative permittivity, must be ≥ 1
 */
export function computeGcpw(
  widthM: number,
  gapM: number,
  heightM: number,
  er: number,
): Result<CoplanarResult, CoplanarErrorCode> {
  const validationError = validateCoplanar(widthM, gapM, heightM, er)
  if (validationError != null) return err(validationError)

  const k = widthM / (widthM + 2 * gapM)
  const k3 =
    Math.tanh((Math.PI * widthM) / (4 * heightM)) /
    Math.tanh((Math.PI * (widthM + 2 * gapM)) / (4 * heightM))

  // q = K(k')/K(k) · K(k3)/K(k3')
  const q = ellipticKRatio(k3) / ellipticKRatio(k)
  const epsilonEff = (1 + er * q) / (1 + q)

  const sqrtEeff = Math.sqrt(epsilonEff)
  // Z0 = 60π/√εeff · 1 / (K(k)/K(k') + K(k3)/K(k3'))
  const z0Ohm = (60 * Math.PI) / sqrtEeff / (ellipticKRatio(k) + ellipticKRatio(k3))
  const phaseVelocityMPerS = SPEED_OF_LIGHT_M_PER_S / sqrtEeff

  return ok({ z0Ohm, epsilonEff, phaseVelocityMPerS })
}
