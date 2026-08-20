import { NextRequest, NextResponse } from 'next/server'
import { transferTableItems } from '@/lib/repositories/tablesRepository'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fromTableId, toTableId } = body

    if (!fromTableId || !toTableId) {
      return NextResponse.json({ error: 'Mesa de origem e de destino são obrigatórias' }, { status: 400 })
    }

    const success = await transferTableItems(fromTableId, toTableId)
    if (!success) {
      return NextResponse.json({ error: 'Falha ao transferir itens entre mesas' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Itens transferidos com sucesso!' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao transferir itens' }, { status: 500 })
  }
}
