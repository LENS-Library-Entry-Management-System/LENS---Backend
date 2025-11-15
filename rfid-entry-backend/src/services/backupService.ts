import fs from 'fs';
import path from 'path';
import User from '../models/User';
import EntryLog from '../models/EntryLog';
import Admin from '../models/Admin';
import AuditLog from '../models/AuditLog';
import SystemBackup from '../models/SystemsBackup';

const BACKUP_BASE_PATH = process.env.BACKUP_PATH || 'C:\\Users\\Public\\Documents\\LENS_Backups';

// Ensure backup directory exists
export const ensureBackupDirectory = (): void => {
  if (!fs.existsSync(BACKUP_BASE_PATH)) {
    fs.mkdirSync(BACKUP_BASE_PATH, { recursive: true });
  }
};

// Convert array to CSV
const arrayToCSV = (data: any[], headers: string[]): string => {
  const rows = [headers.join(',')];
  
  data.forEach((item) => {
    const values = headers.map((header) => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    rows.push(values.join(','));
  });
  
  return rows.join('\n');
};

// Get file size in MB
const getFileSizeInMB = (filePath: string): number => {
  const stats = fs.statSync(filePath);
  return parseFloat((stats.size / (1024 * 1024)).toFixed(2));
};

// Backup Users
export const backupUsers = async (): Promise<{ filePath: string; sizeMb: number }> => {
  ensureBackupDirectory();
  
  const users = await User.findAll({ raw: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `users_backup_${timestamp}.csv`;
  const filePath = path.join(BACKUP_BASE_PATH, fileName);
  
  const headers = [
    'user_id', 'id_number', 'rfid_tag', 'first_name', 'last_name', 
    'email', 'user_type', 'college', 'department', 'year_level', 
    'status', 'created_at', 'updated_at'
  ];
  
  const csv = arrayToCSV(users, headers);
  fs.writeFileSync(filePath, csv, 'utf-8');
  
  return {
    filePath,
    sizeMb: getFileSizeInMB(filePath),
  };
};

// Backup Entry Logs
export const backupEntryLogs = async (): Promise<{ filePath: string; sizeMb: number }> => {
  ensureBackupDirectory();
  
  const entries = await EntryLog.findAll({ 
    include: [{ model: User, as: 'user', attributes: ['idNumber', 'firstName', 'lastName'] }],
    raw: true,
    nest: true,
  });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `entry_logs_backup_${timestamp}.csv`;
  const filePath = path.join(BACKUP_BASE_PATH, fileName);
  
  const formattedData = entries.map((entry: any) => ({
    log_id: entry.logId,
    user_id: entry.userId,
    id_number: entry.user?.idNumber || '',
    user_name: `${entry.user?.firstName || ''} ${entry.user?.lastName || ''}`.trim(),
    entry_timestamp: entry.entryTimestamp,
    entry_method: entry.entryMethod,
    status: entry.status,
    created_at: entry.createdAt,
  }));
  
  const headers = ['log_id', 'user_id', 'id_number', 'user_name', 'entry_timestamp', 'entry_method', 'status', 'created_at'];
  const csv = arrayToCSV(formattedData, headers);
  fs.writeFileSync(filePath, csv, 'utf-8');
  
  return {
    filePath,
    sizeMb: getFileSizeInMB(filePath),
  };
};

// Backup Admins (without passwords)
export const backupAdmins = async (): Promise<{ filePath: string; sizeMb: number }> => {
  ensureBackupDirectory();
  
  const admins = await Admin.findAll({ 
    attributes: { exclude: ['passwordHash'] },
    raw: true 
  });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `admins_backup_${timestamp}.csv`;
  const filePath = path.join(BACKUP_BASE_PATH, fileName);
  
  const headers = ['admin_id', 'username', 'full_name', 'email', 'role', 'last_login', 'created_at', 'updated_at'];
  const csv = arrayToCSV(admins, headers);
  fs.writeFileSync(filePath, csv, 'utf-8');
  
  return {
    filePath,
    sizeMb: getFileSizeInMB(filePath),
  };
};

// Backup Audit Logs
export const backupAuditLogs = async (): Promise<{ filePath: string; sizeMb: number }> => {
  ensureBackupDirectory();
  
  const auditLogs = await AuditLog.findAll({ 
    include: [{ model: Admin, as: 'admin', attributes: ['username', 'fullName'] }],
    raw: true,
    nest: true,
  });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `audit_logs_backup_${timestamp}.csv`;
  const filePath = path.join(BACKUP_BASE_PATH, fileName);
  
  const formattedData = auditLogs.map((log: any) => ({
    audit_id: log.auditId,
    admin_id: log.adminId,
    admin_username: log.admin?.username || '',
    admin_name: log.admin?.fullName || '',
    action_type: log.actionType,
    target_table: log.targetTable || '',
    target_id: log.targetId || '',
    description: log.description || '',
    timestamp: log.timestamp,
    ip_address: log.ipAddress || '',
  }));
  
  const headers = ['audit_id', 'admin_id', 'admin_username', 'admin_name', 'action_type', 'target_table', 'target_id', 'description', 'timestamp', 'ip_address'];
  const csv = arrayToCSV(formattedData, headers);
  fs.writeFileSync(filePath, csv, 'utf-8');
  
  return {
    filePath,
    sizeMb: getFileSizeInMB(filePath),
  };
};

// Full Backup (All tables)
export const createFullBackup = async (adminId: number): Promise<SystemBackup> => {
  ensureBackupDirectory();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(BACKUP_BASE_PATH, `full_backup_${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  
  try {
    // Backup all tables
    const usersBackup = await backupUsers();
    const entriesBackup = await backupEntryLogs();
    const adminsBackup = await backupAdmins();
    const auditBackup = await backupAuditLogs();
    
    // Move files to backup directory
    const files = [usersBackup, entriesBackup, adminsBackup, auditBackup];
    let totalSize = 0;
    
    files.forEach((file) => {
      const newPath = path.join(backupDir, path.basename(file.filePath));
      fs.renameSync(file.filePath, newPath);
      totalSize += file.sizeMb;
    });
    
    // Create backup record
    const backup = await SystemBackup.create({
      createdBy: adminId,
      backupDate: new Date(),
      filePath: backupDir,
      sizeMb: totalSize,
      status: 'completed',
      backupType: 'full',
      description: `Full system backup with ${files.length} files`,
    });
    
    return backup;
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
    
    await SystemBackup.create({
      createdBy: adminId,
      backupDate: new Date(),
      filePath: backupDir,
      sizeMb: 0,
      status: 'failed',
      backupType: 'full',
      description: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    
    throw error;
  }
};

// List all backups
export const listBackups = async (): Promise<SystemBackup[]> => {
  return await SystemBackup.findAll({
    include: [{ model: Admin, as: 'admin', attributes: ['username', 'fullName'] }],
    order: [['backupDate', 'DESC']],
  });
};

// Delete backup
export const deleteBackup = async (backupId: number): Promise<boolean> => {
  const backup = await SystemBackup.findByPk(backupId);
  
  if (!backup) {
    throw new Error('Backup not found');
  }
  
  // Delete backup files
  if (fs.existsSync(backup.filePath)) {
    const stats = fs.statSync(backup.filePath);
    if (stats.isDirectory()) {
      fs.rmSync(backup.filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(backup.filePath);
    }
  }
  
  // Delete database record
  await backup.destroy();
  
  return true;
};

// Get backup path
export const getBackupPath = (): string => {
  return BACKUP_BASE_PATH;
};