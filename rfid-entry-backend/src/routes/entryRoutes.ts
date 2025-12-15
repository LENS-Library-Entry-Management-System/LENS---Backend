import { Router } from 'express';
import {
  getAllEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
  getActiveEntries,
  filterEntries,
  exportEntries,
} from '../controllers/entryController';
import { authenticate } from '../middleware/auth';
import { csrfProtection, csrfTokenProvider } from '../middleware/csrf';

const router = Router();

// All entry routes require authentication
router.use(authenticate);
router.use(csrfTokenProvider);
router.use(csrfProtection);

// Real-time monitoring (must be before /:id to avoid conflict)
router.get('/active', getActiveEntries);

// Export entries
router.get('/export', exportEntries);

// Filter/search entries
router.post('/filter', filterEntries);

// CRUD operations
router.get('/', getAllEntries);
router.get('/:id', getEntryById);
router.put('/:id', updateEntry);
router.delete('/:id', deleteEntry);

export default router;