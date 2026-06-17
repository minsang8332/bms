import { BrowserWindow, ipcMain } from 'electron'
import * as serialPort from '../modules/serial-port'
import type { StoreRepository } from '../modules/store/create-store-repository'

type SettingHandlerOptions = {
  storeRepository: StoreRepository
}

export function registerSettingHandlers({
  storeRepository
}: SettingHandlerOptions): void {
  serialPort.init({
    storeRepository,
    onListChanged: (ports) => {
      for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send('setting:serialPortListChanged', ports)
      }
    },
    onDataReceived: (payload) => {
      for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send('setting:serialPortData', payload)
      }
    }
  })

  ipcMain.handle('setting:getSerialPortList', async () => {
    return serialPort.refreshList()
  })

  ipcMain.handle('setting:getSerialPortSetting', () => serialPort.getSetting())
  ipcMain.handle('setting:toggleSerialPort', (_, port) =>
    serialPort.toggleSelectedPort(port)
  )
  ipcMain.handle('setting:setSerialCommand', (_, command: string) =>
    serialPort.setCommand(command)
  )
}
