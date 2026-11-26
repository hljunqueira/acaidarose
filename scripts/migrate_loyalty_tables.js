const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL
  if (!connectionString) {
    console.error('❌ DATABASE_URL não configurada no .env.local.')
    process.exit(1)
  }

  const pool = new Pool({ connectionString })

  console.log('--- Executando Migration das Tabelas de Fidelidade e Cashback ---')

  try {
    const sqlPath = path.join(__dirname, 'migrations', 'create_loyalty_module_tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    await pool.query(sql)

    console.log('✓ Tabelas de fidelidade e cashback criadas/atualizadas com sucesso no PostgreSQL!')
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error('❌ Erro na execução da migration:', err)
    await pool.end()
    process.exit(1)
  }
}

runMigration()
