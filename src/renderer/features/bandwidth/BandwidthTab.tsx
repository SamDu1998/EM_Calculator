import { GlassCard } from '../../components/GlassCard'
import { NumberInput } from '../../components/NumberInput'
import { PythonVerifyButton } from '../../components/PythonVerifyButton'
import { ResultDisplay } from '../../components/ResultDisplay'
import { useTranslation } from '../../i18n/useTranslation'
import { formatHz, formatNumber, formatPercent } from '../../lib/format'
import { FREQUENCY_UNITS, useBandwidth } from './useBandwidth'

export function BandwidthTab(): JSX.Element {
  const { t } = useTranslation()
  const state = useBandwidth()

  const errorMessage =
    state.computed.kind === 'error'
      ? t(`bandwidth.errors.${state.computed.error}` as const)
      : null

  return (
    <section
      role="tabpanel"
      id="panel-bandwidth"
      aria-labelledby="tab-bandwidth"
      className="tab-panel"
    >
      <GlassCard heading={t('bandwidth.heading')} description={t('bandwidth.description')}>
        <div className="form-grid">
          <NumberInput
            label={t('bandwidth.fmin')}
            value={state.inputs.fminRaw}
            onValueChange={state.setFminRaw}
            unit={state.inputs.fminUnit}
            units={FREQUENCY_UNITS}
            onUnitChange={state.setFminUnit}
            error={state.computed.kind === 'error' ? errorMessage : null}
            placeholder="2.4"
          />
          <NumberInput
            label={t('bandwidth.fmax')}
            value={state.inputs.fmaxRaw}
            onValueChange={state.setFmaxRaw}
            unit={state.inputs.fmaxUnit}
            units={FREQUENCY_UNITS}
            onUnitChange={state.setFmaxUnit}
            placeholder="2.4835"
          />
        </div>

        {state.computed.kind === 'ok' && (
          <ResultDisplay
            rows={[
              {
                label: t('bandwidth.result.absolute'),
                value: formatHz(state.computed.absoluteHz),
              },
              {
                label: t('bandwidth.result.center'),
                value: formatHz(state.computed.centerHz),
              },
              {
                label: t('bandwidth.result.relative'),
                value: formatPercent(state.computed.relativePercent, 4),
                emphasis: true,
              },
            ]}
          />
        )}

        {state.computed.kind === 'ok' && state.resolved.fminHz != null && state.resolved.fmaxHz != null && (
          <PythonVerifyButton
            inputs={[state.resolved.fminHz, state.resolved.fmaxHz]}
            invoker={(fminHz, fmaxHz) => window.emApi.pythonBandwidth(fminHz, fmaxHz)}
            compareValue={state.computed.relativePercent}
            extractValue={(reply) => reply.value.relativePercent}
            formatValue={(v) => formatPercent(v, 4)}
            formatDelta={(d) => formatNumber(d)}
          />
        )}
      </GlassCard>
    </section>
  )
}
