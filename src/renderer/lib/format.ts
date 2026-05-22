/**
 * Number formatting helpers for the renderer UI. All return strings — never numbers —
 * so callers don't accidentally compose them back into calculations.
 */

const COMPACT_FORMAT = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 3,
  notation: 'compact',
})

const FIXED_FORMAT = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 3,
  useGrouping: true,
})

const SCIENTIFIC_FORMAT = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 4,
  notation: 'scientific',
})

export function formatPercent(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return '—'
  return `${value.toFixed(digits)}%`
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) >= 1e9 || (value !== 0 && Math.abs(value) < 1e-3)) {
    return SCIENTIFIC_FORMAT.format(value)
  }
  return FIXED_FORMAT.format(value)
}

export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return COMPACT_FORMAT.format(value)
}

export function formatHz(hz: number): string {
  if (!Number.isFinite(hz)) return '—'
  const abs = Math.abs(hz)
  if (abs >= 1e9) return `${(hz / 1e9).toFixed(4)} GHz`
  if (abs >= 1e6) return `${(hz / 1e6).toFixed(4)} MHz`
  if (abs >= 1e3) return `${(hz / 1e3).toFixed(4)} kHz`
  return `${hz.toFixed(4)} Hz`
}
