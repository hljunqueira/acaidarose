import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { getTenantById, updateTenant } from '@/lib/repositories/tenantsRepository'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tenant = await getTenantById(id)
  if (!tenant) return errorResponse('Loja não encontrada', 404)
  return jsonResponse({ tenant })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  const { id } = await params

  if (!user) return errorResponse('Não autenticado', 401)
  if (user.role !== 'SUPER_ADMIN' && user.tenantId !== id) {
    return errorResponse('Sem permissão para alterar esta loja', 403)
  }

  try {
    const body = await request.json()
    const updated = await updateTenant(id, body)
    if (!updated) return errorResponse('Loja não encontrada', 404)
    return jsonResponse(updated)
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao atualizar loja', 500)
  }
}
