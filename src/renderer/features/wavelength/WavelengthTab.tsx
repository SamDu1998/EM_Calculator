import { GlassCard } from '../../components/GlassCard'
import { NumberInput } from '../../components/NumberInput'
import { ResultDisplay } from '../../components/ResultDisplay'
import { useTranslation } from '../../i18n/useTranslation'
import { formatMeters, formatNumber } from '../../lib/format'
import { FREQUENCY_UNITS, useWavelength } from './useWavelength'

export function WavelengthTab(): JSX.Element {
  const { t } = useTranslation()
  const state = useWavelength()

  const errorMessage =
    state.computed.kind === 'error'
      ? t(`wavelength.errors.${state.computed.error}` as const)
      : null

  return (
    <section
      role="tabpanel"
      id="panel-wavelength"
      aria-labelledby="tab-wavelength"
      className="tab-panel"
    >
      <GlassCard heading={t('wavelength.heading')} description={t('wavelength.description')}>
        <div className="form-grid">
          <NumberInput
            label={t('wavelength.frequency')}
            value={state.inputs.frequencyRaw}
            onValueChange={state.setFrequencyRaw}
            unit={state.inputs.frequencyUnit}
            units={FREQUENCY_UNITS}
            onUnitChange={state.setFrequencyUnit}
            error={
              state.computed.kind === 'error' && state.computed.error === 'frequency_not_positive'
                ? errorMessage
                : null
            }
            placeholder="2.4"
          />
          <NumberInput
            label={t('wavelength.dielectric')}
            value={state.inputs.erRaw}
            onValueChange={state.setErRaw}
            unit={'εᵣ' as const}
            units={['εᵣ'] as const}
            onUnitChange={() => undefined}
            error={
              state.computed.kind === 'error' && state.computed.error === 'er_less_than_one'
                ? errorMessage
                : null
            }
            placeholder="1.0"
          />
        </div>

        {state.computed.kind === 'ok' && (
          <ResultDisplay
            rows={[
              {
                label: t('wavelength.result.lambda0'),
                value: formatMeters(state.computed.lambda0M),
              },
              {
                label: t('wavelength.result.lambdag'),
                value: formatMeters(state.computed.lambdaGM),
                emphasis: true,
              },
              {
                label: t('wavelength.result.half'),
                value: formatMeters(state.computed.halfLambdaGM),
              },
              {
                label: t('wavelength.result.quarter'),
                value: formatMeters(state.computed.quarterLambdaGM),
              },
              {
                label: t('wavelength.result.phase_velocity'),
                value: `${formatNumber(state.computed.phaseVelocityMPerS)} m/s`,
              },
            ]}
          />
        )}
      </GlassCard>
    </section>
  )
}
