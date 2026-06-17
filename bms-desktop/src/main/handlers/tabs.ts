import { ipcMain } from 'electron'
import type { StoredTab } from '../../shared/api'
import { createTabRepository } from '../modules/tabs/tab-repository'
import type { StoreRepository } from '../modules/store/create-store-repository'

export function registerTabHandlers(storeRepository: StoreRepository): void {
  const tabRepository = createTabRepository(storeRepository)

  ipcMain.handle('tabs:readAll', () => tabRepository.readAll())
  ipcMain.handle('tabs:create', (_, tab: StoredTab) => tabRepository.create(tab))
  ipcMain.handle('tabs:edit', (_, tab: StoredTab) => tabRepository.edit(tab))
  ipcMain.handle('tabs:remove', (_, id: string) => tabRepository.remove(id))
  ipcMain.handle('tabs:removeAll', () => tabRepository.removeAll())
}
