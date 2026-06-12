import { describe, expect, it } from 'vitest'
import { computeMicrostrip } from './microstrip'
import { fixtures } from './fixtures'

describe('computeMicrostrip', () => {
  describe('valid inputs', () => {
    for (const fx of fixtures.microstrip) {
      it(`matches expected for ${fx.name}`, () => {
        const result = computeMicrostrip(fx.widthM, fx.heightM, fx.er)
        expect(result.ok).toBe(true)
        if (!result.ok) return

        expect(result.value.z0Ohm).toBeCloseTo(fx.expected.z0Ohm, 9)
        expect(result.value.epsilonEff).toBeCloseTo(fx.expected.epsilonEff, 12)
        expect(result.value.phaseVelocityMPerS).toBeCloseTo(fx.expected.phaseVelocityMPerS, 3)
        expect(result.value.outsideValidatedRange).toBe(fx.expected.outsideValidatedRange)
      })
    }
  })

  describe('reference designs (±2% tolerance)', () => {
    it('classic FR4 50 Ω design lands near 50 Ω', () => {
      // W = 3.06 mm, h = 1.6 mm, εr = 4.4 is the widely-quoted 50 Ω FR4 design
      const result = computeMicrostrip(3.06e-3, 1.6e-3, 4.4)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(Math.abs(result.value.z0Ohm - 50) / 50).toBeLessThan(0.02)
      expect(Math.abs(result.value.epsilonEff - 3.33) / 3.33).toBeLessThan(0.02)
    })

    it('air-filled line with W/h = 1 is near the textbook 126.5 Ω', () => {
      const result = computeMicrostrip(1e-3, 1e-3, 1)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(Math.abs(result.value.z0Ohm - 126.5) / 126.5).toBeLessThan(0.02)
    })
  })

  describe('physical relationships', () => {
    it('wider trace lowers impedance', () => {
      const narrow = computeMicrostrip(1e-3, 1.6e-3, 4.4)
      const wide = computeMicrostrip(5e-3, 1.6e-3, 4.4)
      expect(narrow.ok && wide.ok).toBe(true)
      if (!narrow.ok || !wide.ok) return
      expect(wide.value.z0Ohm).toBeLessThan(narrow.value.z0Ohm)
    })

    it('higher permittivity lowers impedance', () => {
      const low = computeMicrostrip(3e-3, 1.6e-3, 2.2)
      const high = computeMicrostrip(3e-3, 1.6e-3, 10.2)
      expect(low.ok && high.ok).toBe(true)
      if (!low.ok || !high.ok) return
      expect(high.value.z0Ohm).toBeLessThan(low.value.z0Ohm)
    })

    it('keeps epsilonEff between (er + 1)/2 and er', () => {
      const er = 4.4
      const result = computeMicrostrip(3e-3, 1.6e-3, er)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.epsilonEff).toBeGreaterThan((er + 1) / 2)
      expect(result.value.epsilonEff).toBeLessThan(er)
    })

    it('flags W/h outside the validated model range', () => {
      const tooNarrow = computeMicrostrip(1e-6, 1e-3, 4.4)
      const tooWide = computeMicrostrip(0.2, 1e-3, 4.4)
      expect(tooNarrow.ok && tooWide.ok).toBe(true)
      if (!tooNarrow.ok || !tooWide.ok) return
      expect(tooNarrow.value.outsideValidatedRange).toBe(true)
      expect(tooWide.value.outsideValidatedRange).toBe(true)
    })
  })

  describe('error handling', () => {
    it('rejects zero width', () => {
      expect(computeMicrostrip(0, 1e-3, 4.4)).toEqual({ ok: false, error: 'width_not_positive' })
    })

    it('rejects negative width', () => {
      expect(computeMicrostrip(-1e-3, 1e-3, 4.4)).toEqual({
        ok: false,
        error: 'width_not_positive',
      })
    })

    it('rejects zero height', () => {
      expect(computeMicrostrip(1e-3, 0, 4.4)).toEqual({ ok: false, error: 'height_not_positive' })
    })

    it('rejects NaN height', () => {
      expect(computeMicrostrip(1e-3, Number.NaN, 4.4)).toEqual({
        ok: false,
        error: 'height_not_positive',
      })
    })

    it('rejects er below one', () => {
      expect(computeMicrostrip(1e-3, 1e-3, 0.5)).toEqual({ ok: false, error: 'er_less_than_one' })
    })

    it('rejects Infinity er', () => {
      expect(computeMicrostrip(1e-3, 1e-3, Number.POSITIVE_INFINITY)).toEqual({
        ok: false,
        error: 'er_less_than_one',
      })
    })
  })
})
