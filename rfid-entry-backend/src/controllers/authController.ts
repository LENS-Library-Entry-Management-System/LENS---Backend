import { Request, Response } from 'express';
import Admin from '../models/Admin';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { logAuditAction } from '../services/auditService';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
      return;
    }

    const admin = await Admin.findOne({ where: { username } });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    admin.lastLogin = new Date();
    await admin.save();

    const payload = {
      adminId: admin.adminId,
      username: admin.username,
      role: admin.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await logAuditAction({
      admin_id: admin.adminId,
      action_type: 'login',
      description: 'Admin logged in',
      ip_address: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: admin.toSafeObject(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    await logAuditAction({
      admin_id: req.admin.adminId,
      action_type: 'logout',
      description: 'Admin logged out',
      ip_address: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const admin = await Admin.findByPk(req.admin.adminId);

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
      return;
    }

    res.json({
      success: true,
      data: admin.toSafeObject(),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { fullName, email, currentPassword, newPassword } = req.body;

    const admin = await Admin.findByPk(req.admin.adminId);

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
      return;
    }

    const oldValues = {
      fullName: admin.fullName,
      email: admin.email,
    };

    if (fullName) admin.fullName = fullName;
    if (email) admin.email = email;

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password is required to change password',
        });
        return;
      }

      const isPasswordValid = await admin.comparePassword(currentPassword);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
        return;
      }

      admin.passwordHash = newPassword;
    }

    await admin.save();

    await logAuditAction({
      admin_id: admin.adminId,
      action_type: 'edit',
      target_table: 'admins',
      target_id: admin.adminId,
      description: JSON.stringify({
        old: oldValues,
        new: {
          fullName: admin.fullName,
          email: admin.email,
          passwordChanged: !!newPassword,
        },
      }),
      ip_address: req.ip || req.socket.remoteAddress || null,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: admin.toSafeObject(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);

    const admin = await Admin.findByPk(decoded.adminId);

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
      return;
    }

    const payload = {
      adminId: admin.adminId,
      username: admin.username,
      role: admin.role,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          message: 'Refresh token expired',
        });
        return;
      }
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
        return;
      }
    }
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};