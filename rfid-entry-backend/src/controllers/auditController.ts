import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import AuditLog from '../models/AuditLog';
import Admin from '../models/Admin';
import sequelize from '../config/database';

// GET /api/audit-logs - View audit trail
export const getAllAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Filters
    const actionType = req.query.actionType as string;
    const targetTable = req.query.targetTable as string;
    const adminId = req.query.adminId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: WhereOptions = {};

    // Filter by action type
    if (actionType) {
      where.actionType = actionType;
    }

    // Filter by target table
    if (targetTable) {
      where.targetTable = targetTable;
    }

    // Filter by admin
    if (adminId) {
      where.adminId = parseInt(adminId);
    }

    // Filter by date range
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp[Op.lte] = end;
      }
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['adminId', 'username', 'fullName', 'role'],
        },
      ],
      order: [['timestamp', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get all audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/audit-logs/:id - Get specific audit log
export const getAuditLogById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findByPk(parseInt(id), {
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['adminId', 'username', 'fullName', 'email', 'role'],
        },
      ],
    });

    if (!log) {
      res.status(404).json({
        success: false,
        message: 'Audit log not found',
      });
      return;
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error('Get audit log by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/audit-logs/admin/:adminId - Logs by specific admin
export const getAuditLogsByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Optional filters
    const actionType = req.query.actionType as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: WhereOptions = {
      adminId: parseInt(adminId),
    };

    // Filter by action type
    if (actionType) {
      where.actionType = actionType;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp[Op.lte] = end;
      }
    }

    // Check if admin exists
    const admin = await Admin.findByPk(parseInt(adminId), {
      attributes: ['adminId', 'username', 'fullName', 'role'],
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
      return;
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['adminId', 'username', 'fullName', 'role'],
        },
      ],
      order: [['timestamp', 'DESC']],
      limit,
      offset,
    });

    // Get statistics
    const actionStats = await AuditLog.findAll({
      where: { adminId: parseInt(adminId) },
      attributes: [
        'actionType',
        [sequelize.fn('COUNT', sequelize.col('audit_id')), 'count'],
      ],
      group: ['actionType'],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        admin,
        logs: rows,
        stats: {
          totalActions: count,
          actionBreakdown: actionStats,
        },
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get audit logs by admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/audit-logs/stats - Get audit statistics (bonus endpoint)
export const getAuditStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: WhereOptions & { [k: symbol]: unknown } = {};

    // Filter by date range
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp[Op.lte] = end;
      }
    }

    // Total actions
    const totalActions = await AuditLog.count({ where });

    // Actions by type
    const actionsByType = await AuditLog.findAll({
      where,
      attributes: [
        'actionType',
        [sequelize.fn('COUNT', sequelize.col('audit_id')), 'count'],
      ],
      group: ['actionType'],
      raw: true,
    });

    // Actions by admin
    const actionsByAdmin = await AuditLog.findAll({
      where,
      attributes: [
        'adminId',
        [sequelize.fn('COUNT', sequelize.col('audit_id')), 'count'],
      ],
      group: ['adminId', 'admin.admin_id', 'admin.username', 'admin.full_name'],
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['adminId', 'username', 'fullName'],
          required: true,
        },
      ],
      order: [[sequelize.fn('COUNT', sequelize.col('audit_id')), 'DESC']],
      limit: 10,
    });

    // Actions by table
    const actionsByTable = await AuditLog.findAll({
      where: {
        ...where,
        targetTable: { [Op.ne]: null },
      },
      attributes: [
        'targetTable',
        [sequelize.fn('COUNT', sequelize.col('audit_id')), 'count'],
      ],
      group: ['targetTable'],
      raw: true,
    });

    // Recent activity (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = await AuditLog.count({
      where: {
        timestamp: { [Op.gte]: last24Hours },
      },
    });

    res.json({
      success: true,
      data: {
        totalActions,
        recentActivity,
        actionsByType,
        actionsByAdmin,
        actionsByTable,
      },
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};