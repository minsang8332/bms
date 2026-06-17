import { useEffect, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useThemeEffect } from '../hooks/useThemeEffect'
import { useTabStore } from '../stores/useTabStore'

const splashStorageKey = 'bms:splash-shown'

function DashboardPage() {
  useThemeEffect()

  const tabs = useTabStore((state) => state.tabs)
  const activeTab = useTabStore((state) => state.activeTab)
  const activeTabId = useTabStore((state) => state.activeTabId)
  const loadTabs = useTabStore((state) => state.loadTabs)
  const setActiveTabId = useTabStore((state) => state.setActiveTabId)
  const [showSplash, setShowSplash] = useState(() => {
    return sessionStorage.getItem(splashStorageKey) !== 'true'
  })
  const [fadeSplash, setFadeSplash] = useState(false)

  useEffect(() => {
    loadTabs()
  }, [loadTabs])

  useEffect(() => {
    if (!showSplash) {
      return
    }

    const fadeTimer = window.setTimeout(() => setFadeSplash(true), 900)
    const hideTimer = window.setTimeout(() => {
      sessionStorage.setItem(splashStorageKey, 'true')
      setShowSplash(false)
    }, 1500)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [showSplash])

  return (
    <>
      <AppLayout
        activeTab={activeTab}
        activeTabId={activeTabId}
        tabs={tabs}
        onTabChange={setActiveTabId}
      />

      {showSplash ? (
        <div
          className={[
            'fixed inset-0 z-50 grid place-items-center bg-neutral-950 transition-opacity duration-700 ease-out',
            fadeSplash ? 'opacity-0' : 'opacity-100'
          ].join(' ')}
        >
          <div className="text-5xl font-semibold tracking-normal text-white">
            BMS Workbench
          </div>
        </div>
      ) : null}
    </>
  )
}

export default DashboardPage
