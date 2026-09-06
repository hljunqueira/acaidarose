import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { normalizeTenantId } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawTenant = searchParams.get('tenantId') || searchParams.get('loja') || ''
    const tenantId = normalizeTenantId(rawTenant)

    const res = await query(
      `SELECT marquee_config, videos_playlist, sound_config, display_config, updated_at
       FROM store_tv_configs
       WHERE tenant_id = $1`,
      [tenantId]
    )

    if (res.rows.length === 0) {
      return NextResponse.json({
        success: true,
        tenantId,
        marqueeConfig: {},
        videosPlaylist: [],
        soundConfig: { enabled: true, gender: 'female' },
        displayConfig: { showCompletedOrders: true },
      })
    }

    const row = res.rows[0]
    return NextResponse.json({
      success: true,
      tenantId,
      marqueeConfig: row.marquee_config || {},
      videosPlaylist: Array.isArray(row.videos_playlist) ? row.videos_playlist : [],
      soundConfig: row.sound_config || { enabled: true, gender: 'female' },
      displayConfig: row.display_config || { showCompletedOrders: true },
      updatedAt: row.updated_at,
    })
  } catch (err: any) {
    console.error('Erro ao buscar configurações de TV:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao carregar configurações da TV' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawTenant = body.tenantId || ''
    const tenantId = normalizeTenantId(rawTenant)

    const marqueeConfig = body.marqueeConfig !== undefined ? JSON.stringify(body.marqueeConfig) : null
    const videosPlaylist = body.videosPlaylist !== undefined ? JSON.stringify(body.videosPlaylist) : null
    const soundConfig = body.soundConfig !== undefined ? JSON.stringify(body.soundConfig) : null
    const displayConfig = body.displayConfig !== undefined ? JSON.stringify(body.displayConfig) : null

    await query(`
      INSERT INTO store_tv_configs (tenant_id, marquee_config, videos_playlist, sound_config, display_config, updated_at)
      VALUES (
        $1,
        COALESCE($2::jsonb, '{}'::jsonb),
        COALESCE($3::jsonb, '[]'::jsonb),
        COALESCE($4::jsonb, '{"enabled": true, "gender": "female"}'::jsonb),
        COALESCE($5::jsonb, '{"showCompletedOrders": true}'::jsonb),
        NOW()
      )
      ON CONFLICT (tenant_id) DO UPDATE
      SET marquee_config = COALESCE($2::jsonb, store_tv_configs.marquee_config),
          videos_playlist = COALESCE($3::jsonb, store_tv_configs.videos_playlist),
          sound_config = COALESCE($4::jsonb, store_tv_configs.sound_config),
          display_config = COALESCE($5::jsonb, store_tv_configs.display_config),
          updated_at = NOW()
    `, [tenantId, marqueeConfig, videosPlaylist, soundConfig, displayConfig])

    return NextResponse.json({
      success: true,
      tenantId,
      message: 'Configurações de TV salvas no PostgreSQL com sucesso!',
    })
  } catch (err: any) {
    console.error('Erro ao salvar configurações de TV:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao salvar configurações da TV' },
      { status: 500 }
    )
  }
}
