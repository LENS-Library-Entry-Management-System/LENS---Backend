import { Router } from 'express';
import {
  getAllAdmins,
  createAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { validateCreateAdmin, validateUpdateAdmin } from '../middleware/adminValidator';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// All admin management routes require super_admin role
router.use(authorize('super_admin'));

// CRUD operations
router.get('/', getAllAdmins);
router.post('/', validateCreateAdmin, createAdmin);
router.get('/:id', getAdminById);
router.put('/:id', validateUpdateAdmin, updateAdmin);
router.delete('/:id', deleteAdmin);

export default router;