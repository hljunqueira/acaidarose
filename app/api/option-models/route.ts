import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser } from '@/lib/api/authGuard'
import { canManageMasterCatalog } from '@/lib/utils/permissions'
import { getOptionModelsByTenant, createOptionModel } from '@/lib/repositories/optionModelsRepository'
import { AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId') || AVEIRO_HQ_ID

  try {
    const models = await getOptionModelsByTenant(tenantId)
    return jsonResponse(models)
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao carregar modelos de opções', 500)
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!canManageMasterCatalog(user, user?.tenantId)) {
    return errorResponse('Apenas a Franqueadora pode criar modelos de opções.', 403)
  }

  try {
    const body = await request.json()
    const tenantId = body.tenantId || user?.tenantId || AVEIRO_HQ_ID
    const created = await createOptionModel(tenantId, body, {
      id: user?.id,
      name: user?.name,
      role: user?.role,
    })
    return jsonResponse(created, 201)
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao criar modelo de opção', 500)
  }
}
