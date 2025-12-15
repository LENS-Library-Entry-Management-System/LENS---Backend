import { Router } from 'express';
import {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getCustomReport,
  generateReport,
  exportEntryById,
} from '../controllers/reportController';
import { authenticate } from '../middleware/auth';
import { csrfProtection, csrfTokenProvider } from '../middleware/csrf';

const router = Router();

// All report routes require authentication
router.use(authenticate);
router.use(csrfTokenProvider);
router.use(csrfProtection);

// Report endpoints
router.get('/daily', getDailyReport);
router.get('/weekly', getWeeklyReport);
router.get('/monthly', getMonthlyReport);
router.get('/custom', getCustomReport);
router.post('/generate', generateReport);
router.get('/export/:id', exportEntryById);

export default router;