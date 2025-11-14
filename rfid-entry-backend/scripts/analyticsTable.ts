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

const createAnalyticsTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Creating analytics tables...');

    // Create ENUM types
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE student_status AS ENUM ('active', 'inactive');
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

    // Create students table
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        college VARCHAR(150) NOT NULL,
        department VARCHAR(150) NOT NULL,
        year_level VARCHAR(20) NOT NULL,
        status student_status NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create entries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS entries (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        entry_method entry_method NOT NULL,
        location VARCHAR(100),
        purpose VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for students table
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
      CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
      CREATE INDEX IF NOT EXISTS idx_students_college ON students(college);
      CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
      CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
    `);

    // Create indexes for entries table
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_entries_student_id ON entries(student_id);
      CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp);
      CREATE INDEX IF NOT EXISTS idx_entries_entry_method ON entries(entry_method);
      CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(DATE(timestamp));
    `);

    // Create function to update updated_at timestamp (if not exists)
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger for students table
    await client.query(`
      DROP TRIGGER IF EXISTS update_students_updated_at ON students;
      CREATE TRIGGER update_students_updated_at
      BEFORE UPDATE ON students
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('Analytics tables created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Tables created:');
    console.log('   - students');
    console.log('   - entries');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Indexes created for optimized analytics queries');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('Error creating analytics tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

createAnalyticsTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));