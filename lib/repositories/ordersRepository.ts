import { Order, DayReportSummary, PaymentMethodCode } from '@/types'
import { getMockStore } from '@/lib/supabase/mockStore'
import { v4 as uuidv4 } from 'uuid'

export async function createOrder(payload: any): Promise<Order> {
  const store = getMockStore()
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  
  const todayOrders = store.orders.filter(
    (o: Order) => o.tenantId === payload.tenantId && new Date(o.createdAt) >= start
  )

  const subtotal = (payload.items || []).reduce((s: number, i: any) => s + (Number(i.lineTotal) || 0), 0)
  const total = +subtotal.toFixed(2)

  const newOrder: Order = {
    id: uuidv4(),
    tenantId: payload.tenantId,
    cashierId: payload.cashierId || null,
    cashierName: payload.cashierName || null,
    customerName: (payload.customerName || '').trim() || null,
    customerPhone: (payload.customerPhone || '').trim() || null,
    orderNumber: todayOrders.length + 1,
    subtotal: total,
    total: total,
    status: payload.status || 'PAID',
    paymentStatus: payload.paymentStatus || 'PAID',
    paymentMethod: payload.paymentMethod || 'NUMERARIO',
    paymentReference: payload.paymentReference || null,
    isTableOrder: payload.isTableOrder !== undefined ? payload.isTableOrder : true,
    tableNumber: payload.tableNumber || null,
    notes: (payload.notes || '').trim() || null,
    items: (payload.items || []).map((i: any) => ({
      id: i.id || uuidv4(),
      containerId: i.container?.id || i.containerId,
      containerName: i.container?.name || i.containerName,
      containerEmoji: i.container?.emoji || i.containerEmoji || '🍨',
      containerPrice: Number(i.container?.precoBase || i.containerPrice || 0),
      freeToppingsAllowed: i.container?.limiteComplementosGratis || i.freeToppingsAllowed || 0,
      bases: (i.bases || []).map((b: any) => ({ id: b.id, name: b.name })),
      toppings: (i.toppings || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        emoji: t.emoji || '',
        isPremium: !!t.isPremium,
        isPaid: !!t.isPaid,
        precoCobrado: Number(t.precoCobrado || 0),
      })),
      lineTotal: Number(i.lineTotal || 0),
    })),
    createdAt: new Date().toISOString(),
  }

  // Sincronizar mesa física no salão se for pedido de mesa
  if (newOrder.tableNumber && newOrder.isTableOrder !== false) {
    const tableDigits = newOrder.tableNumber.replace(/\D/g, '')
    const tableNum = parseInt(tableDigits)
    if (!isNaN(tableNum)) {
      const targetTable = store.tables.find(
        (t) => t.tenantId === payload.tenantId && t.number === tableNum
      )
      if (targetTable) {
        targetTable.status = 'OCCUPIED'
        targetTable.items = newOrder.items || []
        targetTable.total = total
        targetTable.activatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    }
  }

  store.orders.unshift(newOrder)
  return newOrder
}

export async function getOrderById(id: string): Promise<Order | null> {
  const store = getMockStore()
  const order = store.orders.find((o: Order) => o.id === id)
  return order || null
}

export async function cancelOrder(id: string, reason: string, user: any): Promise<Order | null> {
  const store = getMockStore()
  const idx = store.orders.findIndex((o: Order) => o.id === id)
  if (idx >= 0) {
    store.orders[idx].status = 'CANCELLED'
    store.orders[idx].cancelledAt = new Date().toISOString()
    store.orders[idx].cancelReason = reason
    store.orders[idx].cancelledById = user?.id || null
    store.orders[idx].cancelledByName = user?.name || null
    return store.orders[idx]
  }
  return null
}

export async function getDayReport(tenantId: string, dateStr?: string): Promise<DayReportSummary> {
  const store = getMockStore()
  const start = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const list = store.orders.filter((o: Order) => {
    if (tenantId && o.tenantId !== tenantId) return false
    const d = new Date(o.createdAt)
    return d >= start && d < end
  })

  const byMethod: Record<string, { count: number; total: number }> = {
    NUMERARIO: { count: 0, total: 0 },
    MULTIBANCO: { count: 0, total: 0 },
    MB_WAY: { count: 0, total: 0 },
    PLATAFORMA: { count: 0, total: 0 },
  }

  let total = 0
  let paidCount = 0
  let cancelledTotal = 0
  let cancelledCount = 0

  for (const o of list) {
    if (o.status === 'CANCELLED') {
      cancelledCount += 1
      cancelledTotal += Number(o.total || o.totalAmount || 0)
      continue
    }
    paidCount += 1
    const orderVal = Number(o.total || o.totalAmount || 0)
    total += orderVal
    const meth = o.paymentMethod === 'MBWAY' ? 'MB_WAY' : o.paymentMethod === 'CASH' ? 'NUMERARIO' : o.paymentMethod
    if (!byMethod[meth]) {
      byMethod[meth] = { count: 0, total: 0 }
    }
    byMethod[meth].count += 1
    byMethod[meth].total += orderVal
  }

  Object.values(byMethod).forEach((b) => {
    b.total = +b.total.toFixed(2)
  })

  const byHour: Record<string, number> = {}
  for (const o of list) {
    if (o.status !== 'CANCELLED') {
      const h = new Date(o.createdAt).getHours().toString().padStart(2, '0') + ':00'
      byHour[h] = +((byHour[h] || 0) + Number(o.total || o.totalAmount || 0)).toFixed(2)
    }
  }

  return {
    date: start.toISOString().slice(0, 10),
    count: paidCount,
    total: +total.toFixed(2),
    cancelledCount,
    cancelledTotal: +cancelledTotal.toFixed(2),
    byMethod,
    byHour,
    orders: list,
  }
}
