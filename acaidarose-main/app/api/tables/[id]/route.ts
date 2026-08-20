import { NextRequest, NextResponse } from 'next/server'
import { updateTable, deleteTable, closeTable, openTableWithItems } from '@/lib/repositories/tablesRepository'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    // Fechar mesa (liberar)
    if (body.action === 'CLOSE') {
      const closed = await closeTable(id)
      return NextResponse.json(closed)
    }

    // Abrir mesa com itens
    if (body.action === 'OPEN_WITH_ITEMS') {
      const opened = await openTableWithItems(id, body.items || [], body.assignedStaffId, body.assignedStaffName)
      return NextResponse.json(opened)
    }

    const updated = await updateTable(id, body)
    if (!updated) {
      return NextResponse.json({ error: 'Mesa não encontrada' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao atualizar mesa' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ok = await deleteTable(id)
    if (!ok) {
      return NextResponse.json({ error: 'Mesa não encontrada' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao excluir mesa' }, { status: 500 })
  }
}
