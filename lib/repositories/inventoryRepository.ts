import { query } from '@/lib/db/postgres'
import { v4 as uuidv4 } from 'uuid'
import { recordAuditLog } from './auditRepository'

export interface InventoryItemRow {
  id: string
  name: string
  unit: string
  category: string
  marketPrice: number
  supplyPrice: number
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
  marketPrice: number
  supplyPrice: number
  isCriticalChecklist?: boolean
  createdAt?: string
}

export interface SupplyOrderRow {
  id: string
  tenantId: string
  tenantName?: string
  orderNumber: number
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  totalAmount: number
  totalSavings: number
  items: any[]
  createdAt: string
}

/**
 * Retorna todos os insumos do catálogo mestre (Franqueadora)
 */
export async function getAllMasterItems(): Promise<MasterInventoryItem[]> {
  try {
    const res = await query(
      `SELECT id, name, unit, category, 
              market_benchmark_price as "marketPrice", 
              franchise_supply_price as "supplyPrice", 
              is_critical_checklist as "isCriticalChecklist",
              created_at as "createdAt"
       FROM inventory_items
       ORDER BY category, name`
    )
    if (res && res.rows) {
      return res.rows.map((r) => ({
        id: r.id,
        name: r.name,
        unit: r.unit,
        category: r.category,
        marketPrice: Number(r.marketPrice) || 0,
        supplyPrice: Number(r.supplyPrice) || 0,
        isCriticalChecklist: Boolean(r.isCriticalChecklist),
        createdAt: r.createdAt,
      }))
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
  marketPrice: number
  supplyPrice: number
  isCriticalChecklist?: boolean
}): Promise<MasterInventoryItem> {
  const id = uuidv4()
  const res = await query(
    `INSERT INTO inventory_items (id, name, unit, category, market_benchmark_price, franchise_supply_price, is_critical_checklist)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, unit, category, 
               market_benchmark_price as "marketPrice", 
               franchise_supply_price as "supplyPrice", 
               is_critical_checklist as "isCriticalChecklist",
               created_at as "createdAt"`,
    [id, data.name, data.unit, data.category, data.marketPrice, data.supplyPrice, data.isCriticalChecklist ?? false]
  )
  const r = res.rows[0]
  return {
    id: r.id,
    name: r.name,
    unit: r.unit,
    category: r.category,
    marketPrice: Number(r.marketPrice) || 0,
    supplyPrice: Number(r.supplyPrice) || 0,
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
    marketPrice: number
    supplyPrice: number
    isCriticalChecklist?: boolean
  }>
): Promise<MasterInventoryItem | null> {
  const res = await query(
    `UPDATE inventory_items
     SET name = COALESCE($2, name),
         unit = COALESCE($3, unit),
         category = COALESCE($4, category),
         market_benchmark_price = COALESCE($5, market_benchmark_price),
         franchise_supply_price = COALESCE($6, franchise_supply_price),
         is_critical_checklist = COALESCE($7, is_critical_checklist)
     WHERE id = $1
     RETURNING id, name, unit, category, 
               market_benchmark_price as "marketPrice", 
               franchise_supply_price as "supplyPrice", 
               is_critical_checklist as "isCriticalChecklist",
               created_at as "createdAt"`,
    [id, data.name, data.unit, data.category, data.marketPrice, data.supplyPrice, data.isCriticalChecklist]
  )
  if (!res || !res.rows[0]) return null
  const r = res.rows[0]
  return {
    id: r.id,
    name: r.name,
    unit: r.unit,
    category: r.category,
    marketPrice: Number(r.marketPrice) || 0,
    supplyPrice: Number(r.supplyPrice) || 0,
    isCriticalChecklist: Boolean(r.isCriticalChecklist),
    createdAt: r.createdAt,
  }
}

/**
 * Remove um insumo do catálogo mestre
 */
export async function deleteMasterItem(id: string): Promise<boolean> {
  try {
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
      `SELECT ii.id, ii.name, ii.unit, ii.category, 
              ii.market_benchmark_price as market_price, 
              ii.franchise_supply_price as supply_price,
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
        let status: 'NORMAL' | 'ALERT' | 'CRITICAL' = 'NORMAL'
        if (current <= min * 0.5) status = 'CRITICAL'
        else if (current <= min) status = 'ALERT'

        return {
          id: r.id,
          name: r.name,
          unit: r.unit,
          category: r.category,
          marketPrice: Number(r.market_price) || 0,
          supplyPrice: Number(r.supply_price) || 0,
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
              so.items_json as "items", so.created_at as "createdAt"
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
        items: Array.isArray(r.items) ? r.items : JSON.parse(r.items || '[]'),
        createdAt: r.createdAt,
      }))
    }
  } catch (err) {
    console.error('Erro ao consultar supply_orders:', err)
  }
  return []
}

/**
 * Cria pedido de abastecimento B2B
 */
export async function createSupplyOrder(
  tenantId: string,
  items: any[],
  totalAmount: number,
  totalSavings: number
): Promise<SupplyOrderRow> {
  const id = uuidv4()
  const orderNum = Math.floor(1000 + Math.random() * 9000)
  try {
    const res = await query(
      `INSERT INTO supply_orders (id, tenant_id, order_number, status, total_amount, total_savings, items_json, created_at)
       VALUES ($1, $2, $3, 'PENDING', $4, $5, $6, now())
       RETURNING *`,
      [id, tenantId, orderNum, totalAmount, totalSavings, JSON.stringify(items)]
    )
    const r = res.rows[0]

    await recordAuditLog({
      tenantId,
      action: 'SUPPLY_ORDER_CREATED',
      entity: 'supply_orders',
      entityId: id,
      message: `Novo pedido B2B #${orderNum} (€ ${totalAmount.toFixed(2)})`,
      metadata: { orderId: id, totalAmount, totalSavings },
    })

    return {
      id: r.id,
      tenantId: r.tenant_id,
      orderNumber: r.order_number,
      status: r.status,
      totalAmount: Number(r.total_amount) || 0,
      totalSavings: Number(r.total_savings) || 0,
      items: Array.isArray(r.items_json) ? r.items_json : JSON.parse(r.items_json || '[]'),
      createdAt: r.created_at,
    }
  } catch (err) {
    console.error('Erro ao criar supply_order:', err)
    return {
      id,
      tenantId,
      orderNumber: orderNum,
      status: 'PENDING',
      totalAmount,
      totalSavings,
      items,
      createdAt: new Date().toISOString(),
    }
  }
}

/**
 * Atualiza status de pedido de abastecimento (ex: SHIPPED, DELIVERED, CANCELLED)
 */
export async function updateSupplyOrderStatus(id: string, status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'): Promise<boolean> {
  try {
    await query(`UPDATE supply_orders SET status = $2 WHERE id = $1`, [id, status])
    await recordAuditLog({
      action: 'SUPPLY_ORDER_STATUS_CHANGED',
      entity: 'supply_orders',
      entityId: id,
      message: `Status do pedido de abastecimento alterado para ${status}`,
      metadata: { orderId: id, status },
    })
    return true
  } catch (err) {
    console.error('Erro ao atualizar status de supply_order:', err)
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
