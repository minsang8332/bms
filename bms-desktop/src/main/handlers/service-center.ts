import { ipcMain, dialog, app } from 'electron'
import ElectronStore from 'electron-store'
import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'
import type { ServiceCenterBranch } from '../../shared/api'

const VALID_STATUSES = ['문의접수', '입고요청', '수리중', '수리완료', '출고대기', '출고완료', '접수취소'] as const

const store = new ElectronStore<{ branches: Record<string, ServiceCenterBranch> }>({
  name: 'cs',
  defaults: {
    branches: {}
  }
})

export function registerServiceCenterHandlers(): void {
  // If store doesn't have branches, initialize to empty object
  if (!store.has('branches')) {
    store.set('branches', {})
  } else {
    // Migrate: Ensure all existing branches have a createdAt field, status '접수중' to '문의접수', and contacts are cleaned
    let currentBranches = store.get('branches')
    if (currentBranches && typeof currentBranches === 'object') {
      let modified = false
      const updated = { ...currentBranches } as Record<string, any>
      for (const key of Object.keys(updated)) {
        if (updated[key]) {
          if (!updated[key].createdAt) {
            updated[key].createdAt = new Date().toISOString()
            modified = true
          }
          if (updated[key].status === '접수중') {
            updated[key].status = '문의접수'
            modified = true
          }
          if (updated[key].status === '출고중') {
            updated[key].status = '출고대기'
            modified = true
          }
          if (updated[key].contact && updated[key].contact.includes('-')) {
            updated[key].contact = updated[key].contact.replace(/\D/g, '')
            modified = true
          }
        }
      }
      if (modified) {
        store.set('branches', updated)
      }
    }
  }

  ipcMain.handle('service-center:readAll', () => {
    const branches = store.get('branches') || {}
    return Object.values(branches)
  })

  ipcMain.handle('service-center:create', (_, branchInput: Omit<ServiceCenterBranch, 'id' | 'createdAt'>) => {
    const newId = crypto.randomUUID()
    const newBranch: ServiceCenterBranch = {
      ...branchInput,
      contact: branchInput.contact.replace(/\D/g, ''),
      id: newId,
      createdAt: new Date().toISOString()
    }
    store.set(`branches.${newId}`, newBranch)
    return newBranch
  })

  ipcMain.handle('service-center:edit', (_, branch: ServiceCenterBranch) => {
    const updatedBranch = {
      ...branch,
      contact: branch.contact.replace(/\D/g, '')
    }
    store.set(`branches.${branch.id}`, updatedBranch)
    return updatedBranch
  })

  ipcMain.handle('service-center:remove', (_, id: string) => {
    const branches = store.get('branches') || {}
    if (branches[id]) {
      const updated = { ...branches }
      delete updated[id]
      store.set('branches', updated)
      return true
    }
    return false
  })

  ipcMain.handle('service-center:getStatuses', () => {
    return [...VALID_STATUSES]
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
