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

    // Consulta se o tenant é a Matriz Franqueadora
    const tenantRes = await query(
      `SELECT is_headquarters FROM tenants WHERE id = $1`,
      [tenantId]
    )
    const isHeadquarters = tenantRes.rows[0]?.is_headquarters === true || tenantId === '11111111-1111-1111-1111-111111111111'

    const marqueeConfig = body.marqueeConfig !== undefined ? JSON.stringify(body.marqueeConfig) : null
    const videosPlaylist = body.videosPlaylist !== undefined ? JSON.stringify(body.videosPlaylist) : null
    const soundConfig = body.soundConfig !== undefined ? JSON.stringify(body.soundConfig) : null
    const displayConfig = body.displayConfig !== undefined ? JSON.stringify(body.displayConfig) : null

    // Caso de Replicação para Todas as Lojas (Exclusivo da Matriz Franqueadora)
    if (body.replicateToAllStores || body.replicatePlaylist) {
      if (!isHeadquarters) {
        return NextResponse.json(
          { success: false, error: 'Apenas a Matriz Franqueadora pode replicar a playlist para as lojas da rede.' },
          { status: 403 }
        )
      }

      if (videosPlaylist) {
        await query(`
          INSERT INTO store_tv_configs (tenant_id, videos_playlist, updated_at)
          SELECT id, $1::jsonb, NOW()
          FROM tenants
          WHERE deleted_at IS NULL
          ON CONFLICT (tenant_id) DO UPDATE
          SET videos_playlist = EXCLUDED.videos_playlist,
              updated_at = NOW()
        `, [videosPlaylist])

        return NextResponse.json({
          success: true,
          tenantId,
          replicated: true,
          message: 'Playlist oficial replicada com sucesso para todas as lojas da rede!',
        })
      }
    }

    // Bloqueio de governança: Filiais/Franquias não podem cadastrar novos vídeos nem excluir vídeos
    if (!isHeadquarters && body.videosPlaylist !== undefined && Array.isArray(body.videosPlaylist)) {
      const currentRes = await query(
        `SELECT videos_playlist FROM store_tv_configs WHERE tenant_id = $1`,
        [tenantId]
      )
      const currentList = Array.isArray(currentRes.rows[0]?.videos_playlist) ? currentRes.rows[0].videos_playlist : []
      const currentIds = new Set(currentList.map((v: any) => v.id))
      const newIds = new Set(body.videosPlaylist.map((v: any) => v.id))

      const hasAdded = body.videosPlaylist.some((v: any) => !currentIds.has(v.id))
      const hasDeleted = currentList.some((v: any) => !newIds.has(v.id))

      if (hasAdded || hasDeleted) {
        return NextResponse.json(
          { success: false, error: 'Apenas a Matriz Franqueadora pode cadastrar ou excluir vídeos da Smart TV. As filiais podem apenas ativar ou pausar a exibição local.' },
          { status: 403 }
        )
      }
    }

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
