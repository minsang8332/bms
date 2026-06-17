import { Pencil, Plus, Search, Trash2, Building2, MapPin, Phone, Settings, Upload, FileText, Truck, CheckCircle2, Download } from 'lucide-react'
import { FormEvent, useMemo, useState, useEffect } from 'react'
import BaseModal from '../components/modal/BaseModal'
import PageHeader from '../components/layout/PageHeader'
import { useAlertStore } from '../stores/useAlertStore'
import type { ServiceCenterBranch, ShippedItem, StoredItem } from '../../../shared/api'
import Table, { TableColumn } from '../components/common/Table'
import Pagination from '../components/common/Pagination'

type ServiceCenterFormState = {
  name: string
  address: string
  contact: string
  status: '문의접수' | '입고요청' | '수리중' | '수리완료' | '출고대기' | '출고완료' | '접수취소'
  licensePath?: string | null
  licenseName?: string | null
  description: string
  items: ShippedItem[]
}

type SortKey = 'name' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const pageSizeOptions = [5, 10, 20, 50, 100]

const emptyForm: ServiceCenterFormState = {
  name: '',
  address: '',
  contact: '',
  status: '문의접수',
  licensePath: null,
  licenseName: null,
  description: '',
  items: []
}

type ServiceCenterPageProps = {
  title?: string
  subLabel?: string | null
}

function ServiceCenterPage({ title = 'CS 관리', subLabel }: ServiceCenterPageProps) {
  const showAlert = useAlertStore((state) => state.showAlert)
  const [items, setItems] = useState<ServiceCenterBranch[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [pageSize, setPageSize] = useState(5)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<ServiceCenterFormState>(emptyForm)
  const [editingServiceCenter, setEditingServiceCenter] = useState<ServiceCenterBranch | null>(null)
  const [deletingServiceCenter, setDeletingServiceCenter] = useState<ServiceCenterBranch | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['문의접수', '입고요청', '수리중', '수리완료', '출고대기'])
  const [currentPage, setCurrentPage] = useState(1)
  const [stockItems, setStockItems] = useState<StoredItem[]>([])

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''

    // 1. 서울 지역번호 02 (2자리)
    if (numbers.startsWith('02')) {
      if (numbers.length <= 2) return numbers
      if (numbers.length <= 5) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
      if (numbers.length <= 9) return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
    }

    // 2. 010 및 기타 지역번호/인터넷전화 (3자리: 010, 031, 032, 051, 070 등)
    if (numbers.startsWith('0')) {
      if (numbers.length <= 3) return numbers
      if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
      if (numbers.length <= 10) return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }

    // 3. 전국 대표번호 (1588, 1544, 1644, 1800 등 8자리 이하)
    if (numbers.startsWith('1') && numbers.length <= 8) {
      if (numbers.length <= 4) return numbers
      return `${numbers.slice(0, 4)}-${numbers.slice(4)}`
    }

    return numbers
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setForm((current) => ({ ...current, contact: formatted }))
  }

  const loadServiceCenters = async () => {
    if (!window.api || !window.api.serviceCenter) {
      console.warn('CS API를 아직 사용할 수 없습니다.')
      return
    }
    try {
      const data = await window.api.serviceCenter.readAll()
      if (Array.isArray(data)) {
        setItems(data)
      } else {
        setItems([])
      }
    } catch (error: any) {
      console.error('Failed to load CS data:', error)
      const errorMsg = error?.message || String(error)
      if (!errorMsg.includes('No handler registered') && !errorMsg.includes('Handler already registered')) {
        showAlert('지점 목록을 불러오는데 실패했습니다.', 'error')
      }
    }
  }

  const loadStatuses = async () => {
    if (!window.api || !window.api.serviceCenter) {
      return
    }
    try {
      const data = await window.api.serviceCenter.getStatuses()
      setStatuses(data)
    } catch (error) {
      console.error('Failed to load statuses:', error)
    }
  }

  const loadStockItems = async () => {
    if (!window.api || !window.api.item) return
    try {
      const data = await window.api.item.readAll()
      setStockItems(data)
    } catch (error) {
      console.error('Failed to load stock items:', error)
    }
  }

  useEffect(() => {
    loadServiceCenters()
    loadStatuses()
    loadStockItems()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize, selectedStatuses])

  const stats = useMemo(() => {
    return {
      total: items.length,
      received: items.filter((b) => b.status === '문의접수').length,
      requestStock: items.filter((b) => b.status === '입고요청').length,
      repairing: items.filter((b) => b.status === '수리중').length,
      repairCompleted: items.filter((b) => b.status === '수리완료').length,
      shipping: items.filter((b) => b.status === '출고대기').length,
      completed: items.filter((b) => b.status === '출고완료').length,
      cancelled: items.filter((b) => b.status === '접수취소').length
    }
  }, [items])

  const itemsSummary = useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => sum + (item.price || 0) * (item.count || 0), 0)
    const vat = Math.floor(subtotal * 0.1)
    const total = subtotal + vat
    return { subtotal, vat, total }
  }, [form.items])

  const filteredItems = useMemo(() => {
    const statusFiltered = items.filter((item) => selectedStatuses.includes(item.status))
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return statusFiltered

    return statusFiltered.filter((item) =>
      [item.name, item.address || '', item.contact, item.status].some((value) =>
        String(value).toLowerCase().includes(normalizedSearch)
      )
    )
  }, [items, selectedStatuses, search])

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((left, right) => {
      const valLeft = left[sortKey] ?? ''
      const valRight = right[sortKey] ?? ''
      const comparison = String(valLeft).localeCompare(String(valRight), 'ko')
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredItems, sortKey, sortDirection])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredItems.length / pageSize))
  }, [filteredItems.length, pageSize])

  const displayedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedItems.slice(start, start + pageSize)
  }, [sortedItems, currentPage, pageSize])

  const toggleSort = (nextSortKey: SortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(nextSortKey)
    setSortDirection('asc')
  }


  const openCreateModal = () => {
    loadStockItems()
    setEditingServiceCenter(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEditModal = (serviceCenter: ServiceCenterBranch) => {
    loadStockItems()
    setEditingServiceCenter(serviceCenter)
    setForm({
      name: serviceCenter.name,
      address: serviceCenter.address,
      contact: formatPhoneNumber(serviceCenter.contact),
      status: serviceCenter.status,
      licensePath: serviceCenter.licensePath,
      licenseName: serviceCenter.licenseName,
      description: serviceCenter.description || '',
      items: serviceCenter.items ?? []
    })
    setFormOpen(true)
  }

  const closeFormModal = () => {
    setFormOpen(false)
    setEditingServiceCenter(null)
    setForm(emptyForm)
  }

  const handleAddShippedItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, { name: '', price: 0, count: 1 }]
    }))
  }

  const handleUpdateShippedItem = (idx: number, key: keyof ShippedItem, value: any) => {
    setForm((current) => {
      const nextItems = [...current.items]
      nextItems[idx] = {
        ...nextItems[idx],
        [key]: value
      }
      return {
        ...current,
        items: nextItems
      }
    })
  }

  const handleRemoveShippedItem = (idx: number) => {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, i) => i !== idx)
    }))
  }

  const handleUploadLicense = async () => {
    try {
      const fileInfo = await window.api.serviceCenter.uploadLicense()
      if (fileInfo) {
        setForm((current) => ({
          ...current,
          licensePath: fileInfo.path,
          licenseName: fileInfo.name
        }))
        showAlert('사업자 등록증이 업로드되었습니다.', 'success')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      showAlert('파일 업로드에 실패했습니다.', 'error')
    }
  }

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.name.trim() || !form.contact.trim()) {
      showAlert('지점명과 연락처는 필수 입력 항목입니다.', 'error')
      return
    }

    // Validate stock before saving
    for (const shippedItem of form.items) {
      if (!shippedItem.name) continue
      const sItem = stockItems.find((s) => s.name === shippedItem.name)
      if (!sItem) {
        showAlert(`재고 관리에서 품목 [${shippedItem.name}]을 찾을 수 없습니다.`, 'error')
        return
      }

      const savedInBranch = editingServiceCenter?.items?.find((i) => i.name === shippedItem.name)?.count || 0
      const countInCurrentFormAllRows = form.items
        .filter((i) => i.name === shippedItem.name)
        .reduce((sum, i) => sum + (i.count || 0), 0)

      const availableStock = sItem.count + savedInBranch
      if (countInCurrentFormAllRows > availableStock) {
        showAlert(`[${shippedItem.name}]의 최대 사용 가능 재고(${availableStock}개)를 초과했습니다. 현재 선택: ${countInCurrentFormAllRows}개`, 'error')
        return
      }
    }

    try {
      let shippedAt: string | null = null
      if (editingServiceCenter) {
        if (form.status === '출고완료') {
          shippedAt = editingServiceCenter.status === '출고완료' ? (editingServiceCenter.shippedAt || new Date().toISOString()) : new Date().toISOString()
        } else {
          shippedAt = null
        }
      } else {
        shippedAt = form.status === '출고완료' ? new Date().toISOString() : null
      }

      if (editingServiceCenter) {
        await window.api.serviceCenter.edit({
          id: editingServiceCenter.id,
          name: form.name,
          address: form.address,
          contact: form.contact.replace(/\D/g, ''),
          status: form.status,
          licensePath: form.licensePath,
          licenseName: form.licenseName,
          description: form.description,
          shippedAt,
          createdAt: editingServiceCenter.createdAt,
          items: form.items
        })
        showAlert('지점 정보가 수정되었습니다.', 'success')
      } else {
        await window.api.serviceCenter.create({
          name: form.name,
          address: form.address,
          contact: form.contact.replace(/\D/g, ''),
          status: form.status,
          licensePath: form.licensePath,
          licenseName: form.licenseName,
          description: form.description,
          shippedAt,
          items: form.items
        })
        showAlert('새로운 지점이 추가되었습니다.', 'success')
      }

      // Adjust stock in the backend
      for (const sItem of stockItems) {
        const savedInBranch = editingServiceCenter?.items?.find((i) => i.name === sItem.name)?.count || 0
        const countInCurrentForm = form.items
          .filter((i) => i.name === sItem.name)
          .reduce((sum, i) => sum + (i.count || 0), 0)

        const diff = savedInBranch - countInCurrentForm
        if (diff !== 0) {
          await window.api.item.edit({
            ...sItem,
            count: sItem.count + diff
          })
        }
      }

      await loadServiceCenters()
      closeFormModal()
    } catch (error) {
      console.error('Failed to save CS branch:', error)
      showAlert('저장에 실패했습니다.', 'error')
    }
  }

  const confirmDelete = async () => {
    if (!deletingServiceCenter) {
      return
    }

    try {
      await window.api.serviceCenter.remove(deletingServiceCenter.id)
      
      // Return stocks for deleted branch
      if (deletingServiceCenter.items && deletingServiceCenter.items.length > 0) {
        let latestStock: StoredItem[] = []
        if (window.api && window.api.item) {
          latestStock = await window.api.item.readAll()
        }
        for (const item of deletingServiceCenter.items) {
          const sItem = latestStock.find((s) => s.name === item.name)
          if (sItem) {
            await window.api.item.edit({
              ...sItem,
              count: sItem.count + (item.count || 0)
            })
          }
        }
      }

      showAlert('지점이 삭제되었습니다.', 'success')
      await loadServiceCenters()
    } catch (error) {
      console.error('Failed to delete CS branch:', error)
      showAlert('지점 삭제에 실패했습니다.', 'error')
    } finally {
      setDeletingServiceCenter(null)
    }
  }

  const getStatusBadgeClass = (status: '문의접수' | '입고요청' | '수리중' | '수리완료' | '출고대기' | '출고완료' | '접수취소') => {
    switch (status) {
      case '문의접수':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-400/10 dark:text-blue-300'
      case '입고요청':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300'
      case '수리중':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-400/10 dark:text-purple-300'
      case '수리완료':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-400/10 dark:text-indigo-300'
      case '출고대기':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-400/10 dark:text-orange-300'
      case '출고완료':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300'
      case '접수취소':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-400/10 dark:text-rose-300'
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
    }
  }
  const columns: TableColumn<ServiceCenterBranch>[] = [
    { key: 'name', label: '지점명', sortable: true },
    { key: 'status', label: '상태', sortable: true },
    { key: 'address', label: '주소', sortable: false, align: 'left' },
    { key: 'contact', label: '연락처', sortable: false },
    { key: 'items', label: '출고 항목', sortable: false },
    { key: 'createdAt', label: '접수일자', sortable: true },
    { key: 'shippedAt', label: '출고일자', sortable: false },
    { key: 'actions', label: '작업', sortable: false, widthClassName: 'w-28' }
  ]

  return (
    <div className="space-y-5">
      {/* Page Header Card */}
      <PageHeader
        title={title}
        subLabel={subLabel}
        action={
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
            type="button"
            onClick={openCreateModal}
          >
            <Plus size={17} />
            지점 추가
          </button>
        }
      />

      {/* Stats Summary Widgets */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
        {/* 전체 지점 card */}
        <button
          type="button"
          onClick={() => {
            const allStatuses = ['문의접수', '입고요청', '수리중', '수리완료', '출고대기', '출고완료', '접수취소']
            const allSelected = allStatuses.every((s) => selectedStatuses.includes(s))
            if (allSelected) {
              setSelectedStatuses([])
            } else {
              setSelectedStatuses(allStatuses)
            }
          }}
          className={`glass-panel p-3.5 flex items-center justify-between text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer select-none ${
            selectedStatuses.length === 7
              ? 'ring-2 ring-emerald-500/50'
              : 'opacity-50 dark:opacity-40 grayscale hover:grayscale-0 hover:opacity-80'
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">전체 지점</div>
            <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {stats.total}
            </div>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Building2 size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatuses((prev) =>
              prev.includes('문의접수') ? prev.filter((s) => s !== '문의접수') : [...prev, '문의접수']
            )
          }}
          className={`glass-panel p-3.5 flex items-center justify-between text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer select-none ${
            selectedStatuses.includes('문의접수')
              ? 'ring-2 ring-blue-500/50'
              : 'opacity-50 dark:opacity-40 grayscale hover:grayscale-0 hover:opacity-80'
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">문의 접수</div>
            <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.received}
            </div>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-300 rounded-lg">
            <MapPin size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatuses((prev) =>
              prev.includes('입고요청') ? prev.filter((s) => s !== '입고요청') : [...prev, '입고요청']
            )
          }}
          className={`glass-panel p-3.5 flex items-center justify-between text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer select-none ${
            selectedStatuses.includes('입고요청')
              ? 'ring-2 ring-amber-500/50'
              : 'opacity-50 dark:opacity-40 grayscale hover:grayscale-0 hover:opacity-80'
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">입고 요청</div>
            <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.requestStock}
            </div>
          </div>
          <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-300 rounded-lg">
            <Download size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatuses((prev) =>
              prev.includes('수리중') ? prev.filter((s) => s !== '수리중') : [...prev, '수리중']
            )
          }}
          className={`glass-panel p-3.5 flex items-center justify-between text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer select-none ${
            selectedStatuses.includes('수리중')
              ? 'ring-2 ring-purple-500/50'
              : 'opacity-50 dark:opacity-40 grayscale hover:grayscale-0 hover:opacity-80'
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">수리 중</div>
            <div className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.repairing}
            </div>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-500 dark:text-purple-300 rounded-lg">
            <Settings size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatuses((prev) =>
              prev.includes('수리완료') ? prev.filter((s) => s !== '수리완료') : [...prev, '수리완료']
            )
          }}
          className={`glass-panel p-3.5 flex items-center justify-between text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer select-none ${
            selectedStatuses.includes('수리완료')
              ? 'ring-2 ring-indigo-500/50'
              : 'opacity-50 dark:opacity-40 grayscale hover:grayscale-0 hover:opacity-80'
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">수리 완료</div>
            <div className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.repairCompleted}
            </div>
          </div>
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 dark:text-indigo-300 rounded-lg">
            <CheckCircle2 size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatuses((prev) =>
              prev.includes('출고대기') ? prev.filter((s) => s !== '출고대기') : [...prev, '출고대기']
            )
          }}
          className={`glass-panel p-3.5 flex items-center justify-between text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer select-none ${
            selectedStatuses.includes('출고대기')
              ? 'ring-2 ring-orange-500/50'
              : 'opacity-50 dark:opacity-40 grayscale hover:grayscale-0 hover:opacity-80'
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">출고 대기</div>
            <div className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.shipping}
            </div>
          </div>
          <div className="p-2 bg-orange-50 dark:bg-orange-950/20 text-orange-500 dark:text-orange-300 rounded-lg">
            <Truck size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatuses((prev) =>
              prev.includes('출고완료') ? prev.filter((s) => s !== '출고완료') : [...prev, '출고완료']
            )
          }}
          className={`glass-panel p-3.5 flex items-center justify-between text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer select-none ${
            selectedStatuses.includes('출고완료')
              ? 'ring-2 ring-emerald-500/50'
              : 'opacity-50 dark:opacity-40 grayscale hover:grayscale-0 hover:opacity-80'
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">출고 완료</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.completed}
            </div>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-300 rounded-lg">
            <Building2 size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatuses((prev) =>
              prev.includes('접수취소') ? prev.filter((s) => s !== '접수취소') : [...prev, '접수취소']
            )
          }}
          className={`glass-panel p-3.5 flex items-center justify-between text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer select-none ${
            selectedStatuses.includes('접수취소')
              ? 'ring-2 ring-rose-500/50'
              : 'opacity-50 dark:opacity-40 grayscale hover:grayscale-0 hover:opacity-80'
          }`}
        >
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">접수 취소</div>
              <div className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
                {stats.cancelled}
              </div>
            </div>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-300 rounded-lg">
              <Trash2 size={20} />
            </div>
          </button>
      </div>

      {/* Main Workspace Data Section */}
      <section className="glass-panel overflow-hidden">
        {/* Actions bar (Search & Page size) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <select
                className="h-10 rounded-md border border-emerald-100/80 bg-white/70 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              개씩 보기
            </label>
          </div>

          <label className="relative block w-full max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <input
              className="h-10 w-full rounded-md border border-emerald-100/80 bg-white/70 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100"
              placeholder="지점명, 주소, 연락처 검색"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        <Table
          columns={columns}
          data={displayedItems}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={toggleSort as any}
          emptyMessage="일치하는 지점 데이터가 없습니다."
          minWidth="min-w-[750px]"
          renderRow={(item) => (
            <tr
              key={item.id}
              className="text-slate-800 transition hover:bg-emerald-50/50 dark:text-slate-100 dark:hover:bg-emerald-400/10"
            >
              <td className="px-5 py-3 text-center font-medium">{item.name}</td>
              <td className="px-5 py-3 text-center">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(item.status)}`}>
                  {item.status}
                </span>
              </td>
              <td className="px-5 py-3 text-left max-w-xs truncate" title={item.address || ''}>
                {item.address || <span className="text-slate-400">-</span>}
              </td>
              <td className="px-5 py-3 text-center text-slate-600 dark:text-slate-400">{formatPhoneNumber(item.contact)}</td>
              <td className="px-5 py-3 text-center text-slate-600 dark:text-slate-400">
                {(() => {
                  if (!item.items || item.items.length === 0) return <span className="text-slate-400">-</span>
                  const subtotal = item.items.reduce((sum, i) => sum + (i.price || 0) * (i.count || 0), 0)
                  const vat = Math.floor(subtotal * 0.1)
                  const total = subtotal + vat
                  return (
                    <span
                      className="cursor-help underline decoration-dotted"
                      title={item.items.map((i) => `${i.name} (단가: ${i.price.toLocaleString()}원, ${i.count}개)`).join(', ')}
                    >
                      {item.items.length}개 항목 (총 {total.toLocaleString()}원)
                    </span>
                  )
                })()}
              </td>
              <td className="px-5 py-3 text-center text-slate-600 dark:text-slate-400">
                {item.createdAt ? item.createdAt.slice(0, 10) : <span className="text-slate-400">-</span>}
              </td>
              <td className="px-5 py-3 text-center text-slate-600 dark:text-slate-400">
                {item.shippedAt ? item.shippedAt.slice(0, 10) : <span className="text-slate-400">-</span>}
              </td>
              <td className="px-5 py-3 text-center">
                <div className="flex justify-center gap-1">
                  <button
                    aria-label="지점 수정"
                    title="수정"
                    className="grid h-9 w-9 place-items-center rounded-md text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus-visible:outline-none dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
                    type="button"
                    onClick={() => openEditModal(item)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    aria-label="지점 삭제"
                    title="삭제"
                    className="grid h-9 w-9 place-items-center rounded-md text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:outline-none dark:text-slate-300 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
                    type="button"
                    onClick={() => setDeletingServiceCenter(item)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </section>

      {/* Add / Edit Form Modal */}
      <BaseModal
        open={formOpen}
        title={editingServiceCenter ? '지점 수정' : '지점 추가'}
        widthClassName="max-w-4xl"
        onClose={closeFormModal}
      >
        <form className="space-y-4" onSubmit={submitForm}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-emerald-100/30 dark:border-emerald-900/40">
                기본 정보
              </h3>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                <span>지점명</span> <span className="text-rose-500 font-bold">*</span>
                <input
                  className="mt-2 h-10 w-full rounded-md border border-emerald-100/80 bg-white/70 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100"
                  placeholder="예: 서울 강남지점"
                  required
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>

              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                <span>주소</span>
                <input
                  className="mt-2 h-10 w-full rounded-md border border-emerald-100/80 bg-white/70 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100"
                  placeholder="예: 서울특별시 강남구..."
                  type="text"
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, address: event.target.value }))
                  }
                />
              </label>

              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                <span>연락처</span> <span className="text-rose-500 font-bold">*</span>
                <input
                  className="mt-2 h-10 w-full rounded-md border border-emerald-100/80 bg-white/70 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100"
                  placeholder="예: 010-1234-5678"
                  required
                  type="text"
                  value={form.contact}
                  onChange={handleContactChange}
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                  <span>상태</span> <span className="text-rose-500 font-bold">*</span>
                  <select
                    className="mt-2 h-10 w-full rounded-md border border-emerald-100/80 bg-white/70 px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100"
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, status: event.target.value as any }))
                    }
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                <span>문의 내용</span>
                <textarea
                  className="mt-2 w-full rounded-md border border-emerald-100/80 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100 min-h-[80px] resize-y"
                  placeholder="지점 관련 문의 및 요청 사항을 입력해주세요."
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </label>

              <div className="space-y-2">
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                  사업자 등록증
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleUploadLicense}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-emerald-100/80 bg-white/70 px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-200 dark:hover:bg-emerald-400/10"
                  >
                    <Upload size={16} />
                    파일 업로드
                  </button>
                  {form.licenseName ? (
                    <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                      <FileText size={16} />
                      <span className="truncate max-w-[150px]" title={form.licensePath || ''}>
                        {form.licenseName}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Right Column: 출고 항목 */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-emerald-100/30 dark:border-emerald-900/40">
                출고 항목 및 정산
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    품목 리스트
                  </span>
                  <button
                    type="button"
                    onClick={handleAddShippedItem}
                    className="inline-flex h-8 items-center gap-1 rounded bg-emerald-600 px-2.5 text-xs font-medium text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                  >
                    <Plus size={14} />
                    항목 추가
                  </button>
                </div>
                {form.items.length > 0 ? (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <select
                          className="h-9 flex-1 min-w-0 rounded-md border border-emerald-100/80 bg-white/70 px-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100"
                          required
                          value={item.name}
                          onChange={(e) => {
                            const selectedName = e.target.value
                            const sItem = stockItems.find((s) => s.name === selectedName)
                            if (sItem) {
                              setForm((current) => {
                                const nextItems = [...current.items]
                                nextItems[idx] = {
                                  name: sItem.name,
                                  price: sItem.price,
                                  count: 1
                                }
                                return { ...current, items: nextItems }
                              })
                            } else {
                              handleUpdateShippedItem(idx, 'name', '')
                            }
                          }}
                        >
                          <option value="">품목 선택</option>
                          {stockItems.map((sItem) => {
                            const countInCurrentFormOtherRows = form.items
                              .filter((_, i) => i !== idx)
                              .filter((i) => i.name === sItem.name)
                              .reduce((sum, i) => sum + (i.count || 0), 0)

                            const savedInBranch = editingServiceCenter?.items?.find((i) => i.name === sItem.name)?.count || 0
                            const availableStock = sItem.count + savedInBranch - countInCurrentFormOtherRows
                            const isDisabled = availableStock <= 0 && item.name !== sItem.name

                            return (
                              <option key={sItem.id} value={sItem.name} disabled={isDisabled}>
                                {sItem.name} (재고: {availableStock}개)
                              </option>
                            )
                          })}
                        </select>
                        <input
                          className="h-9 w-24 rounded-md border border-emerald-100/80 bg-white/70 px-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100 bg-slate-50 dark:bg-slate-900"
                          placeholder="단가"
                          required
                          type="number"
                          min={0}
                          readOnly
                          value={item.price || ''}
                        />
                        <input
                          className="h-9 w-16 rounded-md border border-emerald-100/80 bg-white/70 px-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950/55 dark:text-slate-100"
                          placeholder="수량"
                          required
                          type="number"
                          min={1}
                          max={(() => {
                            const sItem = stockItems.find((s) => s.name === item.name)
                            if (!sItem) return 1
                            const savedInBranch = editingServiceCenter?.items?.find((i) => i.name === item.name)?.count || 0
                            const countInCurrentFormOtherRows = form.items
                              .filter((_, i) => i !== idx)
                              .filter((i) => i.name === item.name)
                              .reduce((sum, i) => sum + (i.count || 0), 0)
                            return sItem.count + savedInBranch - countInCurrentFormOtherRows
                          })()}
                          value={item.count || ''}
                          onChange={(e) => handleUpdateShippedItem(idx, 'count', Number(e.target.value))}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveShippedItem(idx)}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-md text-xs text-slate-400">
                    등록된 출고 항목이 없습니다.
                  </div>
                )}

                {form.items.length > 0 && (
                  <div className="mt-3 rounded-lg border border-emerald-100/30 bg-slate-50/50 p-3 text-right text-xs text-slate-600 dark:border-emerald-950/20 dark:bg-slate-900/35 dark:text-slate-400 space-y-1">
                    <div>
                      <span>공급가액: </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {itemsSummary.subtotal.toLocaleString()}원
                      </span>
                    </div>
                    <div>
                      <span>부가세 (10%): </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {itemsSummary.vat.toLocaleString()}원
                      </span>
                    </div>
                    <div className="text-sm border-t border-emerald-100/30 dark:border-emerald-950/25 pt-1.5 mt-1.5 flex justify-between font-medium">
                      <span>합계금액 (VAT 포함): </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {itemsSummary.total.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-emerald-100/30 dark:border-emerald-900/40">
            <button
              type="button"
              onClick={closeFormModal}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
            >
              저장
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Delete Confirmation Modal */}
      <BaseModal
        open={Boolean(deletingServiceCenter)}
        title="지점 삭제"
        widthClassName="max-w-md"
        heightClassName="h-auto"
        onClose={() => setDeletingServiceCenter(null)}
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-700 dark:text-slate-200">
            {deletingServiceCenter
              ? `정말로 [${deletingServiceCenter.name}] 지점을 삭제하시겠습니까?`
              : ''}
          </p>

          <div className="flex justify-end gap-2">
            <button
              className="h-10 rounded-md border border-emerald-100/80 bg-white/50 px-4 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/60 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
              type="button"
              onClick={() => setDeletingServiceCenter(null)}
            >
              취소
            </button>
            <button
              className="h-10 rounded-md bg-rose-600 px-4 text-sm font-medium text-white transition hover:bg-rose-700"
              type="button"
              onClick={confirmDelete}
            >
              확인
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  )
}

export default ServiceCenterPage
