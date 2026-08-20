import { ProductBase, ProductContainer, ProductTopping } from './catalog'

export type PaymentMethodCode = 'NUMERARIO' | 'MULTIBANCO' | 'MB_WAY' | 'PLATAFORMA' | 'MBWAY' | 'CASH'
export type OrderStatus = 'NEW' | 'OPEN' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'

export interface OrderItemTopping extends ProductTopping {
  isPaid: boolean
  precoCobrado: number
}

export interface CartDraftItem {
  id: string
  container: ProductContainer | null
  bases: ProductBase[]
  toppings: ProductTopping[]
}

export interface CartItem {
  id: string
  container: ProductContainer
  bases: ProductBase[]
  toppings: OrderItemTopping[]
  lineTotal: number
}

export interface Order {
  id: string
  tenantId: string
  cashierId?: string | null
  cashierName?: string | null
  customerName?: string | null
  customerPhone?: string | null
  orderNumber: number
  subtotal?: number
  subtotalAmount?: number
  total: number
  totalAmount?: number
  itemsCount?: number
  status: OrderStatus
  paymentStatus?: 'PAID' | 'PENDING' | string | null
  paymentMethod: PaymentMethodCode
  paymentReference?: string | null
  mbwayPhone?: string | null
  isTableOrder?: boolean
  tableNumber?: string | null
  notes?: string | null
  cancelledAt?: string | Date | null
  cancelReason?: string | null
  cancelledById?: string | null
  cancelledByName?: string | null
  items: any[]
  createdAt: string | Date
  updatedAt?: string | Date
  deletedAt?: string | Date | null
}

export interface DayReportSummary {
  date: string
  count: number
  total: number
  cancelledCount: number
  cancelledTotal: number
  byMethod: Record<string, { count: number; total: number }>
  byHour?: Record<string, number>
  orders: Order[]
}
