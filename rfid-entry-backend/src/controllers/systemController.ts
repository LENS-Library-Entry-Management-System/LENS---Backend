import { Request, Response } from 'express';
import {
  createFullBackup,
  backupUsers,
  backupEntryLogs,
  backupAdmins,
  listBackups,
  deleteBackup,
  getBackupPath,
  ensureBackupDirectory
} from '../services/backupService';
import SystemBackup from '../models/SystemsBackup';
import { logAuditAction } from '../services/auditService';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import fs from 'fs';

// POST /api/system/backup - Create backup
export const createBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Only super_admin can create backups
    if (req.admin.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Forbidden: Only super admins can create backups' });
      return;
    }

    const { backupType = 'full', description } = req.body;

    let backup: SystemBackup | { filePath: string; sizeMb: number };

    switch (backupType) {
      case 'full':
        backup = await createFullBackup(req.admin.adminId);
        break;
      case 'users':
        backup = await backupUsers();
        await SystemBackup.create({
          createdBy: req.admin.adminId,
          backupDate: new Date(),
          filePath: backup.filePath,
          sizeMb: backup.sizeMb,
          status: 'completed',
          backupType: 'users',
          description: description || 'Users backup',
        });
        break;
      case 'entries':
        backup = await backupEntryLogs();
        await SystemBackup.create({
          createdBy: req.admin.adminId,
          backupDate: new Date(),
          filePath: backup.filePath,
          sizeMb: backup.sizeMb,
          status: 'completed',
          backupType: 'entries',
          description: description || 'Entry logs backup',
        });
        break;
      case 'admins':
        backup = await backupAdmins();
        await SystemBackup.create({
          createdBy: req.admin.adminId,
          backupDate: new Date(),
          filePath: backup.filePath,
          sizeMb: backup.sizeMb,
          status: 'completed',
          backupType: 'admins',
          description: description || 'Admins backup',
        });
        break;
      default:
        res.status(400).json({ success: false, message: 'Invalid backup type' });
        return;
    }

    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'edit',
      targetTable: 'system_backups',
      description: `Created ${backupType} backup`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      message: 'Backup created successfully',
      data: backup,
    });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/system/backups - List all backups
export const getBackups = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (req.admin.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Forbidden: Only super admins can view backups' });
      return;
    }

    const backups = await listBackups();

    res.json({
      success: true,
      data: {
        backups,
        backupPath: getBackupPath(),
        totalBackups: backups.length,
        totalSize: backups.reduce((sum, b) => sum + parseFloat(b.sizeMb.toString()), 0).toFixed(2),
      },
    });
  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backups',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// POST /api/system/restore/:id - Restore backup (placeholder - requires manual restore)
export const restoreBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (req.admin.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Forbidden: Only super admins can restore backups' });
      return;
    }

    const { id } = req.params;

    const backup = await SystemBackup.findByPk(id);

    if (!backup) {
      res.status(404).json({ success: false, message: 'Backup not found' });
      return;
    }

    if (!fs.existsSync(backup.filePath)) {
      res.status(404).json({ success: false, message: 'Backup files not found' });
      return;
    }

    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'view',
      targetTable: 'system_backups',
      targetId: backup.backupId,
      description: `Viewed backup details for restore: ${backup.backupType}`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      message: 'Backup files located. Please import CSV files manually into the database.',
      data: {
        backup,
        instructions: [
          '1. Navigate to the backup directory',
          '2. Open each CSV file',
          '3. Use database import tools or scripts to restore data',
          '4. Verify data integrity after restore',
        ],
      },
    });
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// DELETE /api/system/backups/:id - Delete backup
export const removeBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (req.admin.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Forbidden: Only super admins can delete backups' });
      return;
    }

    const { id } = req.params;

    await deleteBackup(parseInt(id));

    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'delete',
      targetTable: 'system_backups',
      targetId: parseInt(id),
      description: 'Deleted backup',
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      message: 'Backup deleted successfully',
    });
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/system/health - System health check
export const getSystemHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      backupDirectory: 'not accessible',
      uptime: process.uptime(),
      memory: {
        used: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        total: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB',
      },
    };

    // Check database connection
    try {
      await sequelize.authenticate();
      health.database = 'connected';
    } catch (error) {
      health.status = 'unhealthy';
      health.database = 'error';
    }

    // Check backup directory
    try {
      ensureBackupDirectory();
      const backupPath = getBackupPath();
      if (fs.existsSync(backupPath)) {
        health.backupDirectory = 'accessible';
        health.backupPath = backupPath;
      }
    } catch (error) {
      health.backupDirectory = 'error';
    }

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error('System health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// POST /api/system/optimize - Database optimization
export const optimizeDatabase = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (req.admin.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Forbidden: Only super admins can optimize database' });
      return;
    }

    // Run VACUUM and ANALYZE on PostgreSQL
    await sequelize.query('VACUUM ANALYZE');

    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'edit',
      targetTable: 'system',
      description: 'Database optimization executed',
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      message: 'Database optimized successfully',
      data: {
        operation: 'VACUUM ANALYZE',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Database optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize database',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/system/logs - System logs (last 100 entries)
export const getSystemLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (req.admin.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Forbidden: Only super admins can view system logs' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 100;

    // Get audit logs as system logs
    const logs = await sequelize.query(
      `SELECT al.*, a.username, a.full_name
       FROM audit_logs al
       LEFT JOIN admins a ON al.admin_id = a.admin_id
       ORDER BY al.timestamp DESC
       LIMIT :limit`,
      {
        replacements: { limit },
        type: QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      data: {
        logs,
        totalLogs: logs.length,
      },
    });
  } catch (error) {
    console.error('Get system logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system logs',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};