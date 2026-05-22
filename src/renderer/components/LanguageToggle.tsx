import { useTranslation } from '../i18n/useTranslation'
import type { Language } from '../i18n/strings'

export function LanguageToggle(): JSX.Element {
  const { language, setLanguage } = useTranslation()

  const buttons: Array<{ id: Language; label: string }> = [
    { id: 'en', label: 'EN' },
    { id: 'zh', label: '中' },
  ]

  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      {buttons.map((btn) => (
        <button
          key={btn.id}
          type="button"
          className={`lang-toggle__btn${language === btn.id ? ' is-active' : ''}`}
          aria-pressed={language === btn.id}
          onClick={() => setLanguage(btn.id)}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}
