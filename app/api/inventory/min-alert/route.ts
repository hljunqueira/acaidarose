import { NextRequest, NextResponse } from 'next/server'
import { updateStoreMinAlert } from '@/lib/repositories/inventoryRepository'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantId, itemId, minAlert } = body

    if (!tenantId || !itemId || minAlert === undefined) {
      return NextResponse.json({ error: 'tenantId, itemId e minAlert são obrigatórios' }, { status: 400 })
    }

    const val = Number(minAlert)
    if (isNaN(val) || val < 0) {
      return NextResponse.json({ error: 'minAlert deve ser um número não negativo' }, { status: 400 })
    }

    const success = await updateStoreMinAlert(tenantId, itemId, val)
    if (!success) {
      return NextResponse.json({ error: 'Falha ao atualizar limite mínimo' }, { status: 500 })
    }

    return NextResponse.json({ success: true, minAlert: val })
  } catch (err: any) {
    console.error('Erro na rota POST /api/inventory/min-alert:', err)
    return NextResponse.json({ error: err.message || 'Erro ao atualizar limite mínimo' }, { status: 500 })
  }
}
