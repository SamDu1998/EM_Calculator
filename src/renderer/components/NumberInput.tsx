import { type ChangeEvent, useId } from 'react'
import { UnitSelect } from './UnitSelect'

interface NumberInputProps<U extends string> {
  label: string
  value: string
  onValueChange: (raw: string) => void
  unit: U
  units: readonly U[]
  onUnitChange: (unit: U) => void
  unitLabel?: (unit: U) => string
  placeholder?: string
  error?: string | null
  min?: number
  step?: string
  inputMode?: 'decimal' | 'numeric'
}

export function NumberInput<U extends string>(props: NumberInputProps<U>): JSX.Element {
  const id = useId()
  const errorId = `${id}-err`
  const hasError = Boolean(props.error)
  const handle = (e: ChangeEvent<HTMLInputElement>) => props.onValueChange(e.target.value)

  return (
    <div className={`field${hasError ? ' field--error' : ''}`}>
      <label htmlFor={id} className="field__label">
        {props.label}
      </label>
      <div className="field__row">
        <input
          id={id}
          className="field__input"
          type="text"
          inputMode={props.inputMode ?? 'decimal'}
          value={props.value}
          onChange={handle}
          placeholder={props.placeholder}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          spellCheck={false}
          autoComplete="off"
        />
        <UnitSelect
          units={props.units}
          value={props.unit}
          onChange={props.onUnitChange}
          ariaLabel={`${props.label} unit`}
          unitLabel={props.unitLabel}
        />
      </div>
      {hasError && (
        <p id={errorId} role="alert" className="field__error">
          {props.error}
        </p>
      )}
    </div>
  )
}
