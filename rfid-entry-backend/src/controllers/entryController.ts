import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import EntryLog from '../models/EntryLog';
import User from '../models/User';
import { logAuditAction } from '../services/auditService';

// GET /api/entries - List all entries (paginated)
export const getAllEntries = async (req: Request, res: Response): Promise<void> => {
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
    return;
  } catch (error) {
    console.error('Get all entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entries',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// GET /api/entries/:id - Get specific entry
export const getEntryById = async (req: Request, res: Response): Promise<void> => {
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
      res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
      return;
    }

    res.json({
      success: true,
      data: entry,
    });
    return;
  } catch (error) {
    console.error('Get entry by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entry',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// PUT /api/entries/:id - Update entry
export const updateEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { id } = req.params;
    const { entryTimestamp, entryMethod, status } = req.body;

    const entry = await EntryLog.findByPk(id);

    if (!entry) {
      res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
      return;
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
      adminId: req.admin.adminId,
      actionType: 'edit',
      targetTable: 'entry_logs',
      targetId: entry.logId,
      description: JSON.stringify({
        old: oldValues,
        new: {
          entryTimestamp: entry.entryTimestamp,
          entryMethod: entry.entryMethod,
          status: entry.status,
        },
      }),
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      message: 'Entry updated successfully',
      data: entry,
    });
    return;
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update entry',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// DELETE /api/entries/:id - Delete entry
export const deleteEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { id } = req.params;

    const entry = await EntryLog.findByPk(id);

    if (!entry) {
      res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
      return;
    }

    await entry.destroy();

    // Log audit action
    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'delete',
      targetTable: 'entry_logs',
      targetId: parseInt(id),
      description: JSON.stringify({
        deletedEntry: {
          userId: entry.userId,
          entryTimestamp: entry.entryTimestamp,
          entryMethod: entry.entryMethod,
        },
      }),
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      message: 'Entry deleted successfully',
    });
    return;
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete entry',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// GET /api/entries/active - Real-time monitoring (FR-09)
export const getActiveEntries = async (_req: Request, res: Response): Promise<void> => {
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
    return;
  } catch (error) {
    console.error('Get active entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active entries',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// POST /api/entries/filter - Filter/search (FR-10)
export const filterEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { college, department, userType, startDate, endDate, searchQuery, page = 1, limit = 50 } = req.body;

    const where: WhereOptions = {};
    // Allow symbol-indexed keys (e.g. Op.or) on the userWhere object
    const userWhere: WhereOptions & { [k: symbol]: unknown } = {};

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
      // Use a symbol index on userWhere (typed above) so TypeScript accepts Op.or
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
    return;
  } catch (error) {
    console.error('Filter entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter entries',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// GET /api/entries/export - Export entries (CSV/PDF)
export const exportEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { format = 'csv', startDate, endDate } = req.query;

    const where: WhereOptions = {};

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
        adminId: req.admin.adminId,
        actionType: 'export',
        targetTable: 'entry_logs',
        description: `Exported ${entries.length} entries as CSV`,
        ipAddress: req.ip || req.socket.remoteAddress || null,
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
    return;
  } catch (error) {
    console.error('Export entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export entries',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};
