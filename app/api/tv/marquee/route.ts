import { NextRequest, NextResponse } from 'next/server'

export interface TVMarqueeConfig {
  promoText: string
  idleText: string
  showPreparingOrders: boolean
  textColor: string
  fontFamily: 'sans' | 'cursive' | 'mono' | 'serif'
  fontSize: string
  speedSeconds: number
}

const DEFAULT_CONFIG: TVMarqueeConfig = {
  promoText: '',
  idleText: '',
  showPreparingOrders: true,
  textColor: '#E9D5FF',
  fontFamily: 'sans',
  fontSize: 'text-xl',
  speedSeconds: 25,
}

// Armazenamento em memória por tenant
const marqueeConfigsByTenant: Record<string, TVMarqueeConfig> = {}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId') || 'default'

    const config = marqueeConfigsByTenant[tenantId] || marqueeConfigsByTenant['default'] || DEFAULT_CONFIG

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
    const { config, tenantId } = body

    if (!config) {
      return NextResponse.json({ success: false, error: 'Configuração é obrigatória' }, { status: 400 })
    }

    const merged: TVMarqueeConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    }

    if (tenantId) {
      marqueeConfigsByTenant[tenantId] = merged
    }
    marqueeConfigsByTenant['default'] = merged

    return NextResponse.json({
      success: true,
      config: merged,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
