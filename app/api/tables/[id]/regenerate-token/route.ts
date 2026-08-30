import { NextRequest, NextResponse } from 'next/server'
import { regenerateTableToken } from '@/lib/repositories/tablesRepository'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updated = await regenerateTableToken(id)
    if (!updated) {
      return NextResponse.json({ error: 'Mesa não encontrada' }, { status: 404 })
    }
    return NextResponse.json({ success: true, table: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao regenerar token da mesa' }, { status: 500 })
  }
}
