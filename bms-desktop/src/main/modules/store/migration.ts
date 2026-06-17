import ElectronStore from 'electron-store'
import type { StoredItem, ServiceCenterBranch } from '../../../shared/api'

const API_URL = process.env.API_URL || 'http://localhost'

const itemStore = new ElectronStore<any>({ name: 'bms-store' })
const csStore = new ElectronStore<any>({ name: 'cs' })

export async function migrateLocalDataToApi(): Promise<void> {
  try {
    // 1. Migrate Items
    const items = itemStore.get('item_tbl', {})
    const itemIds = Object.keys(items)
    const isItemsMigrated = itemStore.get('migrated_to_db')

    if (itemIds.length > 0 && !isItemsMigrated) {
      console.log(`[Migration] Found ${itemIds.length} local items. Migrating to API...`)
      for (const id of itemIds) {
        const item = items[id] as StoredItem
        try {
          const res = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          })
          if (!res.ok) {
            console.error(`[Migration] Failed to migrate item ${item.name}: ${res.statusText}`)
          }
        } catch (err) {
          console.error(`[Migration] Network error migrating item ${item.name}:`, err)
        }
      }
      itemStore.set('migrated_to_db', true)
      console.log('[Migration] Items migration finished.')
    }

    // 2. Migrate Service Centers
    const branches = csStore.get('branches', {})
    const branchIds = Object.keys(branches)
    const isBranchesMigrated = csStore.get('migrated_to_db')

    if (branchIds.length > 0 && !isBranchesMigrated) {
      console.log(`[Migration] Found ${branchIds.length} local service center branches. Migrating to API...`)
      for (const id of branchIds) {
        const branch = branches[id] as ServiceCenterBranch
        try {
          const res = await fetch(`${API_URL}/service-center`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(branch)
          })
          if (!res.ok) {
            console.error(`[Migration] Failed to migrate branch ${branch.name}: ${res.statusText}`)
          }
        } catch (err) {
          console.error(`[Migration] Network error migrating branch ${branch.name}:`, err)
        }
      }
      csStore.set('migrated_to_db', true)
      console.log('[Migration] Service center migration finished.')
    }
  } catch (error) {
    console.error('[Migration] Data migration process failed:', error)
  }
}
