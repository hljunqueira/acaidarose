import { NextResponse } from 'next/server'
import { getSupplyChainMetrics } from '@/lib/repositories/inventoryRepository'

export async function GET() {
  try {
    const metrics = await getSupplyChainMetrics()
    return NextResponse.json({ metrics })
  } catch (err: any) {
    console.error('Erro na rota GET /api/supply-chain/metrics:', err)
    return NextResponse.json({ error: err.message || 'Erro ao calcular métricas' }, { status: 500 })
  }
}
