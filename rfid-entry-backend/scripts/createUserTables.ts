import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'lens_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const createUserTables = async () => {
  const client = await pool.connect();

  try {
    console.log('🚀 Creating User and EntryLog tables...');

    // Create ENUM types
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_type AS ENUM ('student', 'faculty');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM ('active', 'inactive');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE entry_method AS ENUM ('rfid', 'manual');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE entry_status AS ENUM ('success', 'duplicate', 'error');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        id_number VARCHAR(20) NOT NULL UNIQUE,
        rfid_tag VARCHAR(50) NOT NULL UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(150),
        user_type user_type NOT NULL,
        college VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        year_level VARCHAR(20),
        status user_status NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create entry_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS entry_logs (
        log_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        entry_timestamp TIMESTAMP NOT NULL,
        entry_method entry_method NOT NULL,
        status entry_status NOT NULL DEFAULT 'success',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_id_number ON users(id_number);
      CREATE INDEX IF NOT EXISTS idx_users_rfid_tag ON users(rfid_tag);
      CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
      CREATE INDEX IF NOT EXISTS idx_users_college ON users(college);
      CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
      
      CREATE INDEX IF NOT EXISTS idx_entry_logs_user_id ON entry_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_entry_logs_entry_timestamp ON entry_logs(entry_timestamp);
      CREATE INDEX IF NOT EXISTS idx_entry_logs_status ON entry_logs(status);
      CREATE INDEX IF NOT EXISTS idx_entry_logs_entry_method ON entry_logs(entry_method);
    `);

    // Ensure the helper function exists so triggers can reference it
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger for users table updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ User and EntryLog tables created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Tables created:');
    console.log('   - users');
    console.log('   - entry_logs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ Error creating user tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

createUserTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));