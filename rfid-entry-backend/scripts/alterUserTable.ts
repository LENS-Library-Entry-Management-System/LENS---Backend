import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'lens_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const alterUserTable = async () => {
  const client = await pool.connect();

  try {
    console.log('🚀 Altering users table to make college and department nullable...');

    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN college DROP NOT NULL,
      ALTER COLUMN department DROP NOT NULL;
    `);

    console.log('✅ Users table altered successfully.');
  } catch (error) {
    console.error('❌ Error altering users table:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

alterUserTable();
