import dotenv from 'dotenv';
import sequelize from '../src/config/database';
import Admin from '../src/models/Admin';
import { testConnection } from '../src/config/database';

dotenv.config();

console.log('🔍 DEBUG - Database Config:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-3) : 'EMPTY');
console.log('---');

const seedAdmin = async () => {
  try {
    console.log('🌱 Starting admin seeder...');

    await testConnection();

    // Sync models (doesn't drop tables, just ensures they exist)
    await sequelize.sync();

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      where: { username: 'admin' } 
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Username: admin');
      process.exit(0);
    }

    // Create super admin
    await Admin.create({
      username: 'admin',
      passwordHash: 'password',
      fullName: 'System Administrator',
      email: 'admin@ustp.edu.ph',
      role: 'super_admin',
    });

    console.log('✅ Super Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: password');
    console.log('   Role: super_admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANT: Change this password in production!');

    // Create staff user
    await Admin.create({
      username: 'staff',
      passwordHash: 'password123',
      fullName: 'Library Staff',
      email: 'staff@ustp.edu.ph',
      role: 'staff',
    });

    console.log('✅ Staff user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Login Credentials:');
    console.log('   Username: staff');
    console.log('   Password: password123');
    console.log('   Role: staff');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder error:', error);
    process.exit(1);
  }
};

seedAdmin();