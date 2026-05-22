import type { TabId } from '../App'

interface TabDescriptor {
  id: TabId
  label: string
}

interface TabsProps {
  tabs: TabDescriptor[]
  activeId: TabId
  onChange: (id: TabId) => void
}

export function Tabs({ tabs, activeId, onChange }: TabsProps): JSX.Element {
  return (
    <div role="tablist" aria-label="Calculators" className="tabs">
      {tabs.map((tab) => {
        const selected = tab.id === activeId
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            className={`tabs__btn${selected ? ' is-active' : ''}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                const idx = tabs.findIndex((t) => t.id === activeId)
                const delta = e.key === 'ArrowRight' ? 1 : -1
                const next = tabs[(idx + delta + tabs.length) % tabs.length]
                if (next) {
                  onChange(next.id)
                  document.getElementById(`tab-${next.id}`)?.focus()
                }
              }
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
