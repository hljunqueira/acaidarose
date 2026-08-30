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

    const saved = tenantQrConfigCache[tenantId] || {}

    const config = {
      mode: saved.mode || 'ORDER_EMISSION',
      allowMbwayPayment: saved.allowMbwayPayment ?? true,
      pickupModel: saved.pickupModel || 'TV_CALL',
      tableMode: 'FIXED_QR',
      allowTableTransfer: saved.allowTableTransfer ?? true,
      customerNameRule: saved.customerNameRule || 'OPTIONAL',
      customerPhoneRule: saved.customerPhoneRule || 'OPTIONAL',
      customerNifRule: saved.customerNifRule || 'OPTIONAL',
      allowInternationalPhone: saved.allowInternationalPhone ?? true,
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

    // Atualiza cache em memória
    tenantQrConfigCache[tenantId] = {
      ...tenantQrConfigCache[tenantId],
      ...config,
    }

    return NextResponse.json({ success: true, config: tenantQrConfigCache[tenantId] })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao atualizar configurações' },
      { status: 500 }
    )
  }
}
