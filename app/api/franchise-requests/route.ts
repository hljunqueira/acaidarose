import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { setStoreProductPrice } from '@/lib/repositories/productsRepository'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await query(
      `SELECT id, tenant_id, request_type, title, description, status, requested_changes_json, response_notes,
              created_at, updated_at
       FROM franchise_requests
       ORDER BY created_at DESC`
    )

    const requests = (res.rows || []).map((r: any) => {
      const rawData = r.requested_changes_json
      const data = typeof rawData === 'string' ? JSON.parse(rawData || '{}') : (rawData || {})
      const isApplication = r.request_type === 'FRANCHISE_APPLICATION' || data.type === 'FRANCHISE_APPLICATION'

      if (isApplication) {
        return {
          id: r.id,
          tenantId: r.tenant_id,
          type: 'FRANCHISE_APPLICATION',
          candidateName: data.nome || data.name || r.title || 'Candidato',
          email: data.email || '',
          phone: data.telefone || data.phone || '',
          city: data.cidade || data.city || '',
          district: data.distrito || data.district || 'Aveiro',
          investment: data.investimento || data.investment || '20.000€',
          reason: r.description || data.motivo || data.reason || 'Interesse em franquia Açaí da Rose',
          preferredContact: data.preferenciaContato || { whatsapp: true, telefone: false, email: false },
          status: r.status || 'PENDING',
          responseNotes: r.response_notes,
          createdAt: r.created_at,
        }
      }

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
        responseNotes: r.response_notes,
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
    const isApplication = body.type === 'FRANCHISE_APPLICATION' || body.investimento || body.distrito

    const tenantId = isApplication
      ? '11111111-1111-1111-1111-111111111111' // Franqueadora Master Matriz
      : body.tenantId || '22222222-2222-2222-2222-222222222222'

    const requestType = isApplication ? 'FRANCHISE_APPLICATION' : (body.type || 'PRICE_CHANGE')
    const title = isApplication ? `Candidatura: ${body.nome || body.name || 'Novo Interessado'}` : (body.productName || 'Alteração de Preço')
    const description = isApplication ? (body.motivo || body.reason || `Interesse em ${body.distrito || 'Portugal'}`) : (body.reason || 'Ajuste de preço solicitado pela filial')

    const res = await query(
      `INSERT INTO franchise_requests (id, tenant_id, request_type, title, description, status, requested_changes_json, created_at)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, now())
       RETURNING *`,
      [
        id,
        tenantId,
        requestType,
        title,
        description,
        JSON.stringify(body),
      ]
    )

    const response = NextResponse.json({ success: true, request: res.rows[0] }, { status: 201 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  } catch (err: any) {
    console.error('Erro ao registrar franchise_request:', err)
    const response = NextResponse.json(
      { error: err.message || 'Erro ao criar solicitação' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, action, status, responseNotes } = body

    let newStatus = status
    if (!newStatus) {
      if (action === 'APPROVE') newStatus = 'APPROVED'
      else if (action === 'REJECT') newStatus = 'REJECTED'
      else if (action === 'CONTACTED') newStatus = 'CONTACTED'
      else newStatus = 'PENDING'
    }

    const res = await query(
      `UPDATE franchise_requests 
       SET status = $1, response_notes = COALESCE($2, response_notes), resolved_at = timezone('utc'::text, now())
       WHERE id::text = $3
       RETURNING *`,
      [newStatus, responseNotes || null, id]
    )

    if (action === 'APPROVE' && res.rows?.[0]) {
      const r = res.rows[0]
      const rawData = r.requested_changes_json
      const data = typeof rawData === 'string' ? JSON.parse(rawData || '{}') : (rawData || {})
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    await query(
      `DELETE FROM franchise_requests WHERE id::text = $1`,
      [id]
    )

    const response = NextResponse.json({ success: true })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (err: any) {
    const response = NextResponse.json(
      { error: err.message || 'Erro ao excluir solicitação' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}


