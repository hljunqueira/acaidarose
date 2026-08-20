import { NextRequest, NextResponse } from 'next/server'
import { getMockStore } from '@/lib/supabase/mockStore'
import { Order } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get('q') || '').toLowerCase().trim()
    const tenantId = request.nextUrl.searchParams.get('tenantId')

    const store = getMockStore()
    const list = store.orders.filter((o: Order) => {
      if (o.deletedAt) return false
      if (tenantId && o.tenantId !== tenantId) return false
      if (!q) return true
      return (
        String(o.orderNumber).includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q))
      )
    })

    return NextResponse.json({ orders: list.slice(0, 20) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao buscar pedidos' }, { status: 500 })
  }
}
