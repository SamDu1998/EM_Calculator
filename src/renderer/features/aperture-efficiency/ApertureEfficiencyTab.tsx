import { GlassCard } from '../../components/GlassCard'
import { NumberInput } from '../../components/NumberInput'
import { PythonVerifyButton } from '../../components/PythonVerifyButton'
import { ResultDisplay } from '../../components/ResultDisplay'
import { useTranslation } from '../../i18n/useTranslation'
import { formatNumber, formatPercent } from '../../lib/format'
import { AREA_UNITS, FREQUENCY_UNITS, useApertureEfficiency } from './useApertureEfficiency'

export function ApertureEfficiencyTab(): JSX.Element {
  const { t } = useTranslation()
  const state = useApertureEfficiency()

  const errorMessage =
    state.computed.kind === 'error'
      ? t(`efficiency.errors.${state.computed.error}` as const)
      : null

  return (
    <section
      role="tabpanel"
      id="panel-efficiency"
      aria-labelledby="tab-efficiency"
      className="tab-panel"
    >
      <GlassCard heading={t('efficiency.heading')} description={t('efficiency.description')}>
        <div className="form-grid">
          <NumberInput
            label={t('efficiency.frequency')}
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
            label={t('efficiency.gain')}
            value={state.inputs.gainRaw}
            onValueChange={state.setGainRaw}
            unit={'dBi' as const}
            units={['dBi'] as const}
            onUnitChange={() => undefined}
            error={
              state.computed.kind === 'error' && state.computed.error === 'gain_not_finite'
                ? errorMessage
                : null
            }
            placeholder="30"
          />
          <NumberInput
            label={t('efficiency.area')}
            value={state.inputs.areaRaw}
            onValueChange={state.setAreaRaw}
            unit={state.inputs.areaUnit}
            units={AREA_UNITS}
            onUnitChange={state.setAreaUnit}
            unitLabel={(u) => (u === 'm2' ? 'm²' : 'cm²')}
            error={
              state.computed.kind === 'error' && state.computed.error === 'area_not_positive'
                ? errorMessage
                : null
            }
            placeholder="1"
          />
        </div>

        {state.computed.kind === 'ok' && (
          <ResultDisplay
            rows={[
              {
                label: t('efficiency.result.wavelength'),
                value: `${formatNumber(state.computed.wavelengthM)} m`,
              },
              {
                label: t('efficiency.result.effective_area'),
                value: `${formatNumber(state.computed.effectiveAreaM2)} m²`,
              },
              {
                label: t('efficiency.result.efficiency'),
                value: formatPercent(state.computed.efficiencyPercent, 3),
                emphasis: true,
              },
            ]}
            warning={state.computed.exceedsPhysicalLimit ? t('efficiency.warning.over_unity') : null}
          />
        )}

        {state.computed.kind === 'ok' &&
          state.resolved.frequencyHz != null &&
          state.resolved.gainDbi != null &&
          state.resolved.physicalAreaM2 != null && (
            <PythonVerifyButton
              inputs={[
                state.resolved.frequencyHz,
                state.resolved.gainDbi,
                state.resolved.physicalAreaM2,
              ]}
              invoker={(f, g, a) => window.emApi.pythonApertureEfficiency(f, g, a)}
              compareValue={state.computed.efficiencyPercent}
              extractValue={(reply) => reply.value.efficiencyPercent}
              formatValue={(v) => formatPercent(v, 3)}
              formatDelta={(d) => formatNumber(d)}
            />
          )}
      </GlassCard>
    </section>
  )
}
