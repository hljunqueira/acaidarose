import { NextRequest, NextResponse } from 'next/server'
import { mockStore } from '@/lib/supabase/mockStore'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId') || 'tenant-torres-novas'
    const config = (mockStore.qrCodeConfigs || {})[tenantId] || {
      mode: 'ORDER_EMISSION',
      allowMbwayPayment: true,
      tableMode: 'FIXED_QR',
      customerNameRule: 'OPTIONAL',
      customerPhoneRule: 'REQUIRED',
      customerNifRule: 'OPTIONAL',
      allowInternationalPhone: true,
      bannerUrl: '',
    }
    return NextResponse.json({ config })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao carregar configurações de QR Code' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantId, config } = body

    if (!tenantId || !config) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    mockStore.qrCodeConfigs = {
      ...(mockStore.qrCodeConfigs || {}),
      [tenantId]: config,
    }

    return NextResponse.json({ success: true, config })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao atualizar configurações' }, { status: 500 })
  }
}
