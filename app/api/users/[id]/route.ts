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
    const body = await request.json()
    // Regra estrita de alteração de palavra-passe:
    // Henrique pode alterar e definir de qualquer utilizador;
    // SUPER_ADMIN pode alterar de lojas franqueadas e da sua conta;
    // Os restantes não têm essa função.
    if (body.password) {
      const isHenrique = user?.email?.toLowerCase().trim() === 'henriquelinharesjunqueira@gmail.com'
      const isSuperAdmin = user?.role === 'SUPER_ADMIN'

      if (!isHenrique && !isSuperAdmin) {
        return errorResponse('Apenas o Super Admin tem permissão para alterar a palavra-passe de utilizadores.', 403)
      }

      if (!isHenrique) {
        const targetUser = await getUserById(id)
        if (targetUser?.email?.toLowerCase().trim() === 'henriquelinharesjunqueira@gmail.com') {
          return errorResponse('Apenas o próprio Henrique pode alterar suas credenciais.', 403)
        }
      }
    }

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
