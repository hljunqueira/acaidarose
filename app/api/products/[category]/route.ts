import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { createProductItem } from '@/lib/repositories/productsRepository'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const user = await getAuthUser(request)
  if (!hasRole(user, ['SUPER_ADMIN', 'TENANT_ADMIN'])) {
    return errorResponse('Sem permissão', 403)
  }

  const { category } = await params
  if (!['containers', 'bases', 'toppings'].includes(category)) {
    return errorResponse('Categoria inválida', 400)
  }

  try {
    const body = await request.json()
    const item = await createProductItem(category as any, {
      ...body,
      tenantId: user?.tenantId || body.tenantId,
    })
    return jsonResponse(item, 201)
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao criar item', 500)
  }
}
