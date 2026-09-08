const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  })

  console.log('--- Iniciando migração de colunas para Pesquisas de Satisfação ---')

  try {
    // 1. Adicionar colunas faltantes em satisfaction_survey_responses
    console.log('1. Atualizando tabela satisfaction_survey_responses...')
    await pool.query(`
      ALTER TABLE satisfaction_survey_responses 
        ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS customer_birthday VARCHAR(20),
        ADD COLUMN IF NOT EXISTS nps_score INTEGER;
    `)
    console.log('✓ Colunas customer_email, customer_birthday e nps_score adicionadas com sucesso.')

    // 2. Adicionar survey_type em satisfaction_surveys caso não exista
    console.log('2. Atualizando tabela satisfaction_surveys...')
    await pool.query(`
      ALTER TABLE satisfaction_surveys
        ADD COLUMN IF NOT EXISTS survey_type VARCHAR(50) DEFAULT 'CUSTOM';

      UPDATE satisfaction_surveys
      SET survey_type = 'FULL'
      WHERE deleted_at IS NULL AND jsonb_array_length(questions) >= 4;
    `)
    console.log('✓ Coluna survey_type adicionada e atualizada na satisfaction_surveys.')

    // 3. Criar índices para acelerar consultas e relatórios
    console.log('3. Criando índices de performance...')
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_survey_responses_nps 
        ON satisfaction_survey_responses(nps_score);

      CREATE INDEX IF NOT EXISTS idx_survey_responses_email 
        ON satisfaction_survey_responses(customer_email) 
        WHERE customer_email IS NOT NULL;
    `)
    console.log('✓ Índices criados com sucesso.')

    // 4. Retroalimentar dados a partir do JSONB answers se existirem respostas antigas
    console.log('4. Sincronizando dados retroativos do JSONB answers...')
    const backfillRes = await pool.query(`
      SELECT id, answers, score, nps_score, customer_email, customer_birthday 
      FROM satisfaction_survey_responses
      WHERE (nps_score IS NULL OR customer_email IS NULL) AND answers IS NOT NULL
    `)

    let updatedCount = 0
    for (const row of backfillRes.rows) {
      let npsScore = row.nps_score ?? (typeof row.score === 'number' ? row.score : null)
      let customerEmail = row.customer_email || null
      let customerBirthday = row.customer_birthday || null

      if (Array.isArray(row.answers)) {
        for (const ans of row.answers) {
          if (ans.type === 'nps' && npsScore === null) {
            const s = Number(ans.score)
            if (!isNaN(s)) npsScore = s
          } else if (ans.type === 'customer_data') {
            if (!customerEmail && ans.email) customerEmail = String(ans.email).trim()
            if (!customerBirthday && ans.birthday) customerBirthday = String(ans.birthday).trim()
          }
        }
      }

      if (npsScore !== row.nps_score || customerEmail !== row.customer_email || customerBirthday !== row.customer_birthday) {
        await pool.query(`
          UPDATE satisfaction_survey_responses 
          SET nps_score = $1, customer_email = $2, customer_birthday = $3
          WHERE id = $4
        `, [npsScore, customerEmail, customerBirthday, row.id])
        updatedCount++
      }
    }
    console.log(`✓ Sincronização concluída: ${updatedCount} registros atualizados.`)

    console.log('=== Migração concluída com ÊXITO TOTAL! ===')
  } catch (err) {
    console.error('❌ Erro na execução da migração:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
