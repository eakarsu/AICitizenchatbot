const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL && (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD)) {
  throw new Error('Configure DATABASE_URL or DB_NAME, DB_USER, and DB_PASSWORD');
}
const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined } : {
  host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 5432), database: process.env.DB_NAME,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;
