import { CartItem, RestaurantTable } from '@/types'
import { mockStore } from '@/lib/supabase/mockStore'

export async function getTablesByTenant(tenantId: string): Promise<RestaurantTable[]> {
  return (mockStore.tables || [])
    .filter((t) => t.tenantId === tenantId)
    .sort((a, b) => a.number - b.number)
}

export async function getTableById(id: string): Promise<RestaurantTable | null> {
  return (mockStore.tables || []).find((t) => t.id === id) || null
}

export async function getTableByNumber(tenantId: string, number: number): Promise<RestaurantTable | null> {
  return (mockStore.tables || []).find((t) => t.tenantId === tenantId && t.number === number) || null
}

export async function createTable(data: Omit<RestaurantTable, 'id' | 'createdAt'>): Promise<RestaurantTable> {
  const newTable: RestaurantTable = {
    id: `tbl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...data,
    createdAt: new Date().toISOString(),
  }
  mockStore.tables = [...(mockStore.tables || []), newTable]
  return newTable
}

export async function createBatchTables(tenantId: string, startNumber: number, endNumber: number, staffId?: string, staffName?: string): Promise<RestaurantTable[]> {
  const created: RestaurantTable[] = []
  const currentList = mockStore.tables || []

  for (let num = startNumber; num <= endNumber; num++) {
    const existing = currentList.find((t) => t.tenantId === tenantId && t.number === num)
    if (!existing) {
      const tbl: RestaurantTable = {
        id: `tbl-${Date.now()}-${num}`,
        tenantId,
        number: num,
        code: `${num}`,
        nickname: `Mesa ${num.toString().padStart(2, '0')}`,
        serviceChargePercent: 0,
        status: 'AVAILABLE',
        assignedStaffId: staffId,
        assignedStaffName: staffName,
        createdAt: new Date().toISOString(),
      }
      created.push(tbl)
      currentList.push(tbl)
    }
  }

  mockStore.tables = [...currentList]
  return created
}

export async function updateTable(id: string, updates: Partial<RestaurantTable>): Promise<RestaurantTable | null> {
  const list = mockStore.tables || []
  const index = list.findIndex((t) => t.id === id)
  if (index === -1) return null

  const updated: RestaurantTable = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  list[index] = updated
  mockStore.tables = [...list]
  return updated
}

export async function openTableWithItems(id: string, items: CartItem[], staffId?: string, staffName?: string): Promise<RestaurantTable | null> {
  const table = await getTableById(id)
  if (!table) return null

  const total = items.reduce((acc, it) => acc + it.lineTotal, 0)
  const timeStr = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })

  return updateTable(id, {
    status: 'OCCUPIED',
    activatedAt: timeStr,
    items,
    total: +total.toFixed(2),
    assignedStaffId: staffId || table.assignedStaffId,
    assignedStaffName: staffName || table.assignedStaffName,
  })
}

export async function transferTableItems(fromTableId: string, toTableId: string): Promise<boolean> {
  const fromTbl = await getTableById(fromTableId)
  const toTbl = await getTableById(toTableId)

  if (!fromTbl || !toTbl) return false

  const combinedItems = [...(toTbl.items || []), ...(fromTbl.items || [])]
  const combinedTotal = combinedItems.reduce((acc, it) => acc + it.lineTotal, 0)

  // Update target table
  await updateTable(toTableId, {
    status: 'OCCUPIED',
    activatedAt: toTbl.activatedAt || fromTbl.activatedAt || new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
    items: combinedItems,
    total: +combinedTotal.toFixed(2),
  })

  // Clear source table
  await updateTable(fromTableId, {
    status: 'AVAILABLE',
    activatedAt: undefined,
    items: [],
    total: 0,
  })

  return true
}

export async function closeTable(id: string): Promise<RestaurantTable | null> {
  return updateTable(id, {
    status: 'AVAILABLE',
    activatedAt: undefined,
    items: [],
    total: 0,
  })
}

export async function deleteTable(id: string): Promise<boolean> {
  const list = mockStore.tables || []
  const filtered = list.filter((t) => t.id !== id)
  if (filtered.length === list.length) return false
  mockStore.tables = filtered
  return true
}
