import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/User';
import EntryLog from '../models/EntryLog';

// POST /api/entries/scan - RFID scan entry
export const scanEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rfidTag } = req.body;

    if (!rfidTag) {
      res.status(400).json({
        success: false,
        message: 'RFID tag is required',
      });
      return;
    }

    const user = await User.findOne({ where: { rfidTag, status: 'active' } });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found or inactive',
      });
      return;
    }

    // Check for duplicate entry (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentEntry = await EntryLog.findOne({
      where: {
        userId: user.userId,
        entryTimestamp: { [Op.gte]: fiveMinutesAgo },
        status: 'success',
      },
    });

    if (recentEntry) {
      await EntryLog.create({
        userId: user.userId,
        entryTimestamp: new Date(),
        entryMethod: 'rfid',
        status: 'duplicate',
      });

      res.status(200).json({
        success: false,
        message: 'Duplicate entry detected',
        status: 'duplicate',
        user: {
          idNumber: user.idNumber,
          fullName: user.fullName,
          userType: user.userType,
        },
      });
      return;
    }

    const entry = await EntryLog.create({
      userId: user.userId,
      entryTimestamp: new Date(),
      entryMethod: 'rfid',
      status: 'success',
    });

    res.json({
      success: true,
      message: 'Entry recorded successfully',
      data: {
        entry,
        user: {
          idNumber: user.idNumber,
          fullName: user.fullName,
          userType: user.userType,
          college: user.college,
          department: user.department,
        },
      },
    });
  } catch (error) {
    console.error('Scan entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process scan',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// POST /api/entries/manual - Manual entry
export const manualEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idNumber } = req.body;

    if (!idNumber) {
      res.status(400).json({
        success: false,
        message: 'ID number is required',
      });
      return;
    }

    const user = await User.findOne({ where: { idNumber, status: 'active' } });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found or inactive',
      });
      return;
    }

    const entry = await EntryLog.create({
      userId: user.userId,
      entryTimestamp: new Date(),
      entryMethod: 'manual',
      status: 'success',
    });

    res.json({
      success: true,
      message: 'Manual entry recorded successfully',
      data: {
        entry,
        user: {
          idNumber: user.idNumber,
          fullName: user.fullName,
          userType: user.userType,
          college: user.college,
          department: user.department,
        },
      },
    });
  } catch (error) {
    console.error('Manual entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process manual entry',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/entries/validate/:rfid - Check duplicate
export const validateRfid = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rfid } = req.params;

    const user = await User.findOne({ where: { rfidTag: rfid, status: 'active' } });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentEntry = await EntryLog.findOne({
      where: {
        userId: user.userId,
        entryTimestamp: { [Op.gte]: fiveMinutesAgo },
        status: 'success',
      },
    });

    res.json({
      success: true,
      data: {
        user: {
          idNumber: user.idNumber,
          fullName: user.fullName,
          userType: user.userType,
        },
        isDuplicate: !!recentEntry,
        lastEntry: recentEntry ? recentEntry.entryTimestamp : null,
      },
    });
  } catch (error) {
    console.error('Validate RFID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate RFID',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// GET /api/users/:id - Get user info
export const getUserInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      where: {
        [Op.or]: [{ idNumber: id }, { rfidTag: id }],
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        idNumber: user.idNumber,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        college: user.college,
        department: user.department,
        yearLevel: user.yearLevel,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user info',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};