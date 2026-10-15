import { query } from '@/lib/db/postgres'
import { StorePrinterSetting, CreatePrinterInput, UpdatePrinterInput } from '@/types/printer'

function parseJsonArray(val: any): string[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export async function getPrintersByTenantId(tenantId: string): Promise<StorePrinterSetting[]> {
  const sql = `
    SELECT 
      id,
      tenant_id as "tenantId",
      name,
      driver_name as "driverName",
      printer_type as "printerType",
      connection_type as "connectionType",
      categories,
      products,
      copies,
      is_active as "isActive",
      is_backup as "isBackup",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM store_printer_settings
    WHERE tenant_id = $1
    ORDER BY created_at ASC;
  `
  const res = await query(sql, [tenantId])
  return (res.rows || []).map((row: any) => ({
    ...row,
    categories: parseJsonArray(row.categories),
    products: parseJsonArray(row.products),
    copies: Number(row.copies) || 1,
    isActive: Boolean(row.isActive),
    isBackup: Boolean(row.isBackup),
  }))
}

export async function getPrinterById(id: string): Promise<StorePrinterSetting | null> {
  const sql = `
    SELECT 
      id,
      tenant_id as "tenantId",
      name,
      driver_name as "driverName",
      printer_type as "printerType",
      connection_type as "connectionType",
      categories,
      products,
      copies,
      is_active as "isActive",
      is_backup as "isBackup",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM store_printer_settings
    WHERE id = $1
    LIMIT 1;
  `
  const res = await query(sql, [id])
  if (!res.rows || res.rows.length === 0) return null
  const row = res.rows[0]
  return {
    ...row,
    categories: parseJsonArray(row.categories),
    products: parseJsonArray(row.products),
    copies: Number(row.copies) || 1,
    isActive: Boolean(row.isActive),
    isBackup: Boolean(row.isBackup),
  }
}

export async function createPrinter(tenantId: string, input: CreatePrinterInput): Promise<StorePrinterSetting> {
  const sql = `
    INSERT INTO store_printer_settings (
      tenant_id,
      name,
      driver_name,
      printer_type,
      connection_type,
      categories,
      products,
      copies,
      is_active,
      is_backup
    ) VALUES (
      $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10
    )
    RETURNING 
      id,
      tenant_id as "tenantId",
      name,
      driver_name as "driverName",
      printer_type as "printerType",
      connection_type as "connectionType",
      categories,
      products,
      copies,
      is_active as "isActive",
      is_backup as "isBackup",
      created_at as "createdAt",
      updated_at as "updatedAt";
  `
  const params = [
    tenantId,
    input.name.trim(),
    input.driverName.trim(),
    input.printerType || 'EPSON_ESC_POS',
    input.connectionType || 'QZ_TRAY',
    JSON.stringify(input.categories || []),
    JSON.stringify(input.products || []),
    input.copies || 1,
    input.isActive !== false,
    Boolean(input.isBackup),
  ]

  const res = await query(sql, params)
  const row = res.rows[0]
  return {
    ...row,
    categories: parseJsonArray(row.categories),
    products: parseJsonArray(row.products),
    copies: Number(row.copies) || 1,
    isActive: Boolean(row.isActive),
    isBackup: Boolean(row.isBackup),
  }
}

export async function updatePrinter(id: string, input: Partial<CreatePrinterInput>): Promise<StorePrinterSetting | null> {
  const existing = await getPrinterById(id)
  if (!existing) return null

  const sql = `
    UPDATE store_printer_settings
    SET 
      name = COALESCE($2, name),
      driver_name = COALESCE($3, driver_name),
      printer_type = COALESCE($4, printer_type),
      connection_type = COALESCE($5, connection_type),
      categories = CASE WHEN $6::jsonb IS NOT NULL THEN $6::jsonb ELSE categories END,
      products = CASE WHEN $7::jsonb IS NOT NULL THEN $7::jsonb ELSE products END,
      copies = COALESCE($8, copies),
      is_active = COALESCE($9, is_active),
      is_backup = COALESCE($10, is_backup),
      updated_at = NOW()
    WHERE id = $1
    RETURNING 
      id,
      tenant_id as "tenantId",
      name,
      driver_name as "driverName",
      printer_type as "printerType",
      connection_type as "connectionType",
      categories,
      products,
      copies,
      is_active as "isActive",
      is_backup as "isBackup",
      created_at as "createdAt",
      updated_at as "updatedAt";
  `
  const params = [
    id,
    input.name?.trim() ?? null,
    input.driverName?.trim() ?? null,
    input.printerType ?? null,
    input.connectionType ?? null,
    input.categories ? JSON.stringify(input.categories) : null,
    input.products ? JSON.stringify(input.products) : null,
    input.copies ?? null,
    typeof input.isActive === 'boolean' ? input.isActive : null,
    typeof input.isBackup === 'boolean' ? input.isBackup : null,
  ]

  const res = await query(sql, params)
  if (!res.rows || res.rows.length === 0) return null
  const row = res.rows[0]
  return {
    ...row,
    categories: parseJsonArray(row.categories),
    products: parseJsonArray(row.products),
    copies: Number(row.copies) || 1,
    isActive: Boolean(row.isActive),
    isBackup: Boolean(row.isBackup),
  }
}

export async function deletePrinter(id: string): Promise<boolean> {
  const sql = `DELETE FROM store_printer_settings WHERE id = $1;`
  const res = await query(sql, [id])
  return (res.rowCount || 0) > 0
}
