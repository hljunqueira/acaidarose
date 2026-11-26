const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function createTestUser() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL não configurada no .env.local.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    const rawPassword = '123456';
    const passwordHash = bcrypt.hashSync(rawPassword, 10);
    const username = '@hljunqueira';

    console.log(`Verificando existência do utilizador ${username}...`);

    const existing = await pool.query(
      `SELECT * FROM loyalty_customers WHERE LOWER(username) = $1 OR LOWER(username) = $2 LIMIT 1`,
      [username.toLowerCase(), 'hljunqueira']
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      console.log(`Utilizador encontrado (ID: ${user.id}). A atualizar palavra-passe para 123456...`);

      const updated = await pool.query(
        `UPDATE loyalty_customers 
         SET password_hash = $1, username = $2, points_balance = GREATEST(points_balance, 250)
         WHERE id = $3 
         RETURNING id, username, phone, name, points_balance, referral_code`,
        [passwordHash, username, user.id]
      );

      console.log('✓ Utilizador atualizado com sucesso:', updated.rows[0]);
    } else {
      console.log(`Utilizador não encontrado. A criar novo registo para ${username}...`);

      const inserted = await pool.query(
        `INSERT INTO loyalty_customers (
          tenant_id,
          username,
          phone,
          name,
          password_hash,
          points_balance,
          referral_code
        ) VALUES (
          '11111111-1111-1111-1111-111111111111',
          $1,
          '910000001',
          'Henrique Junqueira',
          $2,
          250,
          'HLJ2026'
        ) RETURNING id, username, phone, name, points_balance, referral_code`,
        [username, passwordHash]
      );

      console.log('✓ Utilizador criado com sucesso no banco de dados:', inserted.rows[0]);
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao criar/atualizar utilizador:', err);
    await pool.end();
    process.exit(1);
  }
}

createTestUser();
