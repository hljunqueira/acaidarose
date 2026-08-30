import { Order, DayReportSummary } from '@/types'
import { query } from '@/lib/db/postgres'
import { v4 as uuidv4 } from 'uuid'
import { getTenantByIdOrSlug } from './tenantsRepository'

export async function createOrder(payload: any): Promise<Order> {
  const orderId = payload.id || uuidv4()
  
  // Normalizar Tenant ID canônico
  let tenantId = '11111111-1111-1111-1111-111111111111'
  if (payload.tenantId || payload.loja) {
    const resolvedTenant = await getTenantByIdOrSlug(payload.tenantId || payload.loja)
    if (resolvedTenant) tenantId = resolvedTenant.id
  }

  const subtotal = (payload.items || []).reduce((s: number, i: any) => s + (Number(i.lineTotal) || 0), 0)
  const total = +subtotal.toFixed(2)
  const vatTotal = +(total * 0.13).toFixed(2) // IVA taxa padrão restauração Portugal (13%)
  const tableNum = payload.tableNumber ? parseInt(String(payload.tableNumber).replace(/\D/g, ''), 10) || null : null

  // Calcular próximo order_number diário no fuso de Portugal
  const seqRes = await query(
    `SELECT COALESCE(MAX(order_number), 0) + 1 AS next_seq 
     FROM orders 
     WHERE tenant_id::text = $1 
       AND (created_at AT TIME ZONE 'Europe/Lisbon')::date = (now() AT TIME ZONE 'Europe/Lisbon')::date`,
    [tenantId]
  )
  const orderNumber = Number(seqRes.rows[0]?.next_seq) || 1

  const itemsJson = JSON.stringify(payload.items || payload.itemsJson || [])

  // Inserção na tabela principal orders
  const res = await query(
    `INSERT INTO orders (
      id, tenant_id, cashier_id, cashier_name, customer_name, customer_phone, customer_nif,
      order_number, subtotal, vat_total, total, status, payment_method,
      payment_reference, is_table_order, table_number, items_json, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13,
      $14, $15, $16, $17, timezone('utc'::text, now())
    ) RETURNING *`,
    [
      orderId,
      tenantId,
      payload.cashierId || null,
      payload.cashierName || 'Autoatendimento QR Code',
      payload.customerName ? String(payload.customerName).trim() : null,
      payload.customerPhone ? String(payload.customerPhone).trim() : null,
      payload.customerNif ? String(payload.customerNif).trim() : null,
      orderNumber,
      total,
      vatTotal,
      total,
      payload.status || 'PREPARING',
      payload.paymentMethod || 'MBWAY',
      payload.paymentReference || null,
      payload.isTableOrder !== false,
      tableNum,
      itemsJson,
    ]
  )

  // Atualizar a comanda da mesa no salão se for pedido em mesa
  if (tableNum && tenantId) {
    try {
      const tableRes = await query(
        `SELECT id, status, total_amount, items_json FROM tables WHERE tenant_id::text = $1 AND table_number = $2 AND deleted_at IS NULL LIMIT 1`,
        [tenantId, tableNum]
      )
      if (tableRes.rows?.[0]) {
        const t = tableRes.rows[0]
        let existingItems = []
        try {
          existingItems = typeof t.items_json === 'string' ? JSON.parse(t.items_json) : (t.items_json || [])
        } catch {}
        const newItems = [...existingItems, ...(payload.items || [])]
        const newTableTotal = +(Number(t.total_amount || 0) + total).toFixed(2)
        await query(
          `UPDATE tables 
           SET status = 'OCCUPIED', 
               total_amount = $1, 
               items_json = $2, 
               current_order_id = $3,
               activated_at = COALESCE(activated_at, to_char(now() AT TIME ZONE 'Europe/Lisbon', 'HH24:MI')),
               updated_at = now() 
           WHERE id = $4`,
          [newTableTotal, JSON.stringify(newItems), orderId, t.id]
        )
      }
    } catch (err) {
      console.error('Erro ao atualizar mesa do pedido:', err)
    }
  }

  const row = res.rows[0]

  return {
    id: row.id,
    tenantId: row.tenant_id,
    cashierId: row.cashier_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    orderNumber: row.order_number || orderNumber,
    subtotal: Number(row.subtotal) || total,
    total: Number(row.total) || total,
    status: row.status,
    paymentStatus: row.status === 'PAID' || row.status === 'PREPARING' || row.status === 'READY' ? 'PAID' : 'PENDING',
    paymentMethod: row.payment_method,
    tableNumber: row.table_number,
    isTableOrder: row.is_table_order !== false,
    notes: payload.notes || '',
    items: payload.items || [],
    createdAt: row.created_at,
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  const res = await query(
    `SELECT * FROM orders WHERE id::text = $1 LIMIT 1`,
    [id]
  )
  if (res.rows && res.rows.length > 0) {
    const o = res.rows[0]
    let items = []
    try {
      items = typeof o.items_json === 'string' ? JSON.parse(o.items_json) : (o.items_json || [])
    } catch {}

    return {
      id: o.id,
      tenantId: o.tenant_id,
      cashierId: o.cashier_id,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      orderNumber: o.order_number,
      subtotal: Number(o.subtotal) || 0,
      total: Number(o.total) || 0,
      status: o.status,
      paymentStatus: o.status === 'PAID' || o.status === 'PREPARING' || o.status === 'READY' ? 'PAID' : 'PENDING',
      paymentMethod: o.payment_method,
      tableNumber: o.table_number,
      isTableOrder: o.is_table_order !== false,
      notes: o.cancel_reason || '',
      items,
      createdAt: o.created_at,
    }
  }
  return null
}

export async function cancelOrder(id: string, reason: string, user: any): Promise<Order | null> {
  const userName = user?.name || 'Operador KDS'
  const res = await query(
    `UPDATE orders 
     SET status = 'CANCELLED', 
         cancel_reason = $2,
         cancelled_at = timezone('utc'::text, now()),
         cancelled_by_name = $3
     WHERE id::text = $1
     RETURNING *`,
    [id, reason, userName]
  )
  if (res.rows && res.rows.length > 0) {
    const o = res.rows[0]
    return {
      id: o.id,
      tenantId: o.tenant_id,
      orderNumber: o.order_number,
      subtotal: Number(o.subtotal) || 0,
      total: Number(o.total) || 0,
      status: 'CANCELLED',
      paymentStatus: 'CANCELLED',
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
