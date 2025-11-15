import { Router } from 'express';
import {
  scanEntry,
  manualEntry,
  validateRfid,
  getUserInfo,
} from '../controllers/publicController';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiting to all public routes
router.use(apiRateLimiter);

// Public endpoints - no authentication required
router.post('/entries/scan', scanEntry);
router.post('/entries/manual', manualEntry);
router.get('/entries/validate/:rfid', validateRfid);
router.get('/users/:id', getUserInfo);

export default router;