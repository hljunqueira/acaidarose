import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser } from '@/lib/api/authGuard'
import { canManageMasterCatalog } from '@/lib/utils/permissions'
import { reorderOptionModels } from '@/lib/repositories/optionModelsRepository'
import { AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!canManageMasterCatalog(user, user?.tenantId)) {
    return errorResponse('Apenas a Franqueadora pode alterar a ordem dos modelos de opções.', 403)
  }

  try {
    const body = await request.json()
    const { items, tenantId } = body

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse('Lista de modelos para reordenação inválida.', 400)
    }

    const effectiveTenant = tenantId || user?.tenantId || AVEIRO_HQ_ID
    const success = await reorderOptionModels(items, effectiveTenant, {
      id: user?.id,
      name: user?.name,
      role: user?.role,
    })

    if (!success) {
      return errorResponse('Erro ao reordenar modelos de opções.', 500)
    }

    return jsonResponse({ success: true, count: items.length })
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro interno ao reordenar modelos de opções.', 500)
  }
}
