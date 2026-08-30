import { RestaurantTable, TableStatus, TableOrderItem } from '@/types'
import { query } from '@/lib/db/postgres'
import { v4 as uuidv4 } from 'uuid'

let hasEnsuredTable = false
export async function ensureTablesTable() {
  if (hasEnsuredTable) return
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS tables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        table_number INTEGER NOT NULL,
        qr_code_token VARCHAR(255),
        status VARCHAR(50) DEFAULT 'AVAILABLE' NOT NULL,
        current_order_id UUID,
        total_amount NUMERIC(10, 2) DEFAULT 0.00,
        last_activity TIMESTAMP WITH TIME ZONE,
        activated_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        deleted_at TIMESTAMP WITH TIME ZONE
      );
      CREATE INDEX IF NOT EXISTS idx_tables_tenant_id ON tables(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_tables_qr_token ON tables(qr_code_token);
    `)
    hasEnsuredTable = true
  } catch (err) {
    console.error('Erro ao garantir tabela tables:', err)
  }
}

export async function getTablesByTenant(tenantId: string): Promise<RestaurantTable[]> {
  await ensureTablesTable()
  try {
    const res = await query(
      `SELECT id, tenant_id, table_number, qr_code_token, status, current_order_id, 
              total_amount, last_activity, activated_at, created_at, updated_at, deleted_at
       FROM tables 
       WHERE tenant_id::text = $1
       ORDER BY table_number ASC`,
      [tenantId]
    )

    if (res.rows && res.rows.length > 0) {
      return res.rows
        .filter((t: any) => !t.deleted_at)
        .map((t: any) => ({
          id: t.id,
          tenantId: t.tenant_id,
          number: t.table_number,
          code: t.qr_code_token || generateTableHash(t.table_number),
          nickname: `Mesa ${t.table_number}`,
          status: (t.status || 'AVAILABLE') as TableStatus,
          total: Number(t.total_amount) || 0,
          activatedAt: t.activated_at,
          items: [],
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }))
    }

    // Se a loja não possuir mesas criadas, inicializa o salão no banco com 12 mesas reais e hashes únicas
    const initialTables: RestaurantTable[] = []
    for (let i = 1; i <= 12; i++) {
      const newId = uuidv4()
      const hash = generateTableHash(i)
      await query(
        `INSERT INTO tables (id, tenant_id, table_number, qr_code_token, status)
         VALUES ($1, $2, $3, $4, 'AVAILABLE')
         ON CONFLICT (tenant_id, table_number) DO NOTHING`,
        [newId, tenantId, i, hash]
      ).catch(() => {})

      initialTables.push({
        id: newId,
        tenantId,
        number: i,
        code: hash,
        nickname: `Mesa ${i}`,
        status: 'AVAILABLE',
        total: 0,
        items: [],
        createdAt: new Date().toISOString(),
      })
    }
    return initialTables
  } catch (err) {
    console.error('Erro ao buscar mesas no PostgreSQL:', err)
    return []
  }
}

export async function getTableByNumber(tenantId: string, number: number): Promise<RestaurantTable | null> {
  await ensureTablesTable()
  const tables = await getTablesByTenant(tenantId)
  return tables.find((t) => t.number === number) || null
}

export async function getTableById(id: string): Promise<RestaurantTable | null> {
  await ensureTablesTable()
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

export function generateTableHash(tableNumber: number): string {
  const randomPart = uuidv4().replace(/-/g, '').slice(0, 8)
  return `tb${tableNumber}_${randomPart}`
}

export async function createTable(payload: Partial<RestaurantTable>): Promise<RestaurantTable> {
  await ensureTablesTable()
  const id = payload.id || uuidv4()
  const tenantId = payload.tenantId || '11111111-1111-1111-1111-111111111111'
  const tableNumber = Number(payload.number) || 1
  const code = payload.code || generateTableHash(tableNumber)
  const status = payload.status || 'AVAILABLE'
  const nickname = payload.nickname || `Mesa ${tableNumber}`

  // 1. Verifica se já existe registro com o mesmo número para o estabelecimento
  const existing = await query(
    `SELECT id FROM tables WHERE tenant_id::text = $1 AND table_number = $2 LIMIT 1`,
    [tenantId, tableNumber]
  )

  if (existing.rows && existing.rows.length > 0) {
    const existingId = existing.rows[0].id
    const updateRes = await query(
      `UPDATE tables 
       SET qr_code_token = COALESCE(NULLIF(qr_code_token, ''), $2),
           status = $3,
           deleted_at = NULL,
           updated_at = timezone('utc'::text, now())
       WHERE id::text = $1
       RETURNING *`,
      [existingId, code, status]
    )
    const t = updateRes.rows[0]
    return {
      id: t.id,
      tenantId: t.tenant_id,
      number: t.table_number,
      code: t.qr_code_token,
      nickname,
      status: t.status,
      total: 0,
      items: [],
      createdAt: t.created_at,
    }
  }

  // 2. Insere nova mesa
  const res = await query(
    `INSERT INTO tables (id, tenant_id, table_number, qr_code_token, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, tenantId, tableNumber, code, status]
  )
  const t = res.rows[0]
  return {
    id: t.id,
    tenantId: t.tenant_id,
    number: t.table_number,
    code: t.qr_code_token,
    nickname,
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
  await ensureTablesTable()
  const created: RestaurantTable[] = []
  const start = Math.min(Number(startNumber) || 1, Number(endNumber) || 1)
  const end = Math.max(Number(startNumber) || 1, Number(endNumber) || 1)
  for (let num = start; num <= end; num++) {
    const table = await createTable({
      tenantId,
      number: num,
      code: generateTableHash(num),
      status: 'AVAILABLE',
    })
    created.push(table)
  }
  return created
}

export async function getTableByToken(token: string): Promise<RestaurantTable | null> {
  await ensureTablesTable()
  try {
    const res = await query(
      `SELECT * FROM tables WHERE qr_code_token = $1 AND deleted_at IS NULL LIMIT 1`,
      [token]
    )
    if (res.rows?.[0]) {
      const t = res.rows[0]
      return {
        id: t.id,
        tenantId: t.tenant_id,
        number: t.table_number,
        code: t.qr_code_token,
        nickname: `Mesa ${t.table_number}`,
        status: (t.status || 'AVAILABLE') as TableStatus,
        total: Number(t.total_amount) || 0,
        activatedAt: t.activated_at,
        items: [],
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }
    }
  } catch (err) {
    console.error('Erro ao buscar mesa por token:', err)
  }
  return null
}

export async function regenerateTableToken(id: string): Promise<RestaurantTable | null> {
  await ensureTablesTable()
  const table = await getTableById(id)
  if (!table) return null

  const newToken = generateTableHash(table.number)
  const res = await query(
    `UPDATE tables 
     SET qr_code_token = $2,
         updated_at = timezone('utc'::text, now())
     WHERE id::text = $1 AND deleted_at IS NULL
     RETURNING *`,
    [id, newToken]
  )

  if (res.rows?.[0]) {
    return getTableById(id)
  }
  return null
}

export async function updateTable(id: string, payload: Partial<RestaurantTable>): Promise<RestaurantTable | null> {
  await ensureTablesTable()
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
  await ensureTablesTable()

  // 1. Se for um identificador virtual inicial
  if (id.startsWith('table-')) {
    const parts = id.split('-')
    const tableNumber = parseInt(parts[parts.length - 1]) || 1
    const tenantId = parts.slice(1, parts.length - 1).join('-') || '11111111-1111-1111-1111-111111111111'

    const newId = uuidv4()
    await query(
      `INSERT INTO tables (id, tenant_id, table_number, qr_code_token, status, created_at, updated_at, deleted_at)
       VALUES ($1, $2, $3, $4, 'AVAILABLE', timezone('utc'::text, now()), timezone('utc'::text, now()), timezone('utc'::text, now()))
       ON CONFLICT (tenant_id, table_number) DO UPDATE
       SET deleted_at = timezone('utc'::text, now()), updated_at = timezone('utc'::text, now())`,
      [newId, tenantId, tableNumber, generateTableHash(tableNumber)]
    ).catch(() => {})

    return true
  }

  // 2. Se for UUID físico
  const res = await query(`UPDATE tables SET deleted_at = timezone('utc'::text, now()) WHERE id::text = $1`, [id])
  return (res.rowCount || 0) > 0
}

export async function deleteAllTablesByTenant(tenantId: string): Promise<boolean> {
  await ensureTablesTable()
  await query(
    `UPDATE tables 
     SET deleted_at = timezone('utc'::text, now()),
         updated_at = timezone('utc'::text, now())
     WHERE tenant_id::text = $1 AND deleted_at IS NULL`,
    [tenantId]
  )
  return true
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
