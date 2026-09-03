import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser } from '@/lib/api/authGuard'
import { canManageMasterCatalog } from '@/lib/utils/permissions'
import { updateOptionModel, deleteOptionModel } from '@/lib/repositories/optionModelsRepository'
import { AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!canManageMasterCatalog(user, user?.tenantId)) {
    return errorResponse('Apenas a Franqueadora pode alterar modelos de opções.', 403)
  }

  const { id } = await params
  try {
    const body = await request.json()
    const tenantId = body.tenantId || user?.tenantId || AVEIRO_HQ_ID
    const updated = await updateOptionModel(id, tenantId, body, {
      id: user?.id,
      name: user?.name,
      role: user?.role,
    })
    if (!updated) return errorResponse('Modelo de opção não encontrado', 404)
    return jsonResponse(updated)
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao atualizar modelo de opção', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!canManageMasterCatalog(user, user?.tenantId)) {
    return errorResponse('Apenas a Franqueadora pode excluir modelos de opções.', 403)
  }

  const { id } = await params
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || user?.tenantId || AVEIRO_HQ_ID
    await deleteOptionModel(id, tenantId, {
      id: user?.id,
      name: user?.name,
      role: user?.role,
    })
    return jsonResponse({ ok: true })
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao excluir modelo de opção', 500)
  }
}
