import { describe, expect, it } from 'vitest'
import { SPEED_OF_LIGHT_M_PER_S } from './units'
import { computeWavelength } from './wavelength'
import { fixtures } from './fixtures'

describe('computeWavelength', () => {
  describe('valid inputs', () => {
    for (const fx of fixtures.wavelength) {
      it(`matches expected for ${fx.name}`, () => {
        const result = computeWavelength(fx.frequencyHz, fx.er)
        expect(result.ok).toBe(true)
        if (!result.ok) return

        expect(result.value.lambda0M).toBeCloseTo(fx.expected.lambda0M, 12)
        expect(result.value.lambdaGM).toBeCloseTo(fx.expected.lambdaGM, 12)
        expect(result.value.halfLambdaGM).toBeCloseTo(fx.expected.halfLambdaGM, 12)
        expect(result.value.quarterLambdaGM).toBeCloseTo(fx.expected.quarterLambdaGM, 12)
        expect(result.value.phaseVelocityMPerS).toBeCloseTo(fx.expected.phaseVelocityMPerS, 3)
      })
    }
  })

  describe('error handling', () => {
    it('rejects zero frequency', () => {
      const result = computeWavelength(0, 1)
      expect(result).toEqual({ ok: false, error: 'frequency_not_positive' })
    })

    it('rejects negative frequency', () => {
      const result = computeWavelength(-1e9, 1)
      expect(result).toEqual({ ok: false, error: 'frequency_not_positive' })
    })

    it('rejects NaN frequency', () => {
      const result = computeWavelength(Number.NaN, 1)
      expect(result).toEqual({ ok: false, error: 'frequency_not_positive' })
    })

    it('rejects Infinity frequency', () => {
      const result = computeWavelength(Number.POSITIVE_INFINITY, 1)
      expect(result).toEqual({ ok: false, error: 'frequency_not_positive' })
    })

    it('rejects er below one', () => {
      const result = computeWavelength(1e9, 0.99)
      expect(result).toEqual({ ok: false, error: 'er_less_than_one' })
    })

    it('rejects NaN er', () => {
      const result = computeWavelength(1e9, Number.NaN)
      expect(result).toEqual({ ok: false, error: 'er_less_than_one' })
    })
  })

  describe('known relationships', () => {
    it('free space (er = 1) keeps lambdaG equal to lambda0', () => {
      const result = computeWavelength(5e9, 1)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.lambdaGM).toBe(result.value.lambda0M)
      expect(result.value.phaseVelocityMPerS).toBe(SPEED_OF_LIGHT_M_PER_S)
    })

    it('half and quarter wavelengths derive from lambdaG', () => {
      const result = computeWavelength(2.4e9, 4.4)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.halfLambdaGM).toBeCloseTo(result.value.lambdaGM / 2, 15)
      expect(result.value.quarterLambdaGM).toBeCloseTo(result.value.lambdaGM / 4, 15)
    })

    it('lambda0 equals c / f', () => {
      const result = computeWavelength(1e9, 2)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.lambda0M).toBeCloseTo(SPEED_OF_LIGHT_M_PER_S / 1e9, 15)
    })

    it('accepts er exactly 1', () => {
      const result = computeWavelength(1e9, 1)
      expect(result.ok).toBe(true)
    })
  })
})
