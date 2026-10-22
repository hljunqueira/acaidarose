import { NextRequest, NextResponse } from 'next/server'
import { updateSupplier, deleteSupplier } from '@/lib/repositories/inventoryRepository'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, nif, email, phone, category, leadTimeDays, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do fornecedor é obrigatório' }, { status: 400 })
    }

    const updated = await updateSupplier(id, {
      name,
      nif,
      email,
      phone,
      category,
      leadTimeDays: leadTimeDays !== undefined ? Number(leadTimeDays) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Fornecedor não encontrado ou falha ao atualizar' }, { status: 404 })
    }

    return NextResponse.json({ supplier: updated })
  } catch (err: any) {
    console.error('Erro na rota PUT /api/suppliers/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro ao atualizar fornecedor' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'ID do fornecedor é obrigatório' }, { status: 400 })
    }

    const ok = await deleteSupplier(id)
    if (!ok) {
      return NextResponse.json({ error: 'Falha ao desativar fornecedor' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Fornecedor desativado com sucesso' })
  } catch (err: any) {
    console.error('Erro na rota DELETE /api/suppliers/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro ao remover fornecedor' }, { status: 500 })
  }
}
