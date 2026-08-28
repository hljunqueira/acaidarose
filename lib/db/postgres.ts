import { Pool } from 'pg'

declare global {
  var __postgres_pool: Pool | undefined
}

function getPool(): Pool {
  if (global.__postgres_pool) {
    return global.__postgres_pool
  }

  const raw = process.env.DATABASE_URL || process.env.DIRECT_URL || ''
  const connectionString = raw.trim().replace(/^["']|["']$/g, '').trim()

  if (!connectionString) {
    throw new Error('DATABASE_URL / DIRECT_URL não configurada nas variáveis de ambiente.')
  }

  const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: false,
  })

  global.__postgres_pool = pool
  return pool
}

export async function query(text: string, params?: any[]) {
  const pool = getPool()
  return await pool.query(text, params)
}

export default getPool
