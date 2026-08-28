import { NextRequest, NextResponse } from 'next/server'
import { saveShiftChecklist } from '@/lib/repositories/inventoryRepository'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantId, counts, operatorId } = body

    if (!tenantId || !Array.isArray(counts)) {
      return NextResponse.json({ error: 'tenantId e counts são obrigatórios' }, { status: 400 })
    }

    const success = await saveShiftChecklist({
      tenantId,
      counts,
      operatorId,
    })

    if (!success) {
      return NextResponse.json({ error: 'Falha ao registrar checklist de turno' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erro na rota POST /api/inventory/checklist:', err)
    return NextResponse.json({ error: err.message || 'Erro ao registrar checklist' }, { status: 500 })
  }
}
