import { Request, Response } from 'express';
import { Op } from 'sequelize';
import EntryLog from '../models/EntryLog';
import User from '../models/User';
import { logAuditAction } from '../services/auditService';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// GET /api/reports/daily - Daily report
export const getDailyReport = async (_req: Request, res: Response): Promise<void> => {
  try {
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
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'idNumber', 'firstName', 'lastName', 'userType', 'college', 'department'],
        },
      ],
      order: [['entryTimestamp', 'DESC']],
    });

    const stats = {
      totalEntries: entries.length,
      students: entries.filter((e) => e.user?.userType === 'student').length,
      faculty: entries.filter((e) => e.user?.userType === 'faculty').length,
      byCollege: {} as Record<string, number>,
      byHour: {} as Record<string, number>,
    };

    // Group by college
    entries.forEach((entry) => {
      const college = entry.user?.college || 'Unknown';
      stats.byCollege[college] = (stats.byCollege[college] || 0) + 1;

      // Group by hour
      const hour = new Date(entry.entryTimestamp).getHours();
      const hourKey = `${hour}:00`;
      stats.byHour[hourKey] = (stats.byHour[hourKey] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        reportType: 'daily',
        date: today.toISOString().split('T')[0],
        stats,
        entries: entries.slice(0, 100), // Limit to 100 for response size
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
export const getWeeklyReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    const startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const endDate = endOfWeek(today, { weekStartsOn: 1 });

    const entries = await EntryLog.findAll({
      where: {
        entryTimestamp: {
          [Op.between]: [startDate, endDate],
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
    });

    const stats = {
      totalEntries: entries.length,
      students: entries.filter((e) => e.user?.userType === 'student').length,
      faculty: entries.filter((e) => e.user?.userType === 'faculty').length,
      byCollege: {} as Record<string, number>,
      byDay: {} as Record<string, number>,
      dailyAverage: 0,
    };

    // Group by college
    entries.forEach((entry) => {
      const college = entry.user?.college || 'Unknown';
      stats.byCollege[college] = (stats.byCollege[college] || 0) + 1;

      // Group by day
      const day = new Date(entry.entryTimestamp).toLocaleDateString('en-US', { weekday: 'short' });
      stats.byDay[day] = (stats.byDay[day] || 0) + 1;
    });

    stats.dailyAverage = Math.round(entries.length / 7);

    res.json({
      success: true,
      data: {
        reportType: 'weekly',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        stats,
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
export const getMonthlyReport = async (_req: Request, res: Response): Promise<void> => {
  try {
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
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'idNumber', 'firstName', 'lastName', 'userType', 'college', 'department'],
        },
      ],
      order: [['entryTimestamp', 'DESC']],
    });

    const stats = {
      totalEntries: entries.length,
      students: entries.filter((e) => e.user?.userType === 'student').length,
      faculty: entries.filter((e) => e.user?.userType === 'faculty').length,
      byCollege: {} as Record<string, number>,
      byDepartment: {} as Record<string, number>,
      dailyAverage: 0,
      peakDay: '',
      peakDayCount: 0,
    };

    const dayCount: Record<string, number> = {};

    // Group by college and department
    entries.forEach((entry) => {
      const college = entry.user?.college || 'Unknown';
      const department = entry.user?.department || 'Unknown';
      stats.byCollege[college] = (stats.byCollege[college] || 0) + 1;
      stats.byDepartment[department] = (stats.byDepartment[department] || 0) + 1;

      // Track daily counts for peak day
      const day = new Date(entry.entryTimestamp).toISOString().split('T')[0];
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    // Calculate daily average
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    stats.dailyAverage = Math.round(entries.length / daysInMonth);

    // Find peak day
    Object.entries(dayCount).forEach(([day, count]) => {
      if (count > stats.peakDayCount) {
        stats.peakDay = day;
        stats.peakDayCount = count;
      }
    });

    res.json({
      success: true,
      data: {
        reportType: 'monthly',
        month: today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        stats,
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
    const { startDate, endDate, college, department, userType } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
      return;
    }

    const start = startOfDay(new Date(startDate as string));
    const end = endOfDay(new Date(endDate as string));

    const where: any = {
      entryTimestamp: {
        [Op.between]: [start, end],
      },
      status: 'success',
    };

    const userWhere: any = {};
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

    const stats = {
      totalEntries: entries.length,
      students: entries.filter((e) => e.user?.userType === 'student').length,
      faculty: entries.filter((e) => e.user?.userType === 'faculty').length,
      byCollege: {} as Record<string, number>,
      byDepartment: {} as Record<string, number>,
    };

    entries.forEach((entry) => {
      const college = entry.user?.college || 'Unknown';
      const department = entry.user?.department || 'Unknown';
      stats.byCollege[college] = (stats.byCollege[college] || 0) + 1;
      stats.byDepartment[department] = (stats.byDepartment[department] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        reportType: 'custom',
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        filters: { college, department, userType },
        stats,
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
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { reportType, startDate, endDate, format = 'csv', college, department, userType } = req.body;

    if (!reportType || !startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'Report type, start date, and end date are required',
      });
      return;
    }

    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    const where: any = {
      entryTimestamp: {
        [Op.between]: [start, end],
      },
      status: 'success',
    };

    const userWhere: any = {};
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
      order: [['entryTimestamp', 'ASC']],
    });

    if (format === 'csv') {
      const csv = [
        'Log ID,Date,Time,ID Number,Name,User Type,College,Department,Year Level,Entry Method',
        ...entries.map((e) => {
          const timestamp = new Date(e.entryTimestamp);
          return [
            e.logId,
            timestamp.toLocaleDateString(),
            timestamp.toLocaleTimeString(),
            e.user?.idNumber || '',
            `"${e.user?.firstName} ${e.user?.lastName}"`,
            e.user?.userType || '',
            e.user?.college || '',
            e.user?.department || '',
            e.user?.yearLevel || 'N/A',
            e.entryMethod,
          ].join(',');
        }),
      ].join('\n');

      // Log audit action
      await logAuditAction({
        admin_id: req.admin.adminId,
        action_type: 'export',
        target_table: 'entry_logs',
        description: `Generated ${reportType} report (${entries.length} entries)`,
        ip_address: req.ip || req.socket.remoteAddress || null,
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report_${reportType}_${Date.now()}.csv`);
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