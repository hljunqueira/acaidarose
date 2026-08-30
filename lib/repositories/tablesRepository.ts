import { RestaurantTable, TableStatus, TableOrderItem } from '@/types'
import { query } from '@/lib/db/postgres'
import { v4 as uuidv4 } from 'uuid'

export async function getTablesByTenant(tenantId: string): Promise<RestaurantTable[]> {
  try {
    const res = await query(
      `SELECT id, tenant_id, table_number, qr_code_token, status, current_order_id, 
              total_amount, last_activity, activated_at, created_at, updated_at
       FROM tables 
       WHERE tenant_id::text = $1 AND deleted_at IS NULL
       ORDER BY table_number ASC`,
      [tenantId]
    )

    if (res.rows && res.rows.length > 0) {
      return res.rows.map((t: any) => ({
        id: t.id,
        tenantId: t.tenant_id,
        number: t.table_number,
        code: t.qr_code_token || `MESA-${t.table_number}`,
        nickname: `Mesa ${t.table_number}`,
        status: (t.status || 'AVAILABLE') as TableStatus,
        total: Number(t.total_amount) || 0,
        activatedAt: t.activated_at,
        items: [],
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }))
    }
  } catch (err) {
    console.error('Erro ao buscar mesas no PostgreSQL:', err)
  }

  // Gera 12 mesas padrão se a loja ainda não tiver
  const defaultTables: RestaurantTable[] = []
  for (let i = 1; i <= 12; i++) {
    defaultTables.push({
      id: `table-${tenantId}-${i}`,
      tenantId,
      number: i,
      code: `QR-MESA-${i}`,
      nickname: `Mesa ${i}`,
      status: 'AVAILABLE',
      total: 0,
      items: [],
      createdAt: new Date().toISOString(),
    })
  }
  return defaultTables
}

export async function getTableByNumber(tenantId: string, number: number): Promise<RestaurantTable | null> {
  const tables = await getTablesByTenant(tenantId)
  return tables.find((t) => t.number === number) || null
}

export async function getTableById(id: string): Promise<RestaurantTable | null> {
  try {
    const res = await query(`SELECT * FROM tables WHERE id::text = $1 AND deleted_at IS NULL LIMIT 1`, [id])
    if (res.rows?.[0]) {
      const t = res.rows[0]
      return {
        id: t.id,
        tenantId: t.tenant_id,
        number: t.table_number,
        code: t.qr_code_token || `MESA-${t.table_number}`,
        nickname: `Mesa ${t.table_number}`,
        status: (t.status || 'AVAILABLE') as TableStatus,
        total: Number(t.total_amount) || 0,
        activatedAt: t.activated_at,
        items: [],
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }
    }
  } catch {}
  return null
}

export async function createTable(payload: Partial<RestaurantTable>): Promise<RestaurantTable> {
  const id = payload.id || uuidv4()
  const res = await query(
    `INSERT INTO tables (id, tenant_id, table_number, qr_code_token, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      id,
      payload.tenantId,
      payload.number || 1,
      payload.code || `MESA-${payload.number || 1}`,
      payload.status || 'AVAILABLE',
    ]
  )
  const t = res.rows[0]
  return {
    id: t.id,
    tenantId: t.tenant_id,
    number: t.table_number,
    code: t.qr_code_token,
    status: t.status,
    total: 0,
    items: [],
    createdAt: t.created_at,
  }
}

export async function createBatchTables(
  tenantId: string,
  startNumber: number,
  endNumber: number,
  assignedStaffId?: string,
  assignedStaffName?: string
): Promise<RestaurantTable[]> {
  const created: RestaurantTable[] = []
  for (let num = startNumber; num <= endNumber; num++) {
    const table = await createTable({ tenantId, number: num, code: `QR-MESA-${num}`, status: 'AVAILABLE' })
    created.push(table)
  }
  return created
}

export async function updateTable(id: string, payload: Partial<RestaurantTable>): Promise<RestaurantTable | null> {
  const tenantId = payload.tenantId || '11111111-1111-1111-1111-111111111111'
  const tableNumber = payload.number !== undefined ? payload.number : null
  const code = payload.code || (tableNumber ? `QR-MESA-${tableNumber}` : null)
  const status = payload.status || null
  const totalAmount = payload.total !== undefined ? payload.total : null

  // 1. Tenta atualizar a mesa existente por ID
  const res = await query(
    `UPDATE tables 
     SET table_number = COALESCE($2, table_number),
         qr_code_token = COALESCE($3, qr_code_token),
         status = COALESCE($4, status),
         total_amount = COALESCE($5, total_amount),
         updated_at = timezone('utc'::text, now())
     WHERE id::text = $1 AND deleted_at IS NULL
     RETURNING *`,
    [id, tableNumber, code, status, totalAmount]
  )

  if (res.rows?.[0]) return getTableById(id)

  // 2. Se a mesa ainda não existia no banco (ex: ID virtual table-tenant-X), insere nova linha persistida
  const newId = uuidv4()
  const insertRes = await query(
    `INSERT INTO tables (id, tenant_id, table_number, qr_code_token, status, total_amount, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, timezone('utc'::text, now()), timezone('utc'::text, now()))
     RETURNING *`,
    [newId, tenantId, tableNumber || 1, code || `QR-MESA-${tableNumber || 1}`, status || 'AVAILABLE', totalAmount || 0]
  )
  if (insertRes.rows?.[0]) {
    const t = insertRes.rows[0]
    return {
      id: t.id,
      tenantId: t.tenant_id,
      number: t.table_number,
      code: t.qr_code_token || `MESA-${t.table_number}`,
      nickname: payload.nickname || `Mesa ${t.table_number}`,
      status: (t.status || 'AVAILABLE') as TableStatus,
      total: Number(t.total_amount) || 0,
      activatedAt: t.activated_at,
      items: [],
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }
  }

  return null
}

export async function deleteTable(id: string): Promise<boolean> {
  const res = await query(`UPDATE tables SET deleted_at = timezone('utc'::text, now()) WHERE id::text = $1`, [id])
  return (res.rowCount || 0) > 0
}

export async function closeTable(tableId: string, tenantId?: string): Promise<boolean> {
  let sql = `UPDATE tables SET status = 'AVAILABLE', total_amount = 0, current_order_id = null WHERE id::text = $1`
  const params: any[] = [tableId]
  if (tenantId) {
    sql += ` AND tenant_id::text = $2`
    params.push(tenantId)
  }
  const res = await query(sql, params)
  return (res.rowCount || 0) > 0
}

export async function openTableWithItems(
  tableId: string,
  items: TableOrderItem[],
  assignedStaffId?: string,
  assignedStaffName?: string
): Promise<RestaurantTable | null> {
  const total = +(items.reduce((s, i) => s + (Number(i.lineTotal) || 0), 0)).toFixed(2)
  await query(
    `UPDATE tables SET status = 'OCCUPIED', total_amount = $1, activated_at = timezone('utc'::text, now()) WHERE id::text = $2`,
    [total, tableId]
  )
  return getTableById(tableId)
}

export async function transferTableItems(fromTableId: string, toTableId: string, tenantId?: string): Promise<boolean> {
  const fromTable = await getTableById(fromTableId)
  if (!fromTable) return false
  await openTableWithItems(toTableId, fromTable.items || [])
  await closeTable(fromTableId, tenantId)
  return true
}

export async function clearTableSession(tenantId: string, tableNumber: number): Promise<boolean> {
  const table = await getTableByNumber(tenantId, tableNumber)
  if (!table) return false
  return await closeTable(table.id, tenantId)
}
