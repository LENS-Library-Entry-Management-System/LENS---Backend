import AuditLog from '../models/AuditLog';

interface AuditLogData {
  admin_id: number;
  action_type: 'view' | 'edit' | 'delete' | 'export' | 'login' | 'logout';
  target_table?: string | null;
  target_id?: number | null;
  description?: string | null;
  ip_address?: string | null;
}

export const logAuditAction = async (data: AuditLogData): Promise<void> => {
  try {
    await AuditLog.create({
      admin_id: data.admin_id,
      action_type: data.action_type,
      target_table: data.target_table || null,
      target_id: data.target_id || null,
      description: data.description || null,
      ip_address: data.ip_address || null,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Audit log creation failed:', error);
    // Don't throw error to prevent breaking the main operation
  }
};