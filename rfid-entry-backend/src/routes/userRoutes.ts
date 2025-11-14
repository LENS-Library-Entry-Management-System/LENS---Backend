import { Router } from 'express';
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  searchUsers,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validateCreateUser, validateUpdateUser } from '../middleware/userValidator';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Search must be before /:id to avoid treating "search" as an ID
router.get('/search', searchUsers);

// CRUD operations
router.get('/', getAllUsers);
router.post('/',  validateCreateUser, createUser);
router.get('/:id', getUserById);
router.put('/:id', validateUpdateUser, updateUser);
router.delete('/:id', deleteUser);

export default router;