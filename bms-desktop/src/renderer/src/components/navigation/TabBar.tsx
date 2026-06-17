import type { StoredTab } from '../../../../shared/api'

type TabBarProps = {
  tabs: StoredTab[]
  activeTabId: string
  onTabChange: (tabId: string) => void
}

function TabBar({ tabs, activeTabId, onTabChange }: TabBarProps) {
  return (
    <div className="flex min-w-0 flex-1 items-end self-end">
      <div className="flex min-w-0 gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={[
              'h-11 min-w-32 rounded-t-md border px-4 text-sm font-medium transition-colors focus:outline-none focus-visible:outline-none',
              activeTabId === tab.id
                ? 'border-emerald-100/80 border-b-transparent bg-white/70 text-emerald-800 shadow-sm backdrop-blur-xl dark:border-emerald-900/60 dark:bg-emerald-400/12 dark:text-emerald-100'
                : 'border-transparent bg-white/25 text-slate-600 hover:bg-emerald-50/80 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200'
            ].join(' ')}
            type="button"
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default TabBar
