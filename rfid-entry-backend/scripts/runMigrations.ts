import { execSync } from 'child_process';
import path from 'path';

const scripts = [
  'createTables.ts',
  'createUserTables.ts',
  'createSystemBackupTable.ts',
];

const runMigrations = () => {
  console.log('🔄 Starting database migrations...');

  for (const script of scripts) {
    const scriptPath = path.join(__dirname, script);
    console.log(`\nRunning ${script}...`);
    try {
      execSync(`ts-node ${scriptPath}`, { stdio: 'inherit' });
      console.log(`✅ ${script} completed successfully.`);
    } catch (error) {
      console.error(`❌ Error running ${script}:`, error);
      process.exit(1);
    }
  }

  console.log('\n✨ All migrations completed successfully!');
};

runMigrations();
