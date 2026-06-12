import { describe, expect, it } from 'vitest'
import { computeCpw } from './cpw'
import { computeGcpw } from './gcpw'
import { fixtures } from './fixtures'

describe('computeGcpw', () => {
  describe('valid inputs', () => {
    for (const fx of fixtures.gcpw) {
      it(`matches expected for ${fx.name}`, () => {
        const result = computeGcpw(fx.widthM, fx.gapM, fx.heightM, fx.er)
        expect(result.ok).toBe(true)
        if (!result.ok) return

        expect(result.value.z0Ohm).toBeCloseTo(fx.expected.z0Ohm, 9)
        expect(result.value.epsilonEff).toBeCloseTo(fx.expected.epsilonEff, 12)
        expect(result.value.phaseVelocityMPerS).toBeCloseTo(fx.expected.phaseVelocityMPerS, 3)
      })
    }
  })

  describe('physical relationships', () => {
    it('back ground lowers impedance versus plain CPW on a thin substrate', () => {
      const cpw = computeCpw(0.5e-3, 0.25e-3, 0.635e-3, 9.8)
      const gcpw = computeGcpw(0.5e-3, 0.25e-3, 0.635e-3, 9.8)
      expect(cpw.ok && gcpw.ok).toBe(true)
      if (!cpw.ok || !gcpw.ok) return
      expect(gcpw.value.z0Ohm).toBeLessThan(cpw.value.z0Ohm)
      expect(gcpw.value.epsilonEff).toBeGreaterThan(cpw.value.epsilonEff)
    })

    it('converges to the CPW thick-substrate limit as h grows', () => {
      const gcpw = computeGcpw(0.5e-3, 0.25e-3, 1, 9.8)
      expect(gcpw.ok).toBe(true)
      if (!gcpw.ok) return
      expect(gcpw.value.epsilonEff).toBeCloseTo((9.8 + 1) / 2, 6)
    })

    it('keeps εeff between 1 and εr', () => {
      const result = computeGcpw(1.1e-3, 0.2e-3, 0.508e-3, 3.66)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.epsilonEff).toBeGreaterThan(1)
      expect(result.value.epsilonEff).toBeLessThan(3.66)
    })

    it('wider gap raises impedance', () => {
      const narrow = computeGcpw(1.1e-3, 0.1e-3, 0.508e-3, 3.66)
      const wide = computeGcpw(1.1e-3, 0.4e-3, 0.508e-3, 3.66)
      expect(narrow.ok && wide.ok).toBe(true)
      if (!narrow.ok || !wide.ok) return
      expect(wide.value.z0Ohm).toBeGreaterThan(narrow.value.z0Ohm)
    })
  })

  describe('error handling', () => {
    it('rejects zero width', () => {
      expect(computeGcpw(0, 0.2e-3, 0.508e-3, 3.66)).toEqual({
        ok: false,
        error: 'width_not_positive',
      })
    })

    it('rejects negative gap', () => {
      expect(computeGcpw(1.1e-3, -1e-4, 0.508e-3, 3.66)).toEqual({
        ok: false,
        error: 'gap_not_positive',
      })
    })

    it('rejects zero height', () => {
      expect(computeGcpw(1.1e-3, 0.2e-3, 0, 3.66)).toEqual({
        ok: false,
        error: 'height_not_positive',
      })
    })

    it('rejects er below one', () => {
      expect(computeGcpw(1.1e-3, 0.2e-3, 0.508e-3, 0.5)).toEqual({
        ok: false,
        error: 'er_less_than_one',
      })
    })
  })
})
