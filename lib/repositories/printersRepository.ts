import { query } from '@/lib/db/postgres'
import { StorePrinterSetting, CreatePrinterInput, UpdatePrinterInput } from '@/types/printer'
import { recordAuditLog } from './auditRepository'

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
      print_layout as "printLayout",
      highlight_customer as "highlightCustomer",
      print_logo as "printLogo",
      print_qr_code as "printQrCode",
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
    printLayout: row.printLayout || 'FULL_RECEIPT',
    highlightCustomer: row.highlightCustomer !== false,
    printLogo: row.printLogo !== false,
    printQrCode: row.printQrCode !== false,
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
      print_layout as "printLayout",
      highlight_customer as "highlightCustomer",
      print_logo as "printLogo",
      print_qr_code as "printQrCode",
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
    printLayout: row.printLayout || 'FULL_RECEIPT',
    highlightCustomer: row.highlightCustomer !== false,
    printLogo: row.printLogo !== false,
    printQrCode: row.printQrCode !== false,
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
      print_layout,
      highlight_customer,
      print_logo,
      print_qr_code,
      categories,
      products,
      copies,
      is_active,
      is_backup
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13, $14
    )
    RETURNING 
      id,
      tenant_id as "tenantId",
      name,
      driver_name as "driverName",
      printer_type as "printerType",
      connection_type as "connectionType",
      print_layout as "printLayout",
      highlight_customer as "highlightCustomer",
      print_logo as "printLogo",
      print_qr_code as "printQrCode",
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
    input.printLayout || 'FULL_RECEIPT',
    input.highlightCustomer !== false,
    input.printLogo !== false,
    input.printQrCode !== false,
    JSON.stringify(input.categories || []),
    JSON.stringify(input.products || []),
    input.copies || 1,
    input.isActive !== false,
    Boolean(input.isBackup),
  ]

  const res = await query(sql, params)
  const row = res.rows[0]
  const created: StorePrinterSetting = {
    ...row,
    printLayout: row.printLayout || 'FULL_RECEIPT',
    highlightCustomer: row.highlightCustomer !== false,
    printLogo: row.printLogo !== false,
    printQrCode: row.printQrCode !== false,
    categories: parseJsonArray(row.categories),
    products: parseJsonArray(row.products),
    copies: Number(row.copies) || 1,
    isActive: Boolean(row.isActive),
    isBackup: Boolean(row.isBackup),
  }

  recordAuditLog({
    tenantId,
    action: 'PRINTER_CREATED',
    entity: 'IMPRESSORAS_QZ',
    entityId: created.id,
    message: `Impressora "${created.name}" (${created.driverName}) configurada com modelo "${created.printLayout}"`,
    metadata: created,
    level: 'INFO',
  }).catch(() => {})

  return created
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
      print_layout = COALESCE($6, print_layout),
      highlight_customer = COALESCE($7, highlight_customer),
      print_logo = COALESCE($8, print_logo),
      print_qr_code = COALESCE($9, print_qr_code),
      categories = CASE WHEN $10::jsonb IS NOT NULL THEN $10::jsonb ELSE categories END,
      products = CASE WHEN $11::jsonb IS NOT NULL THEN $11::jsonb ELSE products END,
      copies = COALESCE($12, copies),
      is_active = COALESCE($13, is_active),
      is_backup = COALESCE($14, is_backup),
      updated_at = NOW()
    WHERE id = $1
    RETURNING 
      id,
      tenant_id as "tenantId",
      name,
      driver_name as "driverName",
      printer_type as "printerType",
      connection_type as "connectionType",
      print_layout as "printLayout",
      highlight_customer as "highlightCustomer",
      print_logo as "printLogo",
      print_qr_code as "printQrCode",
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
    input.printLayout ?? null,
    typeof input.highlightCustomer === 'boolean' ? input.highlightCustomer : null,
    typeof input.printLogo === 'boolean' ? input.printLogo : null,
    typeof input.printQrCode === 'boolean' ? input.printQrCode : null,
    input.categories ? JSON.stringify(input.categories) : null,
    input.products ? JSON.stringify(input.products) : null,
    input.copies ?? null,
    typeof input.isActive === 'boolean' ? input.isActive : null,
    typeof input.isBackup === 'boolean' ? input.isBackup : null,
  ]

  const res = await query(sql, params)
  if (!res.rows || res.rows.length === 0) return null
  const row = res.rows[0]
  const updated: StorePrinterSetting = {
    ...row,
    printLayout: row.printLayout || 'FULL_RECEIPT',
    highlightCustomer: row.highlightCustomer !== false,
    printLogo: row.printLogo !== false,
    printQrCode: row.printQrCode !== false,
    categories: parseJsonArray(row.categories),
    products: parseJsonArray(row.products),
    copies: Number(row.copies) || 1,
    isActive: Boolean(row.isActive),
    isBackup: Boolean(row.isBackup),
  }

  recordAuditLog({
    tenantId: updated.tenantId,
    action: 'PRINTER_UPDATED',
    entity: 'IMPRESSORAS_QZ',
    entityId: updated.id,
    message: `Impressora "${updated.name}" (${updated.driverName}) atualizada · Modelo: "${updated.printLayout}"`,
    metadata: updated,
    level: 'INFO',
  }).catch(() => {})

  return updated
}

export async function deletePrinter(id: string): Promise<boolean> {
  const existing = await getPrinterById(id)
  const sql = `DELETE FROM store_printer_settings WHERE id = $1;`
  const res = await query(sql, [id])
  const deleted = (res.rowCount || 0) > 0

  if (deleted && existing) {
    recordAuditLog({
      tenantId: existing.tenantId,
      action: 'PRINTER_DELETED',
      entity: 'IMPRESSORAS_QZ',
      entityId: id,
      message: `Impressora "${existing.name}" (${existing.driverName}) removida`,
      metadata: existing,
      level: 'WARN',
    }).catch(() => {})
  }

  return deleted
}
