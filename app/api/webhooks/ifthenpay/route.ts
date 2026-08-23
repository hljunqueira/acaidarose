import { NextRequest, NextResponse } from 'next/server'
import { getMockStore } from '@/lib/supabase/mockStore'
import { Order } from '@/types'

/**
 * Webhook Oficial da Ifthenpay para confirmação em tempo real de pagamentos MB WAY
 * Docs: https://www.ifthenpay.com/docs/en/
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, amount, status, requestId } = body

    if (status === '000' && id) {
      const store = getMockStore()
      const order = store.orders.find((o: Order) => o.id === id)

      if (order) {
        order.paymentStatus = 'PAID'
        order.status = 'NEW'
        order.paymentReference = requestId || order.paymentReference || 'IFTHENPAY-MBWAY'
        order.updatedAt = new Date().toISOString()

        // Sincronizar mesa física acumulando os itens
        if (order.tableNumber && order.isTableOrder !== false) {
          const tableDigits = order.tableNumber.replace(/\D/g, '')
          const tableNum = parseInt(tableDigits)
          if (!isNaN(tableNum)) {
            const targetTable = store.tables.find(
              (t) => t.tenantId === order.tenantId && t.number === tableNum
            )
            if (targetTable) {
              const currentItems = targetTable.items || []
              const newItems = (order.items || []).map((it: any) => ({
                ...it,
                customerName: order.customerName || 'Cliente',
                orderedAt: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
                orderNumber: order.orderNumber,
                paymentStatus: 'PAID',
                paymentMethod: 'MBWAY',
              }))

              // Verifica se já não foram adicionados
              const existingIds = new Set(currentItems.map((i) => i.id))
              const itemsToAdd = newItems.filter((i: any) => !existingIds.has(i.id))

              if (itemsToAdd.length > 0) {
                targetTable.items = [...currentItems, ...itemsToAdd]
                targetTable.total = +(targetTable.items.reduce((s, i) => s + (Number(i.lineTotal) || 0), 0)).toFixed(2)
                targetTable.status = 'OCCUPIED'
                if (!targetTable.activatedAt) {
                  targetTable.activatedAt = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
                }
              }
            }
          }
        }
      }

      return NextResponse.json({ success: true, message: 'Pagamento confirmado e comanda despachada.' })
    }

    return NextResponse.json({ success: false, status }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro no webhook Ifthenpay' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Suporte a callback GET da Ifthenpay (query params)
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const status = searchParams.get('status')
  const amount = searchParams.get('amount')

  if (status === '000' && id) {
    const store = getMockStore()
    const order = store.orders.find((o: Order) => o.id === id)
    if (order) {
      order.paymentStatus = 'PAID'
      order.status = 'NEW'
      order.updatedAt = new Date().toISOString()
    }
    return new NextResponse('OK', { status: 200 })
  }

  return new NextResponse('INVALID_STATUS', { status: 400 })
}
