import { Request, Response, NextFunction } from 'express';

import sanitizer from 'express-sanitizer';

// Middleware to sanitize user inputs
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  // Sanitize all string inputs
  if (req.body) {
    req.body = sanitizer(req.body);
  }

  if (req.query) {
    req.query = sanitizer(req.query);
  }

  if (req.params) {
    req.params = sanitizer(req.params);
  }

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
