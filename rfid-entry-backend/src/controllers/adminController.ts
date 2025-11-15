import { Request, Response } from 'express';
import Admin from '../models/Admin';
import AuditLog from '../models/AuditLog';
import { logAuditAction } from '../services/auditService';
import { Op } from 'sequelize';

// GET /api/admins - List all admins
export const getAllAdmins = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Only super_admin can list all admins
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only super admins can list all admins',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const role = req.query.role as string;

    const where: { role?: "super_admin" | "staff" } = {};

    // Filter by role
    if (role && ['super_admin', 'staff'].includes(role)) {
      where.role = role as "super_admin" | "staff";
    }

    const { count, rows } = await Admin.findAndCountAll({
      where,
      attributes: { exclude: ['passwordHash'] }, // Don't send password hashes
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return res.json({
      success: true,
      data: {
        admins: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admins',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// POST /api/admins - Create admin
export const createAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Only super_admin can create admins
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only super admins can create admins',
      });
    }

    const { username, password, fullName, email, role = 'staff' } = req.body;

    // Validation
    if (!username || !password || !fullName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: username, password, fullName, email',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Validate role
    if (!['super_admin', 'staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "super_admin" or "staff"',
      });
    }

    // Check if username already exists
    const existingUsername = await Admin.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists',
      });
    }

    // Check if email already exists
    const existingEmail = await Admin.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    }

    const admin = await Admin.create({
      username,
      passwordHash: password, // Will be hashed by model hook
      fullName,
      email,
      role,
    });

    // Log audit action
    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'edit',
      targetTable: 'admins',
      targetId: admin.adminId,
      description: JSON.stringify({
        action: 'create',
        admin: {
          username: admin.username,
          fullName: admin.fullName,
          role: admin.role,
        },
      }),
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: admin.toSafeObject(),
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create admin',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/admins/:id - Get admin details
export const getAdminById = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Only super_admin can view other admins, or admin can view themselves
    if (req.admin.role !== 'super_admin' && req.admin.adminId !== parseInt(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only view your own profile',
      });
    }

    const { id } = req.params;

    const admin = await Admin.findByPk(parseInt(id), {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Get audit log statistics
    const totalActions = await AuditLog.count({
      where: { adminId: admin.adminId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const actionsToday = await AuditLog.count({
      where: {
        adminId: admin.adminId,
        timestamp: {
          [Op.gte]: today,
        },
      },
    });

    return res.json({
      success: true,
      data: {
        admin,
        stats: {
          totalActions,
          actionsToday,
        },
      },
    });
  } catch (error) {
    console.error('Get admin by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// PUT /api/admins/:id - Update admin
export const updateAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { id } = req.params;
    const targetAdminId = parseInt(id);

    // Only super_admin can update other admins
    if (req.admin.role !== 'super_admin' && req.admin.adminId !== targetAdminId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only super admins can update other admins',
      });
    }

    const { username, password, fullName, email, role } = req.body;

    const admin = await Admin.findByPk(targetAdminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    const oldValues = {
      username: admin.username,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
    };

    // Check if new username already exists (if changing)
    if (username && username !== admin.username) {
      const existingUsername = await Admin.findOne({ where: { username } });
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists',
        });
      }
      admin.username = username;
    }

    // Check if new email already exists (if changing)
    if (email && email !== admin.email) {
      const existingEmail = await Admin.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
        });
      }
      admin.email = email;
    }

    // Update fields
    if (fullName) admin.fullName = fullName;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
        });
      }
      admin.passwordHash = password; // Will be hashed by model hook
    }

    // Only super_admin can change roles
    if (role) {
      if (req.admin.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Only super admins can change roles',
        });
      }

      // Prevent demoting yourself
      if (req.admin.adminId === targetAdminId && role !== 'super_admin') {
        return res.status(400).json({
          success: false,
          message: 'You cannot demote yourself from super_admin',
        });
      }

      admin.role = role;
    }

    await admin.save();

    // Log audit action
    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'edit',
      targetTable: 'admins',
      targetId: admin.adminId,
      description: JSON.stringify({
        old: oldValues,
        new: {
          username: admin.username,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          passwordChanged: !!password,
        },
      }),
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    return res.json({
      success: true,
      message: 'Admin updated successfully',
      data: admin.toSafeObject(),
    });
  } catch (error) {
    console.error('Update admin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update admin',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// DELETE /api/admins/:id - Delete admin
export const deleteAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Only super_admin can delete admins
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only super admins can delete admins',
      });
    }

    const { id } = req.params;
    const targetAdminId = parseInt(id);

    // Prevent deleting yourself
    if (req.admin.adminId === targetAdminId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete yourself',
      });
    }

    const admin = await Admin.findByPk(targetAdminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Store admin info before deletion
    const deletedAdminInfo = {
      username: admin.username,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
    };

    await admin.destroy();

    // Log audit action
    await logAuditAction({
      adminId: req.admin.adminId,
      actionType: 'delete',
      targetTable: 'admins',
      targetId: targetAdminId,
      description: JSON.stringify({
        deletedAdmin: deletedAdminInfo,
      }),
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    return res.json({
      success: true,
      message: 'Admin deleted successfully',
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete admin',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
