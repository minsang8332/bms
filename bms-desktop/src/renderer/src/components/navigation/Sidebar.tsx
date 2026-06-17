import type { StoredTab } from '../../../../shared/api'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

type SidebarProps = {
  tabs: StoredTab[]
  activeTabId: string
  onTabChange: (tabId: string) => void
}

function Sidebar({ tabs, activeTabId, onTabChange }: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const groupedTabs = useMemo(() => {
    const topLevelTabs = tabs.filter((tab) => !tab.parentId)
    const childrenByParent = new Map<string, StoredTab[]>()

    for (const tab of tabs) {
      if (!tab.parentId) {
        continue
      }

      const children = childrenByParent.get(tab.parentId) ?? []
      children.push(tab)
      childrenByParent.set(tab.parentId, children)
    }

    return topLevelTabs.map((tab) => ({
      tab,
      children: (childrenByParent.get(tab.id) ?? []).sort((left, right) => left.order - right.order)
    }))
  }, [tabs])

  const toggleGroup = (tabId: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [tabId]: !current[tabId]
    }))
  }

  return (
    <aside className="m-3 mr-0 flex w-64 shrink-0 flex-col rounded-lg border border-emerald-100/80 bg-white/55 shadow-2xl shadow-emerald-950/10 backdrop-blur-2xl dark:border-emerald-900/60 dark:bg-slate-950/35">
      <nav className="flex-1 space-y-1 px-3 py-4">
        {groupedTabs.map(({ tab, children }) => {
          const isExpanded = expandedGroups[tab.id] ?? true
          const hasChildren = children.length > 0

          return (
            <div key={tab.id} className="space-y-1">
              <button
                className={[
                  'flex h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-medium transition-colors focus:outline-none focus-visible:outline-none',
                  activeTabId === tab.id
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/10 dark:bg-emerald-400 dark:text-emerald-950'
                    : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200'
                ].join(' ')}
                type="button"
                onClick={() => {
                  if (hasChildren) {
                    toggleGroup(tab.id)
                  } else {
                    onTabChange(tab.id)
                  }
                }}
              >
                <span className="flex-1">{tab.label}</span>
                {hasChildren ? (
                  <span
                    aria-hidden="true"
                    className="text-current opacity-70"
                  >
                    {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </span>
                ) : null}
              </button>

              {hasChildren && isExpanded ? (
                <div className="space-y-1 pl-3">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      className={[
                        'flex h-9 w-full items-center rounded-md px-3 text-left text-sm font-medium transition-colors focus:outline-none focus-visible:outline-none',
                        activeTabId === child.id
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/10 dark:bg-emerald-400 dark:text-emerald-950'
                          : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200'
                      ].join(' ')}
                      type="button"
                      onClick={() => onTabChange(child.id)}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
