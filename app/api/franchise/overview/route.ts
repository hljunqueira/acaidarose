import { NextResponse } from 'next/server'
import { getNetworkOverview } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const overview = await getNetworkOverview()
    return NextResponse.json(overview)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar métricas da rede' }, { status: 500 })
  }
}
