import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { updateUser, deleteUser } from '@/lib/repositories/usersRepository'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!hasRole(user, ['SUPER_ADMIN', 'TENANT_ADMIN'])) {
    return errorResponse('Sem permissão', 403)
  }

  const { id } = await params
  try {
    const body = await request.json()
    const updated = await updateUser(id, body)
    if (!updated) return errorResponse('Usuário não encontrado', 404)
    return jsonResponse(updated)
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao atualizar usuário', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!hasRole(user, ['SUPER_ADMIN', 'TENANT_ADMIN'])) {
    return errorResponse('Sem permissão', 403)
  }

  const { id } = await params
  if (user?.id === id) return errorResponse('Não podes remover o teu próprio utilizador', 400)
  
  await deleteUser(id)
  return jsonResponse({ ok: true })
}
