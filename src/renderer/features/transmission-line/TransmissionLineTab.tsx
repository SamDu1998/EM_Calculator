import { useId } from 'react'
import { GlassCard } from '../../components/GlassCard'
import { NumberInput } from '../../components/NumberInput'
import { ResultDisplay } from '../../components/ResultDisplay'
import { useTranslation } from '../../i18n/useTranslation'
import { formatNumber } from '../../lib/format'
import type { LengthUnit } from '../../lib/calculations/units'
import {
  LENGTH_UNITS,
  TRANSMISSION_LINE_TYPES,
  useTransmissionLine,
  type TransmissionLineErrorCode,
  type TransmissionLineState,
  type TransmissionLineType,
} from './useTransmissionLine'

const lengthUnitLabel = (u: LengthUnit): string => (u === 'um' ? 'µm' : u)

function fieldError(
  state: TransmissionLineState,
  codes: TransmissionLineErrorCode[],
  message: string | null,
): string | null {
  if (state.computed.kind !== 'error') return null
  return codes.includes(state.computed.error) ? message : null
}

export function TransmissionLineTab(): JSX.Element {
  const { t } = useTranslation()
  const state = useTransmissionLine()
  const typeSelectId = useId()

  const errorMessage =
    state.computed.kind === 'error'
      ? t(`transmission.errors.${state.computed.error}` as const)
      : null

  return (
    <section
      role="tabpanel"
      id="panel-transmission"
      aria-labelledby="tab-transmission"
      className="tab-panel"
    >
      <GlassCard heading={t('transmission.heading')} description={t('transmission.description')}>
        <div className="field">
          <label htmlFor={typeSelectId} className="field__label">
            {t('transmission.type')}
          </label>
          <div className="field__row">
            <select
              id={typeSelectId}
              className="field__input"
              value={state.lineType}
              onChange={(e) => state.setLineType(e.target.value as TransmissionLineType)}
            >
              {TRANSMISSION_LINE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`transmission.type.${type}` as const)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid">
          {state.lineType === 'microstrip' ? (
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
          ) : (
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
          )}
        </div>

        {state.computed.kind === 'ok' && (
          <ResultDisplay
            rows={[
              {
                label: t('transmission.result.z0'),
                value: `${formatNumber(state.computed.z0Ohm)} Ω`,
                emphasis: true,
              },
              {
                label: t('transmission.result.eeff'),
                value: formatNumber(state.computed.epsilonEff),
              },
              {
                label: t('transmission.result.vp'),
                value: `${formatNumber(state.computed.phaseVelocityMPerS)} m/s`,
              },
            ]}
            warning={state.computed.outsideValidatedRange ? t('transmission.warning.range') : null}
          />
        )}
      </GlassCard>
    </section>
  )
}
