import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/repositories/ordersRepository'
import { getAuthUser } from '@/lib/api/authGuard'
import { getMockStore } from '@/lib/supabase/mockStore'
import { Order } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId')
    const store = getMockStore()
    const orders = store.orders.filter(
      (o: Order) => !tenantId || o.tenantId === tenantId
    )
    return NextResponse.json({ orders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao procurar pedidos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const user = await getAuthUser(request)

    const payload = {
      ...body,
      cashierId: user?.id || null,
      cashierName: user?.name || 'Caixa Balcão',
    }

    const order = await createOrder(payload)
    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao registar pedido' }, { status: 500 })
  }
}
