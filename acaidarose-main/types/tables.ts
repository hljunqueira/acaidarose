import { CartItem } from './order'

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BILLING'

export interface RestaurantTable {
  id: string
  tenantId: string
  number: number
  code: string
  nickname?: string
  serviceChargePercent?: number
  status: TableStatus
  assignedStaffId?: string
  assignedStaffName?: string
  activatedAt?: string
  items?: CartItem[]
  total?: number
  createdAt: string
  updatedAt?: string
}
