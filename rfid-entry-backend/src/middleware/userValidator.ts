import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateCreateUser = [
  body('idNumber')
    .trim()
    .notEmpty()
    .withMessage('ID number is required')
    .isLength({ max: 20 })
    .withMessage('ID number must be 20 characters or less'),
  
  body('rfidTag')
    .trim()
    .notEmpty()
    .withMessage('RFID tag is required')
    .isLength({ max: 50 })
    .withMessage('RFID tag must be 50 characters or less'),
  
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name must be 100 characters or less'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name must be 100 characters or less'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('userType')
    .notEmpty()
    .withMessage('User type is required')
    .isIn(['student', 'faculty'])
    .withMessage('User type must be "student" or "faculty"'),
  
  body('college')
    .trim()
    .notEmpty()
    .withMessage('College is required'),
  
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required'),
  
  body('yearLevel')
    .if(body('userType').equals('student'))
    .notEmpty()
    .withMessage('Year level is required for students'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be "active" or "inactive"'),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  },
];

export const validateUpdateUser = [
  body('idNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('ID number must be 20 characters or less'),
  
  body('rfidTag')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('RFID tag must be 50 characters or less'),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('First name must be 100 characters or less'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Last name must be 100 characters or less'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('userType')
    .optional()
    .isIn(['student', 'faculty'])
    .withMessage('User type must be "student" or "faculty"'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be "active" or "inactive"'),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  },
];