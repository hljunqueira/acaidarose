import { NextRequest, NextResponse } from 'next/server'
import { addCashierTransaction, getCashierShiftSummary } from '@/lib/repositories/cashierRepository'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId') || 'tenant-torres-novas'
    const date = searchParams.get('date') || undefined
    const summary = await getCashierShiftSummary(tenantId, date)
    return NextResponse.json(summary)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao carregar resumo de caixa' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantId, type, amount, reason, operatorName } = body

    if (!tenantId || !type || !amount || !reason) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
    }

    const tx = await addCashierTransaction(tenantId, type, Number(amount), reason, operatorName || 'Operador')
    return NextResponse.json(tx, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao registrar operação de caixa' }, { status: 500 })
  }
}
