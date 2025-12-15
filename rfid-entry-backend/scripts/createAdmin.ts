import readline from 'readline';
import dotenv from 'dotenv';
import sequelize from '../src/config/database';
import Admin from '../src/models/Admin';
import { testConnection } from '../src/config/database';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const createAdmin = async () => {
  try {
    console.log('🔐 Create New Admin User');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await testConnection();
    // Sync models to ensure table exists
    await sequelize.sync();

    const username = await question('Username: ');
    if (!username) throw new Error('Username is required');

    const existing = await Admin.findOne({ where: { username } });
    if (existing) throw new Error('Username already exists');

    const email = await question('Email: ');
    if (!email) throw new Error('Email is required');

    const fullName = await question('Full Name: ');
    if (!fullName) throw new Error('Full Name is required');

    const password = await question('Password: ');
    if (!password) throw new Error('Password is required');

    const roleInput = await question('Role (super_admin/staff) [staff]: ');
    const role = (roleInput.trim() === 'super_admin') ? 'super_admin' : 'staff';

    console.log('\nCreating admin...');

    await Admin.create({
      username,
      email,
      fullName,
      passwordHash: password, // Hook will hash this
      role,
    });

    console.log('✅ Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Username: ${username}`);
    console.log(`Role: ${role}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    rl.close();
    await sequelize.close();
    process.exit(0);
  }
};

createAdmin();
