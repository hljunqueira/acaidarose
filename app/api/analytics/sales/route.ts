import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'
import { getAuthUser } from '@/lib/api/authGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const rawTenant =
      req.nextUrl.searchParams.get('loja') ||
      req.nextUrl.searchParams.get('tenantId') ||
      req.nextUrl.searchParams.get('tenant')

    let targetTenantId: string | null = null
    if (rawTenant && rawTenant !== 'all' && rawTenant !== 'ALL') {
      const t = await getTenantByIdOrSlug(rawTenant)
      targetTenantId = t ? t.id : rawTenant
    }

    const periodo = (req.nextUrl.searchParams.get('periodo') || 'yesterday').toLowerCase()
    const startDateParam = req.nextUrl.searchParams.get('startDate')
    const endDateParam = req.nextUrl.searchParams.get('endDate')

    // 1. Construir cláusulas de período no fuso de Portugal ('Europe/Lisbon')
    let dateFilterSql = ''
    const params: any[] = []

    if (targetTenantId) {
      params.push(targetTenantId)
      dateFilterSql += ` AND o.tenant_id::text = $${params.length}`
    }

    let dateFormatted = ''
    const now = new Date()

    if (periodo === 'today') {
      dateFilterSql += ` AND (o.created_at AT TIME ZONE 'Europe/Lisbon')::date = (now() AT TIME ZONE 'Europe/Lisbon')::date`
      dateFormatted = now.toLocaleDateString('pt-PT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } else if (periodo === 'yesterday') {
      dateFilterSql += ` AND (o.created_at AT TIME ZONE 'Europe/Lisbon')::date = ((now() AT TIME ZONE 'Europe/Lisbon')::date - INTERVAL '1 day')`
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      dateFormatted = yesterday.toLocaleDateString('pt-PT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } else if (periodo === 'month') {
      dateFilterSql += ` AND date_trunc('month', o.created_at AT TIME ZONE 'Europe/Lisbon') = date_trunc('month', now() AT TIME ZONE 'Europe/Lisbon')`
      dateFormatted = now.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
    } else if (periodo === 'custom' && startDateParam && endDateParam) {
      params.push(startDateParam)
      const p1 = params.length
      params.push(endDateParam)
      const p2 = params.length
      dateFilterSql += ` AND (o.created_at AT TIME ZONE 'Europe/Lisbon')::date BETWEEN $${p1}::date AND $${p2}::date`
      dateFormatted = `${startDateParam} até ${endDateParam}`
    } else {
      // Default: todos ou yesterday
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      dateFormatted = yesterday.toLocaleDateString('pt-PT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    // Capitalizar primeira letra da data
    if (dateFormatted) {
      dateFormatted = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1)
    }

    // 2. Buscar pedidos ativos (ignora cancelados)
    const sql = `
      SELECT 
        o.id,
        o.tenant_id,
        o.total,
        o.subtotal,
        o.items_json,
        o.created_at,
        EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'Europe/Lisbon')::int AS order_hour
      FROM orders o
      WHERE o.status != 'CANCELLED'
        ${dateFilterSql}
      ORDER BY o.created_at ASC
    `

    const ordersRes = await query(sql, params)
    const orders = ordersRes.rows || []

    // 3. Métricas Gerais
    let totalRevenue = 0
    const orderVolume = orders.length

    // 4. Inicializar 24 horas (00:00 às 23:00)
    const hourlyData: { hour: string; label: string; revenue: number; volume: number }[] = []
    for (let h = 0; h < 24; h++) {
      const hStr = String(h).padStart(2, '0') + ':00'
      hourlyData.push({
        hour: hStr,
        label: hStr,
        revenue: 0,
        volume: 0,
      })
    }

    // 5. Agregações de Produtos e Acompanhamentos (Opcionais)
    const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {}
    const toppingStats: Record<string, { name: string; quantity: number; revenue: number }> = {}

    for (const ord of orders) {
      const ordTotal = Number(ord.total) || 0
      totalRevenue += ordTotal

      const hr = Number(ord.order_hour)
      if (hr >= 0 && hr < 24) {
        hourlyData[hr].revenue += ordTotal
        hourlyData[hr].volume += 1
      }

      // Parse dos itens do pedido
      let items: any[] = []
      try {
        items = typeof ord.items_json === 'string' ? JSON.parse(ord.items_json) : ord.items_json || []
      } catch {}

      if (Array.isArray(items)) {
        for (const it of items) {
          const prodName = String(
            it.containerName ||
            it.container?.name ||
            it.productName ||
            it.name ||
            (it.isBagItem ? 'Saco de Transporte' : 'Item Diverso')
          ).trim()

          const qty = Math.max(1, Number(it.quantity) || 1)
          const lineTot = Number(it.lineTotal) || Number(it.unitPrice) * qty || 0

          if (!productStats[prodName]) {
            productStats[prodName] = { name: prodName, quantity: 0, revenue: 0 }
          }
          productStats[prodName].quantity += qty
          productStats[prodName].revenue += lineTot

          // Acompanhamentos / Opcionais
          const rawToppings = Array.isArray(it.toppings)
            ? it.toppings
            : Array.isArray(it.selectedOptions)
            ? it.selectedOptions
            : Array.isArray(it.options)
            ? it.options
            : []

          for (const top of rawToppings) {
            const topName = String(top.name || top.toppingName || top.title || '').trim()
            if (!topName) continue

            const topPrice = Number(top.price || top.precoCobrado || 0) * qty

            if (!toppingStats[topName]) {
              toppingStats[topName] = { name: topName, quantity: 0, revenue: 0 }
            }
            toppingStats[topName].quantity += qty
            toppingStats[topName].revenue += topPrice
          }
        }
      }
    }

    const averageTicket = orderVolume > 0 ? +(totalRevenue / orderVolume).toFixed(2) : 0
    totalRevenue = +totalRevenue.toFixed(2)

    // Formatar arrays ordenados
    const allProducts = Object.values(productStats)
    const topProducts = [...allProducts].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    const worstProducts = [...allProducts].sort((a, b) => a.quantity - b.quantity || a.revenue - b.revenue)

    const allToppings = Object.values(toppingStats)
    const topToppings = [...allToppings].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    const worstToppings = [...allToppings].sort((a, b) => a.quantity - b.quantity || a.revenue - b.revenue)

    // 6. Resumo das Avaliações de Clientes para o card da Visão Geral
    let ratingSql = `SELECT score FROM customer_ratings WHERE 1=1`
    const ratingParams: any[] = []
    if (targetTenantId) {
      ratingParams.push(targetTenantId)
      ratingSql += ` AND tenant_id::text = $1`
    }
    const ratingsRes = await query(ratingSql, ratingParams)
    const ratings = ratingsRes.rows || []
    const totalReviews = ratings.length

    let averageScore = 0
    let npsScore = 0
    if (totalReviews > 0) {
      const sumScore = ratings.reduce((acc: number, r: any) => acc + (Number(r.score) || 0), 0)
      averageScore = +(sumScore / totalReviews).toFixed(1)

      const promoters = ratings.filter((r: any) => Number(r.score) >= 5).length
      const detractors = ratings.filter((r: any) => Number(r.score) <= 3).length
      npsScore = Math.round(((promoters - detractors) / totalReviews) * 100)
    }

    return NextResponse.json({
      success: true,
      period: periodo,
      dateFormatted,
      metrics: {
        revenue: totalRevenue,
        averageTicket,
        orderVolume,
      },
      hourlyData,
      products: {
        mostSold: topProducts,
        leastSold: worstProducts,
        totalItems: allProducts.length,
      },
      toppings: {
        mostSold: topToppings,
        leastSold: worstToppings,
        totalItems: allToppings.length,
      },
      customerRatingSummary: {
        totalReviews,
        averageScore,
        npsScore,
      },
    })
  } catch (err: any) {
    console.error('Erro em GET /api/analytics/sales:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao carregar dados analíticos de vendas' },
      { status: 500 }
    )
  }
}
