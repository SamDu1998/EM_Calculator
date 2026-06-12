import { describe, expect, it } from 'vitest'
import { computeCpw, sinhRatio } from './cpw'
import { fixtures } from './fixtures'

describe('computeCpw', () => {
  describe('valid inputs', () => {
    for (const fx of fixtures.cpw) {
      it(`matches expected for ${fx.name}`, () => {
        const result = computeCpw(fx.widthM, fx.gapM, fx.heightM, fx.er)
        expect(result.ok).toBe(true)
        if (!result.ok) return

        expect(result.value.z0Ohm).toBeCloseTo(fx.expected.z0Ohm, 9)
        expect(result.value.epsilonEff).toBeCloseTo(fx.expected.epsilonEff, 12)
        expect(result.value.phaseVelocityMPerS).toBeCloseTo(fx.expected.phaseVelocityMPerS, 3)
      })
    }
  })

  describe('analytic limits', () => {
    it('converges to εeff = (εr + 1)/2 on an infinitely thick substrate', () => {
      const result = computeCpw(0.5e-3, 0.25e-3, 1, 9.8)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.epsilonEff).toBeCloseTo((9.8 + 1) / 2, 6)
    })

    it('keeps εeff at exactly 1 in air', () => {
      const result = computeCpw(0.5e-3, 0.25e-3, 0.635e-3, 1)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.epsilonEff).toBe(1)
    })
  })

  describe('physical relationships', () => {
    it('wider gap raises impedance', () => {
      const narrow = computeCpw(0.5e-3, 0.1e-3, 0.635e-3, 9.8)
      const wide = computeCpw(0.5e-3, 0.5e-3, 0.635e-3, 9.8)
      expect(narrow.ok && wide.ok).toBe(true)
      if (!narrow.ok || !wide.ok) return
      expect(wide.value.z0Ohm).toBeGreaterThan(narrow.value.z0Ohm)
    })

    it('higher permittivity lowers impedance', () => {
      const low = computeCpw(0.5e-3, 0.25e-3, 0.635e-3, 2.2)
      const high = computeCpw(0.5e-3, 0.25e-3, 0.635e-3, 9.8)
      expect(low.ok && high.ok).toBe(true)
      if (!low.ok || !high.ok) return
      expect(high.value.z0Ohm).toBeLessThan(low.value.z0Ohm)
    })

    it('stays finite for extreme aspect ratios (sinh overflow guard)', () => {
      const result = computeCpw(1, 0.5, 1e-3, 4.4)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(Number.isFinite(result.value.z0Ohm)).toBe(true)
      expect(Number.isFinite(result.value.epsilonEff)).toBe(true)
    })
  })

  describe('error handling', () => {
    it('rejects zero width', () => {
      expect(computeCpw(0, 0.25e-3, 0.635e-3, 9.8)).toEqual({
        ok: false,
        error: 'width_not_positive',
      })
    })

    it('rejects zero gap', () => {
      expect(computeCpw(0.5e-3, 0, 0.635e-3, 9.8)).toEqual({
        ok: false,
        error: 'gap_not_positive',
      })
    })

    it('rejects NaN height', () => {
      expect(computeCpw(0.5e-3, 0.25e-3, Number.NaN, 9.8)).toEqual({
        ok: false,
        error: 'height_not_positive',
      })
    })

    it('rejects er below one', () => {
      expect(computeCpw(0.5e-3, 0.25e-3, 0.635e-3, 0.9)).toEqual({
        ok: false,
        error: 'er_less_than_one',
      })
    })
  })
})

describe('sinhRatio', () => {
  it('matches direct evaluation in the normal range', () => {
    expect(sinhRatio(1, 2)).toBeCloseTo(Math.sinh(1) / Math.sinh(2), 12)
  })

  it('matches the exponential limit for large arguments', () => {
    expect(sinhRatio(400, 401)).toBeCloseTo(Math.exp(-1), 12)
  })
})
