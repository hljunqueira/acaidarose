import { Order, DayReportSummary } from '@/types'
import { query } from '@/lib/db/postgres'
import { v4 as uuidv4 } from 'uuid'

export async function createOrder(payload: any): Promise<Order> {
  const orderId = payload.id || uuidv4()
  const tenantId = payload.tenantId
  const subtotal = (payload.items || []).reduce((s: number, i: any) => s + (Number(i.lineTotal) || 0), 0)
  const total = +subtotal.toFixed(2)

  // Inserção na tabela principal orders (o trigger trigger_set_order_daily_seq gera daily_order_seq)
  const res = await query(
    `INSERT INTO orders (
      id, tenant_id, cashier_id, customer_name, customer_phone, table_number,
      order_type, status, payment_status, payment_method, subtotal, total_amount, notes
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    ) RETURNING *`,
    [
      orderId,
      tenantId,
      payload.cashierId || null,
      payload.customerName ? String(payload.customerName).trim() : null,
      payload.customerPhone ? String(payload.customerPhone).trim() : null,
      payload.tableNumber ? String(payload.tableNumber) : null,
      payload.isTableOrder !== false ? 'DINE_IN' : 'TAKEOUT',
      payload.status || 'PAID',
      payload.paymentStatus || 'PAID',
      payload.paymentMethod || 'NUMERARIO',
      total,
      total,
      payload.notes ? String(payload.notes).trim() : null,
    ]
  )

  const row = res.rows[0]

  // Inserção dos itens na tabela order_items
  for (const item of payload.items || []) {
    const itemId = item.id || uuidv4()
    await query(
      `INSERT INTO order_items (
        id, order_id, product_id, item_name, quantity, unit_price, total_price, custom_notes, selected_addons_json
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )`,
      [
        itemId,
        orderId,
        item.containerId || null,
        item.containerName || 'Açaí Personalizado',
        1,
        Number(item.containerPrice || item.lineTotal) || 0,
        Number(item.lineTotal) || 0,
        item.notes || null,
        JSON.stringify({
          bases: item.bases || [],
          toppings: item.toppings || [],
        }),
      ]
    )
  }

  return {
    id: row.id,
    tenantId: row.tenant_id,
    cashierId: row.cashier_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    orderNumber: row.daily_order_seq || 1,
    subtotal: Number(row.subtotal) || total,
    total: Number(row.total_amount) || total,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    tableNumber: row.table_number,
    isTableOrder: row.order_type === 'DINE_IN',
    notes: row.notes,
    items: payload.items || [],
    createdAt: row.created_at,
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  const res = await query(
    `SELECT * FROM orders WHERE id::text = $1 AND deleted_at IS NULL LIMIT 1`,
    [id]
  )
  if (res.rows && res.rows.length > 0) {
    const o = res.rows[0]
    const itemsRes = await query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [o.id]
    )
    return {
      id: o.id,
      tenantId: o.tenant_id,
      cashierId: o.cashier_id,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      orderNumber: o.daily_order_seq,
      subtotal: Number(o.subtotal) || 0,
      total: Number(o.total_amount) || 0,
      status: o.status,
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      tableNumber: o.table_number,
      isTableOrder: o.order_type === 'DINE_IN',
      notes: o.notes,
      items: itemsRes.rows || [],
      createdAt: o.created_at,
    }
  }
  return null
}

export async function cancelOrder(id: string, reason: string, user: any): Promise<Order | null> {
  const res = await query(
    `UPDATE orders 
     SET status = 'CANCELLED', 
         notes = COALESCE(notes, '') || ' [Cancelado: ' || $2 || ']',
         updated_at = timezone('utc'::text, now())
     WHERE id::text = $1
     RETURNING *`,
    [id, reason]
  )
  if (res.rows && res.rows.length > 0) {
    const o = res.rows[0]
    return {
      id: o.id,
      tenantId: o.tenant_id,
      orderNumber: o.daily_order_seq,
      subtotal: Number(o.subtotal) || 0,
      total: Number(o.total_amount) || 0,
      status: 'CANCELLED',
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      items: [],
      createdAt: o.created_at,
    }
  }
  return null
}

export async function getDayReport(tenantId: string, dateStr?: string): Promise<DayReportSummary> {
  const start = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const res = await query(
    `SELECT id, daily_order_seq, status, payment_status, payment_method, total_amount, created_at 
     FROM orders 
     WHERE (tenant_id::text = $1 OR $1 IS NULL) 
       AND created_at >= $2 AND created_at < $3 
       AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [tenantId || null, start.toISOString(), end.toISOString()]
  )

  const list = res.rows || []
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
  const byHour: Record<string, number> = {}

  for (const o of list) {
    const orderVal = Number(o.total_amount) || 0
    if (o.status === 'CANCELLED') {
      cancelledCount += 1
      cancelledTotal += orderVal
      continue
    }

    paidCount += 1
    total += orderVal

    const meth =
      o.payment_method === 'MBWAY'
        ? 'MB_WAY'
        : o.payment_method === 'CASH'
        ? 'NUMERARIO'
        : o.payment_method || 'NUMERARIO'

    if (!byMethod[meth]) {
      byMethod[meth] = { count: 0, total: 0 }
    }
    byMethod[meth].count += 1
    byMethod[meth].total += orderVal

    const h = new Date(o.created_at).getHours().toString().padStart(2, '0') + ':00'
    byHour[h] = +((byHour[h] || 0) + orderVal).toFixed(2)
  }

  Object.values(byMethod).forEach((b) => {
    b.total = +b.total.toFixed(2)
  })

  return {
    date: start.toISOString().slice(0, 10),
    count: paidCount,
    total: +total.toFixed(2),
    cancelledCount,
    cancelledTotal: +cancelledTotal.toFixed(2),
    byMethod,
    byHour,
    orders: list.map((o: any) => ({
      id: o.id,
      tenantId,
      orderNumber: o.daily_order_seq,
      total: Number(o.total_amount) || 0,
      status: o.status,
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      createdAt: o.created_at,
      items: [],
    })),
  }
}
