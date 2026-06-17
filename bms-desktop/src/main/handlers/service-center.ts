import { ipcMain, dialog, app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'
import type { ServiceCenterBranch } from '../../shared/api'

const API_URL = process.env.API_URL || 'http://localhost'

export function registerServiceCenterHandlers(): void {
  ipcMain.handle('service-center:readAll', async () => {
    const response = await fetch(`${API_URL}/service-center`)
    if (!response.ok) throw new Error('Failed to fetch service center branches')
    return response.json()
  })

  ipcMain.handle('service-center:create', async (_, branchInput: Omit<ServiceCenterBranch, 'id' | 'createdAt'>) => {
    const response = await fetch(`${API_URL}/service-center`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branchInput)
    })
    if (!response.ok) throw new Error('Failed to create service center branch')
    return response.json()
  })

  ipcMain.handle('service-center:edit', async (_, branch: ServiceCenterBranch) => {
    const response = await fetch(`${API_URL}/service-center/${branch.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branch)
    })
    if (!response.ok) throw new Error('Failed to edit service center branch')
    return response.json()
  })

  ipcMain.handle('service-center:remove', async (_, id: string) => {
    const response = await fetch(`${API_URL}/service-center/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to remove service center branch')
    return response.json() // returns boolean
  })

  ipcMain.handle('service-center:getStatuses', async () => {
    const response = await fetch(`${API_URL}/service-center/statuses`)
    if (!response.ok) throw new Error('Failed to get statuses')
    return response.json()
  })

  ipcMain.handle('service-center:uploadLicense', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: '사업자 등록증 업로드',
      filters: [
        { name: '이미지 및 PDF 파일', extensions: ['jpg', 'jpeg', 'png', 'pdf'] }
      ],
      properties: ['openFile']
    })

    if (canceled || filePaths.length === 0) {
      return null
    }

    const srcPath = filePaths[0]
    const ext = path.extname(srcPath)
    const uuidFilename = `${crypto.randomUUID()}${ext}`
    
    // Create Documents/bms-workbench directory if it doesn't exist
    const docPath = app.getPath('documents')
    const destDir = path.join(docPath, 'bms-workbench')
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }

    const destPath = path.join(destDir, uuidFilename)
    fs.copyFileSync(srcPath, destPath)

    return {
      path: destPath,
      name: path.basename(srcPath)
    }
  })
}
