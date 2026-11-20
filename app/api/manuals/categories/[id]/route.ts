import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/authGuard'
import { updateManualCategory, deleteManualCategory } from '@/lib/repositories/manualsRepository'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Permissão negada. Apenas o Super Admin pode alterar categorias.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const category = await updateManualCategory(id, body)

    return NextResponse.json({ category })
  } catch (err: any) {
    console.error('Erro ao atualizar categoria de manual:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Permissão negada. Apenas o Super Admin pode excluir categorias.' }, { status: 403 })
    }

    const { id } = await params
    await deleteManualCategory(id)

    return NextResponse.json({ success: true, message: 'Categoria removida com sucesso.' })
  } catch (err: any) {
    console.error('Erro ao deletar categoria de manual:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
