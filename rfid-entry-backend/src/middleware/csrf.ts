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

  // For admin routes, require CSRF token
  if (req.path.startsWith('/api/users') || req.path.startsWith('/api/entries') ||
      req.path.startsWith('/api/admin') || req.path.startsWith('/api/reports')) {

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
