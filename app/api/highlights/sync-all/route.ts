import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { syncAllStoresHighlights } from '@/lib/repositories/highlightsRepository'
import { AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (user && !hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN', 'TENANT_ADMIN'])) {
      return NextResponse.json({ error: 'Apenas administradores podem sincronizar destaques' }, { status: 403 })
    }

    let body: any = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const result = await syncAllStoresHighlights({
      sourceTenantId: body.sourceTenantId || AVEIRO_HQ_ID,
      targetTenantIds: body.targetTenantIds,
      userEmail: user?.email || 'super@acairose.pt',
    })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao sincronizar destaques' }, { status: 500 })
  }
}
