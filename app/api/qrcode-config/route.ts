import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

// Cache em memória / persistência rápida por tenant
const tenantQrConfigCache: Record<string, any> = {
  '11111111-1111-1111-1111-111111111111': {
    mode: 'ORDER_EMISSION',
    pickupModel: 'TV_CALL',
    allowTableTransfer: true,
    allowMbwayPayment: true,
    allowInternationalPhone: true,
    customerNameRule: 'OPTIONAL',
    customerPhoneRule: 'OPTIONAL',
    customerNifRule: 'OPTIONAL',
  },
  '22222222-2222-2222-2222-222222222222': {
    mode: 'ORDER_EMISSION',
    pickupModel: 'TV_CALL',
    allowTableTransfer: true,
    allowMbwayPayment: true,
    allowInternationalPhone: true,
    customerNameRule: 'OPTIONAL',
    customerPhoneRule: 'OPTIONAL',
    customerNifRule: 'OPTIONAL',
  },
}

export async function GET(req: NextRequest) {
  try {
    const rawTenant =
      req.nextUrl.searchParams.get('loja') ||
      req.nextUrl.searchParams.get('tenantId') ||
      req.nextUrl.searchParams.get('tenant') ||
      '1'

    const t = await getTenantByIdOrSlug(rawTenant)
    const tenantId = t ? t.id : '11111111-1111-1111-1111-111111111111'

    let saved: any = null

    try {
      const res = await query(
        `SELECT * FROM store_qrcode_settings WHERE tenant_id::text = $1 LIMIT 1`,
        [tenantId]
      )
      if (res.rows && res.rows.length > 0) {
        saved = res.rows[0]
      }
    } catch {}

    const config = {
      mode: saved?.mode || 'ORDER_EMISSION',
      allowMbwayPayment: saved?.allow_mbway_payment ?? true,
      pickupModel: saved?.pickup_model || 'TV_CALL',
      tableMode: 'FIXED_QR',
      allowTableTransfer: saved?.allow_table_transfer ?? true,
      customerNameRule: saved?.customer_name_rule || 'REQUIRED',
      customerPhoneRule: saved?.customer_phone_rule || 'REQUIRED',
      customerNifRule: saved?.customer_nif_rule || 'OPTIONAL',
      allowInternationalPhone: saved?.allow_international_phone ?? true,
      bannerUrl: '',
      tenantId,
      storeNumber: tenantId.startsWith('11111111') ? 1 : 2,
      storeSlug: tenantId.startsWith('11111111') ? 'aveiro' : 'torres-novas',
    }

    return NextResponse.json({ config })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao carregar configurações de QR Code' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantId, config } = body

    if (!tenantId || !config) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const mode = config.mode === 'VIEW_ONLY' ? 'VIEW_ONLY' : 'ORDER_EMISSION'
    const pickupModel = config.pickupModel === 'TABLE_SERVICE' ? 'TABLE_SERVICE' : 'TV_CALL'
    const allowTableTransfer = Boolean(config.allowTableTransfer !== false)
    const allowMbwayPayment = Boolean(config.allowMbwayPayment !== false)
    const allowInternationalPhone = Boolean(config.allowInternationalPhone !== false)
    const customerNameRule = config.customerNameRule === 'OPTIONAL' ? 'OPTIONAL' : 'REQUIRED'
    const customerPhoneRule = config.customerPhoneRule || 'REQUIRED'
    const customerNifRule = config.customerNifRule || 'OPTIONAL'

    await query(
      `INSERT INTO store_qrcode_settings (
        tenant_id, mode, pickup_model, allow_table_transfer,
        allow_mbway_payment, allow_international_phone,
        customer_name_rule, customer_phone_rule, customer_nif_rule,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (tenant_id) DO UPDATE SET
        mode = EXCLUDED.mode,
        pickup_model = EXCLUDED.pickup_model,
        allow_table_transfer = EXCLUDED.allow_table_transfer,
        allow_mbway_payment = EXCLUDED.allow_mbway_payment,
        allow_international_phone = EXCLUDED.allow_international_phone,
        customer_name_rule = EXCLUDED.customer_name_rule,
        customer_phone_rule = EXCLUDED.customer_phone_rule,
        customer_nif_rule = EXCLUDED.customer_nif_rule,
        updated_at = NOW()`,
      [
        tenantId,
        mode,
        pickupModel,
        allowTableTransfer,
        allowMbwayPayment,
        allowInternationalPhone,
        customerNameRule,
        customerPhoneRule,
        customerNifRule,
      ]
    )

    return NextResponse.json({
      success: true,
      config: {
        mode,
        pickupModel,
        allowTableTransfer,
        allowMbwayPayment,
        allowInternationalPhone,
        customerNameRule,
        customerPhoneRule,
        customerNifRule,
        tenantId,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao atualizar configurações' },
      { status: 500 }
    )
  }
}
