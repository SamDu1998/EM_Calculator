/**
 * Shared fixture data for cross-validating the TypeScript and Python implementations.
 *
 * Both `src/renderer/lib/calculations/*.test.ts` and `python/tests/test_em_calc.py`
 * consume this file. Expected values are pre-computed with double precision and
 * the test tolerance is 1e-9 for relative bandwidth and 1e-12 for aperture efficiency
 * intermediate quantities. Update both sides if you change a fixture.
 */
import fixturesJson from './fixtures.json'

export interface BandwidthFixture {
  name: string
  fminHz: number
  fmaxHz: number
  expected: {
    absoluteHz: number
    centerHz: number
    relativePercent: number
    fractional: number
  }
}

export interface ApertureEfficiencyFixture {
  name: string
  frequencyHz: number
  gainDbi: number
  physicalAreaM2: number
  expected: {
    wavelengthM: number
    effectiveAreaM2: number
    efficiencyPercent: number
    exceedsPhysicalLimit: boolean
  }
}

export interface WavelengthFixture {
  name: string
  frequencyHz: number
  er: number
  expected: {
    lambda0M: number
    lambdaGM: number
    halfLambdaGM: number
    quarterLambdaGM: number
    phaseVelocityMPerS: number
  }
}

export interface Fixtures {
  bandwidth: BandwidthFixture[]
  apertureEfficiency: ApertureEfficiencyFixture[]
  wavelength: WavelengthFixture[]
}

export const fixtures = fixturesJson as Fixtures
