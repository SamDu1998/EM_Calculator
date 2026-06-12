import { NumberInput } from '../../components/NumberInput'
import { useTranslation } from '../../i18n/useTranslation'
import type { LengthUnit } from '../../lib/calculations/units'
import {
  LENGTH_UNITS,
  type TransmissionLineErrorCode,
  type TransmissionLineState,
} from './useTransmissionLine'

const lengthUnitLabel = (u: LengthUnit): string => (u === 'um' ? 'µm' : u)

interface LineFormProps {
  state: TransmissionLineState
  errorMessage: string | null
}

function fieldError(
  state: TransmissionLineState,
  codes: TransmissionLineErrorCode[],
  message: string | null,
): string | null {
  if (state.computed.kind !== 'error') return null
  return codes.includes(state.computed.error) ? message : null
}

export function MicrostripForm({ state, errorMessage }: LineFormProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <>
      <NumberInput
        label={t('transmission.microstrip.width')}
        value={state.microstrip.widthRaw}
        onValueChange={(raw) => state.updateMicrostrip({ widthRaw: raw })}
        unit={state.microstrip.widthUnit}
        units={LENGTH_UNITS}
        onUnitChange={(unit) => state.updateMicrostrip({ widthUnit: unit })}
        unitLabel={lengthUnitLabel}
        error={fieldError(state, ['width_not_positive'], errorMessage)}
        placeholder="3.06"
      />
      <NumberInput
        label={t('transmission.microstrip.height')}
        value={state.microstrip.heightRaw}
        onValueChange={(raw) => state.updateMicrostrip({ heightRaw: raw })}
        unit={state.microstrip.heightUnit}
        units={LENGTH_UNITS}
        onUnitChange={(unit) => state.updateMicrostrip({ heightUnit: unit })}
        unitLabel={lengthUnitLabel}
        error={fieldError(state, ['height_not_positive'], errorMessage)}
        placeholder="1.6"
      />
      <NumberInput
        label={t('transmission.dielectric')}
        value={state.microstrip.erRaw}
        onValueChange={(raw) => state.updateMicrostrip({ erRaw: raw })}
        unit={'εᵣ' as const}
        units={['εᵣ'] as const}
        onUnitChange={() => undefined}
        error={fieldError(state, ['er_less_than_one'], errorMessage)}
        placeholder="4.4"
      />
    </>
  )
}

export function CoaxialForm({ state, errorMessage }: LineFormProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <>
      <NumberInput
        label={t('transmission.coaxial.inner')}
        value={state.coaxial.innerRaw}
        onValueChange={(raw) => state.updateCoaxial({ innerRaw: raw })}
        unit={state.coaxial.innerUnit}
        units={LENGTH_UNITS}
        onUnitChange={(unit) => state.updateCoaxial({ innerUnit: unit })}
        unitLabel={lengthUnitLabel}
        error={fieldError(state, ['inner_not_positive'], errorMessage)}
        placeholder="1.0"
      />
      <NumberInput
        label={t('transmission.coaxial.outer')}
        value={state.coaxial.outerRaw}
        onValueChange={(raw) => state.updateCoaxial({ outerRaw: raw })}
        unit={state.coaxial.outerUnit}
        units={LENGTH_UNITS}
        onUnitChange={(unit) => state.updateCoaxial({ outerUnit: unit })}
        unitLabel={lengthUnitLabel}
        error={fieldError(state, ['outer_not_greater_than_inner'], errorMessage)}
        placeholder="3.49"
      />
      <NumberInput
        label={t('transmission.dielectric')}
        value={state.coaxial.erRaw}
        onValueChange={(raw) => state.updateCoaxial({ erRaw: raw })}
        unit={'εᵣ' as const}
        units={['εᵣ'] as const}
        onUnitChange={() => undefined}
        error={fieldError(state, ['er_less_than_one'], errorMessage)}
        placeholder="2.25"
      />
    </>
  )
}

export function CoplanarForm({ state, errorMessage }: LineFormProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <>
      <NumberInput
        label={t('transmission.coplanar.width')}
        value={state.coplanar.widthRaw}
        onValueChange={(raw) => state.updateCoplanar({ widthRaw: raw })}
        unit={state.coplanar.widthUnit}
        units={LENGTH_UNITS}
        onUnitChange={(unit) => state.updateCoplanar({ widthUnit: unit })}
        unitLabel={lengthUnitLabel}
        error={fieldError(state, ['width_not_positive'], errorMessage)}
        placeholder="0.5"
      />
      <NumberInput
        label={t('transmission.coplanar.gap')}
        value={state.coplanar.gapRaw}
        onValueChange={(raw) => state.updateCoplanar({ gapRaw: raw })}
        unit={state.coplanar.gapUnit}
        units={LENGTH_UNITS}
        onUnitChange={(unit) => state.updateCoplanar({ gapUnit: unit })}
        unitLabel={lengthUnitLabel}
        error={fieldError(state, ['gap_not_positive'], errorMessage)}
        placeholder="0.25"
      />
      <NumberInput
        label={t('transmission.coplanar.height')}
        value={state.coplanar.heightRaw}
        onValueChange={(raw) => state.updateCoplanar({ heightRaw: raw })}
        unit={state.coplanar.heightUnit}
        units={LENGTH_UNITS}
        onUnitChange={(unit) => state.updateCoplanar({ heightUnit: unit })}
        unitLabel={lengthUnitLabel}
        error={fieldError(state, ['height_not_positive'], errorMessage)}
        placeholder="0.635"
      />
      <NumberInput
        label={t('transmission.dielectric')}
        value={state.coplanar.erRaw}
        onValueChange={(raw) => state.updateCoplanar({ erRaw: raw })}
        unit={'εᵣ' as const}
        units={['εᵣ'] as const}
        onUnitChange={() => undefined}
        error={fieldError(state, ['er_less_than_one'], errorMessage)}
        placeholder="9.8"
      />
    </>
  )
}
