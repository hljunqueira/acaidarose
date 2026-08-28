import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const rawTenant =
      req.nextUrl.searchParams.get('loja') ||
      req.nextUrl.searchParams.get('tenantId') ||
      req.nextUrl.searchParams.get('tenant')

    let tenantId: string | null = null
    if (rawTenant) {
      const t = await getTenantByIdOrSlug(rawTenant)
      if (t) tenantId = t.id
    }

    const res = await query(
      `SELECT id, tenant_id, stars, comment, customer_name, created_at 
       FROM order_ratings 
       WHERE (tenant_id::text = $1 OR $1 IS NULL) 
       ORDER BY created_at DESC LIMIT 50`,
      [tenantId]
    )

    const reviews = res.rows || []
    return NextResponse.json({ success: true, reviews })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao carregar avaliações' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = uuidv4()

    let tenantId = body.tenantId || '11111111-1111-1111-1111-111111111111'
    if (body.loja) {
      const t = await getTenantByIdOrSlug(body.loja)
      if (t) tenantId = t.id
    }

    const stars = Math.max(1, Math.min(5, Number(body.stars) || 5))
    const comment = String(body.comment || '').trim()
    const customerName = String(body.customerName || 'Cliente Anónimo').trim()

    await query(
      `INSERT INTO order_ratings (id, tenant_id, stars, comment, customer_name)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, tenantId, stars, comment, customerName]
    )

    return NextResponse.json({
      success: true,
      review: { id, tenantId, stars, comment, customerName, createdAt: new Date().toISOString() },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao registar avaliação' },
      { status: 500 }
    )
  }
}
