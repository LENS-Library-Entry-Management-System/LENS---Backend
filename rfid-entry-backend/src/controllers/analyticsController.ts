import { Request, Response } from 'express';
import sequelize from '../config/database';
import { QueryTypes, Op } from 'sequelize';
import User from '../models/User';
import EntryLog from '../models/EntryLog';

export class AnalyticsController {
  /**
   * GET /api/dashboard/stats
   * Overall statistics
   */
  static async getDashboardStats(_req: Request, res: Response) {
    try {
      console.log('Fetching dashboard stats...');

      // Get total entries count
      const totalEntries = await EntryLog.count();
      console.log('Total entries:', totalEntries);

      // Get unique students count
      const uniqueStudents = await User.count({
        where: { userType: 'student' }
      });
      console.log('Unique students:', uniqueStudents);

      // Get today's entries
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayEntries = await EntryLog.count({
        where: {
          entryTimestamp: {
            [Op.gte]: todayStart
          }
        }
      });
      console.log('Today\'s entries:', todayEntries);

      // Get average entries per day (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentEntries = await EntryLog.count({
        where: {
          entryTimestamp: {
            [Op.gte]: thirtyDaysAgo
          }
        }
      });

      const averageEntriesPerDay = Math.round(recentEntries / 30);
      console.log('Average entries per day:', averageEntriesPerDay);

      res.json({
        success: true,
        data: {
          totalEntries,
          uniqueStudents,
          todayEntries,
          averageEntriesPerDay,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/analytics/peak-hours
   * Peak hours analysis
   */
  static async getPeakHours(_req: Request, res: Response) {
    try {
      console.log('Fetching peak hours...');

      const result = await sequelize.query<{ hour: string; count: string }>(
        `SELECT EXTRACT(HOUR FROM entry_timestamp) as hour, COUNT(*) as count
         FROM entry_logs
         GROUP BY EXTRACT(HOUR FROM entry_timestamp)
         ORDER BY hour`,
        { type: QueryTypes.SELECT }
      );

      // Initialize all hours with 0
      const hourCounts: { [key: number]: number } = {};
      for (let i = 0; i < 24; i++) {
        hourCounts[i] = 0;
      }

      // Fill in actual counts
      result.forEach((row) => {
        const hour = parseInt(row.hour);
        hourCounts[hour] = parseInt(row.count);
      });

      // Format for response
      const peakHoursData = Object.entries(hourCounts).map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        label: `${hour.toString().padStart(2, '0')}:00`,
      }));

      // Find peak hour
      const peakHour = peakHoursData.reduce((max, curr) =>
        curr.count > max.count ? curr : max
      );

      console.log('Peak hour:', peakHour);

      res.json({
        success: true,
        data: {
          peakHours: peakHoursData,
          peakHour: {
            hour: peakHour.hour,
            count: peakHour.count,
            label: peakHour.label,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching peak hours:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch peak hours analysis',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/analytics/trends
   * Entry trends over time
   */
  static async getTrends(req: Request, res: Response) {
    try {
      const { period = '30d' } = req.query;
      console.log('Fetching trends for period:', period);

      let daysBack = 30;
      if (period === '7d') daysBack = 7;
      else if (period === '90d') daysBack = 90;

      const result = await sequelize.query<{ date: Date; count: string }>(
        `SELECT DATE(entry_timestamp) as date, COUNT(*) as count
         FROM entry_logs
         WHERE entry_timestamp >= CURRENT_DATE - INTERVAL '${daysBack} days'
         GROUP BY DATE(entry_timestamp)
         ORDER BY date ASC`,
        { type: QueryTypes.SELECT }
      );

      // Initialize all dates in range
      const dateCounts: { [key: string]: number } = {};
      for (let i = 0; i < daysBack; i++) {
        const date = new Date();
        date.setDate(date.getDate() - daysBack + i + 1);
        const dateKey = date.toISOString().split('T')[0];
        dateCounts[dateKey] = 0;
      }

      // Fill in actual counts
      result.forEach((row) => {
        const dateKey = new Date(row.date).toISOString().split('T')[0];
        dateCounts[dateKey] = parseInt(row.count);
      });

      // Format for response
      const trendsData = Object.entries(dateCounts).map(([date, count]) => ({
        date,
        count,
        label: new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      }));

      const totalEntries = result.reduce((sum, row) => sum + parseInt(row.count), 0);

      console.log('Trends data points:', trendsData.length);

      res.json({
        success: true,
        data: {
          period,
          trends: trendsData,
          totalEntries,
        },
      });
    } catch (error) {
      console.error('Error fetching trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch entry trends',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/analytics/by-college
   * College breakdown
   */
  static async getByCollege(_req: Request, res: Response) {
    try {
      console.log('Fetching college breakdown...');

      const result = await sequelize.query<{ college: string; count: string }>(
        `SELECT u.college, COUNT(el.log_id) as count
         FROM entry_logs el
         JOIN users u ON el.user_id = u.user_id
         WHERE u.user_type = 'student'
         GROUP BY u.college
         ORDER BY count DESC`,
        { type: QueryTypes.SELECT }
      );

      const totalEntries = await EntryLog.count();

      // Format for response
      const collegeData = result.map((row) => ({
        college: row.college || 'Unknown',
        count: parseInt(row.count),
        percentage: totalEntries > 0 ? ((parseInt(row.count) / totalEntries) * 100).toFixed(2) : '0.00',
      }));

      console.log('College breakdown:', collegeData);

      res.json({
        success: true,
        data: {
          colleges: collegeData,
          totalEntries,
        },
      });
    } catch (error) {
      console.error('Error fetching college breakdown:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch college breakdown',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/analytics/by-department
   * Department breakdown
   */
  static async getByDepartment(_req: Request, res: Response) {
    try {
      console.log('Fetching department breakdown...');

      const result = await sequelize.query<{ department: string; college: string; count: string }>(
        `SELECT u.department, u.college, COUNT(el.log_id) as count
         FROM entry_logs el
         JOIN users u ON el.user_id = u.user_id
         WHERE u.user_type = 'student'
         GROUP BY u.department, u.college
         ORDER BY count DESC`,
        { type: QueryTypes.SELECT }
      );

      const totalEntries = await EntryLog.count();

      // Format for response
      const departmentData = result.map((row) => ({
        department: row.department || 'Unknown',
        college: row.college || 'Unknown',
        count: parseInt(row.count),
        percentage: totalEntries > 0 ? ((parseInt(row.count) / totalEntries) * 100).toFixed(2) : '0.00',
      }));

      console.log('Department breakdown:', departmentData);

      res.json({
        success: true,
        data: {
          departments: departmentData,
          totalEntries,
        },
      });
    } catch (error) {
      console.error('Error fetching department breakdown:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch department breakdown',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}