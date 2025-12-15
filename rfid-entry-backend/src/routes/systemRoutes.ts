import { Router } from 'express';
import {
  createBackup,
  getBackups,
  restoreBackup,
  getSystemHealth,
  optimizeDatabase,
  getSystemLogs,
} from '../controllers/systemController';
import { authenticate, authorize } from '../middleware/auth';
import { csrfProtection, csrfTokenProvider } from '../middleware/csrf';

const router = Router();

// Health check (public - no auth required)
router.get('/health', getSystemHealth);

// All other system routes require super_admin authentication
router.use(authenticate);
router.use(csrfTokenProvider);
router.use(csrfProtection);
router.use(authorize('super_admin'));

// Backup & Restore
router.post('/backup', createBackup);
router.get('/backups', getBackups);
router.post('/restore/:id', restoreBackup);

// System Maintenance
router.post('/optimize', optimizeDatabase);
router.get('/logs', getSystemLogs);

export default router;