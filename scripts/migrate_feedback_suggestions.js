const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL
  if (!connectionString) {
    console.error('DATABASE_URL não configurada.')
    process.exit(1)
  }

  const pool = new Pool({ connectionString })

  console.log('--- Criando Tabela manual_feedback_suggestions ---')

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS manual_feedback_suggestions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        article_id UUID NOT NULL REFERENCES manual_articles(id) ON DELETE CASCADE,
        user_id UUID NULL,
        user_name VARCHAR(255) NULL,
        user_role VARCHAR(50) NULL,
        tenant_id UUID NULL,
        is_helpful BOOLEAN NOT NULL,
        suggestion_text TEXT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_manual_feedback_article ON manual_feedback_suggestions(article_id);
      CREATE INDEX IF NOT EXISTS idx_manual_feedback_status ON manual_feedback_suggestions(status);
      CREATE INDEX IF NOT EXISTS idx_manual_feedback_created ON manual_feedback_suggestions(created_at DESC);
    `)

    console.log('✓ Tabela manual_feedback_suggestions criada com sucesso!')
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error('Erro na migration:', err)
    await pool.end()
    process.exit(1)
  }
}

runMigration()
