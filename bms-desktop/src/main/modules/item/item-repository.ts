import { randomUUID } from 'node:crypto'
import type { ItemInput, StoredItem } from '../../../shared/api'
import type { StoreRepository } from '../store/create-store-repository'

const ITEM_COLLECTION = 'item_tbl'

function ensureInt(value: number, fieldName: string): number {
  if (!Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer`)
  }
  return value
}

function normalizeItemInput(item: ItemInput): ItemInput {
  return {
    name: String(item.name).trim(),
    price: ensureInt(Number(item.price), 'price'),
    count: ensureInt(Number(item.count), 'count')
  }
}

export function createItemRepository(storeRepository: StoreRepository) {
  return {
    readAll(): StoredItem[] {
      return Object.values(storeRepository.readAll<StoredItem>(ITEM_COLLECTION)).sort(
        (left, right) => left.name.localeCompare(right.name, 'ko')
      )
    },

    create(item: ItemInput): StoredItem {
      const nextItem: StoredItem = {
        id: randomUUID(),
        ...normalizeItemInput(item)
      }

      return storeRepository.create(ITEM_COLLECTION, nextItem.id, nextItem)
    },

    edit(item: StoredItem): StoredItem {
      const nextItem: StoredItem = {
        id: item.id,
        ...normalizeItemInput(item)
      }

      return storeRepository.edit(ITEM_COLLECTION, nextItem.id, nextItem)
    },

    remove(id: string): boolean {
      return storeRepository.remove(ITEM_COLLECTION, id)
    }
  }
}
