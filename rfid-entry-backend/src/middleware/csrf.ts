import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { redis } from '../config/redis';

const CSRF_TTL = 60 * 60; // 1 hour in seconds

// Generate CSRF token
export const generateCSRFToken = async (sessionId: string): Promise<string> => {
  const key = `csrf:${sessionId}`;
  const existingToken = await redis.get(key);

  if (existingToken) {
    // Extend TTL
    await redis.expire(key, CSRF_TTL);
    return existingToken;
  }

  const token = crypto.randomBytes(32).toString('hex');
  await redis.set(key, token, 'EX', CSRF_TTL);
  return token;
};

// Validate CSRF token
export const validateCSRFToken = async (sessionId: string, token: string): Promise<boolean> => {
  const storedToken = await redis.get(`csrf:${sessionId}`);
  return storedToken === token;
};

// CSRF protection middleware for admin routes
export const csrfProtection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Check if CSRF is enabled
  if (process.env.ENABLE_CSRF !== 'true') {
    return next();
  }

  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const path = req.originalUrl.split('?')[0];

  // Skip CSRF for public endpoints
  if (
    path === '/api/entries/scan' ||
    path === '/api/entries/manual' ||
    path === '/api/users/upsert' ||
    path === '/api/entries/form'
  ) {
    return next();
  }

  // For admin routes, require CSRF token
  if (path.startsWith('/api/users') || path.startsWith('/api/entries') ||
      path.startsWith('/api/admin') || path.startsWith('/api/reports')) {

    const token = req.headers['x-csrf-token'] as string;
    const sessionId = req.admin?.adminId?.toString() || req.ip || 'anonymous';

    if (!token) {
      console.warn(`[CSRF] Missing token. SessionId: ${sessionId}, Path: ${path}, Method: ${req.method}`);
      res.status(403).json({
        success: false,
        message: 'Missing CSRF token',
      });
      return;
    }

    const isValid = await validateCSRFToken(sessionId, token);
    if (!isValid) {
      console.warn(`[CSRF] Invalid token. SessionId: ${sessionId}, Token: ${token}, Path: ${path}`);
      res.status(403).json({
        success: false,
        message: 'Invalid or expired CSRF token',
      });
      return;
    }
  }

  next();
};

// Middleware to provide CSRF token to client
export const csrfTokenProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Check if CSRF is enabled
  if (process.env.ENABLE_CSRF !== 'true') {
    return next();
  }

  if (req.admin) {
    try {
      const sessionId = req.admin.adminId.toString();
      const token = await generateCSRFToken(sessionId);
      res.setHeader('X-CSRF-Token', token);
    } catch (error) {
      console.error('Error generating CSRF token:', error);
    }
  }
  next();
};
