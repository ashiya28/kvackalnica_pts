const { Pool } = require('pg');
require('dotenv').config();

const poolOptions = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
} : {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432
};

const pool = new Pool(poolOptions);

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};

