import { NextRequest, NextResponse } from 'next/server'
import { adjustStoreStock } from '@/lib/repositories/inventoryRepository'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantId, itemId, newQuantity, difference, reason, operatorId } = body

    if (!tenantId || !itemId || newQuantity === undefined) {
      return NextResponse.json({ error: 'tenantId, itemId e newQuantity são obrigatórios' }, { status: 400 })
    }

    const success = await adjustStoreStock({
      tenantId,
      itemId,
      newQuantity: Number(newQuantity),
      difference: Number(difference) || 0,
      reason: reason || 'AJUSTE_MANUAL',
      operatorId,
    })

    if (!success) {
      return NextResponse.json({ error: 'Falha ao registrar ajuste de estoque' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erro na rota POST /api/inventory/adjust:', err)
    return NextResponse.json({ error: err.message || 'Erro ao ajustar estoque' }, { status: 500 })
  }
}
