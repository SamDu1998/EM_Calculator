import { describe, expect, it } from 'vitest'
import { computeBandwidth } from './bandwidth'
import { fixtures } from './fixtures'

describe('computeBandwidth', () => {
  describe('valid inputs', () => {
    for (const fx of fixtures.bandwidth) {
      it(`matches expected for ${fx.name}`, () => {
        const result = computeBandwidth(fx.fminHz, fx.fmaxHz)
        expect(result.ok).toBe(true)
        if (!result.ok) return

        expect(result.value.absoluteHz).toBeCloseTo(fx.expected.absoluteHz, 6)
        expect(result.value.centerHz).toBeCloseTo(fx.expected.centerHz, 6)
        expect(result.value.relativePercent).toBeCloseTo(fx.expected.relativePercent, 9)
        expect(result.value.fractional).toBeCloseTo(fx.expected.fractional, 12)
      })
    }
  })

  describe('error handling', () => {
    it('rejects zero fmin', () => {
      const result = computeBandwidth(0, 100)
      expect(result).toEqual({ ok: false, error: 'fmin_not_positive' })
    })

    it('rejects negative fmin', () => {
      const result = computeBandwidth(-10, 100)
      expect(result).toEqual({ ok: false, error: 'fmin_not_positive' })
    })

    it('rejects NaN fmin', () => {
      const result = computeBandwidth(Number.NaN, 100)
      expect(result).toEqual({ ok: false, error: 'fmin_not_positive' })
    })

    it('rejects fmin == fmax', () => {
      const result = computeBandwidth(100, 100)
      expect(result).toEqual({ ok: false, error: 'fmax_not_greater_than_fmin' })
    })

    it('rejects fmin > fmax', () => {
      const result = computeBandwidth(200, 100)
      expect(result).toEqual({ ok: false, error: 'fmax_not_greater_than_fmin' })
    })

    it('rejects Infinity fmax', () => {
      const result = computeBandwidth(100, Number.POSITIVE_INFINITY)
      expect(result).toEqual({ ok: false, error: 'fmax_not_greater_than_fmin' })
    })
  })

  describe('known relationships', () => {
    it('relativePercent equals 100 × fractional', () => {
      const result = computeBandwidth(1e9, 2e9)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.relativePercent).toBeCloseTo(result.value.fractional * 100, 12)
    })

    it('center is halfway between fmin and fmax', () => {
      const result = computeBandwidth(1000, 3000)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.centerHz).toBe(2000)
    })
  })
})
