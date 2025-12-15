import { Request, Response, NextFunction } from 'express';

// Middleware to sanitize user inputs
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  const sanitizeObject = (obj: any) => {
    if (!obj) return;
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // req.sanitize is added by express-sanitizer middleware
        obj[key] = req.sanitize(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
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
