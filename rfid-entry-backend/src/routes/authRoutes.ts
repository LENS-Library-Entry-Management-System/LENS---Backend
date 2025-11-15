import { Router } from 'express';
import {
  login,
  logout,
  getProfile,
  updateProfile,
  refreshToken,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authRateLimiter, refreshTokenRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes with rate limiting
router.post('/login', authRateLimiter, login);
router.post('/refresh', refreshTokenRateLimiter, refreshToken);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;
