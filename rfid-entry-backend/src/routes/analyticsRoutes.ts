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

// Apply authentication middleware to all protected analytics routes
router.use(authenticate);

// Dashboard & Analytics Routes
router.get('/dashboard/stats', AnalyticsController.getDashboardStats);
router.get('/analytics/peak-hours', AnalyticsController.getPeakHours);
router.get('/analytics/trends', AnalyticsController.getTrends);
router.get('/analytics/by-college', AnalyticsController.getByCollege);
router.get('/analytics/by-department', AnalyticsController.getByDepartment);

export default router;