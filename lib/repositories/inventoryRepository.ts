import { query } from '@/lib/db/postgres'
import { v4 as uuidv4 } from 'uuid'
import { recordAuditLog } from './auditRepository'

export interface InventoryCategoryRow {
  id: string
  name: string
  code: string
  displayOrder: number
  createdAt?: string
}

export interface InventoryItemRow {
  id: string
  name: string
  unit: string
  category: string
  supplyCode?: string
  marketPrice: number
  supplyPrice: number
  supplyPriceWithTax?: number
  lastCostPriceWithTax?: number
  taxRate?: number
  netWeightKg?: number
  pricePerKg?: number
  currentQuantity: number
  minAlertQuantity: number
  isCriticalChecklist?: boolean
  status: 'NORMAL' | 'ALERT' | 'CRITICAL'
}

export interface MasterInventoryItem {
  id: string
  name: string
  unit: string
  category: string
  supplyCode?: string
  marketPrice: number
  supplyPrice: number
  supplyPriceWithTax?: number
  lastCostPriceWithTax?: number
  taxRate?: number
  netWeightKg?: number
  pricePerKg?: number
  centralStock: number
  lastCostPrice: number
  isCriticalChecklist?: boolean
  createdAt?: string
}

export interface SupplierRow {
  id: string
  name: string
  nif?: string | null
  email?: string | null
  phone?: string | null
  category?: string | null
  leadTimeDays: number
  isActive: boolean
  createdAt: string
}

export interface SupplierPurchaseRow {
  id: string
  supplierId: string
  supplierName?: string
  itemId: string
  itemName?: string
  supplyCode?: string
  quantity: number
  costUnitPrice: number
  totalCost: number
  taxRate?: number
  taxAmount?: number
  totalCostIncTax?: number
  invoiceNumber?: string | null
  batchNumber?: string | null
  expirationDate?: string | null
  notes?: string | null
  purchasedAt: string
}

export interface SupplyOrderRow {
  id: string
  tenantId: string
  tenantName?: string
  orderNumber: number
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REJECTED'
  paymentStatus?: 'PENDING' | 'PAID' | 'INVOICED_30D'
  totalAmount: number
  totalSavings: number
  subtotalNet?: number
  taxTotal?: number
  taxBreakdown?: Record<string, number>
  items: any[]
  rejectionReason?: string | null
  notes?: string | null
  createdAt: string
}

/**
 * Retorna todas as categorias de estoque cadastradas no PostgreSQL
 */
export async function getInventoryCategories(): Promise<InventoryCategoryRow[]> {
  try {
    const res = await query(
      `SELECT id, name, code, display_order as "displayOrder", created_at as "createdAt"
       FROM inventory_categories
       ORDER BY display_order ASC, name ASC`
    )
    if (res && res.rows) {
      return res.rows.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        displayOrder: Number(r.displayOrder) || 0,
        createdAt: r.createdAt,
      }))
    }
  } catch (err) {
    console.error('Erro ao buscar categorias de estoque:', err)
  }
  return []
}

/**
 * Cria uma nova categoria de estoque
 */
export async function createInventoryCategory(data: {
  name: string
  code: string
  displayOrder?: number
}): Promise<InventoryCategoryRow> {
  const id = uuidv4()
  const cleanCode = data.code.trim().toUpperCase()
  const res = await query(
    `INSERT INTO inventory_categories (id, name, code, display_order)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, code, display_order as "displayOrder", created_at as "createdAt"`,
    [id, data.name.trim(), cleanCode, data.displayOrder ?? 0]
  )
  const r = res.rows[0]
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    displayOrder: Number(r.displayOrder) || 0,
    createdAt: r.createdAt,
  }
}

/**
 * Atualiza uma categoria de estoque existente
 */
export async function updateInventoryCategory(
  id: string,
  data: Partial<{ name: string; code: string; displayOrder: number }>
): Promise<InventoryCategoryRow | null> {
  const cleanCode = data.code ? data.code.trim().toUpperCase() : null
  const res = await query(
    `UPDATE inventory_categories
     SET name = COALESCE($2, name),
         code = COALESCE($3, code),
         display_order = COALESCE($4, display_order)
     WHERE id = $1
     RETURNING id, name, code, display_order as "displayOrder", created_at as "createdAt"`,
    [id, data.name?.trim() || null, cleanCode, data.displayOrder]
  )
  if (!res || !res.rows[0]) return null
  const r = res.rows[0]
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    displayOrder: Number(r.displayOrder) || 0,
    createdAt: r.createdAt,
  }
}

/**
 * Remove uma categoria de estoque
 */
export async function deleteInventoryCategory(id: string): Promise<boolean> {
  try {
    await query('DELETE FROM inventory_categories WHERE id = $1', [id])
    return true
  } catch (err) {
    console.error('Erro ao excluir categoria de estoque:', err)
    return false
  }
}

/**
 * Retorna todos os insumos do catálogo mestre (Franqueadora)
 */
export async function getAllMasterItems(): Promise<MasterInventoryItem[]> {
  try {
    const res = await query(
      `SELECT id, name, unit, category, supply_code as "supplyCode",
              market_benchmark_price as "marketPrice", 
              franchise_supply_price as "supplyPrice", 
              central_stock_quantity as "centralStock",
              last_cost_price as "lastCostPrice",
              tax_rate as "taxRate",
              net_weight_kg as "netWeightKg",
              price_per_kg as "pricePerKg",
              is_critical_checklist as "isCriticalChecklist",
              created_at as "createdAt"
       FROM inventory_items
       ORDER BY category, name`
    )
    if (res && res.rows) {
      return res.rows.map((r) => {
        const supplyPrice = Number(r.supplyPrice) || 0
        const lastCostPrice = Number(r.lastCostPrice) || 0
        const taxRate = r.taxRate !== null && r.taxRate !== undefined ? Number(r.taxRate) : 23.00
        const supplyPriceWithTax = Number((supplyPrice * (1 + taxRate / 100)).toFixed(2))
        const lastCostPriceWithTax = Number((lastCostPrice * (1 + taxRate / 100)).toFixed(2))

        return {
          id: r.id,
          name: r.name,
          unit: r.unit,
          category: r.category,
          supplyCode: r.supplyCode || undefined,
          marketPrice: Number(r.marketPrice) || 0,
          supplyPrice,
          supplyPriceWithTax,
          centralStock: Number(r.centralStock) || 0,
          lastCostPrice,
          lastCostPriceWithTax,
          taxRate,
          netWeightKg: r.netWeightKg !== null && r.netWeightKg !== undefined ? Number(r.netWeightKg) : undefined,
          pricePerKg: r.pricePerKg !== null && r.pricePerKg !== undefined ? Number(r.pricePerKg) : undefined,
          isCriticalChecklist: Boolean(r.isCriticalChecklist),
          createdAt: r.createdAt,
        }
      })
    }
  } catch (err) {
    console.error('Erro ao buscar catálogo mestre:', err)
  }
  return []
}

/**
 * Cria um novo insumo no catálogo mestre
 */
export async function createMasterItem(data: {
  name: string
  unit: string
  category: string
  supplyCode?: string
  marketPrice: number
  supplyPrice: number
  centralStock?: number
  lastCostPrice?: number
  taxRate?: number
  netWeightKg?: number
  pricePerKg?: number
  isCriticalChecklist?: boolean
}): Promise<MasterInventoryItem> {
  const id = uuidv4()
  const taxRate = data.taxRate !== undefined ? data.taxRate : 23.00
  const res = await query(
    `INSERT INTO inventory_items (
       id, name, unit, category, supply_code, market_benchmark_price, 
       franchise_supply_price, central_stock_quantity, last_cost_price, 
       tax_rate, net_weight_kg, price_per_kg, is_critical_checklist
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING id, name, unit, category, supply_code as "supplyCode",
               market_benchmark_price as "marketPrice", 
               franchise_supply_price as "supplyPrice", 
               central_stock_quantity as "centralStock",
               last_cost_price as "lastCostPrice",
               tax_rate as "taxRate",
               net_weight_kg as "netWeightKg",
               price_per_kg as "pricePerKg",
               is_critical_checklist as "isCriticalChecklist",
               created_at as "createdAt"`,
    [
      id,
      data.name,
      data.unit,
      data.category,
      data.supplyCode || null,
      data.marketPrice,
      data.supplyPrice,
      data.centralStock ?? 0,
      data.lastCostPrice ?? 0,
      taxRate,
      data.netWeightKg ?? null,
      data.pricePerKg ?? null,
      data.isCriticalChecklist ?? false,
    ]
  )
  const r = res.rows[0]
  const supplyPrice = Number(r.supplyPrice) || 0
  const lastCostPrice = Number(r.lastCostPrice) || 0
  const savedTaxRate = Number(r.taxRate) || 23.00

  return {
    id: r.id,
    name: r.name,
    unit: r.unit,
    category: r.category,
    supplyCode: r.supplyCode || undefined,
    marketPrice: Number(r.marketPrice) || 0,
    supplyPrice,
    supplyPriceWithTax: Number((supplyPrice * (1 + savedTaxRate / 100)).toFixed(2)),
    centralStock: Number(r.centralStock) || 0,
    lastCostPrice,
    lastCostPriceWithTax: Number((lastCostPrice * (1 + savedTaxRate / 100)).toFixed(2)),
    taxRate: savedTaxRate,
    netWeightKg: r.netWeightKg !== null && r.netWeightKg !== undefined ? Number(r.netWeightKg) : undefined,
    pricePerKg: r.pricePerKg !== null && r.pricePerKg !== undefined ? Number(r.pricePerKg) : undefined,
    isCriticalChecklist: Boolean(r.isCriticalChecklist),
    createdAt: r.createdAt,
  }
}

/**
 * Atualiza um insumo existente
 */
export async function updateMasterItem(
  id: string,
  data: Partial<{
    name: string
    unit: string
    category: string
    supplyCode?: string
    marketPrice: number
    supplyPrice: number
    centralStock?: number
    lastCostPrice?: number
    taxRate?: number
    netWeightKg?: number
    pricePerKg?: number
    isCriticalChecklist?: boolean
  }>
): Promise<MasterInventoryItem | null> {
  const res = await query(
    `UPDATE inventory_items
     SET name = COALESCE($2, name),
         unit = COALESCE($3, unit),
         category = COALESCE($4, category),
         supply_code = COALESCE($5, supply_code),
         market_benchmark_price = COALESCE($6, market_benchmark_price),
         franchise_supply_price = COALESCE($7, franchise_supply_price),
         central_stock_quantity = COALESCE($8, central_stock_quantity),
         last_cost_price = COALESCE($9, last_cost_price),
         tax_rate = COALESCE($10, tax_rate),
         net_weight_kg = COALESCE($11, net_weight_kg),
         price_per_kg = COALESCE($12, price_per_kg),
         is_critical_checklist = COALESCE($13, is_critical_checklist)
     WHERE id = $1
     RETURNING id, name, unit, category, supply_code as "supplyCode",
               market_benchmark_price as "marketPrice", 
               franchise_supply_price as "supplyPrice", 
               central_stock_quantity as "centralStock",
               last_cost_price as "lastCostPrice",
               tax_rate as "taxRate",
               net_weight_kg as "netWeightKg",
               price_per_kg as "pricePerKg",
               is_critical_checklist as "isCriticalChecklist",
               created_at as "createdAt"`,
    [
      id,
      data.name,
      data.unit,
      data.category,
      data.supplyCode,
      data.marketPrice,
      data.supplyPrice,
      data.centralStock,
      data.lastCostPrice,
      data.taxRate,
      data.netWeightKg,
      data.pricePerKg,
      data.isCriticalChecklist,
    ]
  )
  if (!res || !res.rows[0]) return null
  const r = res.rows[0]
  const supplyPrice = Number(r.supplyPrice) || 0
  const lastCostPrice = Number(r.lastCostPrice) || 0
  const savedTaxRate = Number(r.taxRate) || 23.00

  return {
    id: r.id,
    name: r.name,
    unit: r.unit,
    category: r.category,
    supplyCode: r.supplyCode || undefined,
    marketPrice: Number(r.marketPrice) || 0,
    supplyPrice,
    supplyPriceWithTax: Number((supplyPrice * (1 + savedTaxRate / 100)).toFixed(2)),
    centralStock: Number(r.centralStock) || 0,
    lastCostPrice,
    lastCostPriceWithTax: Number((lastCostPrice * (1 + savedTaxRate / 100)).toFixed(2)),
    taxRate: savedTaxRate,
    netWeightKg: r.netWeightKg !== null && r.netWeightKg !== undefined ? Number(r.netWeightKg) : undefined,
    pricePerKg: r.pricePerKg !== null && r.pricePerKg !== undefined ? Number(r.pricePerKg) : undefined,
    isCriticalChecklist: Boolean(r.isCriticalChecklist),
    createdAt: r.createdAt,
  }
}

/**
 * Remove um insumo do catálogo mestre
 */
export async function deleteMasterItem(id: string): Promise<boolean> {
  try {
    await query('DELETE FROM supplier_purchases WHERE item_id = $1', [id])
    await query('DELETE FROM store_inventory WHERE item_id = $1', [id])
    await query('DELETE FROM inventory_items WHERE id = $1', [id])
    return true
  } catch (err) {
    console.error('Erro ao excluir item do catálogo mestre:', err)
    return false
  }
}

/**
 * Consulta o inventário de uma loja específica
 */
export async function getStoreInventory(tenantId: string): Promise<InventoryItemRow[]> {
  try {
    const res = await query(
      `SELECT ii.id, ii.name, ii.unit, ii.category, ii.supply_code as supply_code,
              ii.market_benchmark_price as market_price, 
              ii.franchise_supply_price as supply_price,
              ii.tax_rate,
              ii.net_weight_kg,
              ii.price_per_kg,
              ii.is_critical_checklist,
              COALESCE(si.current_quantity, 10.00) as current_quantity,
              COALESCE(si.min_alert_quantity, 2.00) as min_alert_quantity
       FROM inventory_items ii
       LEFT JOIN store_inventory si ON ii.id = si.item_id AND si.tenant_id::text = $1
       ORDER BY ii.category, ii.name`,
      [tenantId]
    )

    if (res && res.rows && res.rows.length > 0) {
      return res.rows.map((r: any) => {
        const current = Number(r.current_quantity) || 0
        const min = Number(r.min_alert_quantity) || 0
        const supplyPrice = Number(r.supply_price) || 0
        const taxRate = r.tax_rate !== null && r.tax_rate !== undefined ? Number(r.tax_rate) : 23.00
        const supplyPriceWithTax = Number((supplyPrice * (1 + taxRate / 100)).toFixed(2))

        let status: 'NORMAL' | 'ALERT' | 'CRITICAL' = 'NORMAL'
        if (current <= min * 0.5) status = 'CRITICAL'
        else if (current <= min) status = 'ALERT'

        return {
          id: r.id,
          name: r.name,
          unit: r.unit,
          category: r.category,
          supplyCode: r.supply_code || undefined,
          marketPrice: Number(r.market_price) || 0,
          supplyPrice,
          supplyPriceWithTax,
          taxRate,
          netWeightKg: r.net_weight_kg !== null && r.net_weight_kg !== undefined ? Number(r.net_weight_kg) : undefined,
          pricePerKg: r.price_per_kg !== null && r.price_per_kg !== undefined ? Number(r.price_per_kg) : undefined,
          currentQuantity: current,
          minAlertQuantity: min,
          isCriticalChecklist: Boolean(r.is_critical_checklist),
          status,
        }
      })
    }
  } catch (err) {
    console.error('Erro ao consultar inventário no PostgreSQL:', err)
  }

  return []
}

/**
 * Ajusta o saldo físico da loja com registro imutável em auditoria
 */
export async function adjustStoreStock(params: {
  tenantId: string
  itemId: string
  newQuantity: number
  difference: number
  reason: string
  operatorId?: string
}): Promise<boolean> {
  const { tenantId, itemId, newQuantity, difference, reason, operatorId } = params
  try {
    // 1. Upsert em store_inventory
    await query(
      `INSERT INTO store_inventory (id, tenant_id, item_id, current_quantity, min_alert_quantity, last_counted_at, updated_at)
       VALUES ($1, $2, $3, $4, 2.00, now(), now())
       ON CONFLICT (tenant_id, item_id)
       DO UPDATE SET current_quantity = $4, last_counted_at = now(), updated_at = now()`,
      [uuidv4(), tenantId, itemId, newQuantity]
    )

    // 2. Insert em inventory_audits
    await query(
      `INSERT INTO inventory_audits (id, tenant_id, item_id, theoretical_quantity, counted_quantity, difference, reason, operator_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())`,
      [
        uuidv4(),
        tenantId,
        itemId,
        newQuantity - difference,
        newQuantity,
        difference,
        reason || 'AJUSTE_MANUAL',
        operatorId || null,
      ]
    )

    await recordAuditLog({
      tenantId,
      action: 'STOCK_ADJUSTED',
      entity: 'store_inventory',
      entityId: itemId,
      message: `Ajuste de estoque: novo saldo ${newQuantity} (${reason})`,
      metadata: params,
    })

    return true
  } catch (err) {
    console.error('Erro ao ajustar estoque:', err)
    return false
  }
}

/**
 * Atualiza o limite mínimo de alerta de uma loja
 */
export async function updateStoreMinAlert(tenantId: string, itemId: string, minAlert: number): Promise<boolean> {
  try {
    await query(
      `INSERT INTO store_inventory (id, tenant_id, item_id, current_quantity, min_alert_quantity, updated_at)
       VALUES ($1, $2, $3, 10.00, $4, now())
       ON CONFLICT (tenant_id, item_id)
       DO UPDATE SET min_alert_quantity = $4, updated_at = now()`,
      [uuidv4(), tenantId, itemId, minAlert]
    )
    return true
  } catch (err) {
    console.error('Erro ao atualizar limite mínimo:', err)
    return false
  }
}

/**
 * Registra o checklist de turno (2 min) para múltiplos itens críticos
 */
export async function saveShiftChecklist(params: {
  tenantId: string
  counts: { itemId: string; theoretical: number; counted: number }[]
  operatorId?: string
}): Promise<boolean> {
  const { tenantId, counts, operatorId } = params
  try {
    for (const c of counts) {
      const diff = c.counted - c.theoretical
      await adjustStoreStock({
        tenantId,
        itemId: c.itemId,
        newQuantity: c.counted,
        difference: diff,
        reason: 'CHECKLIST_TURNO',
        operatorId,
      })
    }
    return true
  } catch (err) {
    console.error('Erro ao salvar checklist de turno:', err)
    return false
  }
}

/**
 * Consulta pedidos de abastecimento B2B
 */
export async function getSupplyOrders(tenantId?: string): Promise<SupplyOrderRow[]> {
  try {
    const whereClause = tenantId ? 'WHERE so.tenant_id::text = $1' : ''
    const params = tenantId ? [tenantId] : []
    const res = await query(
      `SELECT so.id, so.tenant_id as "tenantId", t.name as "tenantName",
              so.order_number as "orderNumber", so.status,
              so.total_amount as "totalAmount", so.total_savings as "totalSavings",
              so.subtotal_net as "subtotalNet", so.tax_total as "taxTotal",
              so.tax_breakdown as "taxBreakdown",
              so.items_json as "items", so.rejection_reason as "rejectionReason",
              so.notes, so.created_at as "createdAt"
       FROM supply_orders so
       LEFT JOIN tenants t ON so.tenant_id = t.id
       ${whereClause}
       ORDER BY so.created_at DESC`,
      params
    )

    if (res && res.rows) {
      return res.rows.map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        tenantName: r.tenantName || 'Filial Franquiada',
        orderNumber: Number(r.orderNumber) || 100,
        status: r.status,
        totalAmount: Number(r.totalAmount) || 0,
        totalSavings: Number(r.totalSavings) || 0,
        subtotalNet: Number(r.subtotalNet) || 0,
        taxTotal: Number(r.taxTotal) || 0,
        taxBreakdown: r.taxBreakdown && typeof r.taxBreakdown === 'object' ? r.taxBreakdown : {},
        items: Array.isArray(r.items) ? r.items : JSON.parse(r.items || '[]'),
        rejectionReason: r.rejectionReason || null,
        notes: r.notes || null,
        createdAt: r.createdAt,
      }))
    }
  } catch (err) {
    console.error('Erro ao consultar supply_orders:', err)
  }
  return []
}

/**
 * Cria pedido de abastecimento B2B com discriminação de IVA
 */
export async function createSupplyOrder(
  tenantId: string,
  items: any[],
  totalAmount: number,
  totalSavings: number,
  notes?: string,
  subtotalNet?: number,
  taxTotal?: number,
  taxBreakdown?: Record<string, number>
): Promise<SupplyOrderRow> {
  const id = uuidv4()
  const orderNum = Math.floor(1000 + Math.random() * 9000)

  // Se não vier discriminado, calcular automaticamente com base nos itens
  let calcNet = subtotalNet !== undefined ? subtotalNet : 0
  let calcTax = taxTotal !== undefined ? taxTotal : 0
  const calcBreakdown: Record<string, number> = taxBreakdown || {}

  if (subtotalNet === undefined || taxTotal === undefined) {
    calcNet = 0
    calcTax = 0
    for (const it of items) {
      const lineNet = Number((Number(it.unitPrice || it.supplyPrice || 0) * it.quantity).toFixed(2))
      const rate = Number(it.taxRate) || 23.00
      const lineTax = Number((lineNet * (rate / 100)).toFixed(2))
      calcNet += lineNet
      calcTax += lineTax
      calcBreakdown[String(rate)] = Number(((calcBreakdown[String(rate)] || 0) + lineTax).toFixed(2))
    }
  }

  try {
    // 1. Processa reserva de estoque e identificação de pré-encomenda
    const processedItems = []
    for (const it of items) {
      const stockRes = await query(`SELECT central_stock_quantity FROM inventory_items WHERE id = $1`, [it.itemId])
      const available = stockRes?.rows[0] ? Number(stockRes.rows[0].central_stock_quantity) || 0 : 0
      const isPreorder = available <= 0

      if (!isPreorder) {
        const qtyToReserve = Math.min(available, it.quantity)
        await query(
          `UPDATE inventory_items 
           SET central_stock_quantity = GREATEST(0, central_stock_quantity - $1) 
           WHERE id = $2`,
          [qtyToReserve, it.itemId]
        )
      }

      processedItems.push({
        ...it,
        isPreorder,
        reservedQty: isPreorder ? 0 : Math.min(available, it.quantity),
      })
    }

    const res = await query(
      `INSERT INTO supply_orders (
         id, tenant_id, order_number, status, payment_status, total_amount, 
         total_savings, subtotal_net, tax_total, tax_breakdown, items_json, notes, created_at
       )
       VALUES ($1, $2, $3, 'PENDING', 'PENDING', $4, $5, $6, $7, $8, $9, $10, now())
       RETURNING *`,
      [
        id,
        tenantId,
        orderNum,
        totalAmount,
        totalSavings,
        calcNet,
        calcTax,
        JSON.stringify(calcBreakdown),
        JSON.stringify(processedItems),
        notes || null,
      ]
    )
    const r = res.rows[0]

    await recordAuditLog({
      tenantId,
      action: 'SUPPLY_ORDER_CREATED',
      entity: 'supply_orders',
      entityId: id,
      message: `Novo pedido B2B #${orderNum} (€ ${totalAmount.toFixed(2)}) com reserva de estoque e IVA discriminado`,
      metadata: { orderId: id, totalAmount, totalSavings, subtotalNet: calcNet, taxTotal: calcTax, notes },
    })

    return {
      id: r.id,
      tenantId: r.tenant_id,
      orderNumber: r.order_number,
      status: r.status,
      paymentStatus: r.payment_status || 'PENDING',
      totalAmount: Number(r.total_amount) || 0,
      totalSavings: Number(r.total_savings) || 0,
      subtotalNet: Number(r.subtotal_net) || 0,
      taxTotal: Number(r.tax_total) || 0,
      taxBreakdown: r.tax_breakdown && typeof r.tax_breakdown === 'object' ? r.tax_breakdown : {},
      items: processedItems,
      notes: r.notes || null,
      createdAt: r.created_at,
    }
  } catch (err) {
    console.error('Erro ao criar supply_order:', err)
    return {
      id,
      tenantId,
      orderNumber: orderNum,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      totalAmount,
      totalSavings,
      subtotalNet: calcNet,
      taxTotal: calcTax,
      taxBreakdown: calcBreakdown,
      items,
      notes: notes || null,
      createdAt: new Date().toISOString(),
    }
  }
}

/**
 * Atualiza status de pedido de abastecimento (ex: SHIPPED, DELIVERED, CANCELLED, REJECTED)
 */
export async function updateSupplyOrderStatus(
  id: string,
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REJECTED',
  rejectionReason?: string
): Promise<boolean> {
  try {
    if (status === 'REJECTED' && rejectionReason) {
      // Restaura o estoque reservado para a central
      const ordRes = await query(`SELECT items_json FROM supply_orders WHERE id = $1`, [id])
      if (ordRes?.rows[0]) {
        const rawItems = ordRes.rows[0].items_json
        const items = Array.isArray(rawItems) ? rawItems : JSON.parse(rawItems || '[]')
        for (const it of items) {
          if (it.itemId && it.reservedQty && it.reservedQty > 0) {
            await query(
              `UPDATE inventory_items 
               SET central_stock_quantity = central_stock_quantity + $1
               WHERE id = $2`,
              [it.reservedQty, it.itemId]
            )
          }
        }
      }

      await query(`UPDATE supply_orders SET status = $2, rejection_reason = $3, updated_at = now() WHERE id = $1`, [
        id,
        status,
        rejectionReason,
      ])
      await recordAuditLog({
        action: 'SUPPLY_ORDER_REJECTED',
        entity: 'supply_orders',
        entityId: id,
        message: `Pedido de abastecimento recusado pela Matriz. Motivo: "${rejectionReason}". Estoque reservado restaurado.`,
        metadata: { orderId: id, status, rejectionReason },
      })
    } else {
      await query(`UPDATE supply_orders SET status = $2, updated_at = now() WHERE id = $1`, [id, status])
      await recordAuditLog({
        action: 'SUPPLY_ORDER_STATUS_CHANGED',
        entity: 'supply_orders',
        entityId: id,
        message: `Status do pedido de abastecimento alterado para ${status}`,
        metadata: { orderId: id, status },
      })
    }
    return true
  } catch (err) {
    console.error('Erro ao atualizar status de supply_order:', err)
    return false
  }
}

/**
 * Exclui pedido de reposição (enviado por engano/teste) e restitui reserva de estoque
 */
export async function deleteSupplyOrder(orderId: string): Promise<boolean> {
  try {
    const ordRes = await query(`SELECT order_number, status, items_json FROM supply_orders WHERE id = $1`, [orderId])
    if (!ordRes || !ordRes.rows[0]) return false
    const ord = ordRes.rows[0]
    const rawItems = ord.items_json
    const items = Array.isArray(rawItems) ? rawItems : JSON.parse(rawItems || '[]')

    // Se o pedido estava PENDING ou SHIPPED, devolve as reservas ao armazém central
    if (ord.status === 'PENDING' || ord.status === 'SHIPPED') {
      for (const it of items) {
        const qtyToReturn = it.reservedQty || (!it.isPreorder ? it.quantity : 0)
        if (it.itemId && qtyToReturn > 0) {
          await query(
            `UPDATE inventory_items 
             SET central_stock_quantity = central_stock_quantity + $1
             WHERE id = $2`,
            [qtyToReturn, it.itemId]
          )
        }
      }
    }

    await query(`DELETE FROM supply_orders WHERE id = $1`, [orderId])

    await recordAuditLog({
      action: 'SUPPLY_ORDER_DELETED',
      entity: 'supply_orders',
      entityId: orderId,
      message: `Pedido de abastecimento #${ord.order_number} excluído permanentemente pela Matriz.`,
      metadata: { orderId, orderNumber: ord.order_number },
    })

    return true
  } catch (err) {
    console.error('Erro ao excluir supply_order:', err)
    return false
  }
}

/**
 * Atualiza status financeiro do pedido B2B
 */
export async function updateSupplyOrderPaymentStatus(
  orderId: string,
  paymentStatus: 'PENDING' | 'PAID' | 'INVOICED_30D'
): Promise<boolean> {
  try {
    await query(`UPDATE supply_orders SET payment_status = $2, updated_at = now() WHERE id = $1`, [orderId, paymentStatus])
    await recordAuditLog({
      action: 'SUPPLY_ORDER_PAYMENT_STATUS_CHANGED',
      entity: 'supply_orders',
      entityId: orderId,
      message: `Status de pagamento do pedido #${orderId} alterado para ${paymentStatus}`,
      metadata: { orderId, paymentStatus },
    })
    return true
  } catch (err) {
    console.error('Erro ao atualizar status de pagamento do pedido:', err)
    return false
  }
}

/**
 * Confirma recebimento do pedido na loja e credita automaticamente o saldo físico
 */
export async function receiveSupplyOrder(orderId: string, tenantId: string, receivedBy?: string): Promise<boolean> {
  try {
    // 1. Busca os itens do pedido
    const res = await query(`SELECT items_json FROM supply_orders WHERE id = $1`, [orderId])
    if (!res || !res.rows[0]) return false
    const rawItems = res.rows[0].items_json
    const items = Array.isArray(rawItems) ? rawItems : JSON.parse(rawItems || '[]')

    // 2. Incrementa o saldo de cada item na loja
    for (const it of items) {
      if (it.itemId && it.quantity) {
        await query(
          `INSERT INTO store_inventory (id, tenant_id, item_id, current_quantity, min_alert_quantity, updated_at)
           VALUES ($1, $2, $3, $4, 2.00, now())
           ON CONFLICT (tenant_id, item_id)
           DO UPDATE SET current_quantity = store_inventory.current_quantity + $4, updated_at = now()`,
          [uuidv4(), tenantId, it.itemId, it.quantity]
        )

        // Log de auditoria da entrada
        await query(
          `INSERT INTO inventory_audits (id, tenant_id, item_id, theoretical_quantity, counted_quantity, difference, reason, operator_id, created_at)
           VALUES ($1, $2, $3, 0, $4, $4, 'ENTRADA_REPOSICAO_MATRIZ', $5, now())`,
          [uuidv4(), tenantId, it.itemId, it.quantity, receivedBy || null]
        )
      }
    }

    // 3. Marca como entregue
    await query(`UPDATE supply_orders SET status = 'DELIVERED' WHERE id = $1`, [orderId])
    await recordAuditLog({
      tenantId,
      action: 'SUPPLY_ORDER_DELIVERED',
      entity: 'supply_orders',
      entityId: orderId,
      message: `Recebimento de carga confirmado na loja: estoque abastecido`,
      metadata: { orderId, receivedBy },
    })
    return true
  } catch (err) {
    console.error('Erro ao confirmar recebimento de abastecimento:', err)
    return false
  }
}

/**
 * Realiza a dedução estimada de matéria-prima em segundo plano na conclusão do pedido
 * e gera logs de auditoria para o TI sem travar vendas.
 */
export async function decrementEstimatedStock(
  tenantId: string,
  orderId: string,
  orderNumber: number,
  items: any[]
): Promise<void> {
  if (!tenantId || !Array.isArray(items) || items.length === 0) return

  try {
    // 1. Carrega os insumos de estoque mapeados para esta loja
    const invRes = await query(
      `SELECT ii.id, ii.name, ii.unit, ii.category, ii.supply_code, si.current_quantity, si.min_alert_quantity
       FROM inventory_items ii
       JOIN store_inventory si ON ii.id = si.item_id
       WHERE si.tenant_id::text = $1`,
      [tenantId]
    )
    if (!invRes || !invRes.rows || invRes.rows.length === 0) return

    const inventory = invRes.rows
    const itemAcai = inventory.find((i: any) => i.supply_code === 'SUP-ACA-10KG' || i.name.toLowerCase().includes('açaí'))
    const itemCopo = inventory.find((i: any) => i.supply_code === 'SUP-COP-500' || i.name.toLowerCase().includes('copo'))
    const itemMorango = inventory.find((i: any) => i.supply_code === 'SUP-FRU-MOR' || i.name.toLowerCase().includes('morango'))
    const itemGranola = inventory.find((i: any) => i.supply_code === 'SUP-TOP-GRA' || i.name.toLowerCase().includes('granola'))
    const itemLeiteCond = inventory.find((i: any) => i.supply_code === 'SUP-CAL-LEI' || i.name.toLowerCase().includes('leite condensado'))
    const itemNutella = inventory.find((i: any) => i.supply_code === 'SUP-CAL-NUT' || i.name.toLowerCase().includes('nutella'))

    const deductions: Record<string, { itemId: string; name: string; amount: number; unit: string }> = {}

    const addDeduction = (item: any, amount: number) => {
      if (!item) return
      if (!deductions[item.id]) {
        deductions[item.id] = { itemId: item.id, name: item.name, amount: 0, unit: item.unit }
      }
      deductions[item.id].amount += amount
    }

    // 2. Mapeia o consumo estimado por taça e opcionais
    for (const line of items) {
      const qty = Number(line.quantity) || 1
      const weight = Number(line.container?.weightGrams) || 500

      // Copos: cada taça consome 1 copo (em centenas: 0.01 se a unidade for Centenas)
      if (itemCopo) {
        const factor = itemCopo.unit?.toLowerCase().includes('centena') ? 0.01 : 1
        addDeduction(itemCopo, factor * qty)
      }

      // Açaí Base (em baldes de 10kg: weight / 10000)
      if (itemAcai) {
        const factor = itemAcai.unit?.toLowerCase().includes('balde') ? weight / 10000 : weight / 1000
        addDeduction(itemAcai, factor * qty)
      }

      // Opcionais (toppings, bases secundárias, frutas, caldas)
      const allToppings = [...(line.toppings || []), ...(line.bases?.slice(1) || [])]
      for (const top of allToppings) {
        const nameLower = (top.name || '').toLowerCase()
        if (itemMorango && nameLower.includes('morango')) {
          addDeduction(itemMorango, 0.03 * qty) // ~30g de morango
        } else if (itemGranola && nameLower.includes('granola')) {
          addDeduction(itemGranola, 0.02 * qty) // ~20g de granola
        } else if (itemLeiteCond && nameLower.includes('leite condensado')) {
          addDeduction(itemLeiteCond, 0.01 * qty) // ~0.01 lata
        } else if (itemNutella && nameLower.includes('nutella')) {
          addDeduction(itemNutella, 0.01 * qty) // ~0.01 balde (~30g)
        }
      }
    }

    // 3. Executa as deduções atômicas e monitora limites de alerta
    const deductionSummary: any[] = []
    for (const d of Object.values(deductions)) {
      if (d.amount <= 0) continue

      const updRes = await query(
        `UPDATE store_inventory 
         SET current_quantity = GREATEST(0, ROUND((current_quantity - $3)::numeric, 4)), 
             updated_at = now() 
         WHERE tenant_id::text = $1 AND item_id = $2 
         RETURNING current_quantity, min_alert_quantity`,
        [tenantId, d.itemId, d.amount]
      )

      const updatedRow = updRes.rows?.[0]
      const newQty = updatedRow ? Number(updatedRow.current_quantity) : 0
      const minAlert = updatedRow ? Number(updatedRow.min_alert_quantity) : 0

      deductionSummary.push({
        name: d.name,
        deducted: +d.amount.toFixed(4),
        remaining: newQty,
        unit: d.unit,
      })

      // Se atingiu o limite mínimo, registra log de alerta para o TI
      if (newQty <= minAlert) {
        await recordAuditLog({
          tenantId,
          userId: 'system',
          authorName: 'Alerta de Estoque Mínimo',
          action: 'STOCK_ALERT_TRIGGERED',
          entity: 'store_inventory',
          entityId: d.itemId,
          message: `Artigo "${d.name}" atingiu o ponto de pedido na loja. Saldo: ${newQty} ${d.unit}.`,
          metadata: {
            orderId,
            orderNumber,
            itemName: d.name,
            currentQuantity: newQty,
            minAlertQuantity: minAlert,
          },
        })
      }
    }

    // 4. Grava log de auditoria da dedução assíncrona para o TI
    await recordAuditLog({
      tenantId,
      userId: 'system',
      authorName: 'Baixa Estimada Automática',
      action: 'AUTO_DECREMENT_STOCK',
      entity: 'orders',
      entityId: orderId,
      message: `Baixa estimada de estoque processada para o pedido #${orderNumber}`,
      metadata: {
        orderId,
        orderNumber,
        itemsCount: items.length,
        deductions: deductionSummary,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('Erro na baixa estimada de estoque em segundo plano:', err)
  }
}

/**
 * Consulta fornecedores cadastrados no sistema
 */
export async function getSuppliers(): Promise<SupplierRow[]> {
  try {
    const res = await query(
      `SELECT id, name, nif, email, phone, category, lead_time_days as "leadTimeDays", is_active as "isActive", created_at as "createdAt"
       FROM suppliers
       WHERE is_active = true
       ORDER BY name`
    )
    return res.rows || []
  } catch (err) {
    console.error('Erro ao buscar suppliers:', err)
    return []
  }
}

/**
 * Cadastra um novo fornecedor
 */
export async function createSupplier(data: {
  name: string
  nif?: string
  email?: string
  phone?: string
  category?: string
  leadTimeDays?: number
}): Promise<SupplierRow | null> {
  try {
    const res = await query(
      `INSERT INTO suppliers (name, nif, email, phone, category, lead_time_days)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, nif, email, phone, category, lead_time_days as "leadTimeDays", is_active as "isActive", created_at as "createdAt"`,
      [data.name, data.nif || null, data.email || null, data.phone || null, data.category || null, data.leadTimeDays ?? 3]
    )
    return res.rows[0]
  } catch (err) {
    console.error('Erro ao cadastrar fornecedor:', err)
    return null
  }
}

/**
 * Consulta histórico de compras da Matriz com fornecedores (Inbound)
 */
export async function getSupplierPurchases(): Promise<SupplierPurchaseRow[]> {
  try {
    const res = await query(`
      SELECT sp.id, sp.supplier_id as "supplierId", s.name as "supplierName",
             sp.item_id as "itemId", ii.name as "itemName", ii.supply_code as "supplyCode",
             sp.quantity, sp.cost_unit_price as "costUnitPrice", sp.total_cost as "totalCost",
             sp.tax_rate as "taxRate", sp.tax_amount as "taxAmount",
             sp.invoice_number as "invoiceNumber", sp.batch_number as "batchNumber",
             sp.expiration_date as "expirationDate", sp.notes, sp.purchased_at as "purchasedAt"
      FROM supplier_purchases sp
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      LEFT JOIN inventory_items ii ON sp.item_id = ii.id
      ORDER BY sp.purchased_at DESC
    `)
    return (res.rows || []).map((r) => {
      const quantity = Number(r.quantity) || 0
      const costUnitPrice = Number(r.costUnitPrice) || 0
      const totalCost = Number(r.totalCost) || 0
      const taxRate = r.taxRate !== null && r.taxRate !== undefined ? Number(r.taxRate) : 23.00
      const taxAmount = r.taxAmount !== null && r.taxAmount !== undefined ? Number(r.taxAmount) : Number(((totalCost * taxRate) / 100).toFixed(2))
      const totalCostIncTax = Number((totalCost + taxAmount).toFixed(2))

      return {
        ...r,
        quantity,
        costUnitPrice,
        totalCost,
        taxRate,
        taxAmount,
        totalCostIncTax,
        expirationDate: r.expirationDate ? new Date(r.expirationDate).toISOString().split('T')[0] : null,
      }
    })
  } catch (err) {
    console.error('Erro ao buscar supplier_purchases:', err)
    return []
  }
}

/**
 * Registra entrada de compra de insumo com fornecedor e abastece o estoque central
 */
export async function recordSupplierPurchase(params: {
  supplierId: string
  itemId: string
  quantity: number
  costUnitPrice: number
  taxRate?: number
  invoiceNumber?: string
  batchNumber?: string
  expirationDate?: string
  notes?: string
}): Promise<SupplierPurchaseRow | null> {
  const { supplierId, itemId, quantity, costUnitPrice, invoiceNumber, batchNumber, expirationDate, notes } = params
  const totalCost = Number((quantity * costUnitPrice).toFixed(2))
  const taxRate = params.taxRate !== undefined ? params.taxRate : 23.00
  const taxAmount = Number(((totalCost * taxRate) / 100).toFixed(2))

  try {
    const res = await query(
      `INSERT INTO supplier_purchases (
         supplier_id, item_id, quantity, cost_unit_price, total_cost, 
         tax_rate, tax_amount, invoice_number, batch_number, expiration_date, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        supplierId,
        itemId,
        quantity,
        costUnitPrice,
        totalCost,
        taxRate,
        taxAmount,
        invoiceNumber || null,
        batchNumber || null,
        expirationDate || null,
        notes || null,
      ]
    )

    // Incrementa estoque físico central da Matriz e atualiza último custo pago
    await query(
      `UPDATE inventory_items
       SET central_stock_quantity = central_stock_quantity + $1,
           last_cost_price = $2
       WHERE id = $3`,
      [quantity, costUnitPrice, itemId]
    )

    await recordAuditLog({
      action: 'SUPPLIER_PURCHASE_RECORDED',
      entity: 'supplier_purchases',
      entityId: res.rows[0].id,
      message: `Entrada de insumo registrada: ${quantity} un a €${costUnitPrice.toFixed(2)} + ${taxRate}% IVA (Total: €${(totalCost + taxAmount).toFixed(2)})`,
      metadata: { itemId, supplierId, quantity, totalCost, taxRate, taxAmount, invoiceNumber, batchNumber },
    })

    return res.rows[0]
  } catch (err) {
    console.error('Erro ao registrar supplier_purchase:', err)
    return null
  }
}

/**
 * Atualiza um registro de compra com fornecedor
 */
export async function updateSupplierPurchase(
  id: string,
  params: {
    supplierId?: string
    itemId?: string
    quantity?: number
    costUnitPrice?: number
    taxRate?: number
    invoiceNumber?: string
    batchNumber?: string
    expirationDate?: string
    notes?: string
  }
): Promise<SupplierPurchaseRow | null> {
  try {
    const current = await query(`SELECT * FROM supplier_purchases WHERE id = $1`, [id])
    if (!current || !current.rows[0]) return null
    const old = current.rows[0]

    const quantity = params.quantity !== undefined ? params.quantity : Number(old.quantity)
    const costUnitPrice = params.costUnitPrice !== undefined ? params.costUnitPrice : Number(old.cost_unit_price)
    const totalCost = Number((quantity * costUnitPrice).toFixed(2))
    const taxRate = params.taxRate !== undefined ? params.taxRate : (old.tax_rate !== null ? Number(old.tax_rate) : 23.00)
    const taxAmount = Number(((totalCost * taxRate) / 100).toFixed(2))
    const itemId = params.itemId || old.item_id
    const supplierId = params.supplierId || old.supplier_id

    // Ajuste proporcional do estoque central
    const diffQty = quantity - Number(old.quantity)
    if (diffQty !== 0 && old.item_id === itemId) {
      await query(
        `UPDATE inventory_items
         SET central_stock_quantity = GREATEST(0, central_stock_quantity + $1)
         WHERE id = $2`,
        [diffQty, itemId]
      )
    }

    const res = await query(
      `UPDATE supplier_purchases
       SET supplier_id = $2,
           item_id = $3,
           quantity = $4,
           cost_unit_price = $5,
           total_cost = $6,
           tax_rate = $7,
           tax_amount = $8,
           invoice_number = $9,
           batch_number = $10,
           expiration_date = $11,
           notes = $12
       WHERE id = $1
       RETURNING *`,
      [
        id,
        supplierId,
        itemId,
        quantity,
        costUnitPrice,
        totalCost,
        taxRate,
        taxAmount,
        params.invoiceNumber !== undefined ? params.invoiceNumber : old.invoice_number,
        params.batchNumber !== undefined ? params.batchNumber : old.batch_number,
        params.expirationDate !== undefined ? params.expirationDate : old.expiration_date,
        params.notes !== undefined ? params.notes : old.notes,
      ]
    )

    return res.rows[0] || null
  } catch (err) {
    console.error('Erro ao atualizar compra com fornecedor:', err)
    return null
  }
}

/**
 * Exclui uma compra de fornecedor e estorna o saldo correspondente do armazém central
 */
export async function deleteSupplierPurchase(id: string): Promise<boolean> {
  try {
    const current = await query(`SELECT * FROM supplier_purchases WHERE id = $1`, [id])
    if (current && current.rows[0]) {
      const old = current.rows[0]
      await query(
        `UPDATE inventory_items
         SET central_stock_quantity = GREATEST(0, central_stock_quantity - $1)
         WHERE id = $2`,
        [Number(old.quantity), old.item_id]
      )
    }

    await query('DELETE FROM supplier_purchases WHERE id = $1', [id])
    return true
  } catch (err) {
    console.error('Erro ao excluir supplier_purchase:', err)
    return false
  }
}

/**
 * Métricas de Supply Chain e DRE da Franqueadora
 */
export async function getSupplyChainMetrics(): Promise<{
  totalPurchasedCost: number
  totalSoldRevenue: number
  grossMargin: number
  grossMarginPercent: number
  topDemandedItems: { name: string; quantity: number; totalRevenue: number }[]
  storeUsage: { storeName: string; totalRevenue: number; ordersCount: number }[]
}> {
  try {
    // 1. Total Gasto em Compras com Fornecedores (Estoque Central)
    const purchasesRes = await query(`SELECT COALESCE(SUM(total_cost), 0) as total FROM supplier_purchases`)
    const totalPurchasedCost = Number(purchasesRes.rows[0]?.total) || 0

    // 2. Total Faturado e Custo dos Insumos Vendidos às Franquias (CMV)
    const salesRes = await query(
      `SELECT 
         COALESCE(SUM(DISTINCT so.total_amount), 0) as total_revenue,
         COALESCE(SUM(soi.quantity * COALESCE(ii.last_cost_price, 0)), 0) as total_cogs
       FROM supply_orders so
       LEFT JOIN supply_order_items soi ON so.id = soi.order_id
       LEFT JOIN inventory_items ii ON soi.item_id = ii.id
       WHERE so.status != 'REJECTED' AND so.status != 'CANCELLED'`
    )
    const totalSoldRevenue = Number(salesRes.rows[0]?.total_revenue) || 0
    const totalCogs = Number(salesRes.rows[0]?.total_cogs) || 0

    // Margem Bruta realizada sobre os pedidos das franquias (Faturamento B2B - CMV)
    const grossMargin = totalSoldRevenue > 0 ? Math.max(0, totalSoldRevenue - totalCogs) : 0
    const grossMarginPercent = totalSoldRevenue > 0 ? (grossMargin / totalSoldRevenue) * 100 : 0

    // 3. Consumo e faturamento por loja da rede
    const storesRes = await query(`
      SELECT t.name as "storeName", COALESCE(SUM(so.total_amount), 0) as "totalRevenue", COUNT(so.id) as "ordersCount"
      FROM supply_orders so
      LEFT JOIN tenants t ON so.tenant_id = t.id
      WHERE so.status != 'REJECTED' AND so.status != 'CANCELLED'
      GROUP BY t.name
      ORDER BY "totalRevenue" DESC
    `)
    const storeUsage = (storesRes.rows || []).map((r) => ({
      storeName: r.storeName || 'Filial',
      totalRevenue: Number(r.totalRevenue) || 0,
      ordersCount: Number(r.ordersCount) || 0,
    }))

    return {
      totalPurchasedCost,
      totalSoldRevenue,
      grossMargin,
      grossMarginPercent,
      topDemandedItems: [],
      storeUsage,
    }
  } catch (err) {
    console.error('Erro ao calcular métricas de supply chain:', err)
    return {
      totalPurchasedCost: 0,
      totalSoldRevenue: 0,
      grossMargin: 0,
      grossMarginPercent: 0,
      topDemandedItems: [],
      storeUsage: [],
    }
  }
}

/**
 * Transferência interna de insumos: Armazém Central -> Balcão da Loja Local (ex: Aveiro)
 */
export async function transferCentralToLocal(params: {
  itemId: string
  quantity: number
  tenantId: string
}): Promise<boolean> {
  const { itemId, quantity, tenantId } = params
  if (quantity <= 0) return false

  try {
    // 1. Deduz do estoque central
    await query(
      `UPDATE inventory_items
       SET central_stock_quantity = GREATEST(0, central_stock_quantity - $1)
       WHERE id = $2`,
      [quantity, itemId]
    )

    // 2. Credita no estoque local da loja
    await query(
      `INSERT INTO store_inventory (tenant_id, item_id, current_quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, item_id)
       DO UPDATE SET current_quantity = store_inventory.current_quantity + $3, updated_at = NOW()`,
      [tenantId, itemId, quantity]
    )

    // 3. Registra log de auditoria
    await recordAuditLog({
      action: 'INTERNAL_TRANSFER_CENTRAL_TO_LOCAL',
      entity: 'store_inventory',
      entityId: itemId,
      tenantId,
      message: `Transferência interna do armazém central para o balcão da loja: ${quantity} un`,
      metadata: { itemId, quantity, tenantId },
    })

    return true
  } catch (err) {
    console.error('Erro na transferência interna central -> local:', err)
    return false
  }
}

