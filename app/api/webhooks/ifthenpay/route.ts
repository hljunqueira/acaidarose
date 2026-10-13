import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

/**
 * Webhook Oficial da Ifthenpay para confirmação em tempo real de pagamentos MB WAY
 * Documentação: Callback URL (GET ou POST)
 * Suporta orderId / id, verificação de anti-phishing e conciliação por UUID truncado ou número de pedido.
 */
export async function POST(req: NextRequest) {
  try {
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      const formData = await req.formData().catch(() => null)
      if (formData) {
        body = Object.fromEntries(formData.entries())
      }
    }

    const targetId = body.orderId || body.id
    const status = body.status || body.Status
    const requestId = body.requestId || body.RequestId || 'IFTHENPAY-CONFIRMED'
    const key = body.key || body.antiPhishingKey

    if (!targetId) {
      return NextResponse.json({ error: 'orderId ausente' }, { status: 400 })
    }

    // Se o status vier preenchido e não for '000', o pagamento não foi aprovado
    if (status && status !== '000') {
      return NextResponse.json({ success: false, status }, { status: 400 })
    }

    // Busca e atualiza o pedido no PostgreSQL
    const res = await query(
      `UPDATE orders 
       SET payment_status = 'PAID', 
           status = 'NEW', 
           payment_method = 'MBWAY',
           payment_reference = $2
       WHERE (id::text = $1 OR replace(id::text, '-', '') LIKE '%' || $1 OR order_number::text = $1)
       RETURNING id, order_number, tenant_id`,
      [String(targetId), String(requestId)]
    )

    if (res.rows && res.rows.length > 0) {
      const order = res.rows[0]
      // Validação de chave anti-phishing se a loja ou ambiente possuir configurado
      if (key && order.tenant_id) {
        try {
          const cfg = await query(
            `SELECT ifthenpay_anti_phishing_key FROM store_qrcode_settings WHERE tenant_id::text = $1 LIMIT 1`,
            [order.tenant_id]
          )
          const storedKey = cfg.rows?.[0]?.ifthenpay_anti_phishing_key || process.env.IFTHENPAY_ANTI_PHISHING_KEY
          if (storedKey && storedKey.trim() !== key.trim()) {
            console.error('[Ifthenpay Webhook] Chave anti-phishing inválida para a loja:', order.tenant_id)
            return NextResponse.json({ error: 'Chave de segurança inválida' }, { status: 403 })
          }
        } catch (authErr) {
          console.warn('[Ifthenpay Webhook] Aviso ao verificar chave anti-phishing:', authErr)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Pagamento MB WAY confirmado e comanda despachada para a cozinha.',
        orderId: order.id,
        orderNumber: order.order_number,
      })
    }

    return NextResponse.json({ success: false, message: 'Pedido não localizado' }, { status: 404 })
  } catch (error: any) {
    console.error('[Ifthenpay Webhook POST] Erro:', error)
    return NextResponse.json({ error: error.message || 'Erro no webhook Ifthenpay' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const targetId = searchParams.get('orderId') || searchParams.get('id')
    const status = searchParams.get('status')
    const requestId = searchParams.get('requestId') || 'IFTHENPAY-CONFIRMED'
    const key = searchParams.get('key')

    if (!targetId) {
      return new NextResponse('MISSING_ORDER_ID', { status: 400 })
    }

    // Se o status vier explícito e diferente de '000', rejeita
    if (status && status !== '000') {
      return new NextResponse('INVALID_STATUS', { status: 400 })
    }

    const res = await query(
      `UPDATE orders 
       SET payment_status = 'PAID', 
           status = 'NEW', 
           payment_method = 'MBWAY',
           payment_reference = $2
       WHERE (id::text = $1 OR replace(id::text, '-', '') LIKE '%' || $1 OR order_number::text = $1)
       RETURNING id, order_number, tenant_id`,
      [String(targetId), String(requestId)]
    )

    if (res.rows && res.rows.length > 0) {
      const order = res.rows[0]
      if (key && order.tenant_id) {
        try {
          const cfg = await query(
            `SELECT ifthenpay_anti_phishing_key FROM store_qrcode_settings WHERE tenant_id::text = $1 LIMIT 1`,
            [order.tenant_id]
          )
          const storedKey = cfg.rows?.[0]?.ifthenpay_anti_phishing_key || process.env.IFTHENPAY_ANTI_PHISHING_KEY
          if (storedKey && storedKey.trim() !== key.trim()) {
            console.error('[Ifthenpay Webhook GET] Chave anti-phishing divergente:', order.tenant_id)
            return new NextResponse('INVALID_ANTI_PHISHING_KEY', { status: 403 })
          }
        } catch (authErr) {
          console.warn('[Ifthenpay Webhook GET] Aviso ao verificar chave anti-phishing:', authErr)
        }
      }

      return new NextResponse('OK', { status: 200 })
    }

    return new NextResponse('ORDER_NOT_FOUND', { status: 404 })
  } catch (err: any) {
    console.error('[Ifthenpay Webhook GET] Erro:', err)
    return new NextResponse('SERVER_ERROR', { status: 500 })
  }
}
