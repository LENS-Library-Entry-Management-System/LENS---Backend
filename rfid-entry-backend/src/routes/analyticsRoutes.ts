import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Health check for analytics routes (no auth required)
router.get('/analytics/health', (_req, res) => {
  res.json({ 
    success: true, 
    message: 'Analytics routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Dashboard & Analytics Routes
router.get('/dashboard/stats', authenticate, AnalyticsController.getDashboardStats);
router.get('/analytics/peak-hours', authenticate, AnalyticsController.getPeakHours);
router.get('/analytics/trends', authenticate, AnalyticsController.getTrends);
router.get('/analytics/by-college', authenticate, AnalyticsController.getByCollege);
router.get('/analytics/by-department', authenticate, AnalyticsController.getByDepartment);

export default router;