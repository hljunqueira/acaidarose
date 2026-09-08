const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function createSatisfactionSurveysTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  console.log('--- Iniciando criação das tabelas de Pesquisa de Satisfação 2.0 ---')

  try {
    // 1. Tabela principal de modelos de pesquisa
    await pool.query(`
      CREATE TABLE IF NOT EXISTS satisfaction_surveys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        title_en VARCHAR(255),
        title_es VARCHAR(255),
        description TEXT,
        description_en TEXT,
        description_es TEXT,
        is_active BOOLEAN DEFAULT false,
        active_stores JSONB DEFAULT '[]'::jsonb,
        questions JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
        deleted_at TIMESTAMPTZ
      );
    `)
    console.log('✓ Tabela satisfaction_surveys pronta.')

    // 2. Tabela de respostas dos clientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS satisfaction_survey_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        survey_id UUID REFERENCES satisfaction_surveys(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL,
        order_id UUID,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        table_number VARCHAR(50),
        language VARCHAR(10) DEFAULT 'pt',
        answers JSONB NOT NULL DEFAULT '{}'::jsonb,
        score INTEGER,
        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
      );
    `)
    console.log('✓ Tabela satisfaction_survey_responses pronta.')

    // 3. Índices de performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_surveys_tenant 
        ON satisfaction_surveys(tenant_id) 
        WHERE deleted_at IS NULL;
      
      CREATE INDEX IF NOT EXISTS idx_survey_responses_survey 
        ON satisfaction_survey_responses(survey_id);

      CREATE INDEX IF NOT EXISTS idx_survey_responses_tenant_created 
        ON satisfaction_survey_responses(tenant_id, created_at DESC);
    `)
    console.log('✓ Índices de alta performance criados.')

    console.log('=== Migração concluída com sucesso! ===')
  } catch (err) {
    console.error('Erro na migração:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

createSatisfactionSurveysTables()
