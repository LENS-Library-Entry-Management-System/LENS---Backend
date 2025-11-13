import dotenv from 'dotenv';
import sequelize from '../src/config/database';
import Admin from '../src/models/Admin';
import AuditLog from '../src/models/AuditLog';
import { testConnection } from '../src/config/database';

dotenv.config();

const syncDatabase = async () => {
  try {
    console.log('🔄 Syncing database...');
    
    await testConnection();
    
    // Sync all models (creates tables if they don't exist)
    await sequelize.sync({ alter: false }); // Use alter: true to modify existing tables
    
    console.log('✅ Database synced successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync error:', error);
    process.exit(1);
  }
};

syncDatabase();