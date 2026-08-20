import { NextRequest, NextResponse } from 'next/server'
import { getDayReport } from '@/lib/repositories/ordersRepository'
import { DEFAULT_TENANT } from '@/lib/supabase/mockStore'

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId') || DEFAULT_TENANT.id
    const date = request.nextUrl.searchParams.get('date') || undefined
    const report = await getDayReport(tenantId, date)
    return NextResponse.json(report)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao gerar relatório do dia' }, { status: 500 })
  }
}
