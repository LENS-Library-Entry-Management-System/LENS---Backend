import { Router } from 'express';
import {
  scanEntry,
  manualEntry,
  validateRfid,
  getUserInfo,
} from '../controllers/publicController';

const router = Router();

// Public endpoints - no authentication required
router.post('/entries/scan', scanEntry);
router.post('/entries/manual', manualEntry);
router.get('/entries/validate/:rfid', validateRfid);
router.get('/users/:id', getUserInfo);

export default router;