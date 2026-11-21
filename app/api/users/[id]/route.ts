import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { updateUser, deleteUser, getUserById } from '@/lib/repositories/usersRepository'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN', 'TENANT_ADMIN'])) {
    return errorResponse('Sem permissão', 403)
  }

  const { id } = await params
  try {
    const targetUser = await getUserById(id)
    if (!targetUser) return errorResponse('Utilizador não encontrado', 404)

    const isTargetSuperAdmin =
      targetUser.role === 'SUPER_ADMIN' ||
      targetUser.email?.toLowerCase().trim() === 'henriquelinharesjunqueira@gmail.com'

    const body = await request.json()

    // Regra estrita: O Super Admin não pode ser editado (apenas alterar a própria palavra-passe)
    if (isTargetSuperAdmin) {
      const isHenrique = user?.email?.toLowerCase().trim() === 'henriquelinharesjunqueira@gmail.com'
      const isSelf = user?.id === id

      if ((isHenrique || isSelf) && body.password && !body.name && !body.role && !body.tenantId && !body.email) {
        const updated = await updateUser(id, { password: body.password })
        return jsonResponse(updated)
      }

      return errorResponse('O Super Admin não pode ser editado.', 403)
    }

    // Regra de alteração de palavra-passe para demais utilizadores:
    if (body.password) {
      const isHenrique = user?.email?.toLowerCase().trim() === 'henriquelinharesjunqueira@gmail.com'
      const isSuperAdmin = user?.role === 'SUPER_ADMIN'
      const isFranchisorAdmin = user?.role === 'FRANCHISOR_ADMIN'
      const isSelf = user?.id === id

      if (!isHenrique && !isSuperAdmin && !isFranchisorAdmin && !isSelf) {
        return errorResponse('Sem permissão para alterar a palavra-passe deste utilizador.', 403)
      }
    }

    // Franchisor Admin não pode promover ninguém a SUPER_ADMIN
    if (user?.role === 'FRANCHISOR_ADMIN' && body.role === 'SUPER_ADMIN') {
      return errorResponse('O Administrador da Franqueadora não pode promover utilizadores a Super Admin.', 403)
    }

    const updated = await updateUser(id, body)
    if (!updated) return errorResponse('Utilizador não encontrado', 404)
    return jsonResponse(updated)
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao atualizar utilizador', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN', 'TENANT_ADMIN'])) {
    return errorResponse('Sem permissão', 403)
  }

  const { id } = await params
  if (user?.id === id) return errorResponse('Não podes remover o teu próprio utilizador', 400)
  
  const targetUser = await getUserById(id)
  if (!targetUser) return errorResponse('Utilizador não encontrado', 404)

  // Proteção absoluta: O Super Admin não pode ser excluído
  if (
    targetUser.role === 'SUPER_ADMIN' ||
    targetUser.email?.toLowerCase().trim() === 'henriquelinharesjunqueira@gmail.com'
  ) {
    return errorResponse('O Super Admin não pode ser excluído.', 403)
  }

  await deleteUser(id)
  return jsonResponse({ ok: true })
}
