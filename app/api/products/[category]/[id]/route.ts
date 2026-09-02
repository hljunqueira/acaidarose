import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { updateProductItem, deleteProductItem } from '@/lib/repositories/productsRepository'

import { canManageMasterCatalog } from '@/lib/utils/permissions'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; id: string }> }
) {
  const user = await getAuthUser(request)
  if (!canManageMasterCatalog(user, user?.tenantId)) {
    return errorResponse('Apenas a Franqueadora e a Loja Matriz Aveiro podem alterar dados do cardápio mestre. Para alterações, utilize a Solicitação à Franqueadora.', 403)
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
  if (!canManageMasterCatalog(user, user?.tenantId)) {
    return errorResponse('Apenas a Franqueadora e a Loja Matriz Aveiro podem excluir itens do cardápio mestre.', 403)
  }

  const { category, id } = await params
  await deleteProductItem(category as any, id)
  return jsonResponse({ ok: true })
}
