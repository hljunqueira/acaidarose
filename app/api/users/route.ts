import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { getUsersByTenant, createUser } from '@/lib/repositories/usersRepository'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN', 'TENANT_ADMIN'])) {
    return errorResponse('Sem permissão', 403)
  }

  const requestedTenant = request.nextUrl.searchParams.get('tenantId')
  
  let tenantId: string | null = null
  if (user?.role === 'SUPER_ADMIN' || user?.role === 'FRANCHISOR_ADMIN') {
    if (requestedTenant && requestedTenant !== 'all') {
      tenantId = requestedTenant
    } else {
      tenantId = null
    }
  } else {
    tenantId = user?.tenantId || null
  }

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
    if (!body.email || !body.name || !body.role || !body.password) {
      return errorResponse('Dados incompletos: Nome, email, cargo e palavra-passe são obrigatórios.', 400)
    }

    // Regra estrita: Apenas SUPER_ADMIN pode criar e definir senhas de utilizadores
    if (user?.role !== 'SUPER_ADMIN') {
      return errorResponse('Apenas o Super Admin tem permissão para criar utilizadores e definir palavras-passe.', 403)
    }

    const tenantId = body.tenantId || null
    const newUser = await createUser({ ...body, tenantId })
    return jsonResponse(newUser, 201)
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao criar usuário', 500)
  }
}
