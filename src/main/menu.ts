import { BrowserWindow, Menu, type MenuItemConstructorOptions } from 'electron'

export type Language = 'en' | 'zh'

const LABELS: Record<Language, { en: string; zh: string }> = {
  en: { en: 'English', zh: '中文' },
  zh: { en: 'English', zh: '中文' },
}

export function buildAppMenu(currentLang: Language, onLanguage: (lang: Language) => void): Menu {
  const langItems: MenuItemConstructorOptions[] = (['en', 'zh'] as const).map((lang) => ({
    label: LABELS[currentLang][lang],
    type: 'radio',
    checked: lang === currentLang,
    click: () => onLanguage(lang),
  }))

  const template: MenuItemConstructorOptions[] = [
    {
      label: currentLang === 'zh' ? '语言' : 'Language',
      submenu: langItems,
    },
    {
      label: currentLang === 'zh' ? '视图' : 'View',
      submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'togglefullscreen' }],
    },
  ]

  return Menu.buildFromTemplate(template)
}

export function broadcastLanguage(lang: Language): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('app:set-language', lang)
  }
}
