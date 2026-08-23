import { NextRequest, NextResponse } from 'next/server'
import { updateStaffMember, deleteStaffMember } from '@/lib/repositories/staffRepository'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updated = await updateStaffMember(id, body)
    if (!updated) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao atualizar colaborador' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ok = await deleteStaffMember(id)
    if (!ok) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao excluir colaborador' }, { status: 500 })
  }
}
