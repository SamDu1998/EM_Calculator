import { describe, expect, it } from 'vitest'
import { ellipticK, ellipticKRatio } from './elliptic'

describe('ellipticK', () => {
  it('K(0) equals π/2', () => {
    expect(ellipticK(0)).toBeCloseTo(Math.PI / 2, 15)
  })

  it('K(0.5) matches the reference value', () => {
    expect(ellipticK(0.5)).toBeCloseTo(1.6857503548125961, 12)
  })

  it('K(1/√2) matches the lemniscatic constant', () => {
    expect(ellipticK(Math.SQRT1_2)).toBeCloseTo(1.8540746773013719, 12)
  })

  it('K(0.9) matches the reference value', () => {
    expect(ellipticK(0.9)).toBeCloseTo(2.2805491384227703, 12)
  })

  it('is monotonically increasing in k', () => {
    expect(ellipticK(0.3)).toBeLessThan(ellipticK(0.6))
    expect(ellipticK(0.6)).toBeLessThan(ellipticK(0.95))
  })

  it('returns NaN outside [0, 1)', () => {
    expect(ellipticK(-0.1)).toBeNaN()
    expect(ellipticK(1)).toBeNaN()
    expect(ellipticK(1.5)).toBeNaN()
    expect(ellipticK(Number.NaN)).toBeNaN()
  })
})

describe('ellipticKRatio', () => {
  it('equals 1 at the self-dual modulus k = 1/√2', () => {
    expect(ellipticKRatio(Math.SQRT1_2)).toBeCloseTo(1, 12)
  })

  it('is reciprocal under k ↔ k′', () => {
    const k = 0.3
    const kp = Math.sqrt(1 - k * k)
    expect(ellipticKRatio(k) * ellipticKRatio(kp)).toBeCloseTo(1, 12)
  })

  it('handles the analytic limits at k = 0 and k = 1', () => {
    expect(ellipticKRatio(0)).toBe(0)
    expect(ellipticKRatio(1)).toBe(Number.POSITIVE_INFINITY)
  })
})
