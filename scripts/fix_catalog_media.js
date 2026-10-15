const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL });

async function run() {
  await pool.query(`
    UPDATE product_containers
    SET name = 'Milk Shake 600ml - Banana e Morango'
    WHERE id = '2e1bb3dd-0e2b-4fb8-9b6e-366a40a34fec'
  `);
  await pool.query(`
    UPDATE product_containers
    SET name = 'Milk Shake 600ml - com Nutella'
    WHERE id = '9ffd4660-641f-485b-a5e8-052d5aefb209'
  `);
  await pool.query(`
    UPDATE product_containers
    SET name = 'Milk Shake 600ml - com Whey Protein'
    WHERE id = '44612b6b-a606-4cbf-942b-676b4e05abc1'
  `);
  console.log('Torres Novas milkshakes renomeados corretamente.');
  await pool.end();
}

run().catch(console.error);
