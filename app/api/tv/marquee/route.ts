import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { resolveTenantId } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

export interface TVMarqueeConfig {
  promoText: string
  idleText: string
  showPreparingOrders: boolean
  textColor: string
  fontFamily: 'sans' | 'cursive' | 'mono' | 'serif'
  fontSize: string
  speedSeconds: number
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rawTenant = searchParams.get('tenantId') || searchParams.get('loja') || ''
    const tenantId = await resolveTenantId(rawTenant)

    const res = await query(
      `SELECT marquee_config FROM store_tv_configs WHERE tenant_id = $1`,
      [tenantId]
    )

    const config: TVMarqueeConfig = res.rows[0]?.marquee_config || {
      promoText: '',
      idleText: '',
      showPreparingOrders: true,
      textColor: '#E9D5FF',
      fontFamily: 'sans',
      fontSize: 'text-xl',
      speedSeconds: 25,
    }

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { config, tenantId: rawTenant } = body

    if (!config) {
      return NextResponse.json({ success: false, error: 'Configuração é obrigatória' }, { status: 400 })
    }

    const tenantId = await resolveTenantId(rawTenant)

    await query(
      `INSERT INTO store_tv_configs (tenant_id, marquee_config, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (tenant_id) DO UPDATE
       SET marquee_config = EXCLUDED.marquee_config,
           updated_at = NOW()`,
      [tenantId, JSON.stringify(config)]
    )

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

