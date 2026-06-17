import { Settings } from 'lucide-react'
import { useState } from 'react'
import GlobalAlert from '../components/feedback/GlobalAlert'
import Sidebar from '../components/navigation/Sidebar'
import SettingsModal from '../components/settings/SettingsModal'
import ThemeModeSwitch from '../components/theme/ThemeModeSwitch'
import ItemManagementPage from '../pages/ItemManagementPage'
import ServiceCenterPage from '../pages/ServiceCenterPage'
import CsHistoryPage from '../pages/CsHistoryPage'
import type { StoredTab } from '../../../shared/api'

type AppLayoutProps = {
  tabs: StoredTab[]
  activeTab?: StoredTab
  activeTabId: string
  onTabChange: (tabId: string) => void
}

function AppLayout({ tabs, activeTab, activeTabId, onTabChange }: AppLayoutProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <main className="app-shell flex min-h-screen text-slate-950 transition-colors dark:text-white">
      <Sidebar
        activeTabId={activeTabId}
        tabs={tabs}
        onTabChange={onTabChange}
      />

      <section className="relative flex min-w-0 flex-1 flex-col">
        <div className="absolute right-6 top-5 z-10 flex items-center gap-2">
          <ThemeModeSwitch />
          <button
            aria-label="Open settings"
            title="Settings"
            className="grid h-10 w-10 place-items-center rounded-md border border-emerald-100/80 bg-white/55 text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/60 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
            type="button"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6 pt-20">
          {activeTab?.id === 'item-management' ? (
            <ItemManagementPage title={activeTab.label} subLabel={activeTab.subLabel} />
          ) : activeTab?.id === 'service-center' || activeTab?.id === 'branch-management' ? (
            <ServiceCenterPage title={activeTab.label} subLabel={activeTab.subLabel} />
          ) : activeTab?.id === 'cs-history' ? (
            <CsHistoryPage title={activeTab.label} subLabel={activeTab.subLabel} />
          ) : (
            <div className="glass-panel p-5">
              <h2 className="text-lg font-semibold">{activeTab?.label ?? '대시보드'}</h2>
            </div>
          )}
        </div>
      </section>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <GlobalAlert />
    </main>
  )
}

export default AppLayout
