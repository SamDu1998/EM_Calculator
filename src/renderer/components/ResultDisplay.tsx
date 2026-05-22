import type { ReactNode } from 'react'

interface ResultRow {
  label: ReactNode
  value: ReactNode
  emphasis?: boolean
}

interface ResultDisplayProps {
  rows: ResultRow[]
  warning?: string | null
}

export function ResultDisplay({ rows, warning }: ResultDisplayProps): JSX.Element {
  return (
    <div className="result">
      <dl className="result__grid">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className={`result__row${row.emphasis ? ' result__row--emphasis' : ''}`}
          >
            <dt className="result__label">{row.label}</dt>
            <dd className="result__value">{row.value}</dd>
          </div>
        ))}
      </dl>
      {warning && (
        <p role="alert" className="result__warning">
          {warning}
        </p>
      )}
    </div>
  )
}
