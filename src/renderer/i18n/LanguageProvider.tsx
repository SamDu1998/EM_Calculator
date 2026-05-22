import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { strings, type Language, type TranslationKey } from './strings'

const STORAGE_KEY = 'em-calc:language'

export interface LanguageContextValue {
  language: Language
  setLanguage: (next: Language) => void
  t: (key: TranslationKey) => string
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'zh') return stored
  const navLang = window.navigator.language.toLowerCase()
  return navLang.startsWith('zh') ? 'zh' : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }): JSX.Element {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage)

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next)
    }
  }, [])

  useEffect(() => {
    const api = window.emApi
    if (!api) return
    const unsubscribe = api.onSetLanguage((lang) => {
      if (lang === 'en' || lang === 'zh') setLanguage(lang)
    })
    return unsubscribe
  }, [setLanguage])

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  }, [language])

  const t = useCallback((key: TranslationKey) => strings[language][key], [language])

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
