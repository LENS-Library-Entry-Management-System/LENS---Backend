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
const arrayToCSV = (data: unknown[], headers: string[]): string => {
  const rows = [headers.join(',')];

  data.forEach((item) => {
    const values = headers.map((header) => {
      const value = (item as Record<string, unknown>)[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
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

  const users = await User.findAll();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `users_backup_${timestamp}.csv`;
  const filePath = path.join(BACKUP_BASE_PATH, fileName);

  const formattedData = users.map(user => ({
    user_id: user.userId,
    id_number: user.idNumber,
    rfid_tag: user.rfidTag,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email || '',
    user_type: user.userType,
    college: user.college,
    department: user.department,
    year_level: user.yearLevel || '',
    status: user.status,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  }));

  const headers = [
    'user_id', 'id_number', 'rfid_tag', 'first_name', 'last_name',
    'email', 'user_type', 'college', 'department', 'year_level',
    'status', 'created_at', 'updated_at'
  ];

  const csv = arrayToCSV(formattedData, headers);
  fs.writeFileSync(filePath, csv, 'utf-8');

  return {
    filePath,
    sizeMb: getFileSizeInMB(filePath),
  };
};

// Backup Entry Logs
export const backupEntryLogs = async (): Promise<{ filePath: string; sizeMb: number }> => {
  ensureBackupDirectory();

  const entries = await EntryLog.findAll();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `entry_logs_backup_${timestamp}.csv`;
  const filePath = path.join(BACKUP_BASE_PATH, fileName);

  const formattedData = entries.map(entry => ({
    log_id: entry.logId,
    user_id: entry.userId,
    entry_timestamp: entry.entryTimestamp,
    entry_method: entry.entryMethod,
    status: entry.status,
    created_at: entry.createdAt,
  }));

  const headers = ['log_id', 'user_id', 'entry_timestamp', 'entry_method', 'status', 'created_at'];
  const csv = arrayToCSV(formattedData, headers);
  fs.writeFileSync(filePath, csv, 'utf-8');

  return {
    filePath,
    sizeMb: getFileSizeInMB(filePath),
  };
};

// Backup Admins
export const backupAdmins = async (): Promise<{ filePath: string; sizeMb: number }> => {
  ensureBackupDirectory();

  const admins = await Admin.findAll();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `admins_backup_${timestamp}.csv`;
  const filePath = path.join(BACKUP_BASE_PATH, fileName);

  const formattedData = admins.map(admin => ({
    admin_id: admin.adminId,
    username: admin.username,
    password_hash: admin.passwordHash,
    full_name: admin.fullName,
    email: admin.email || '',
    role: admin.role,
    last_login: admin.lastLogin || '',
    created_at: admin.createdAt,
    updated_at: admin.updatedAt,
  }));

  const headers = ['admin_id', 'username', 'password_hash', 'full_name', 'email', 'role', 'last_login', 'created_at', 'updated_at'];
  const csv = arrayToCSV(formattedData, headers);
  fs.writeFileSync(filePath, csv, 'utf-8');

  return {
    filePath,
    sizeMb: getFileSizeInMB(filePath),
  };
};

// Backup Audit Logs
export const backupAuditLogs = async (): Promise<{ filePath: string; sizeMb: number }> => {
  ensureBackupDirectory();

  const auditLogs = await AuditLog.findAll();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `audit_logs_backup_${timestamp}.csv`;
  const filePath = path.join(BACKUP_BASE_PATH, fileName);

  const formattedData = auditLogs.map(log => ({
    audit_id: log.auditId,
    admin_id: log.adminId,
    action_type: log.actionType,
    target_table: log.targetTable,
    target_id: log.targetId,
    timestamp: log.timestamp,
    ip_address: log.ipAddress,
    description: log.description,
  }));

  const headers = ['audit_id', 'admin_id', 'action_type', 'target_table', 'target_id', 'timestamp', 'ip_address', 'description'];
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

// Get backup path
export const getBackupPath = (): string => {
  return BACKUP_BASE_PATH;
};