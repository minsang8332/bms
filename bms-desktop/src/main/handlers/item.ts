import { ipcMain } from 'electron'
import type { ItemInput, StoredItem } from '../../shared/api'
import { createItemRepository } from '../modules/item/item-repository'
import type { StoreRepository } from '../modules/store/create-store-repository'

export function registerItemHandlers(storeRepository: StoreRepository): void {
  const itemRepository = createItemRepository(storeRepository)

  ipcMain.handle('item:readAll', () => itemRepository.readAll())
  ipcMain.handle('item:create', (_, item: ItemInput) => itemRepository.create(item))
  ipcMain.handle('item:edit', (_, item: StoredItem) => itemRepository.edit(item))
  ipcMain.handle('item:remove', (_, id: string) => itemRepository.remove(id))
}
