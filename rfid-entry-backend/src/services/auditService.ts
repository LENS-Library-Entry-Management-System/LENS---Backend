import AuditLog from '../models/AuditLog';

interface AuditLogData {
  adminId: number;
  actionType: 'view' | 'edit' | 'delete' | 'export' | 'login' | 'logout';
  targetTable?: string | null;
  targetId?: number | null;
  description?: string | null;
  ipAddress?: string | null;
}

export const logAuditAction = async (data: AuditLogData): Promise<void> => {
  try {
    await AuditLog.create({
      adminId: data.adminId,
      actionType: data.actionType,
      targetTable: data.targetTable || null,
      targetId: data.targetId || null,
      description: data.description || null,
      ipAddress: data.ipAddress || null,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Audit log creation failed:', error);
    // Don't throw error to prevent breaking the main operation
  }
};