import { useEffect, useState } from 'react'
import { useTranslation } from '../i18n/useTranslation'

export function TitleBar(): JSX.Element {
  const { t } = useTranslation()
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const unsubscribe = window.emApi.onWindowMaximized((maximized) => {
      setIsMaximized(maximized)
    })
    return unsubscribe
  }, [])

  const handleMinimize = (): void => {
    window.emApi.windowMinimize()
  }

  const handleMaximize = (): void => {
    window.emApi.windowMaximize()
  }

  const handleClose = (): void => {
    window.emApi.windowClose()
  }

  const handleDoubleClick = (): void => {
    window.emApi.windowMaximize()
  }

  return (
    <div className="titlebar">
      <div className="titlebar__drag" onDoubleClick={handleDoubleClick}>
        <span className="titlebar__title">{t('app.title')}</span>
      </div>
      <div className="titlebar__controls">
        <button
          className="titlebar__btn titlebar__btn--minimize"
          onClick={handleMinimize}
          aria-label="Minimize"
          type="button"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          className="titlebar__btn titlebar__btn--maximize"
          onClick={handleMaximize}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
          type="button"
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
              <rect x="2" y="0" width="8" height="8" strokeWidth="1" />
              <rect x="0" y="2" width="8" height="8" strokeWidth="1" fill="var(--bg-base-1)" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
              <rect x="0" y="0" width="10" height="10" strokeWidth="1" />
            </svg>
          )}
        </button>
        <button
          className="titlebar__btn titlebar__btn--close"
          onClick={handleClose}
          aria-label="Close"
          type="button"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
            <line x1="0" y1="0" x2="10" y2="10" strokeWidth="1" />
            <line x1="10" y1="0" x2="0" y2="10" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  )
}
