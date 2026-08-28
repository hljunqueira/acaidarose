import { Pool } from 'pg'

// Conexão direta com PostgreSQL 16 na VPS (198.50.117.110:5432/acaidarose_prod)
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://acai_admin:da9d329d3252f5b61a2d810b4b765ce9@198.50.117.110:5432/acaidarose_prod'

let pool: Pool

declare global {
  var __postgres_pool: Pool | undefined
}

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: false, // Conexão direta de rede com VPS ou via SSL se configurado
  })
} else {
  if (!global.__postgres_pool) {
    global.__postgres_pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: false,
    })
  }
  pool = global.__postgres_pool
}

export async function query(text: string, params?: any[]) {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  if (process.env.NODE_ENV !== 'production') {
    // Log leve de consulta em desenvolvimento
    // console.log('executed query', { text, duration, rows: res.rowCount })
  }
  return res
}

export default pool
