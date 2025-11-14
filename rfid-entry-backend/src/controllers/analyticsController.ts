import { Request, Response } from 'express';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

export class AnalyticsController {
  /**
   * GET /api/dashboard/stats
   * Overall statistics
   */
  static async getDashboardStats(_req: Request, res: Response) {
    try {
      // Get total entries count
      const totalEntriesResult = await sequelize.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM entries',
        { type: QueryTypes.SELECT }
      );
      const totalEntries = parseInt(totalEntriesResult[0].count);

      // Get unique students count
      const uniqueStudentsResult = await sequelize.query<{ count: string }>(
        'SELECT COUNT(DISTINCT student_id) as count FROM entries',
        { type: QueryTypes.SELECT }
      );
      const uniqueStudents = parseInt(uniqueStudentsResult[0].count);

      // Get today's entries
      const todayEntriesResult = await sequelize.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM entries 
         WHERE DATE(timestamp) = CURRENT_DATE`,
        { type: QueryTypes.SELECT }
      );
      const todayEntries = parseInt(todayEntriesResult[0].count);

      // Get average entries per day (last 30 days)
      const recentEntriesResult = await sequelize.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM entries 
         WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'`,
        { type: QueryTypes.SELECT }
      );
      const recentEntries = parseInt(recentEntriesResult[0].count);

      res.json({
        success: true,
        data: {
          totalEntries,
          uniqueStudents,
          todayEntries,
          averageEntriesPerDay: Math.round(recentEntries / 30),
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
      });
    }
  }

  /**
   * GET /api/analytics/peak-hours
   * Peak hours analysis
   */
  static async getPeakHours(_req: Request, res: Response) {
    try {
      const result = await sequelize.query<{ hour: string; count: string }>(
        `SELECT EXTRACT(HOUR FROM timestamp) as hour, COUNT(*) as count
         FROM entries
         GROUP BY EXTRACT(HOUR FROM timestamp)
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

      let daysBack = 30;
      if (period === '7d') daysBack = 7;
      else if (period === '90d') daysBack = 90;

      const result = await sequelize.query<{ date: Date; count: string }>(
        `SELECT DATE(timestamp) as date, COUNT(*) as count
         FROM entries
         WHERE timestamp >= CURRENT_DATE - INTERVAL '${daysBack} days'
         GROUP BY DATE(timestamp)
         ORDER BY date ASC`,
        { type: QueryTypes.SELECT }
      );

      // Initialize all dates in range
      const dateCounts: { [key: string]: number } = {};
      for (let i = 0; i < daysBack; i++) {
        const date = new Date();
        date.setDate(date.getDate() - daysBack + i);
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
      });
    }
  }

  /**
   * GET /api/analytics/by-college
   * College breakdown
   */
  static async getByCollege(_req: Request, res: Response) {
    try {
      const result = await sequelize.query<{ college: string; count: string }>(
        `SELECT s.college, COUNT(e.id) as count
         FROM entries e
         JOIN students s ON e.student_id = s.id
         GROUP BY s.college
         ORDER BY count DESC`,
        { type: QueryTypes.SELECT }
      );

      const totalEntriesResult = await sequelize.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM entries',
        { type: QueryTypes.SELECT }
      );
      const totalEntries = parseInt(totalEntriesResult[0].count);

      // Format for response
      const collegeData = result.map((row) => ({
        college: row.college || 'Unknown',
        count: parseInt(row.count),
        percentage: ((parseInt(row.count) / totalEntries) * 100).toFixed(2),
      }));

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
      });
    }
  }

  /**
   * GET /api/analytics/by-department
   * Department breakdown
   */
  static async getByDepartment(_req: Request, res: Response) {
    try {
      const result = await sequelize.query<{ department: string; college: string; count: string }>(
        `SELECT s.department, s.college, COUNT(e.id) as count
         FROM entries e
         JOIN students s ON e.student_id = s.id
         GROUP BY s.department, s.college
         ORDER BY count DESC`,
        { type: QueryTypes.SELECT }
      );

      const totalEntriesResult = await sequelize.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM entries',
        { type: QueryTypes.SELECT }
      );
      const totalEntries = parseInt(totalEntriesResult[0].count);

      // Format for response
      const departmentData = result.map((row) => ({
        department: row.department || 'Unknown',
        college: row.college || 'Unknown',
        count: parseInt(row.count),
        percentage: ((parseInt(row.count) / totalEntries) * 100).toFixed(2),
      }));

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
      });
    }
  }
}