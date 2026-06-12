import { useState } from 'react'
import { AppShell } from './components/AppShell'
import { TitleBar } from './components/TitleBar'
import { GradientBlobs } from './components/backgrounds/GradientBlobs'
import { GrainOverlay } from './components/backgrounds/GrainOverlay'
import { Tabs } from './components/Tabs'
import { ApertureEfficiencyTab } from './features/aperture-efficiency/ApertureEfficiencyTab'
import { BandwidthTab } from './features/bandwidth/BandwidthTab'
import { TbdTab } from './features/tbd/TbdTab'
import { TransmissionLineTab } from './features/transmission-line/TransmissionLineTab'
import { WavelengthTab } from './features/wavelength/WavelengthTab'
import { useTranslation } from './i18n/useTranslation'

export type TabId = 'bandwidth' | 'efficiency' | 'wavelength' | 'transmission' | 'tbd'

export function App(): JSX.Element {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabId>('bandwidth')

  const tabs = [
    { id: 'bandwidth' as const, label: t('tabs.bandwidth') },
    { id: 'efficiency' as const, label: t('tabs.efficiency') },
    { id: 'wavelength' as const, label: t('tabs.wavelength') },
    { id: 'transmission' as const, label: t('tabs.transmission') },
    { id: 'tbd' as const, label: t('tabs.tbd') },
  ]

  return (
    <>
      <TitleBar />
      <GradientBlobs />
      <GrainOverlay />
      <AppShell>
        <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />
        <main className="app-main">
          {activeTab === 'bandwidth' && <BandwidthTab />}
          {activeTab === 'efficiency' && <ApertureEfficiencyTab />}
          {activeTab === 'wavelength' && <WavelengthTab />}
          {activeTab === 'transmission' && <TransmissionLineTab />}
          {activeTab === 'tbd' && <TbdTab />}
        </main>
      </AppShell>
    </>
  )
}
