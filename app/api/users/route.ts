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
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN', 'TENANT_ADMIN'])) {
    return errorResponse('Sem permissão', 403)
  }

  try {
    const body = await request.json()
    if (!body.email || !body.name || !body.role || !body.password) {
      return errorResponse('Dados incompletos: Nome, email, cargo e palavra-passe são obrigatórios.', 400)
    }

    // Regras de Autorização para Criação de Utilizadores:
    if (user?.role === 'FRANCHISOR_ADMIN') {
      // O Administrador da Franqueadora pode criar utilizadores das franquias (Gerente de Loja e Operador de Caixa)
      if (body.role === 'SUPER_ADMIN' || body.role === 'FRANCHISOR_ADMIN') {
        return errorResponse('O Administrador da Franqueadora só pode criar utilizadores das unidades franqueadas (Gerente de Loja e Operador de Caixa).', 403)
      }
      if (!body.tenantId) {
        return errorResponse('É obrigatório vincular o utilizador da franquia a uma unidade/loja.', 400)
      }
    } else if (user?.role === 'TENANT_ADMIN') {
      // O Gerente de Loja pode criar apenas operadores de caixa (CASHIER) para a sua unidade
      if (body.role !== 'CASHIER' || (body.tenantId && body.tenantId !== user.tenantId)) {
        return errorResponse('O Gerente de Loja só pode criar operadores de caixa para a sua própria unidade.', 403)
      }
    } else if (user?.role !== 'SUPER_ADMIN') {
      return errorResponse('Sem permissão para criar utilizadores.', 403)
    }

    const tenantId = body.tenantId || null
    const newUser = await createUser({ ...body, tenantId })
    return jsonResponse(newUser, 201)
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao criar usuário', 500)
  }
}
