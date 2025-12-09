import { Request, Response } from "express";
import { Op, WhereOptions } from "sequelize";
import crypto from "crypto";
import User from "../models/User";
import EntryLog from "../models/EntryLog";
import redis from "../config/redis";
import logger from "../utils/logger";

// Validate RFID and check duplicates. Distinguish not-found vs inactive so
// the controller can return a signup form URL for unknown tags.
const validateRfidTag = async (
  rfidTag: string
): Promise<{
  isValid: boolean;
  user?: User;
  isDuplicate: boolean;
  lastEntry?: Date;
  message?: string;
  notFound?: boolean;
  inactive?: boolean;
}> => {
  // find user regardless of status so we can differentiate missing vs inactive
  const user = await User.findOne({ where: { rfidTag } });

  if (!user) {
    return {
      isValid: false,
      isDuplicate: false,
      notFound: true,
      message: "User not found",
    };
  }

  if (user.status !== "active") {
    return {
      isValid: false,
      isDuplicate: false,
      inactive: true,
      user,
      message: "User not active",
    };
  }

  // user exists and is active -> check for duplicate within time window
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentEntry = await EntryLog.findOne({
    where: {
      userId: user.userId,
      entryTimestamp: { [Op.gte]: fiveMinutesAgo },
      status: "success",
    },
    order: [["entryTimestamp", "DESC"]],
  });

  if (recentEntry) {
    return {
      isValid: true,
      user,
      isDuplicate: true,
      lastEntry: recentEntry.entryTimestamp,
      message: "Duplicate entry detected",
    };
  }

  return {
    isValid: true,
    user,
    isDuplicate: false,
  };
};

// POST /api/entries/scan - RFID scan entry with validation
export const scanEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rfidTag } = req.body;

    if (!rfidTag) {
      res.status(400).json({
        success: false,
        message: "RFID tag is required",
      });
      return;
    }

    logger.info(`RFID scan request received for tag: ${rfidTag}`);

    const validation = await validateRfidTag(rfidTag);

    if (!validation.isValid) {
      // If RFID isn't found, generate a temporary token and send frontend signup form URL
      if (validation.notFound) {
        logger.info(
          `RFID tag not found, generating signup token for: ${rfidTag}`
        );
        const ttlSeconds = 10 * 60; // 10 minutes
        const reverseKey = `rfid:${rfidTag}`;
        let token: string | null = null;
        try {
          token = await redis.get(reverseKey);
          if (token) {
            await redis.expire(token, ttlSeconds);
            await redis.expire(reverseKey, ttlSeconds);
          } else {
            token = crypto.randomBytes(20).toString("hex");
            await redis.set(token, rfidTag || "", "EX", ttlSeconds);
            await redis.set(reverseKey, token, "EX", ttlSeconds);
          }
        } catch (redisErr) {
          console.error("Redis set error (notFound):", redisErr);
        }

        const frontendBase =
          process.env.FRONTEND_FORM_URL ||
          process.env.CORS_ORIGIN ||
          "http://localhost:3000";
        const formUrl = `${frontendBase.replace(
          /\/$/,
          ""
        )}/entry-form?token=${token}`;

        res.status(200).json({
          success: true,
          message: "RFID not registered. Complete signup via form.",
          status: "signup",
          token,
          formUrl,
          data: { rfidTag },
        });
        return;
      }

      // inactive or other invalid cases remain errors
      if (validation.inactive) {
        logger.warn(`Inactive user attempted RFID scan: ${rfidTag}`);
      } else {
        logger.warn(
          `Invalid RFID scan validation: ${rfidTag} - ${validation.message}`
        );
      }
      res.status(404).json({
        success: false,
        message: validation.message || "User not found or inactive",
      });
      return;
    }

    if (validation.isDuplicate && validation.user) {
      logger.info(
        `Duplicate entry detected for user ${validation.user.idNumber} (${validation.user.fullName}) with RFID: ${rfidTag}`
      );
      await EntryLog.create({
        userId: validation.user.userId,
        entryTimestamp: new Date(),
        entryMethod: "rfid",
        status: "duplicate",
      });

      // Try to reuse an existing token mapped to this RFID
      const ttlSeconds = 10 * 60; // 10 minutes
      const reverseKey = `rfid:${validation.user.rfidTag}`;
      let token: string | null = null;

      try {
        token = await redis.get(reverseKey);
        if (token) {
          // refresh both keys' TTL
          await redis.expire(token, ttlSeconds);
          await redis.expire(reverseKey, ttlSeconds);
        } else {
          token = crypto.randomBytes(20).toString("hex");
          await redis.set(
            token,
            validation.user.rfidTag || "",
            "EX",
            ttlSeconds
          );
          await redis.set(reverseKey, token, "EX", ttlSeconds);
        }
      } catch (redisErr) {
        console.error("Redis error (duplicate):", redisErr);
      }

      const frontendBase =
        process.env.FRONTEND_FORM_URL || "http://localhost:5173";
      const formUrl = `${frontendBase.replace(
        /\/$/,
        ""
      )}/entry-form?token=${token}`;

      res.status(409).json({
        success: false,
        message: "Duplicate entry detected",
        status: "duplicate",
        data: {
          user: {
            idNumber: validation.user.idNumber,
            fullName: validation.user.fullName,
            userType: validation.user.userType,
            college: validation.user.college,
            department: validation.user.department,
          },
          lastEntry: validation.lastEntry,
          waitTime: validation.lastEntry
            ? Math.ceil((Date.now() - validation.lastEntry.getTime()) / 1000)
            : null,
          token,
          formUrl,
        },
      });
      return;
    }

    if (validation.user) {
      // create temporary token and store RFID tag in Redis for 10 minutes
      const ttlSeconds = 10 * 60; // 10 minutes
      const reverseKey = `rfid:${validation.user.rfidTag}`;
      let token: string | null = null;
      try {
        // if a token already exists for this RFID, reuse it and refresh TTL
        token = await redis.get(reverseKey);
        if (token) {
          await redis.expire(token, ttlSeconds);
          await redis.expire(reverseKey, ttlSeconds);
        } else {
          token = crypto.randomBytes(20).toString("hex");
          await redis.set(
            token,
            validation.user.rfidTag || "",
            "EX",
            ttlSeconds
          );
          await redis.set(reverseKey, token, "EX", ttlSeconds);
        }
      } catch (redisErr) {
        console.error("Redis set error (success):", redisErr);
      }

      // still record the entry in the log as before
      const entry = await EntryLog.create({
        userId: validation.user.userId,
        entryTimestamp: new Date(),
        entryMethod: "rfid",
        status: "success",
      });

      logger.info(
        `Successful RFID entry recorded for user ${validation.user.idNumber} (${validation.user.fullName}) with RFID: ${rfidTag}`
      );

      const frontendBase =
        process.env.FRONTEND_FORM_URL ||
        process.env.CORS_ORIGIN ||
        "http://localhost:3000";
      const formUrl = `${frontendBase.replace(
        /\/$/,
        ""
      )}/entry-form?token=${token}`;

      res.json({
        success: true,
        message: "Entry recorded successfully",
        data: {
          entry: {
            logId: entry.logId,
            entryTimestamp: entry.entryTimestamp,
            entryMethod: entry.entryMethod,
            status: entry.status,
          },
          user: {
            idNumber: validation.user.idNumber,
            fullName: validation.user.fullName,
            userType: validation.user.userType,
            college: validation.user.college,
            department: validation.user.department,
          },
          token,
          formUrl,
        },
      });
    }
  } catch (error) {
    logger.error(
      `Scan entry error for RFID ${req.body.rfidTag || "unknown"}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to process scan",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// POST /api/entries/manual - Manual entry
export const manualEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { idNumber } = req.body;

    if (!idNumber) {
      res.status(400).json({
        success: false,
        message: "ID number is required",
      });
      return;
    }

    const user = await User.findOne({ where: { idNumber, status: "active" } });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found or inactive",
      });
      return;
    }

    const entry = await EntryLog.create({
      userId: user.userId,
      entryTimestamp: new Date(),
      entryMethod: "manual",
      status: "success",
    });

    res.json({
      success: true,
      message: "Manual entry recorded successfully",
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
    console.error("Manual entry error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process manual entry",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// GET /api/users/:id - Get user info
export const getUserInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
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
        message: "User not found",
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
    console.error("Get user info error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user info",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// GET /api/entries/form - retrieve user data by temporary token
export const getUserByToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = (req.query.token as string) || req.params.token;

    if (!token) {
      res.status(400).json({ success: false, message: "Token is required" });
      return;
    }

    const rfidTag = await redis.get(token);

    if (!rfidTag) {
      res
        .status(404)
        .json({ success: false, message: "Token not found or expired" });
      return;
    }

    const user = await User.findOne({ where: { rfidTag } });

    if (!user) {
      res.json({
        success: true,
        message: "No user found for this RFID. Proceed to signup.",
        data: { rfidTag },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        idNumber: user.idNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        college: user.college,
        department: user.department,
        yearLevel: user.yearLevel,
        status: user.status,
        rfidTag: user.rfidTag,
      },
    });
  } catch (error) {
    console.error("Get user by token error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user by token",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// POST /api/users/upsert - create or update user (sign up or edit). If `token` provided, associates RFID from token.
export const upsertUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      token,
      rfidTag: providedRfid,
      idNumber,
      firstName,
      lastName,
      email,
      userType,
      college,
      department,
      yearLevel,
      status,
    } = req.body;

    let rfidTag = providedRfid;

    if (token) {
      const mapped = await redis.get(token);
      if (!mapped) {
        res
          .status(400)
          .json({ success: false, message: "Invalid or expired token" });
        return;
      }
      // If rfidTag was provided in body, ensure it matches token mapping
      if (rfidTag && rfidTag !== mapped) {
        res.status(400).json({
          success: false,
          message: "Provided RFID does not match token",
        });
        return;
      }
      rfidTag = mapped;
    }

    if (!rfidTag) {
      res
        .status(400)
        .json({ success: false, message: "RFID tag is required via token" });
      return;
    }

    // find existing user by idNumber or rfidTag
    const orConditions: WhereOptions<User>[] = [];
    if (idNumber) {
      orConditions.push({ idNumber });
    }
    orConditions.push({ rfidTag });

    const existing = await User.findOne({
      where: { [Op.or]: orConditions },
    });

    let user: User;

    if (existing) {
      // update
      await existing.update({
        idNumber: idNumber || existing.idNumber,
        rfidTag,
        firstName: firstName || existing.firstName,
        lastName: lastName || existing.lastName,
        email: email ?? existing.email,
        userType: userType || existing.userType,
        college: college || existing.college,
        department: department || existing.department,
        yearLevel: yearLevel ?? existing.yearLevel,
        status: status || existing.status,
      });
      user = existing;
    } else {
      // validate required fields for creation
      if (
        !idNumber ||
        !firstName ||
        !lastName ||
        !userType ||
        !college ||
        !department
      ) {
        res.status(400).json({
          success: false,
          message: "Missing required fields for user creation",
        });
        return;
      }

      user = await User.create({
        idNumber,
        rfidTag,
        firstName,
        lastName,
        email: email || null,
        userType,
        college,
        department,
        yearLevel: yearLevel || null,
        status: status || "active",
      });
    }

    // consume token if provided: delete both mappings
    if (token) {
      try {
        const reverseKey = `rfid:${rfidTag}`;
        await redis.del(token);
        await redis.del(reverseKey);
      } catch (redisErr) {
        console.error("Redis delete error (upsert):", redisErr);
      }
    }

    // create an entry log for the signup/edit action
    try {
      await EntryLog.create({
        userId: user.userId,
        entryTimestamp: new Date(),
        entryMethod: "rfid",
        status: "success",
      });
    } catch (elogErr) {
      console.error("EntryLog create error (upsert):", elogErr);
    }

    res.json({
      success: true,
      message: "User upserted successfully",
      data: {
        idNumber: user.idNumber,
        rfidTag: user.rfidTag,
        fullName: user.fullName,
        userId: user.userId,
      },
    });
  } catch (error) {
    console.error("Upsert user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upsert user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
