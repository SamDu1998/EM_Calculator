import { describe, expect, it } from 'vitest'
import { computeSiw } from './siw'
import { fixtures } from './fixtures'

describe('computeSiw', () => {
  describe('valid inputs', () => {
    for (const fx of fixtures.siw) {
      it(`matches expected for ${fx.name}`, () => {
        const result = computeSiw(fx.frequencyHz, fx.er, fx.widthM)
        expect(result.ok).toBe(true)
        if (!result.ok) return

        expect(result.value.viaDiameterM).toBeCloseTo(fx.expected.viaDiameterM, 12)
        expect(result.value.viaPitchM).toBeCloseTo(fx.expected.viaPitchM, 12)
        expect(result.value.effectiveWidthM).toBeCloseTo(fx.expected.effectiveWidthM, 12)
        expect(result.value.cutoffFrequencyHz).toBeCloseTo(fx.expected.cutoffFrequencyHz, 0)
        expect(result.value.belowCutoff).toBe(fx.expected.belowCutoff)
      })
    }
  })

  describe('design rules', () => {
    it('keeps pitch within the typical 1.5d – 2d window', () => {
      const result = computeSiw(10e9, 3.38, 13e-3)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      const ratio = result.value.viaPitchM / result.value.viaDiameterM
      expect(ratio).toBeGreaterThanOrEqual(1.5 - 1e-12)
      expect(ratio).toBeLessThanOrEqual(2 + 1e-12)
    })

    it('keeps effective width below the physical width', () => {
      const result = computeSiw(10e9, 3.38, 13e-3)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.effectiveWidthM).toBeLessThan(13e-3)
      expect(result.value.effectiveWidthM).toBeGreaterThan(0)
    })

    it('flags operation at or below cutoff', () => {
      const result = computeSiw(10e9, 2.2, 5e-3)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.belowCutoff).toBe(true)
    })

    it('wider guide lowers the cutoff frequency', () => {
      const narrow = computeSiw(10e9, 3.38, 10e-3)
      const wide = computeSiw(10e9, 3.38, 16e-3)
      expect(narrow.ok && wide.ok).toBe(true)
      if (!narrow.ok || !wide.ok) return
      expect(wide.value.cutoffFrequencyHz).toBeLessThan(narrow.value.cutoffFrequencyHz)
    })
  })

  describe('error handling', () => {
    it('rejects zero frequency', () => {
      expect(computeSiw(0, 3.38, 13e-3)).toEqual({ ok: false, error: 'frequency_not_positive' })
    })

    it('rejects NaN frequency', () => {
      expect(computeSiw(Number.NaN, 3.38, 13e-3)).toEqual({
        ok: false,
        error: 'frequency_not_positive',
      })
    })

    it('rejects er below one', () => {
      expect(computeSiw(10e9, 0.5, 13e-3)).toEqual({ ok: false, error: 'er_less_than_one' })
    })

    it('rejects zero width', () => {
      expect(computeSiw(10e9, 3.38, 0)).toEqual({ ok: false, error: 'width_not_positive' })
    })

    it('rejects width smaller than the via correction term', () => {
      // At 10 GHz / εr 2.2 the recommended d is ~2 mm; a 1 mm guide cannot host the vias
      expect(computeSiw(10e9, 2.2, 1e-3)).toEqual({
        ok: false,
        error: 'width_too_small_for_vias',
      })
    })
  })
})
