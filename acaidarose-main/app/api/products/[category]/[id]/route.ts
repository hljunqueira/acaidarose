import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { updateProductItem, deleteProductItem } from '@/lib/repositories/productsRepository'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; id: string }> }
) {
  const user = await getAuthUser(request)
  if (!hasRole(user, ['SUPER_ADMIN', 'TENANT_ADMIN'])) {
    return errorResponse('Sem permissão', 403)
  }

  const { category, id } = await params
  try {
    const body = await request.json()
    const updated = await updateProductItem(category as any, id, body)
    if (!updated) return errorResponse('Item não encontrado', 404)
    return jsonResponse(updated)
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao atualizar item', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; id: string }> }
) {
  const user = await getAuthUser(request)
  if (!hasRole(user, ['SUPER_ADMIN', 'TENANT_ADMIN'])) {
    return errorResponse('Sem permissão', 403)
  }

  const { category, id } = await params
  await deleteProductItem(category as any, id)
  return jsonResponse({ ok: true })
}
