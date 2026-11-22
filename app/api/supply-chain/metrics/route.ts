import { NextResponse } from 'next/server'
import { getSupplyChainMetrics } from '@/lib/repositories/inventoryRepository'
import { errorResponse } from '@/lib/api/response'

export async function GET() {
  try {
    const metrics = await getSupplyChainMetrics()
    return NextResponse.json({ metrics })
  } catch (err: any) {
    console.error('Erro na rota GET /api/supply-chain/metrics:', err)
    return errorResponse(err, 'Erro ao calcular métricas de supply chain')
  }
}
