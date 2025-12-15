import { Router } from 'express';
import {
  getAllAuditLogs,
  getAuditLogById,
  getAuditLogsByAdmin,
  getAuditStats,
} from '../controllers/auditController';
import { authenticate, authorize } from '../middleware/auth';
import { csrfProtection, csrfTokenProvider } from '../middleware/csrf';

const router = Router();

// All audit log routes require authentication
router.use(authenticate);
router.use(csrfTokenProvider);
router.use(csrfProtection);

// Statistics endpoint (must be before /:id)
router.get('/stats', authorize('super_admin'), getAuditStats);

// Admin-specific logs (must be before /:id)
router.get('/admin/:adminId', getAuditLogsByAdmin);

// CRUD operations
router.get('/', getAllAuditLogs);
router.get('/:id', getAuditLogById);

export default router;