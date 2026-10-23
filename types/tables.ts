import { CartItem } from './order'

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BILLING'
export type TableType = 'MESA' | 'ESPLANADA'

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
  type?: TableType
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
