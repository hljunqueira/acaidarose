import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { updateCategory, deleteCategory } from '@/lib/repositories/categoriesRepository'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req)
    if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN', 'TENANT_ADMIN'])) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { tenantId } = body

    const updated = await updateCategory(id, {
      ...body,
      tenantId: tenantId || user?.tenantId,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ category: updated })
  } catch (err: any) {
    console.error('Erro na rota PUT /api/categories/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro ao atualizar categoria' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req)
    if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN'])) {
      return NextResponse.json({ error: 'Apenas a Franqueadora pode excluir categorias' }, { status: 403 })
    }

    const { id } = await params
    const success = await deleteCategory(id, user?.tenantId || undefined)
    if (!success) {
      return NextResponse.json({ error: 'Falha ao excluir categoria' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erro na rota DELETE /api/categories/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro ao excluir categoria' }, { status: 500 })
  }
}
