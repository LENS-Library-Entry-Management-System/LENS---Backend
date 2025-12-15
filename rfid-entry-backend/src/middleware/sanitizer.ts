import { Request, Response, NextFunction } from 'express';

// Middleware to sanitize user inputs
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  const sanitizeObject = (obj: Record<string, unknown>) => {
    if (!obj) return;
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === 'string') {
        // req.sanitize is added by express-sanitizer middleware
        obj[key] = req.sanitize(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitizeObject(value as Record<string, unknown>);
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }

  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

// Middleware to validate and limit request body size
export const limitRequestSize = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = parseInt(req.headers['content-length'] || '0');

  // Limit to 10MB for file uploads, 1MB for regular requests
  const maxSize = req.headers['content-type']?.includes('multipart/form-data') ? 10 * 1024 * 1024 : 1 * 1024 * 1024;

  if (contentLength > maxSize) {
    res.status(413).json({
      success: false,
      message: 'Request entity too large',
    });
    return;
  }

  next();
};
