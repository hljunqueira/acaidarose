import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { setStoreProductPrice } from '@/lib/repositories/productsRepository'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await query(
      `SELECT id, tenant_id, request_type, title, description, status, requested_changes_json,
              created_at, updated_at
       FROM franchise_requests
       ORDER BY created_at DESC`
    )

    const requests = (res.rows || []).map((r: any) => {
      const data = r.requested_changes_json || {}
      return {
        id: r.id,
        tenantId: r.tenant_id,
        storeName: data.storeName || (r.tenant_id === '11111111-1111-1111-1111-111111111111' ? 'Matriz Aveiro' : 'Filial Torres Novas'),
        managerName: data.managerName || 'Gerente',
        type: r.request_type || 'PRICE_CHANGE',
        productId: data.productId || 'cnt-500',
        productName: data.productName || r.title || 'Açaí 500g',
        productImage: data.productImage || '/images/official/acai_copo_500g.jpg',
        category: data.category || 'Copos',
        currentPrice: Number(data.currentPrice) || 12.90,
        suggestedPrice: Number(data.suggestedPrice) || 13.50,
        reason: r.description || data.reason || 'Solicitação de cardápio',
        status: r.status || 'PENDING',
        createdAt: r.created_at,
      }
    })

    return NextResponse.json({ requests })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao carregar solicitações' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = uuidv4()
    const tenantId = body.tenantId || '22222222-2222-2222-2222-222222222222'

    const res = await query(
      `INSERT INTO franchise_requests (id, tenant_id, request_type, title, description, status, requested_changes_json)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)
       RETURNING *`,
      [
        id,
        tenantId,
        body.type || 'PRICE_CHANGE',
        body.productName || 'Alteração de Preço',
        body.reason || 'Ajuste de preço solicitado pela filial',
        JSON.stringify(body),
      ]
    )

    return NextResponse.json({ success: true, request: res.rows[0] })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao criar solicitação' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, action, responseNotes } = body

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'

    const res = await query(
      `UPDATE franchise_requests 
       SET status = $1, response_notes = $2, resolved_at = timezone('utc'::text, now())
       WHERE id::text = $3
       RETURNING *`,
      [newStatus, responseNotes || null, id]
    )

    if (action === 'APPROVE' && res.rows?.[0]) {
      const r = res.rows[0]
      const data = r.requested_changes_json || {}
      if (r.tenant_id && data.productId && data.suggestedPrice) {
        await setStoreProductPrice(r.tenant_id, data.productId, data.suggestedPrice)
      }
    }

    return NextResponse.json({ success: true, request: res.rows?.[0] })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
