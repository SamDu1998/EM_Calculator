import { describe, expect, it } from 'vitest'
import { computeApertureEfficiency } from './apertureEfficiency'
import { fixtures } from './fixtures'

describe('computeApertureEfficiency', () => {
  describe('valid inputs', () => {
    for (const fx of fixtures.apertureEfficiency) {
      it(`matches expected for ${fx.name}`, () => {
        const result = computeApertureEfficiency(fx.frequencyHz, fx.gainDbi, fx.physicalAreaM2)
        expect(result.ok).toBe(true)
        if (!result.ok) return

        expect(result.value.wavelengthM).toBeCloseTo(fx.expected.wavelengthM, 12)
        expect(result.value.effectiveAreaM2).toBeCloseTo(fx.expected.effectiveAreaM2, 12)
        expect(result.value.efficiencyPercent).toBeCloseTo(fx.expected.efficiencyPercent, 9)
        expect(result.value.exceedsPhysicalLimit).toBe(fx.expected.exceedsPhysicalLimit)
      })
    }
  })

  describe('error handling', () => {
    it('rejects zero frequency', () => {
      const result = computeApertureEfficiency(0, 20, 1)
      expect(result).toEqual({ ok: false, error: 'frequency_not_positive' })
    })

    it('rejects negative frequency', () => {
      const result = computeApertureEfficiency(-1, 20, 1)
      expect(result).toEqual({ ok: false, error: 'frequency_not_positive' })
    })

    it('rejects zero area', () => {
      const result = computeApertureEfficiency(10e9, 20, 0)
      expect(result).toEqual({ ok: false, error: 'area_not_positive' })
    })

    it('rejects negative area', () => {
      const result = computeApertureEfficiency(10e9, 20, -1)
      expect(result).toEqual({ ok: false, error: 'area_not_positive' })
    })

    it('rejects NaN gain', () => {
      const result = computeApertureEfficiency(10e9, Number.NaN, 1)
      expect(result).toEqual({ ok: false, error: 'gain_not_finite' })
    })
  })

  describe('physical limit warning', () => {
    it('flags exceedsPhysicalLimit when efficiency > 100%', () => {
      // Tiny aperture + high gain at low frequency yields Ae >> A_phys
      const result = computeApertureEfficiency(1e9, 40, 0.5)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.exceedsPhysicalLimit).toBe(true)
      expect(result.value.efficiencyPercent).toBeGreaterThan(100)
    })

    it('does not flag when efficiency ≤ 100%', () => {
      const result = computeApertureEfficiency(10e9, 30, 1.0)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.exceedsPhysicalLimit).toBe(false)
    })
  })
})
