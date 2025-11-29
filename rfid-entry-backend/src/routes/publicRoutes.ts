import { Router } from 'express';
import {
  scanEntry,
  manualEntry,
  getUserInfo,
  getUserByToken,
  upsertUser,
} from '../controllers/publicController';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiting to all public routes
router.use(apiRateLimiter);

// Public endpoints - no authentication required
router.post('/entries/scan', scanEntry);
router.post('/entries/manual', manualEntry);
router.get('/users/:id', getUserInfo);
// Token-based retrieval for frontend form
router.get('/entries/form', getUserByToken);
// Upsert endpoint for signup or edit
router.post('/users/upsert', upsertUser);

export default router;