import { useId } from 'react'
import { GlassCard } from '../../components/GlassCard'
import { ResultDisplay } from '../../components/ResultDisplay'
import { useTranslation } from '../../i18n/useTranslation'
import { formatNumber } from '../../lib/format'
import { CoaxialForm, CoplanarForm, MicrostripForm } from './LineForms'
import {
  TRANSMISSION_LINE_TYPES,
  useTransmissionLine,
  type TransmissionLineType,
} from './useTransmissionLine'

export function TransmissionLineTab(): JSX.Element {
  const { t } = useTranslation()
  const state = useTransmissionLine()
  const typeSelectId = useId()

  const errorMessage =
    state.computed.kind === 'error'
      ? t(`transmission.errors.${state.computed.error}` as const)
      : null

  const isCoplanar = state.lineType === 'cpw' || state.lineType === 'gcpw'

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
          {state.lineType === 'microstrip' && (
            <MicrostripForm state={state} errorMessage={errorMessage} />
          )}
          {state.lineType === 'coaxial' && (
            <CoaxialForm state={state} errorMessage={errorMessage} />
          )}
          {isCoplanar && <CoplanarForm state={state} errorMessage={errorMessage} />}
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
