import { describe, expect, it } from 'vitest'
import { formatCompact, formatHz, formatMeters, formatNumber, formatPercent } from './format'

describe('formatPercent', () => {
  it('formats with default 3 digits', () => {
    expect(formatPercent(3.14159)).toBe('3.142%')
  })

  it('respects custom digits', () => {
    expect(formatPercent(50, 1)).toBe('50.0%')
  })

  it('returns em-dash for non-finite', () => {
    expect(formatPercent(Number.NaN)).toBe('—')
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe('—')
  })
})

describe('formatNumber', () => {
  it('uses fixed notation for moderate values', () => {
    expect(formatNumber(1234.5678)).toBe('1,234.568')
  })

  it('uses scientific notation for very large values', () => {
    expect(formatNumber(2_400_000_000)).toMatch(/2\.4E9/i)
  })

  it('uses scientific notation for very small non-zero values', () => {
    expect(formatNumber(1e-6)).toMatch(/1E-6/i)
  })

  it('formats zero as fixed', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('returns em-dash for non-finite', () => {
    expect(formatNumber(Number.NaN)).toBe('—')
  })
})

describe('formatCompact', () => {
  it('formats thousands with k', () => {
    expect(formatCompact(2400)).toBe('2.4K')
  })

  it('returns em-dash for non-finite', () => {
    expect(formatCompact(Number.POSITIVE_INFINITY)).toBe('—')
  })
})

describe('formatMeters', () => {
  it('uses meters at scale', () => {
    expect(formatMeters(33.51781576148753)).toBe('33.5178 m')
  })

  it('uses centimeters below one meter', () => {
    expect(formatMeters(0.12491352416666666)).toBe('12.4914 cm')
  })

  it('uses millimeters below one centimeter', () => {
    expect(formatMeters(0.0035730111655122554)).toBe('3.5730 mm')
  })

  it('uses micrometers below one millimeter', () => {
    expect(formatMeters(0.00005)).toBe('50.0000 µm')
  })

  it('returns em-dash for non-finite', () => {
    expect(formatMeters(Number.NaN)).toBe('—')
  })
})

describe('formatHz', () => {
  it('uses GHz at scale', () => {
    expect(formatHz(2_400_000_000)).toBe('2.4000 GHz')
  })

  it('uses MHz', () => {
    expect(formatHz(2_400_000)).toBe('2.4000 MHz')
  })

  it('uses kHz', () => {
    expect(formatHz(2_400)).toBe('2.4000 kHz')
  })

  it('uses Hz', () => {
    expect(formatHz(50)).toBe('50.0000 Hz')
  })

  it('returns em-dash for non-finite', () => {
    expect(formatHz(Number.NaN)).toBe('—')
  })
})
