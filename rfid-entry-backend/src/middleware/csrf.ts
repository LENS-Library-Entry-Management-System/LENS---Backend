import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Simple CSRF protection middleware
const csrfTokens = new Map<string, { token: string; expires: number }>();

// Generate CSRF token
export const generateCSRFToken = (sessionId: string): string => {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + (60 * 60 * 1000); // 1 hour

  csrfTokens.set(sessionId, { token, expires });
  return token;
};

// Validate CSRF token
export const validateCSRFToken = (sessionId: string, token: string): boolean => {
  const stored = csrfTokens.get(sessionId);

  if (!stored) return false;

  // Check if token is expired
  if (Date.now() > stored.expires) {
    csrfTokens.delete(sessionId);
    return false;
  }

  return stored.token === token;
};

// CSRF protection middleware for admin routes
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const path = req.originalUrl.split('?')[0];

  // Skip CSRF for public endpoints
  if (
    path === '/api/entries/scan' ||
    path === '/api/entries/manual' ||
    path === '/api/users/upsert'
  ) {
    return next();
  }

  // For admin routes, require CSRF token
  if (path.startsWith('/api/users') || path.startsWith('/api/entries') ||
      path.startsWith('/api/admin') || path.startsWith('/api/reports')) {

    const token = req.headers['x-csrf-token'] as string;
    const sessionId = req.admin?.adminId?.toString() || req.ip || 'anonymous';

    if (!token || !validateCSRFToken(sessionId, token)) {
      res.status(403).json({
        success: false,
        message: 'Invalid or missing CSRF token',
      });
      return;
    }
  }

  next();
};

// Middleware to provide CSRF token to client
export const csrfTokenProvider = (req: Request, res: Response, next: NextFunction): void => {
  if (req.admin) {
    const sessionId = req.admin.adminId.toString();
    const token = generateCSRFToken(sessionId);
    res.setHeader('X-CSRF-Token', token);
  }
  next();
};
