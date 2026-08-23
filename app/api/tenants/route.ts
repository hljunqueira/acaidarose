import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { getTenants, createTenant } from '@/lib/repositories/tenantsRepository'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  const tenants = await getTenants()

  if (user && user.role !== 'SUPER_ADMIN') {
    const userTenants = tenants.filter((t) => t.id === user.tenantId)
    return jsonResponse({ tenants: userTenants })
  }

  return jsonResponse({ tenants })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!hasRole(user, ['SUPER_ADMIN'])) {
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
