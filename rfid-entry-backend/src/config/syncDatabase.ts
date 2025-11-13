import sequelize from './database';
import Admin from '../models/Admin';
import AuditLog from '../models/AuditLog';
// Import other models as you create them
// import User from '../models/User';
// import EntryLog from '../models/EntryLog';

export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    // Sync all models
    await sequelize.sync({ force });
    
    if (force) {
      console.log('⚠️  Database tables dropped and recreated');
    } else {
      console.log('✅ Database tables synced successfully');
    }
  } catch (error) {
    console.error('❌ Database sync error:', error);
    throw error;
  }
};