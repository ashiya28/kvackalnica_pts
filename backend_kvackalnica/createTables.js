const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const dbUrl = process.env.DB_URL || process.env.DATABASE_URL;
if (!dbUrl && !(process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME)) {
  throw new Error('DB_URL or DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME are required');
}

const poolOptions = dbUrl ? {
  connectionString: dbUrl,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
} : {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432
};

const pool = new Pool(poolOptions);

(async () => {
  try {
    // enable uuid extension
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // DROP existing tables (drops relations safely) — WARNING: this deletes data
    await pool.query(`DROP TABLE IF EXISTS images CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS projects CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS users CASCADE;`);

    // USERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // PROJECTS 
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'in_progress',
        difficulty_rating INT NOT NULL DEFAULT 3 CHECK (difficulty_rating BETWEEN 1 AND 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP NULL
      );
    `);

    // IMAGES (store file path on disk)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS images (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(1024) NOT NULL,
        file_size BIGINT,
        mime_type VARCHAR(100),
        upload_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tables created (users, projects, images). Note: existing tables were dropped before creation.');
  } catch (err) {
    console.error('Error creating tables:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
