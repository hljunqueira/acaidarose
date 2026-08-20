import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { getUsersByTenant, createUser } from '@/lib/repositories/usersRepository'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!hasRole(user, ['SUPER_ADMIN', 'TENANT_ADMIN'])) {
    return errorResponse('Sem permissão', 403)
  }

  const requestedTenant = request.nextUrl.searchParams.get('tenantId')
  const tenantId = user?.role === 'TENANT_ADMIN' ? user.tenantId : (requestedTenant || null)
  const users = await getUsersByTenant(tenantId)
  return jsonResponse({ users })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!hasRole(user, ['SUPER_ADMIN', 'TENANT_ADMIN'])) {
    return errorResponse('Sem permissão', 403)
  }

  try {
    const body = await request.json()
    if (!body.email || !body.name || !body.role) {
      return errorResponse('Dados incompletos', 400)
    }

    const tenantId = user?.role === 'TENANT_ADMIN' ? user.tenantId : (body.tenantId || null)
    const newUser = await createUser({ ...body, tenantId })
    return jsonResponse(newUser, 201)
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao criar usuário', 500)
  }
}
