import type { StoredTab } from '../../../shared/api'
import type { StoreRepository } from '../store/create-store-repository'

const TABS_COLLECTION = 'tabs'

const defaultTabs: StoredTab[] = [
  {
    id: 'item-management',
    label: '재고 관리',
    subLabel: 'CS 관리에 사용되는 출고 품목 및 재고 수량을 관리합니다.',
    path: '/item-management',
    order: 20,
    closable: false
  },
  {
    id: 'vehicle-sw',
    label: '차량용 SW',
    subLabel: '차량용 소프트웨어 배포 정보 및 서브 메뉴를 제공합니다.',
    path: '/vehicle-sw',
    order: 30,
    closable: false
  },
  {
    id: 'service-center',
    label: 'CS 관리',
    subLabel: '차량용 소프트웨어가 탑재된 지점 정보 및 배포 현황을 관리하고 모니터링합니다.',
    path: '/service-center',
    order: 10,
    closable: false,
    parentId: 'vehicle-sw'
  },
  {
    id: 'cs-history',
    label: 'CS 히스토리',
    subLabel: '차량용 소프트웨어 충전기 출고에 대하여 날짜별로 품목 및 지점을 집계합니다.',
    path: '/cs-history',
    order: 15,
    closable: false,
    parentId: 'vehicle-sw'
  }
]

export function createTabRepository(storeRepository: StoreRepository) {
  function ensureDefaultTabs(): void {
    const tabs = storeRepository.readAll<StoredTab>(TABS_COLLECTION)
    const defaultIds = new Set(defaultTabs.map((t) => t.id))

    for (const id of Object.keys(tabs)) {
      if (!defaultIds.has(id)) {
        storeRepository.remove(TABS_COLLECTION, id)
      }
    }

    for (const tab of defaultTabs) {
      storeRepository.create(TABS_COLLECTION, tab.id, tab)
    }
  }

  return {
    readAll(): StoredTab[] {
      ensureDefaultTabs()

      return Object.values(storeRepository.readAll<StoredTab>(TABS_COLLECTION)).sort(
        (left, right) => left.order - right.order
      )
    },

    create(tab: StoredTab): StoredTab {
      return storeRepository.create(TABS_COLLECTION, tab.id, tab)
    },

    edit(tab: StoredTab): StoredTab {
      return storeRepository.edit(TABS_COLLECTION, tab.id, tab)
    },

    remove(id: string): boolean {
      return storeRepository.remove(TABS_COLLECTION, id)
    },

    removeAll(): boolean {
      return storeRepository.removeAll(TABS_COLLECTION)
    }
  }
}
