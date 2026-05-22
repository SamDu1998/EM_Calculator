import { GlassCard } from '../../components/GlassCard'
import { useTranslation } from '../../i18n/useTranslation'

export function TbdTab(): JSX.Element {
  const { t } = useTranslation()
  return (
    <section role="tabpanel" id="panel-tbd" aria-labelledby="tab-tbd" className="tab-panel">
      <GlassCard heading={t('tabs.tbd')}>
        <p className="tbd-placeholder">{t('tbd.placeholder')}</p>
      </GlassCard>
    </section>
  )
}
