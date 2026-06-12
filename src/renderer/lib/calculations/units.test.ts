import { describe, expect, it } from 'vitest'
import {
  AREA_UNITS,
  FREQUENCY_UNITS,
  LENGTH_UNITS,
  SPEED_OF_LIGHT_M_PER_S,
  fromHz,
  toHz,
  toMeters,
  toMetersSquared,
} from './units'

describe('units', () => {
  it('exports speed of light', () => {
    expect(SPEED_OF_LIGHT_M_PER_S).toBe(299_792_458)
  })

  it('lists all frequency units', () => {
    expect(FREQUENCY_UNITS).toEqual(['Hz', 'kHz', 'MHz', 'GHz'])
  })

  it('lists all area units', () => {
    expect(AREA_UNITS).toEqual(['m2', 'cm2'])
  })

  describe('toHz', () => {
    it('handles Hz', () => expect(toHz(100, 'Hz')).toBe(100))
    it('handles kHz', () => expect(toHz(2.4, 'kHz')).toBe(2400))
    it('handles MHz', () => expect(toHz(2.4, 'MHz')).toBe(2_400_000))
    it('handles GHz', () => expect(toHz(2.4, 'GHz')).toBe(2_400_000_000))
  })

  describe('fromHz', () => {
    it('handles GHz', () => expect(fromHz(2_400_000_000, 'GHz')).toBe(2.4))
    it('handles MHz', () => expect(fromHz(2_400_000, 'MHz')).toBeCloseTo(2.4, 9))
    it('round-trips with toHz', () => {
      const values: Array<[number, 'Hz' | 'kHz' | 'MHz' | 'GHz']> = [
        [1.5, 'GHz'],
        [3.14, 'MHz'],
        [42, 'kHz'],
        [100, 'Hz'],
      ]
      for (const [v, u] of values) {
        expect(fromHz(toHz(v, u), u)).toBeCloseTo(v, 12)
      }
    })
  })

  describe('toMetersSquared', () => {
    it('handles m2', () => expect(toMetersSquared(2.5, 'm2')).toBe(2.5))
    it('handles cm2', () => expect(toMetersSquared(10000, 'cm2')).toBeCloseTo(1, 12))
  })

  it('lists all length units', () => {
    expect(LENGTH_UNITS).toEqual(['mm', 'um', 'mil'])
  })

  describe('toMeters', () => {
    it('handles mm', () => expect(toMeters(1.6, 'mm')).toBeCloseTo(0.0016, 15))
    it('handles um', () => expect(toMeters(508, 'um')).toBeCloseTo(0.000508, 15))
    it('handles mil', () => expect(toMeters(20, 'mil')).toBeCloseTo(0.000508, 15))
  })
})
