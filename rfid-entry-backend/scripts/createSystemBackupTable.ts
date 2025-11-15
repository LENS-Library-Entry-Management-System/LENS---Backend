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

const createSystemBackupTable = async () => {
  const client = await pool.connect();

  try {
    console.log('Creating system_backups table...');

    // ENUM: backup_status
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE backup_status AS ENUM ('completed', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // ENUM: backup_type
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE backup_type AS ENUM ('full', 'users', 'entries', 'admins');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // TABLE: system_backups
    await client.query(`DROP TABLE IF EXISTS system_backups;`);
    await client.query(`
      CREATE TABLE system_backups (
        backup_id SERIAL PRIMARY KEY,
        created_by INTEGER NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
        backup_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        file_path VARCHAR(500) NOT NULL,
        size_mb DECIMAL(10, 2) NOT NULL,
        status backup_status NOT NULL DEFAULT 'completed',
        backup_type backup_type NOT NULL DEFAULT 'full',
        description TEXT,
        deleted_at TIMESTAMP NULL
      );
    `);

    // INDEXES
    await client.query(`
      DO $$ BEGIN
        CREATE INDEX IF NOT EXISTS idx_system_backups_created_by ON system_backups(created_by);
        CREATE INDEX IF NOT EXISTS idx_system_backups_backup_date ON system_backups(backup_date);
        CREATE INDEX IF NOT EXISTS idx_system_backups_status ON system_backups(status);
        CREATE INDEX IF NOT EXISTS idx_system_backups_backup_type ON system_backups(backup_type);
      END $$;
    `);

    console.log('system_backups table created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Table created: system_backups');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error creating system_backups table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

createSystemBackupTable()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
