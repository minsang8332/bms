export type AppInfo = {
  version: string
  now: string
  sample: string
}

export type StoreValue =
  | string
  | number
  | boolean
  | null
  | StoreValue[]
  | {
      [key: string]: StoreValue
    }

export type StoredTab = {
  id: string
  label: string
  subLabel?: string | null
  path: string
  order: number
  closable: boolean
  parentId?: string | null
}

export type StoredPcm = {
  id: string
  maxCurrentA: number
  outlets: number
  count: number
}

export type TabsApi = {
  readAll: () => Promise<StoredTab[]>
  create: (tab: StoredTab) => Promise<StoredTab>
  edit: (tab: StoredTab) => Promise<StoredTab>
  remove: (id: string) => Promise<boolean>
  removeAll: () => Promise<boolean>
}

export type PcmInput = {
  maxCurrentA: number
  outlets: number
  count: number
}

export type PcmApi = {
  readAll: () => Promise<StoredPcm[]>
  create: (pcm: PcmInput) => Promise<StoredPcm>
  edit: (pcm: StoredPcm) => Promise<StoredPcm>
  remove: (id: string) => Promise<boolean>
}

export type AppWindowApi = {
  closeWindow: () => Promise<boolean>
  showWindow: () => Promise<boolean>
  quit: () => Promise<boolean>
}

export type SerialPortInfo = {
  path: string
  manufacturer?: string
  serialNumber?: string
  pnpId?: string
  locationId?: string
  productId?: string
  vendorId?: string
}

export type StoredSerialPortSetting = {
  path: string
  manufacturer: string | null
  serialNumber: string | null
  pnpId: string | null
  locationId: string | null
  productId: string | null
  vendorId: string | null
}

export type SerialPortSettingState = {
  selectedPort: StoredSerialPortSetting | null
  command: string
}

export type SettingApi = {
  getSerialPortList: () => Promise<SerialPortInfo[]>
  getSerialPortSetting: () => Promise<SerialPortSettingState>
  toggleSerialPort: (port: SerialPortInfo) => Promise<SerialPortSettingState>
  setSerialCommand: (command: string) => Promise<string>
  onSerialPortListChanged: (callback: (ports: SerialPortInfo[]) => void) => () => void
  onSerialPortData: (callback: (payload: { path: string; data: string }) => void) => () => void
}

export type ShippedItem = {
  name: string
  price: number
  count: number
}

export type ServiceCenterBranch = {
  id: string
  name: string
  address: string
  contact: string
  status: '문의접수' | '입고요청' | '수리중' | '수리완료' | '출고대기' | '출고완료' | '접수취소'
  licensePath?: string | null
  licenseName?: string | null
  description?: string | null
  shippedAt?: string | null
  createdAt: string
  items?: ShippedItem[]
}

export type ServiceCenterApi = {
  readAll: () => Promise<ServiceCenterBranch[]>
  create: (branch: Omit<ServiceCenterBranch, 'id' | 'createdAt'>) => Promise<ServiceCenterBranch>
  edit: (branch: ServiceCenterBranch) => Promise<ServiceCenterBranch>
  remove: (id: string) => Promise<boolean>
  getStatuses: () => Promise<string[]>
  uploadLicense: () => Promise<{ path: string; name: string } | null>
}

export type StoredItem = {
  id: string
  name: string
  price: number
  count: number
}

export type ItemInput = {
  name: string
  price: number
  count: number
}

export type ItemApi = {
  readAll: () => Promise<StoredItem[]>
  create: (item: ItemInput) => Promise<StoredItem>
  edit: (item: StoredItem) => Promise<StoredItem>
  remove: (id: string) => Promise<boolean>
}

export type AppApi = {
  getAppInfo: () => Promise<AppInfo>
  app: AppWindowApi
  setting: SettingApi
  tabs: TabsApi
  item: ItemApi
  serviceCenter: ServiceCenterApi
}

