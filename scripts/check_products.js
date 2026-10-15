const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL });

async function run() {
  const bases = await pool.query(`SELECT count(*) as total, count(video_url) as with_video, count(video_poster) as with_poster FROM product_bases`);
  console.log('Bases:', bases.rows);

  const toppings = await pool.query(`SELECT count(*) as total, count(image_url) as with_image, count(video_url) as with_video FROM product_toppings`);
  console.log('Toppings:', toppings.rows);

  await pool.end();
}

run().catch(console.error);
