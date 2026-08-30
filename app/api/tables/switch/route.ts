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

    // Normalizar tenant ID canônico
    const t = await getTenantByIdOrSlug(rawTenantId || rawTenant || '1')
    const tenantId = t ? t.id : '11111111-1111-1111-1111-111111111111'

    const oldNum = oldTableNumber ? parseInt(String(oldTableNumber).replace(/\D/g, ''), 10) : null
    const newNum = parseInt(String(newTableNumber).replace(/\D/g, ''), 10)

    if (isNaN(newNum)) {
      return NextResponse.json({ error: 'Número de mesa inválido' }, { status: 400 })
    }

    let updatedOrdersCount = 0
    if (oldNum && oldNum !== newNum) {
      // 1. Atualizar pedidos em andamento da mesa antiga para a nova mesa na tabela orders
      const orderRes = await query(
        `UPDATE orders 
         SET table_number = $1
         WHERE tenant_id::text = $2 
           AND table_number = $3 
           AND status IN ('NEW', 'OPEN', 'WAITING_PAYMENT', 'PREPARING', 'READY')
         RETURNING id, order_number, table_number`,
        [newNum, tenantId, oldNum]
      )
      updatedOrdersCount = orderRes.rowCount || 0

      // 2. Se a tabela tables existir, tenta migrar o status da mesa
      try {
        const oldTableRes = await query(
          `SELECT id, total_amount, items_json, current_order_id, activated_at 
           FROM tables 
           WHERE tenant_id::text = $1 AND table_number = $2 AND deleted_at IS NULL LIMIT 1`,
          [tenantId, oldNum]
        )

        if (oldTableRes.rows?.[0]) {
          const oldT = oldTableRes.rows[0]
          await query(
            `UPDATE tables 
             SET status = 'OCCUPIED',
                 total_amount = $1,
                 items_json = $2,
                 current_order_id = $3,
                 activated_at = COALESCE(activated_at, $4)
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

          await query(
            `UPDATE tables 
             SET status = 'AVAILABLE',
                 total_amount = 0,
                 items_json = '[]',
                 current_order_id = null,
                 activated_at = null
             WHERE id = $1`,
            [oldT.id]
          )
        }
      } catch (tableErr) {
        // Tabela tables opcional
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
