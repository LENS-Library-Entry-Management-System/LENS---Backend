import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import EntryLog from '../models/EntryLog';
import User from '../models/User';
import { logAuditAction } from '../services/auditService';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// GET /api/reports/daily - Daily report
export const getDailyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const today = new Date();
    const startDate = startOfDay(today);
    const endDate = endOfDay(today);

    const entries = await EntryLog.findAll({
      where: {
        entryTimestamp: {
          [Op.between]: [startDate, endDate],
        },
        status: 'success',
      },
      include: [{ model: User, as: 'user' }],
      order: [['entryTimestamp', 'DESC']],
    });

    const stats = generateStats(entries);

    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'view',
      targetTable: 'reports',
      description: 'Viewed daily report',
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      data: {
        reportType: 'daily',
        date: today.toISOString().split('T')[0],
        stats,
        entries,
      },
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily report',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/reports/weekly - Weekly report
export const getWeeklyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const today = new Date();
    const startDate = startOfWeek(today, { weekStartsOn: 0 });
    const endDate = endOfWeek(today, { weekStartsOn: 0 });

    const entries = await EntryLog.findAll({
      where: {
        entryTimestamp: {
          [Op.between]: [startDate, endDate],
        },
        status: 'success',
      },
      include: [{ model: User, as: 'user' }],
      order: [['entryTimestamp', 'DESC']],
    });

    const stats = generateStats(entries);

    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'view',
      targetTable: 'reports',
      description: 'Viewed weekly report',
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      data: {
        reportType: 'weekly',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        stats,
        entries,
      },
    });
  } catch (error) {
    console.error('Weekly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate weekly report',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/reports/monthly - Monthly report
export const getMonthlyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);

    const entries = await EntryLog.findAll({
      where: {
        entryTimestamp: {
          [Op.between]: [startDate, endDate],
        },
        status: 'success',
      },
      include: [{ model: User, as: 'user' }],
      order: [['entryTimestamp', 'DESC']],
    });

    const stats = generateStats(entries);

    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'view',
      targetTable: 'reports',
      description: 'Viewed monthly report',
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      data: {
        reportType: 'monthly',
        month: today.toLocaleString('default', { month: 'long', year: 'numeric' }),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        stats,
        entries,
      },
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly report',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/reports/custom - Custom date range report
export const getCustomReport = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { startDate, endDate, college, department, userType } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
      return;
    }

    const where: WhereOptions = {
      entryTimestamp: {
        [Op.between]: [
          startOfDay(new Date(startDate as string)),
          endOfDay(new Date(endDate as string)),
        ],
      },
      status: 'success',
    };

    const userWhere: WhereOptions = {};
    if (college) userWhere.college = college;
    if (department) userWhere.department = department;
    if (userType) userWhere.userType = userType;

    const entries = await EntryLog.findAll({
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
    });

    const stats = generateStats(entries);

    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'view',
      targetTable: 'reports',
      description: `Viewed custom report (${startDate} to ${endDate})`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      data: {
        reportType: 'custom',
        startDate,
        endDate,
        filters: { college, department, userType },
        stats,
        entries,
      },
    });
  } catch (error) {
    console.error('Custom report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate custom report',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// POST /api/reports/generate - Generate and download report
export const generateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { reportType, startDate, endDate, format = 'csv', college, department, userType } = req.body;

    if (!reportType) {
      res.status(400).json({
        success: false,
        message: 'reportType is required',
      });
      return;
    }

    let start: Date;
    let end: Date;

    switch (reportType) {
      case 'daily':
        start = startOfDay(new Date());
        end = endOfDay(new Date());
        break;
      case 'weekly':
        start = startOfWeek(new Date(), { weekStartsOn: 0 });
        end = endOfWeek(new Date(), { weekStartsOn: 0 });
        break;
      case 'monthly':
        start = startOfMonth(new Date());
        end = endOfMonth(new Date());
        break;
      case 'custom':
        if (!startDate || !endDate) {
          res.status(400).json({
            success: false,
            message: 'startDate and endDate are required for custom reports',
          });
          return;
        }
        start = startOfDay(new Date(startDate));
        end = endOfDay(new Date(endDate));
        break;
      default:
        res.status(400).json({
          success: false,
          message: 'Invalid reportType',
        });
        return;
    }

    const where: WhereOptions = {
      entryTimestamp: {
        [Op.between]: [start, end],
      },
      status: 'success',
    };

    const userWhere: WhereOptions = {};
    if (college) userWhere.college = college;
    if (department) userWhere.department = department;
    if (userType) userWhere.userType = userType;

    const entries = await EntryLog.findAll({
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
    });

    if (format === 'csv') {
      const csv = [
        'Log ID,Date,Time,ID Number,Name,User Type,College,Department,Year Level,Entry Method,Status',
        ...entries.map((e) => {
          const date = new Date(e.entryTimestamp);
          return [
            e.logId,
            date.toLocaleDateString(),
            date.toLocaleTimeString(),
            e.user?.idNumber || '',
            `"${e.user?.firstName} ${e.user?.lastName}"`,
            e.user?.userType || '',
            e.user?.college || '',
            e.user?.department || '',
            e.user?.yearLevel || '',
            e.entryMethod,
            e.status,
          ].join(',');
        }),
      ].join('\n');

      await logAuditAction({
        adminId: req.admin.adminId,
        actionType: 'export',
        targetTable: 'reports',
        description: `Generated ${reportType} report (${entries.length} entries)`,
        ipAddress: req.ip || req.socket.remoteAddress || null,
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=report_${reportType}_${Date.now()}.csv`
      );
      res.send(csv);
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid format. Only "csv" is supported.',
      });
    }
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/reports/export/:id - Export specific entry log by ID
export const exportEntryById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const entry = await EntryLog.findByPk(id, {
      include: [{ model: User, as: 'user' }],
    });

    if (!entry) {
      res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
      return;
    }

    const date = new Date(entry.entryTimestamp);
    const csv = [
      'Log ID,Date,Time,ID Number,Name,User Type,College,Department,Year Level,Entry Method,Status',
      [
        entry.logId,
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        entry.user?.idNumber || '',
        `"${entry.user?.firstName} ${entry.user?.lastName}"`,
        entry.user?.userType || '',
        entry.user?.college || '',
        entry.user?.department || '',
        entry.user?.yearLevel || '',
        entry.entryMethod,
        entry.status,
      ].join(','),
    ].join('\n');

    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'export',
      targetTable: 'entry_logs',
      targetId: entry.logId,
      description: `Exported entry log ID ${id}`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=entry_${id}_${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export entry by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export entry',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

const generateStats = (entries: EntryLog[]) => {
  const byCollege: Record<string, number> = {};
  const byDepartment: Record<string, number> = {};
  const byHour: Record<string, number> = {};
  let students = 0;
  let faculty = 0;

  entries.forEach((entry) => {
    if (entry.user) {

      if (entry.user.userType === 'student') students++;
      if (entry.user.userType === 'faculty') faculty++;

      const college = entry.user.college;
      byCollege[college] = (byCollege[college] || 0) + 1;

      const department = entry.user.department;
      byDepartment[department] = (byDepartment[department] || 0) + 1;
    }

    const hour = new Date(entry.entryTimestamp).getHours();
    const hourKey = `${hour}:00`;
    byHour[hourKey] = (byHour[hourKey] || 0) + 1;
  });

  return {
    totalEntries: entries.length,
    students,
    faculty,
    byCollege,
    byDepartment,
    byHour,
  };
};