import { GlassCard } from '../../components/GlassCard'
import { NumberInput } from '../../components/NumberInput'
import { ResultDisplay } from '../../components/ResultDisplay'
import { useTranslation } from '../../i18n/useTranslation'
import { formatHz, formatMeters } from '../../lib/format'
import type { LengthUnit } from '../../lib/calculations/units'
import { FREQUENCY_UNITS, LENGTH_UNITS, useSiw } from './useSiw'

const lengthUnitLabel = (u: LengthUnit): string => (u === 'um' ? 'µm' : u)

export function SiwTab(): JSX.Element {
  const { t } = useTranslation()
  const state = useSiw()

  const errorMessage =
    state.computed.kind === 'error' ? t(`siw.errors.${state.computed.error}` as const) : null

  return (
    <section role="tabpanel" id="panel-siw" aria-labelledby="tab-siw" className="tab-panel">
      <GlassCard heading={t('siw.heading')} description={t('siw.description')}>
        <div className="form-grid">
          <NumberInput
            label={t('siw.frequency')}
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
            placeholder="10"
          />
          <NumberInput
            label={t('siw.dielectric')}
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
            placeholder="3.38"
          />
          <NumberInput
            label={t('siw.width')}
            value={state.inputs.widthRaw}
            onValueChange={state.setWidthRaw}
            unit={state.inputs.widthUnit}
            units={LENGTH_UNITS}
            onUnitChange={state.setWidthUnit}
            unitLabel={lengthUnitLabel}
            error={
              state.computed.kind === 'error' &&
              (state.computed.error === 'width_not_positive' ||
                state.computed.error === 'width_too_small_for_vias')
                ? errorMessage
                : null
            }
            placeholder="13"
          />
        </div>

        {state.computed.kind === 'ok' && (
          <ResultDisplay
            rows={[
              {
                label: t('siw.result.diameter'),
                value: formatMeters(state.computed.viaDiameterM),
                emphasis: true,
              },
              {
                label: t('siw.result.pitch'),
                value: formatMeters(state.computed.viaPitchM),
                emphasis: true,
              },
              {
                label: t('siw.result.effective_width'),
                value: formatMeters(state.computed.effectiveWidthM),
              },
              {
                label: t('siw.result.cutoff'),
                value: formatHz(state.computed.cutoffFrequencyHz),
              },
            ]}
            warning={state.computed.belowCutoff ? t('siw.warning.below_cutoff') : null}
          />
        )}
      </GlassCard>
    </section>
  )
}
