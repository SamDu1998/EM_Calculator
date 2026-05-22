interface UnitSelectProps<U extends string> {
  units: readonly U[]
  value: U
  onChange: (unit: U) => void
  ariaLabel: string
  unitLabel?: (unit: U) => string
}

export function UnitSelect<U extends string>({
  units,
  value,
  onChange,
  ariaLabel,
  unitLabel,
}: UnitSelectProps<U>): JSX.Element {
  return (
    <select
      className="unit-select"
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value as U)}
    >
      {units.map((u) => (
        <option key={u} value={u}>
          {unitLabel ? unitLabel(u) : u}
        </option>
      ))}
    </select>
  )
}
