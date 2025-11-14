import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import User from '../models/User';
import EntryLog from '../models/EntryLog';
import { logAuditAction } from '../services/auditService';

// GET /api/users - List all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const userType = req.query.userType as string;
    const status = req.query.status as string;

    const where: WhereOptions & { [k: symbol]: unknown } = {};

    if (userType) where.userType = userType;
    if (status) where.status = status;

    const { count, rows } = await User.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// POST /api/users - Create user
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const {
      idNumber,
      rfidTag,
      firstName,
      lastName,
      email,
      userType,
      college,
      department,
      yearLevel,
      status = 'active',
    } = req.body;

    // Validation
    if (!idNumber || !rfidTag || !firstName || !lastName || !userType || !college || !department) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: idNumber, rfidTag, firstName, lastName, userType, college, department',
      });
      return;
    }

    // Check if ID number already exists
    const existingIdNumber = await User.findOne({ where: { idNumber } });
    if (existingIdNumber) {
      res.status(409).json({
        success: false,
        message: 'ID number already exists',
      });
      return;
    }

    // Check if RFID tag already exists
    const existingRfid = await User.findOne({ where: { rfidTag } });
    if (existingRfid) {
      res.status(409).json({
        success: false,
        message: 'RFID tag already exists',
      });
      return;
    }

    // Validate user type
    if (!['student', 'faculty'].includes(userType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user type. Must be "student" or "faculty"',
      });
      return;
    }

    // Validate year level for students
    if (userType === 'student' && !yearLevel) {
      res.status(400).json({
        success: false,
        message: 'Year level is required for students',
      });
      return;
    }

    const user = await User.create({
      idNumber,
      rfidTag,
      firstName,
      lastName,
      email: email || null,
      userType,
      college,
      department,
      yearLevel: userType === 'student' ? yearLevel : null,
      status,
    });

    // Log audit action
    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'edit',
      targetTable: 'users',
      targetId: user.userId,
      description: JSON.stringify({
        action: 'create',
        user: {
          idNumber: user.idNumber,
          name: `${user.firstName} ${user.lastName}`,
          userType: user.userType,
        },
      }),
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/users/:id - Get user details
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // ✅ FIX: Use findByPk with the actual user_id (numeric)
    const user = await User.findByPk(parseInt(id), {  // ← Add parseInt()
      include: [
        {
          model: EntryLog,
          as: 'entryLogs',
          limit: 10,
          order: [['entryTimestamp', 'DESC']],
        },
      ],
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Get entry statistics
    const totalEntries = await EntryLog.count({
      where: { userId: user.userId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entriesToday = await EntryLog.count({
      where: {
        userId: user.userId,
        entryTimestamp: {
          [Op.gte]: today,
        },
      },
    });

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalEntries,
          entriesToday,
        },
      },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// PUT /api/users/:id - Update user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { id } = req.params;
    const {
      idNumber,
      rfidTag,
      firstName,
      lastName,
      email,
      userType,
      college,
      department,
      yearLevel,
      status,
    } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const oldValues = {
      idNumber: user.idNumber,
      rfidTag: user.rfidTag,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
      college: user.college,
      department: user.department,
      yearLevel: user.yearLevel,
      status: user.status,
    };

    // Check if new ID number already exists (if changing)
    if (idNumber && idNumber !== user.idNumber) {
      const existingIdNumber = await User.findOne({ where: { idNumber } });
      if (existingIdNumber) {
        res.status(409).json({
          success: false,
          message: 'ID number already exists',
        });
        return;
      }
      user.idNumber = idNumber;
    }

    // Check if new RFID tag already exists (if changing)
    if (rfidTag && rfidTag !== user.rfidTag) {
      const existingRfid = await User.findOne({ where: { rfidTag } });
      if (existingRfid) {
        res.status(409).json({
          success: false,
          message: 'RFID tag already exists',
        });
        return;
      }
      user.rfidTag = rfidTag;
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email !== undefined) user.email = email || null;
    if (userType) user.userType = userType;
    if (college) user.college = college;
    if (department) user.department = department;
    if (yearLevel !== undefined) user.yearLevel = yearLevel || null;
    if (status) user.status = status;

    await user.save();

    // Log audit action
    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'edit',
      targetTable: 'users',
      targetId: user.userId,
      description: JSON.stringify({
        old: oldValues,
        new: {
          idNumber: user.idNumber,
          rfidTag: user.rfidTag,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
          college: user.college,
          department: user.department,
          yearLevel: user.yearLevel,
          status: user.status,
        },
      }),
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// DELETE /api/users/:id - Delete user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Store user info before deletion
    const deletedUserInfo = {
      idNumber: user.idNumber,
      name: `${user.firstName} ${user.lastName}`,
      userType: user.userType,
      college: user.college,
      department: user.department,
    };

    await user.destroy();

    // Log audit action
    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'delete',
      targetTable: 'users',
      targetId: parseInt(id),
      description: JSON.stringify({
        deletedUser: deletedUserInfo,
      }),
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/users/search - Search users
export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, userType, college, department, status, page = 1, limit = 50 } = req.query;

    if (!q) {
      res.status(400).json({
        success: false,
        message: 'Search query "q" is required',
      });
      return;
    }

    const where: WhereOptions & { [k: symbol]: unknown } = {};

    // Search in multiple fields
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${q}%` } },
      { lastName: { [Op.iLike]: `%${q}%` } },
      { idNumber: q },
      { email: { [Op.iLike]: `%${q}%` } },
      { rfidTag: q },
    ];

    // Additional filters
    if (userType) where.userType = userType;
    if (college) where.college = college;
    if (department) where.department = department;
    if (status) where.status = status;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { count, rows } = await User.findAndCountAll({
      where,
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
      limit: parseInt(limit as string),
      offset,
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(count / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};