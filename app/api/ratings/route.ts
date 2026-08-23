import { NextRequest, NextResponse } from 'next/server'
import { getMockStore } from '@/lib/supabase/mockStore'
import { v4 as uuidv4 } from 'uuid'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId') || 'tenant-torres-novas'
    const store = getMockStore()

    const reviews = (store.reviews || []).filter((r: any) => r.tenantId === tenantId)
    return NextResponse.json({ success: true, reviews })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao carregar avaliações' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantId = 'tenant-torres-novas', stars = 5, comment = '', customerName = 'Cliente Anónimo' } = body

    const store = getMockStore()
    if (!store.reviews) {
      store.reviews = []
    }

    const newReview = {
      id: `rev-${uuidv4().slice(0, 8)}`,
      tenantId,
      stars: Math.max(1, Math.min(5, Number(stars) || 5)),
      comment: comment.trim(),
      customerName,
      createdAt: new Date().toISOString(),
    }

    store.reviews.unshift(newReview)

    // Atualizar média da loja
    const tenantReviews = store.reviews.filter((r: any) => r.tenantId === tenantId)
    const avg = tenantReviews.reduce((sum: number, r: any) => sum + r.stars, 0) / tenantReviews.length

    const tenant = store.tenants.find((t: any) => t.id === tenantId)
    if (tenant) {
      tenant.ratingAverage = +avg.toFixed(1)
      tenant.reviewsCount = tenantReviews.length
    }

    return NextResponse.json({ success: true, review: newReview, ratingAverage: +avg.toFixed(1), reviewsCount: tenantReviews.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao registar avaliação' }, { status: 500 })
  }
}
