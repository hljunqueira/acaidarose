import { query } from '@/lib/db/postgres'
import { v4 as uuidv4 } from 'uuid'

export interface InventoryItemRow {
  id: string
  name: string
  unit: string
  category: string
  marketPrice: number
  supplyPrice: number
  currentQuantity: number
  minAlertQuantity: number
  status: 'NORMAL' | 'ALERT' | 'CRITICAL'
}

export async function getStoreInventory(tenantId: string): Promise<InventoryItemRow[]> {
  try {
    const res = await query(
      `SELECT ii.id, ii.name, ii.unit, ii.category, 
              ii.market_benchmark_price as market_price, 
              ii.franchise_supply_price as supply_price,
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
          status,
        }
      })
    }
  } catch (err) {
    console.error('Erro ao consultar inventário no PostgreSQL:', err)
  }

  // Fallback padrão se ainda não semeado
  return [
    { id: '1', name: 'Açaí Tradicional (Balde 10kg)', unit: 'Baldes', category: 'BASE', marketPrice: 38.0, supplyPrice: 32.0, currentQuantity: 12, minAlertQuantity: 4, status: 'NORMAL' },
    { id: '2', name: 'Nutella Original (Balde 3kg)', unit: 'Baldes', category: 'TOPPING', marketPrice: 24.5, supplyPrice: 22.5, currentQuantity: 5, minAlertQuantity: 2, status: 'NORMAL' },
    { id: '3', name: 'Morangos Frescos Selecionados', unit: 'Kg', category: 'FRUTA', marketPrice: 4.5, supplyPrice: 3.8, currentQuantity: 1.5, minAlertQuantity: 3, status: 'ALERT' },
    { id: '4', name: 'Copos Biodegradáveis 500ml (Cx 500un)', unit: 'Caixas', category: 'EMBALAGEM', marketPrice: 45.0, supplyPrice: 39.0, currentQuantity: 8, minAlertQuantity: 2, status: 'NORMAL' },
  ]
}

export async function createSupplyOrder(tenantId: string, items: any[], totalAmount: number, totalSavings: number): Promise<any> {
  const id = uuidv4()
  try {
    const res = await query(
      `INSERT INTO supply_orders (id, tenant_id, status, total_amount, total_savings, items_json)
       VALUES ($1, $2, 'PENDING', $3, $4, $5)
       RETURNING *`,
      [id, tenantId, totalAmount, totalSavings, JSON.stringify(items)]
    )
    return res.rows[0]
  } catch (err) {
    console.error('Erro ao criar pedido de abastecimento B2B:', err)
    return { id, tenant_id: tenantId, status: 'PENDING', total_amount: totalAmount, items_json: items }
  }
}
