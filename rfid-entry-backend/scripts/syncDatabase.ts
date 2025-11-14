import dotenv from 'dotenv';
import sequelize from '../src/config/database';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Admin from '../src/models/Admin';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import AuditLog from '../src/models/AuditLog';
import EntryLog from '../src/models/EntryLog';
import User from '../src/models/User';
import { testConnection } from '../src/config/database';

dotenv.config();

const syncDatabase = async () => {
  try {
    console.log('Syncing database...');
    
    await testConnection();
    
    // Sync all models (creates tables if they don't exist)
    await sequelize.sync({ alter: false }); // Use alter: true to modify existing tables
    
    console.log('Database synced successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database sync error:', error);
    process.exit(1);
  }
};

syncDatabase();