import { describe, expect, it } from 'vitest'
import { SPEED_OF_LIGHT_M_PER_S } from './units'
import { computeCoaxial } from './coaxial'
import { fixtures } from './fixtures'

describe('computeCoaxial', () => {
  describe('valid inputs', () => {
    for (const fx of fixtures.coaxial) {
      it(`matches expected for ${fx.name}`, () => {
        const result = computeCoaxial(fx.innerDiameterM, fx.outerDiameterM, fx.er)
        expect(result.ok).toBe(true)
        if (!result.ok) return

        expect(result.value.z0Ohm).toBeCloseTo(fx.expected.z0Ohm, 9)
        expect(result.value.epsilonEff).toBe(fx.expected.epsilonEff)
        expect(result.value.phaseVelocityMPerS).toBeCloseTo(fx.expected.phaseVelocityMPerS, 3)
      })
    }
  })

  describe('reference designs', () => {
    it('solid-PE 50 Ω cable geometry (D/d = e^1.25, εr = 2.25)', () => {
      const result = computeCoaxial(1e-3, Math.E ** 1.25 * 1e-3, 2.25)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.z0Ohm).toBeCloseTo(50, 9)
    })

    it('same geometry in air gives 75 Ω', () => {
      const result = computeCoaxial(1e-3, Math.E ** 1.25 * 1e-3, 1)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.z0Ohm).toBeCloseTo(75, 9)
    })
  })

  describe('physical relationships', () => {
    it('larger outer diameter raises impedance', () => {
      const small = computeCoaxial(1e-3, 3e-3, 2.25)
      const large = computeCoaxial(1e-3, 5e-3, 2.25)
      expect(small.ok && large.ok).toBe(true)
      if (!small.ok || !large.ok) return
      expect(large.value.z0Ohm).toBeGreaterThan(small.value.z0Ohm)
    })

    it('phase velocity is c over sqrt(er)', () => {
      const result = computeCoaxial(1e-3, 3e-3, 4)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.phaseVelocityMPerS).toBeCloseTo(SPEED_OF_LIGHT_M_PER_S / 2, 6)
    })
  })

  describe('error handling', () => {
    it('rejects zero inner diameter', () => {
      expect(computeCoaxial(0, 3e-3, 2.25)).toEqual({ ok: false, error: 'inner_not_positive' })
    })

    it('rejects NaN inner diameter', () => {
      expect(computeCoaxial(Number.NaN, 3e-3, 2.25)).toEqual({
        ok: false,
        error: 'inner_not_positive',
      })
    })

    it('rejects outer equal to inner', () => {
      expect(computeCoaxial(1e-3, 1e-3, 2.25)).toEqual({
        ok: false,
        error: 'outer_not_greater_than_inner',
      })
    })

    it('rejects outer smaller than inner', () => {
      expect(computeCoaxial(2e-3, 1e-3, 2.25)).toEqual({
        ok: false,
        error: 'outer_not_greater_than_inner',
      })
    })

    it('rejects er below one', () => {
      expect(computeCoaxial(1e-3, 3e-3, 0.9)).toEqual({ ok: false, error: 'er_less_than_one' })
    })
  })
})
