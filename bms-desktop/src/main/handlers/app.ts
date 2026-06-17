import { app, BrowserWindow, ipcMain } from 'electron'
import dayjs from 'dayjs'
import lodash from 'lodash'

type AppHandlerOptions = {
  getMainWindow: () => BrowserWindow | null
}

export function registerAppHandlers({ getMainWindow }: AppHandlerOptions): void {
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    now: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    sample: lodash.startCase('electron vite react tailwind')
  }))

  ipcMain.handle('app:closeWindow', () => {
    getMainWindow()?.hide()
    return true
  })

  ipcMain.handle('app:showWindow', () => {
    const window = getMainWindow()
    window?.show()
    window?.focus()
    return true
  })

  ipcMain.handle('app:quit', () => {
    app.quit()
    return true
  })
}
