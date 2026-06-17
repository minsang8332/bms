import { create } from 'zustand'
import type { StoredTab } from '../../../shared/api'

type TabState = {
  tabs: StoredTab[]
  activeTabId: string
  activeTab?: StoredTab
  loadTabs: () => Promise<void>
  setActiveTabId: (tabId: string) => void
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: 'service-center',
  activeTab: undefined,
  loadTabs: async () => {
    const tabs = await window.api.tabs.readAll()
    const activeTabId = get().activeTabId
    const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]

    set({
      tabs,
      activeTab,
      activeTabId: activeTab?.id ?? 'service-center'
    })
  },
  setActiveTabId: (tabId) => {
    const activeTab = get().tabs.find((tab) => tab.id === tabId)

    set({
      activeTabId: tabId,
      activeTab
    })
  }
}))
