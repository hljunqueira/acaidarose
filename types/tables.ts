import { CartItem } from './order'

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BILLING'

export interface TableOrderItem extends CartItem {
  customerName?: string
  orderedAt?: string
  orderNumber?: number
  paymentStatus?: string
  paymentMethod?: string
}

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
  items?: TableOrderItem[]
  total?: number
  createdAt: string
  updatedAt?: string
}
