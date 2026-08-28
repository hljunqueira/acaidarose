import { CashierTransaction, CashierShiftSummary, CashierOperationType } from '@/types/cashier'
import { query } from '@/lib/db/postgres'
import { v4 as uuidv4 } from 'uuid'

export async function getCashierTransactions(tenantId: string): Promise<CashierTransaction[]> {
  try {
    const res = await query(
      `SELECT id, tenant_id, transaction_type as type, amount, reason, created_at as timestamp 
       FROM cashier_transactions 
       WHERE tenant_id::text = $1 
       ORDER BY created_at DESC`,
      [tenantId]
    )

    if (res.rows && res.rows.length > 0) {
      return res.rows.map((r: any) => ({
        id: r.id,
        tenantId: r.tenant_id,
        type: r.type as CashierOperationType,
        amount: Number(r.amount) || 0,
        reason: r.reason,
        operatorName: 'Operador',
        timestamp: r.timestamp,
      }))
    }
  } catch (err) {
    console.error('Erro ao consultar transações de caixa:', err)
  }

  return []
}

export async function addCashierTransaction(
  tenantId: string,
  type: CashierOperationType,
  amount: number,
  reason: string,
  operatorName: string
): Promise<CashierTransaction> {
  const id = uuidv4()
  const numAmount = +amount.toFixed(2)

  try {
    await query(
      `INSERT INTO cashier_transactions (id, tenant_id, transaction_type, amount, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, tenantId, type, numAmount, reason]
    )
  } catch (err) {
    console.error('Erro ao inserir transação de caixa no PostgreSQL:', err)
  }

  return {
    id,
    tenantId,
    type,
    amount: numAmount,
    reason,
    operatorName,
    timestamp: new Date().toISOString(),
  }
}

export async function getCashierShiftSummary(tenantId: string, dateStr?: string): Promise<CashierShiftSummary> {
  const targetDate = dateStr || new Date().toISOString().slice(0, 10)
  const start = targetDate + 'T00:00:00.000Z'
  const end = targetDate + 'T23:59:59.999Z'

  let initialSupply = 0
  let totalBleed = 0
  let totalSalesCash = 0

  try {
    const txRes = await query(
      `SELECT transaction_type, COALESCE(SUM(amount), 0) as total
       FROM cashier_transactions
       WHERE tenant_id::text = $1 AND created_at >= $2 AND created_at <= $3
       GROUP BY transaction_type`,
      [tenantId, start, end]
    )

    txRes.rows?.forEach((r: any) => {
      if (r.transaction_type === 'SUPPLY') initialSupply = Number(r.total) || 0
      if (r.transaction_type === 'BLEED') totalBleed = Number(r.total) || 0
    })

    const salesRes = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as cash_total
       FROM orders
       WHERE tenant_id::text = $1 
         AND payment_method IN ('NUMERARIO', 'CASH', 'DINHEIRO') 
         AND payment_status = 'PAID'
         AND status != 'CANCELLED'
         AND created_at >= $2 AND created_at <= $3`,
      [tenantId, start, end]
    )

    totalSalesCash = Number(salesRes.rows?.[0]?.cash_total) || 0
  } catch (err) {
    console.error('Erro ao calcular resumo de turno de caixa:', err)
  }

  const expectedCash = +(initialSupply + totalSalesCash - totalBleed).toFixed(2)

  return {
    tenantId,
    date: targetDate,
    initialSupply: +initialSupply.toFixed(2),
    totalSales: +totalSalesCash.toFixed(2),
    totalBleed: +totalBleed.toFixed(2),
    expectedCash,
    transactions: [],
  }
}
