const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const REGISTERED_VIDEOS = [
  {
    id: 'vid_institucional',
    title: 'Vídeo Institucional Açaí da Rose',
    url: '/videos/video-institucional.mp4',
    active: true,
    showBadge: false,
    badgeText: '',
    tagLeft: 'Açaí da Rose',
    tagRight: 'acaidarose.pt',
    tagPosition: 'BOTTOM',
    showTags: true,
  },
  {
    id: 'vid_gastronomico_02',
    title: 'Açaí da Rose - Sabores & Acompanhamentos',
    url: '/videos/video2-acaidarose.mp4',
    active: true,
    showBadge: false,
    badgeText: '',
    tagLeft: 'Puro Sabor Artesanal',
    tagRight: 'acaidarose.pt',
    tagPosition: 'BOTTOM',
    showTags: true,
  },
]

async function registerVideosInDatabase() {
  console.log('--- Cadastrando os 2 vídeos oficiais no PostgreSQL (store_tv_configs) ---')

  try {
    const tenants = await pool.query('SELECT id, name FROM tenants WHERE deleted_at IS NULL')
    console.log(`Encontradas ${tenants.rows.length} lojas no banco de dados.`)

    for (const t of tenants.rows) {
      await pool.query(
        `INSERT INTO store_tv_configs (tenant_id, marquee_config, videos_playlist, sound_config, display_config, updated_at)
         VALUES (
           $1,
           '{}'::jsonb,
           $2::jsonb,
           '{"enabled": true, "gender": "female"}'::jsonb,
           '{"showCompletedOrders": true}'::jsonb,
           NOW()
         )
         ON CONFLICT (tenant_id) DO UPDATE
         SET videos_playlist = $2::jsonb,
             updated_at = NOW()`,
        [t.id, JSON.stringify(REGISTERED_VIDEOS)]
      )
      console.log(`✓ Vídeos cadastrados no banco para: ${t.name} (${t.id})`)
    }

    const verification = await pool.query('SELECT tenant_id, videos_playlist FROM store_tv_configs')
    console.log('\n--- Confirmação dos dados persistidos no PostgreSQL: ---')
    for (const row of verification.rows) {
      console.log(`Loja ${row.tenant_id}: ${row.videos_playlist.length} vídeos gravados.`)
      console.log(JSON.stringify(row.videos_playlist, null, 2))
    }
    console.log('\n✓ Sucesso: Vídeos cadastrados diretamente no banco de dados!')
  } catch (err) {
    console.error('Erro ao cadastrar vídeos no banco:', err)
  } finally {
    await pool.end()
  }
}

registerVideosInDatabase()
