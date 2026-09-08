import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'
import { getAuthUser, getAuthorizedTenantId } from '@/lib/api/authGuard'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const rawTenant =
      req.nextUrl.searchParams.get('loja') ||
      req.nextUrl.searchParams.get('tenantId') ||
      req.nextUrl.searchParams.get('tenant')

    const startDate = req.nextUrl.searchParams.get('startDate')
    const endDate = req.nextUrl.searchParams.get('endDate')
    const scoreFilter = req.nextUrl.searchParams.get('score')
    const langFilter = req.nextUrl.searchParams.get('language')
    const withComment = req.nextUrl.searchParams.get('withComment') === 'true'

    const user = await getAuthUser(req)

    let requestedTenantId: string | null = null
    if (rawTenant && rawTenant !== 'all' && rawTenant !== 'ALL') {
      const t = await getTenantByIdOrSlug(rawTenant)
      if (t) requestedTenantId = t.id
      else requestedTenantId = rawTenant
    }

    // Blindagem Multi-Tenant: Franqueadora vê tudo ou loja; Franquia vê estritamente a sua
    let targetTenantId: string | null = null
    if (user) {
      targetTenantId = getAuthorizedTenantId(user, requestedTenantId)
    } else {
      targetTenantId = requestedTenantId
    }

    const whereConditions: string[] = []
    const params: any[] = []
    let pIdx = 1

    if (targetTenantId) {
      whereConditions.push(`tenant_id = $${pIdx++}`)
      params.push(targetTenantId)
    }

    if (startDate) {
      whereConditions.push(`created_at >= $${pIdx++}::timestamp`)
      params.push(startDate)
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${pIdx++}::timestamp`)
      params.push(endDate)
    }

    if (scoreFilter) {
      whereConditions.push(`score = $${pIdx++}`)
      params.push(parseInt(scoreFilter, 10))
    }

    if (langFilter) {
      whereConditions.push(`language = $${pIdx++}`)
      params.push(langFilter)
    }

    if (withComment) {
      whereConditions.push(`comment IS NOT NULL AND TRIM(comment) != ''`)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // 1. Consulta das avaliações detalhadas
    const listQuery = `
      SELECT id, tenant_id, order_id, score, comment, customer_name, customer_phone, table_number, criteria_scores, language, created_at
      FROM customer_ratings
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 100
    `
    const listRes = await query(listQuery, params)
    const reviews = listRes.rows || []

    // 2. Consulta agregada de NPS e métricas
    const aggQuery = `
      SELECT 
        COUNT(*) AS total_count,
        COALESCE(AVG(score), 0) AS avg_score,
        COUNT(*) FILTER (WHERE score = 5) AS promoters,
        COUNT(*) FILTER (WHERE score = 4) AS passives,
        COUNT(*) FILTER (WHERE score <= 3) AS detractors
      FROM customer_ratings
      ${whereClause}
    `
    const aggRes = await query(aggQuery, params)
    const aggRow = aggRes.rows[0] || {}

    const totalCount = Number(aggRow.total_count) || 0
    const averageScore = totalCount > 0 ? Number(Number(aggRow.avg_score || 0).toFixed(1)) : 0
    const promoters = Number(aggRow.promoters) || 0
    const passives = Number(aggRow.passives) || 0
    const detractors = Number(aggRow.detractors) || 0

    let npsScore = 0
    let promotersPercent = 0
    let passivesPercent = 0
    let detractorsPercent = 0

    if (totalCount > 0) {
      promotersPercent = Math.round((promoters / totalCount) * 100)
      passivesPercent = Math.round((passives / totalCount) * 100)
      detractorsPercent = Math.round((detractors / totalCount) * 100)
      npsScore = promotersPercent - detractorsPercent
    }

    // 3. Médias individuais por critério (a partir de criteria_scores JSONB)
    const criteriaTotals: Record<string, { sum: number; count: number }> = {}
    for (const r of reviews) {
      const cs = r.criteria_scores
      if (cs && typeof cs === 'object') {
        for (const [key, val] of Object.entries(cs)) {
          const numVal = Number(val)
          if (!isNaN(numVal) && numVal > 0) {
            if (!criteriaTotals[key]) criteriaTotals[key] = { sum: 0, count: 0 }
            criteriaTotals[key].sum += numVal
            criteriaTotals[key].count += 1
          }
        }
      }
    }

    const criteriaAverages: Record<string, number> = {}
    for (const [key, item] of Object.entries(criteriaTotals)) {
      criteriaAverages[key] = Number((item.sum / item.count).toFixed(1))
    }

    const summaryData = {
      totalReviews: totalCount,
      totalCount,
      averageScore,
      npsScore,
      promotersPercent,
      passivesPercent,
      detractorsPercent,
      npsBreakdown: { promoters, passives, detractors },
      criteriaAverages,
    }

    const ratingsList = reviews.map((r: any) => ({
      id: r.id,
      tenantId: r.tenant_id,
      orderId: r.order_id,
      score: r.score,
      comment: r.comment || '',
      customerName: r.customer_name || 'Cliente Anónimo',
      customerPhone: r.customer_phone || null,
      tableNumber: r.table_number || null,
      criteriaScores: r.criteria_scores || {},
      language: r.language || 'pt',
      createdAt: r.created_at,
    }))

    return NextResponse.json({
      success: true,
      summary: summaryData,
      metrics: summaryData,
      ratings: ratingsList,
      reviews: ratingsList,
    })
  } catch (err: any) {
    console.error('Erro em GET /api/ratings:', err)
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

    const score = Math.max(1, Math.min(5, Number(body.score || body.stars) || 5))
    const comment = String(body.comment || '').trim()
    const customerName = String(body.customerName || 'Cliente Anónimo').trim()
    const customerPhone = body.customerPhone ? String(body.customerPhone).trim() : null
    const tableNumber = body.tableNumber ? String(body.tableNumber).trim() : null
    const orderId = body.orderId || null
    const language = body.language || 'pt'
    const criteriaScoresJson = JSON.stringify(body.criteriaScores || {})

    await query(
      `INSERT INTO customer_ratings (
        id, tenant_id, order_id, score, comment,
        customer_name, customer_phone, table_number,
        criteria_scores, language, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9::jsonb, $10, timezone('utc'::text, now())
      )`,
      [
        id,
        tenantId,
        orderId,
        score,
        comment,
        customerName,
        customerPhone,
        tableNumber,
        criteriaScoresJson,
        language,
      ]
    )

    return NextResponse.json({
      success: true,
      review: {
        id,
        tenantId,
        orderId,
        score,
        comment,
        customerName,
        customerPhone,
        tableNumber,
        criteriaScores: body.criteriaScores || {},
        language,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    console.error('Erro em POST /api/ratings:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao registar avaliação' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    const clearLoja = req.nextUrl.searchParams.get('clearLoja')

    if (id) {
      await query(`DELETE FROM customer_ratings WHERE id = $1`, [id])
      return NextResponse.json({ success: true, message: 'Avaliação eliminada com sucesso' })
    }

    if (clearLoja) {
      if (clearLoja === 'all' || clearLoja === 'ALL') {
        await query(`DELETE FROM customer_ratings`)
      } else {
        const t = await getTenantByIdOrSlug(clearLoja)
        const targetId = t ? t.id : clearLoja
        await query(`DELETE FROM customer_ratings WHERE tenant_id = $1`, [targetId])
      }
      return NextResponse.json({ success: true, message: 'Avaliações zeradas com sucesso' })
    }

    return NextResponse.json({ error: 'Parâmetro id ou clearLoja é obrigatório' }, { status: 400 })
  } catch (err: any) {
    console.error('Erro em DELETE /api/ratings:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao eliminar avaliação' },
      { status: 500 }
    )
  }
}
