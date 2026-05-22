import type { ReactNode } from 'react'
import { useTranslation } from '../i18n/useTranslation'
import { LanguageToggle } from './LanguageToggle'

export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <h1 className="app-header__title">{t('app.title')}</h1>
          <p className="app-header__subtitle">{t('app.subtitle')}</p>
        </div>
        <LanguageToggle />
      </header>
      {children}
      <footer className="app-footer">
        <span>{t('app.author')}</span>
      </footer>
    </div>
  )
}
