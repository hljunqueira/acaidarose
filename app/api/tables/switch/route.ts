import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rawTenant, tenantId: rawTenantId, oldTableNumber, newTableNumber } = body

    if (!newTableNumber) {
      return NextResponse.json({ error: 'Nova mesa é obrigatória' }, { status: 400 })
    }

    // Normalizar tenant
    const t = await getTenantByIdOrSlug(rawTenantId || rawTenant || '1')
    const tenantId = t ? t.id : '11111111-1111-1111-1111-111111111111'

    const oldNum = oldTableNumber ? parseInt(String(oldTableNumber).replace(/\D/g, ''), 10) : null
    const newNum = parseInt(String(newTableNumber).replace(/\D/g, ''), 10)

    if (isNaN(newNum)) {
      return NextResponse.json({ error: 'Número de mesa inválido' }, { status: 400 })
    }

    // 1. Se houver pedidos em andamento na mesa antiga para este tenant, atualiza a mesa em orders
    let updatedOrdersCount = 0
    if (oldNum) {
      const orderRes = await query(
        `UPDATE orders 
         SET table_number = $1,
             updated_at = timezone('utc'::text, now())
         WHERE tenant_id::text = $2 
           AND table_number = $3 
           AND status IN ('NEW', 'OPEN', 'WAITING_PAYMENT', 'PREPARING', 'READY')
         RETURNING id`,
        [newNum, tenantId, oldNum]
      )
      updatedOrdersCount = orderRes.rowCount || 0
    }

    // 2. Se houver registro da mesa antiga na tabela tables, transferir ocupação e liberar a mesa antiga
    if (oldNum && oldNum !== newNum) {
      const oldTableRes = await query(
        `SELECT id, total_amount, items_json, current_order_id, activated_at 
         FROM tables 
         WHERE tenant_id::text = $1 AND table_number = $2 AND deleted_at IS NULL LIMIT 1`,
        [tenantId, oldNum]
      )

      if (oldTableRes.rows?.[0]) {
        const oldT = oldTableRes.rows[0]

        // Atualizar nova mesa com o consumo acumulado
        await query(
          `UPDATE tables 
           SET status = 'OCCUPIED',
               total_amount = $1,
               items_json = $2,
               current_order_id = $3,
               activated_at = COALESCE(activated_at, $4),
               updated_at = now()
           WHERE tenant_id::text = $5 AND table_number = $6 AND deleted_at IS NULL`,
          [
            oldT.total_amount || 0,
            oldT.items_json || '[]',
            oldT.current_order_id || null,
            oldT.activated_at || null,
            tenantId,
            newNum,
          ]
        )

        // Liberar mesa antiga
        await query(
          `UPDATE tables 
           SET status = 'AVAILABLE',
               total_amount = 0,
               items_json = '[]',
               current_order_id = null,
               activated_at = null,
               updated_at = now()
           WHERE id = $1`,
          [oldT.id]
        )
      }
    }

    return NextResponse.json({
      success: true,
      tenantId,
      oldTableNumber: oldNum,
      newTableNumber: newNum,
      updatedOrdersCount,
    })
  } catch (err: any) {
    console.error('Erro ao migrar mesa:', err)
    return NextResponse.json({ error: err.message || 'Erro ao trocar de mesa' }, { status: 500 })
  }
}
