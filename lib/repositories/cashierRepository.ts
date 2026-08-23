import { CashierTransaction, CashierShiftSummary, CashierOperationType } from '@/types/cashier'
import { mockStore } from '@/lib/supabase/mockStore'

export async function getCashierTransactions(tenantId: string): Promise<CashierTransaction[]> {
  return (mockStore.cashierTransactions || []).filter((tx) => tx.tenantId === tenantId)
}

export async function addCashierTransaction(
  tenantId: string,
  type: CashierOperationType,
  amount: number,
  reason: string,
  operatorName: string
): Promise<CashierTransaction> {
  const tx: CashierTransaction = {
    id: `tx-${Date.now()}`,
    tenantId,
    type,
    amount: +amount.toFixed(2),
    reason,
    operatorName,
    timestamp: new Date().toISOString(),
  }

  mockStore.cashierTransactions = [tx, ...(mockStore.cashierTransactions || [])]
  return tx
}

export async function getCashierShiftSummary(tenantId: string, dateStr?: string): Promise<CashierShiftSummary> {
  const targetDate = dateStr || new Date().toISOString().slice(0, 10)
  const txs = (mockStore.cashierTransactions || []).filter(
    (tx) => tx.tenantId === tenantId && tx.timestamp.slice(0, 10) === targetDate
  )

  const initialSupply = txs
    .filter((t) => t.type === 'SUPPLY')
    .reduce((acc, t) => acc + t.amount, 0)

  const totalBleed = txs
    .filter((t) => t.type === 'BLEED')
    .reduce((acc, t) => acc + t.amount, 0)

  // Orders paid in cash today
  const orders = (mockStore.orders || []).filter(
    (o) =>
      o.tenantId === tenantId &&
      o.status !== 'CANCELLED' &&
      new Date(o.createdAt).toISOString().slice(0, 10) === targetDate &&
      ((o.paymentMethod as any) === 'DINHEIRO' || (o.paymentMethod as any) === 'NUMERARIO')
  )

  const totalSalesCash = orders.reduce((acc, o) => acc + (o.total || o.totalAmount || 0), 0)
  const expectedCash = +(initialSupply + totalSalesCash - totalBleed).toFixed(2)

  return {
    tenantId,
    date: targetDate,
    initialSupply: +initialSupply.toFixed(2),
    totalSales: +totalSalesCash.toFixed(2),
    totalBleed: +totalBleed.toFixed(2),
    expectedCash,
    transactions: txs,
  }
}
