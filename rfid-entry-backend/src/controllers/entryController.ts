import { Request, Response } from 'express';
import { Op, WhereOptions, Order } from 'sequelize';
import EntryLog from '../models/EntryLog';
import User from '../models/User';
import { logAuditAction } from '../services/auditService';

// GET /api/entries - List all entries (paginated)
// Helper: build Sequelize `order` array from request query params
const getOrderFromRequest = (req: Request): Order => {
  // Accept several shapes: sort=field:dir, sortBy + order, sort_by + sort_dir
  const rawSort = (req.query.sort as string) || (req.query.sortBy as string) || (req.query.sort_by as string);
  const rawOrder = (req.query.order as string) || (req.query.sort_dir as string) || (req.query.sortDir as string);

  let field: string | undefined;
  let dir: 'ASC' | 'DESC' = 'DESC';

  if (rawSort) {
    if (rawSort.includes(':')) {
      const [f, d] = rawSort.split(':');
      field = f;
      if (d && d.toLowerCase().startsWith('asc')) dir = 'ASC';
      else dir = 'DESC';
    } else {
      field = rawSort;
    }
  }

  if (rawOrder) {
    if (rawOrder.toLowerCase().startsWith('asc')) dir = 'ASC';
    else dir = 'DESC';
  }

  // If we still don't have a field, return default ordering
  if (!field) return [['entryTimestamp', 'DESC']];

  // Normalize field names (allow snake or camel and common aliases)
  const f = field.replace(/\s+/g, '');
  // remove any non-alphanumeric characters (dots, underscores, hyphens, spaces)
  const normalize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const nf = normalize(f);

  if (process.env.NODE_ENV !== 'production') {
    console.debug('getOrderFromRequest -> field:', field, 'normalized:', nf, 'dir:', dir);
  }

  // Map allowed fields to safe Sequelize order clauses
  // Whitelist to avoid SQL injection
  switch (nf) {
    case 'entrytimestamp':
    case 'timestamp':
      return [['entryTimestamp', dir]];
    case 'logid':
    case 'log_id':
      return [['logId', dir]];
    case 'entrymethod':
      return [['entryMethod', dir]];
    case 'status':
      return [['status', dir]];
    case 'userid':
    case 'user_id':
      return [['userId', dir]];
    // User nested fields
    case 'userlastname':
    case 'lastname':
      return [[{ model: User, as: 'user' }, 'lastName', dir]];
    case 'userfirstname':
    case 'firstname':
      return [[{ model: User, as: 'user' }, 'firstName', dir]];
    case 'useridnumber':
    case 'idnumber':
      return [[{ model: User, as: 'user' }, 'idNumber', dir]];
    case 'usercollege':
    case 'college':
      return [[{ model: User, as: 'user' }, 'college', dir]];
    case 'userdepartment':
    case 'department':
      return [[{ model: User, as: 'user' }, 'department', dir]];
    case 'useryearlevel':
    case 'yearlevel':
      return [[{ model: User, as: 'user' }, 'yearLevel', dir]];
    case 'userusertype':
    case 'usertype':
      return [[{ model: User, as: 'user' }, 'userType', dir]];
    default:
      // Unknown field — fall back to default ordering
      return [['entryTimestamp', 'DESC']];
  }
};
export const getAllEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('getAllEntries request query:', req.query);
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    // Allow optional filtering by userType (student|faculty)
    const userType = (req.query.userType as string) || undefined
    const userWhere: WhereOptions = {}
    if (userType && userType !== 'all') {
      userWhere.userType = userType
    }

    const includeUser: {
      model: typeof User;
      as: string;
      attributes: string[];
      where?: WhereOptions;
      required?: boolean;
    } = {
      model: User,
      as: 'user',
      attributes: ['userId', 'idNumber', 'firstName', 'lastName', 'userType', 'college', 'department', 'yearLevel'],
    }
    if (Object.keys(userWhere).length > 0) {
      includeUser.where = userWhere
      includeUser.required = true
    }

    const { count, rows } = await EntryLog.findAndCountAll({
      include: [includeUser],
      order: getOrderFromRequest(req),
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

    // Validate ID
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid entry ID',
      });
      return;
    }

    // Validate enums
    if (entryMethod && !['rfid', 'manual', 'qr'].includes(entryMethod)) {
      res.status(400).json({
        success: false,
        message: 'Invalid entry method',
      });
      return;
    }
    if (status && !['success', 'failed', 'denied'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
      return;
    }

    // Validate date
    let parsedTimestamp: Date | undefined;
    if (entryTimestamp) {
      parsedTimestamp = new Date(entryTimestamp);
      if (isNaN(parsedTimestamp.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid entry timestamp',
        });
        return;
      }
    }

    const entry = await EntryLog.findByPk(parsedId);

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

    if (parsedTimestamp) entry.entryTimestamp = parsedTimestamp;
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
      ipAddress: req.ip || req.socket?.remoteAddress || null,
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
      ipAddress: req.ip || req.socket?.remoteAddress || null,
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
    // Use UTC to avoid timezone issues
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

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
    if (process.env.NODE_ENV !== 'production') {
      console.debug('filterEntries request body (for filter):', req.body);
    }
    const { college, department, userType, startDate, endDate, searchQuery, page = 1, limit = 50 } = req.body;

    const where: WhereOptions = {};
    // Allow symbol-indexed keys (e.g. Op.or) on the userWhere object
    const userWhere: WhereOptions & { [k: symbol]: unknown } = {};

    // Filter by date range
    if (startDate || endDate) {
      where.entryTimestamp = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          res.status(400).json({
            success: false,
            message: 'Invalid start date',
          });
          return;
        }
        where.entryTimestamp[Op.gte] = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          res.status(400).json({
            success: false,
            message: 'Invalid end date',
          });
          return;
        }
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
      order: getOrderFromRequest(req),
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
    if (process.env.NODE_ENV !== 'production') {
      console.debug('exportEntries request query:', req.query);
    }
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
      if (startDate) {
        const start = new Date(startDate as string);
        if (isNaN(start.getTime())) {
          res.status(400).json({
            success: false,
            message: 'Invalid start date',
          });
          return;
        }
        where.entryTimestamp[Op.gte] = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        if (isNaN(end.getTime())) {
          res.status(400).json({
            success: false,
            message: 'Invalid end date',
          });
          return;
        }
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
      order: getOrderFromRequest(req),
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
