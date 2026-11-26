import { NextRequest, NextResponse } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { getTenants, createTenant } from '@/lib/repositories/tenantsRepository'
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    let tenants = await getTenants()

    const cashbackOnly = request.nextUrl.searchParams.get('cashbackOnly') === 'true'
    if (cashbackOnly) {
      const cfg = await loyaltyRepository.getEnabledStoresConfig()
      const disabledSet = new Set(cfg.disabled_tenant_ids || [])
      tenants = tenants.filter((t) => t.active !== false && !disabledSet.has(t.id))
      return NextResponse.json(
        { tenants },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      )
    }

    if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'FRANCHISOR_ADMIN') {
      const userTenants = tenants.filter((t) => t.id === user.tenantId)
      return jsonResponse({ tenants: userTenants })
    }

    return jsonResponse({ tenants })
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao carregar lojas', 500)
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN'])) {
    return errorResponse('Apenas a Franqueadora pode cadastrar novas lojas', 403)
  }

  try {
    const body = await request.json()
    if (!body.name) return errorResponse('Nome da loja é obrigatório', 400)
    const newTenant = await createTenant(body)
    return jsonResponse(newTenant, 201)
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao criar loja', 500)
  }
}
