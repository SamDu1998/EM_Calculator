/**
 * Complete elliptic integral of the first kind K(k), computed with the
 * arithmetic–geometric mean iteration. Converges quadratically; accuracy
 * is ~1e-15 across 0 ≤ k < 1.
 */
export function ellipticK(k: number): number {
  if (!Number.isFinite(k) || k < 0 || k >= 1) return Number.NaN

  let a = 1
  let b = Math.sqrt(1 - k * k)
  while (Math.abs(a - b) > 1e-15) {
    const next = (a + b) / 2
    b = Math.sqrt(a * b)
    a = next
  }
  return Math.PI / (2 * a)
}

/** Ratio K(k)/K(k') with k' = √(1 − k²), as used by coplanar-waveguide models. */
export function ellipticKRatio(k: number): number {
  // Analytic limits: K(k')→∞ as k→0, K(k)→∞ as k→1.
  if (k === 0) return 0
  if (k === 1) return Number.POSITIVE_INFINITY
  return ellipticK(k) / ellipticK(Math.sqrt(1 - k * k))
}
