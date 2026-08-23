export type CashierOperationType = 'SUPPLY' | 'BLEED' // SUPRIMENTO | SANGRIA

export interface CashierTransaction {
  id: string
  tenantId: string
  type: CashierOperationType
  amount: number
  reason: string
  operatorName: string
  timestamp: string
}

export interface CashierShiftSummary {
  tenantId: string
  date: string
  initialSupply: number
  totalSales: number
  totalBleed: number
  expectedCash: number
  transactions: CashierTransaction[]
}
