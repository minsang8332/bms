import { ipcMain } from 'electron'
import type { ItemInput, StoredItem } from '../../shared/api'

const API_URL = process.env.API_URL || 'http://localhost'

export function registerItemHandlers(): void {
  ipcMain.handle('item:readAll', async () => {
    const response = await fetch(`${API_URL}/items`)
    if (!response.ok) throw new Error('Failed to fetch items')
    return response.json()
  })

  ipcMain.handle('item:create', async (_, item: ItemInput) => {
    const response = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    if (!response.ok) throw new Error('Failed to create item')
    return response.json()
  })

  ipcMain.handle('item:edit', async (_, item: StoredItem) => {
    const response = await fetch(`${API_URL}/items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    if (!response.ok) throw new Error('Failed to edit item')
    return response.json()
  })

  ipcMain.handle('item:remove', async (_, id: string) => {
    const response = await fetch(`${API_URL}/items/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to remove item')
    return response.json() // returns boolean
  })
}
