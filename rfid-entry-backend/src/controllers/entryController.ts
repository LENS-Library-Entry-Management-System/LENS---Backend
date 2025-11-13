import { Request, Response } from 'express';
import { Op } from 'sequelize';
import EntryLog from '../models/EntryLog';
import User from '../models/User';
import { logAuditAction } from '../services/auditService';

// GET /api/entries - List all entries (paginated)
export const getAllEntries = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await EntryLog.findAndCountAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'idNumber', 'firstName', 'lastName', 'userType', 'college', 'department', 'yearLevel'],
        },
      ],
      order: [['entryTimestamp', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        entries: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get all entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entries',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/entries/:id - Get specific entry
export const getEntryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const entry = await EntryLog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
    }

    res.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('Get entry by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entry',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// PUT /api/entries/:id - Update entry
export const updateEntry = async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { id } = req.params;
    const { entryTimestamp, entryMethod, status } = req.body;

    const entry = await EntryLog.findByPk(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
    }

    const oldValues = {
      entryTimestamp: entry.entryTimestamp,
      entryMethod: entry.entryMethod,
      status: entry.status,
    };

    if (entryTimestamp) entry.entryTimestamp = new Date(entryTimestamp);
    if (entryMethod) entry.entryMethod = entryMethod;
    if (status) entry.status = status;

    await entry.save();

    // Log audit action
    await logAuditAction({
      admin_id: req.admin.adminId,
      action_type: 'edit',
      target_table: 'entry_logs',
      target_id: entry.logId,
      description: JSON.stringify({
        old: oldValues,
        new: {
          entryTimestamp: entry.entryTimestamp,
          entryMethod: entry.entryMethod,
          status: entry.status,
        },
      }),
      ip_address: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      message: 'Entry updated successfully',
      data: entry,
    });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update entry',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// DELETE /api/entries/:id - Delete entry
export const deleteEntry = async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { id } = req.params;

    const entry = await EntryLog.findByPk(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
    }

    await entry.destroy();

    // Log audit action
    await logAuditAction({
      admin_id: req.admin.adminId,
      action_type: 'delete',
      target_table: 'entry_logs',
      target_id: parseInt(id),
      description: JSON.stringify({
        deletedEntry: {
          userId: entry.userId,
          entryTimestamp: entry.entryTimestamp,
          entryMethod: entry.entryMethod,
        },
      }),
      ip_address: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      message: 'Entry deleted successfully',
    });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete entry',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/entries/active - Real-time monitoring (FR-09)
export const getActiveEntries = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entries = await EntryLog.findAll({
      where: {
        entryTimestamp: {
          [Op.gte]: today,
        },
        status: 'success',
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'idNumber', 'firstName', 'lastName', 'userType', 'college', 'department'],
        },
      ],
      order: [['entryTimestamp', 'DESC']],
      limit: 100,
    });

    const stats = {
      totalToday: entries.length,
      students: entries.filter((e) => e.user?.userType === 'student').length,
      faculty: entries.filter((e) => e.user?.userType === 'faculty').length,
      lastHour: entries.filter((e) => {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return new Date(e.entryTimestamp) >= hourAgo;
      }).length,
    };

    res.json({
      success: true,
      data: {
        entries,
        stats,
      },
    });
  } catch (error) {
    console.error('Get active entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active entries',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// POST /api/entries/filter - Filter/search (FR-10)
export const filterEntries = async (req: Request, res: Response) => {
  try {
    const { college, department, userType, startDate, endDate, searchQuery, page = 1, limit = 50 } = req.body;

    const where: any = {};
    const userWhere: any = {};

    // Filter by date range
    if (startDate || endDate) {
      where.entryTimestamp = {};
      if (startDate) where.entryTimestamp[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.entryTimestamp[Op.lte] = end;
      }
    }

    // Filter by user attributes
    if (college) userWhere.college = college;
    if (department) userWhere.department = department;
    if (userType) userWhere.userType = userType;

    // Search by name or ID number
    if (searchQuery) {
      userWhere[Op.or] = [
        { firstName: { [Op.iLike]: `%${searchQuery}%` } },
        { lastName: { [Op.iLike]: `%${searchQuery}%` } },
        { idNumber: { [Op.iLike]: `%${searchQuery}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await EntryLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          required: Object.keys(userWhere).length > 0,
        },
      ],
      order: [['entryTimestamp', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        entries: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('Filter entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter entries',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/entries/export - Export entries (CSV/PDF)
export const exportEntries = async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { format = 'csv', startDate, endDate } = req.query;

    const where: any = {};

    if (startDate || endDate) {
      where.entryTimestamp = {};
      if (startDate) where.entryTimestamp[Op.gte] = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.entryTimestamp[Op.lte] = end;
      }
    }

    const entries = await EntryLog.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
      order: [['entryTimestamp', 'DESC']],
    });

    if (format === 'csv') {
      // Generate CSV
      const csv = [
        'Log ID,ID Number,Name,User Type,College,Department,Year Level,Entry Time,Entry Method,Status',
        ...entries.map((e) =>
          [
            e.logId,
            e.user?.idNumber || '',
            `"${e.user?.firstName} ${e.user?.lastName}"`,
            e.user?.userType || '',
            e.user?.college || '',
            e.user?.department || '',
            e.user?.yearLevel || '',
            new Date(e.entryTimestamp).toLocaleString(),
            e.entryMethod,
            e.status,
          ].join(',')
        ),
      ].join('\n');

      // Log export action
      await logAuditAction({
        admin_id: req.admin.adminId,
        action_type: 'export',
        target_table: 'entry_logs',
        description: `Exported ${entries.length} entries as CSV`,
        ip_address: req.ip || req.socket.remoteAddress || null,
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=entries_${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid export format. Use "csv".',
      });
    }
  } catch (error) {
    console.error('Export entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export entries',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};