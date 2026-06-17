import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppApi,
  ItemInput,
  SerialPortInfo,
  StoredItem,
  StoredTab
} from '../shared/api'

const api: AppApi = {
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  app: {
    closeWindow: () => ipcRenderer.invoke('app:closeWindow'),
    showWindow: () => ipcRenderer.invoke('app:showWindow'),
    quit: () => ipcRenderer.invoke('app:quit')
  },
  setting: {
    getSerialPortList: () => ipcRenderer.invoke('setting:getSerialPortList'),
    getSerialPortSetting: () => ipcRenderer.invoke('setting:getSerialPortSetting'),
    toggleSerialPort: (port: SerialPortInfo) =>
      ipcRenderer.invoke('setting:toggleSerialPort', port),
    setSerialCommand: (command: string) =>
      ipcRenderer.invoke('setting:setSerialCommand', command),
    onSerialPortListChanged: (callback) => {
      const listener = (_: Electron.IpcRendererEvent, ports: SerialPortInfo[]) =>
        callback(ports)
      ipcRenderer.on('setting:serialPortListChanged', listener)

      return () => ipcRenderer.removeListener('setting:serialPortListChanged', listener)
    },
    onSerialPortData: (callback) => {
      const listener = (
        _: Electron.IpcRendererEvent,
        payload: { path: string; data: string }
      ) => callback(payload)
      ipcRenderer.on('setting:serialPortData', listener)

      return () => ipcRenderer.removeListener('setting:serialPortData', listener)
    }
  },
  tabs: {
    readAll: () => ipcRenderer.invoke('tabs:readAll'),
    create: (tab: StoredTab) => ipcRenderer.invoke('tabs:create', tab),
    edit: (tab: StoredTab) => ipcRenderer.invoke('tabs:edit', tab),
    remove: (id: string) => ipcRenderer.invoke('tabs:remove', id),
    removeAll: () => ipcRenderer.invoke('tabs:removeAll')
  },
  item: {
    readAll: () => ipcRenderer.invoke('item:readAll'),
    create: (item: ItemInput) => ipcRenderer.invoke('item:create', item),
    edit: (item: StoredItem) => ipcRenderer.invoke('item:edit', item),
    remove: (id: string) => ipcRenderer.invoke('item:remove', id)
  },
  serviceCenter: {
    readAll: () => ipcRenderer.invoke('service-center:readAll'),
    create: (branch) => ipcRenderer.invoke('service-center:create', branch),
    edit: (branch) => ipcRenderer.invoke('service-center:edit', branch),
    remove: (id: string) => ipcRenderer.invoke('service-center:remove', id),
    getStatuses: () => ipcRenderer.invoke('service-center:getStatuses'),
    uploadLicense: () => ipcRenderer.invoke('service-center:uploadLicense')
  }
}

contextBridge.exposeInMainWorld('api', api)

