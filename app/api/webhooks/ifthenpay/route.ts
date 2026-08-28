import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

/**
 * Webhook Oficial da Ifthenpay para confirmação em tempo real de pagamentos MB WAY
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, requestId } = body

    if (status === '000' && id) {
      await query(
        `UPDATE orders 
         SET payment_status = 'PAID', 
             status = 'NEW', 
             notes = COALESCE(notes, '') || ' [MBWAY Ref: ' || $2 || ']',
             updated_at = timezone('utc'::text, now())
         WHERE id::text = $1`,
        [id, requestId || 'IFTHENPAY-CONFIRMED']
      )

      return NextResponse.json({ success: true, message: 'Pagamento confirmado e comanda despachada.' })
    }

    return NextResponse.json({ success: false, status }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro no webhook Ifthenpay' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const status = searchParams.get('status')

  if (status === '000' && id) {
    await query(
      `UPDATE orders 
       SET payment_status = 'PAID', status = 'NEW', updated_at = timezone('utc'::text, now())
       WHERE id::text = $1`,
      [id]
    )
    return new NextResponse('OK', { status: 200 })
  }

  return new NextResponse('INVALID_STATUS', { status: 400 })
}
