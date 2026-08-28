import { NextRequest, NextResponse } from 'next/server'
import { getDayReport } from '@/lib/repositories/ordersRepository'
import { getTenantByIdOrSlug, AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const rawTenant =
      request.nextUrl.searchParams.get('loja') ||
      request.nextUrl.searchParams.get('tenantId') ||
      request.nextUrl.searchParams.get('tenant')

    let tenantId = AVEIRO_HQ_ID
    if (rawTenant) {
      const t = await getTenantByIdOrSlug(rawTenant)
      if (t) tenantId = t.id
    }

    const date = request.nextUrl.searchParams.get('date') || undefined
    const report = await getDayReport(tenantId, date)
    return NextResponse.json(report)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar relatório do dia' },
      { status: 500 }
    )
  }
}
