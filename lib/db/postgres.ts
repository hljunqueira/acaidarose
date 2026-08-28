import { Pool } from 'pg'

const rawConnectionString = process.env.DATABASE_URL || ''

// Sanitiza para remover aspas acidentais inseridas por CLIs
const connectionString = rawConnectionString.trim().replace(/^["']|["']$/g, '').trim()

let pool: Pool

declare global {
  var __postgres_pool: Pool | undefined
}

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString: connectionString || undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: false,
  })
} else {
  if (!global.__postgres_pool) {
    global.__postgres_pool = new Pool({
      connectionString: connectionString || undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: false,
    })
  }
  pool = global.__postgres_pool
}

export async function query(text: string, params?: any[]) {
  if (!connectionString) {
    throw new Error('DATABASE_URL não configurada nas variáveis de ambiente.')
  }
  const res = await pool.query(text, params)
  return res
}

export default pool
