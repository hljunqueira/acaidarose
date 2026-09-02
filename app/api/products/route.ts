import { NextRequest, NextResponse } from 'next/server'
import { getCatalogByTenant } from '@/lib/repositories/productsRepository'
import { getTenantByIdOrSlug, AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const rawTenant =
      request.nextUrl.searchParams.get('loja') ||
      request.nextUrl.searchParams.get('tenantId') ||
      request.nextUrl.searchParams.get('tenant') ||
      '1'

    const tenant = await getTenantByIdOrSlug(rawTenant)
    const effectiveTenantId = tenant ? tenant.id : AVEIRO_HQ_ID

    const catalog = await getCatalogByTenant(effectiveTenantId)
    return NextResponse.json(
      {
        ...catalog,
        tenantId: effectiveTenantId,
        tenantName: tenant?.name || 'Açaí da Rose',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar cardápio' },
      { status: 500 }
    )
  }
}
