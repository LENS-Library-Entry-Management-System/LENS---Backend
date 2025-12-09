import rateLimit, { Store } from "express-rate-limit";
import { redis, isHealthy } from "../config/redis";
import { Request, Response } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      rateLimit?: {
        limit: number;
        remaining: number;
        totalHits: number;
        resetTime?: Date;
      };
    }
  }
}

class RedisStore implements Store {
  prefix: string;

  constructor(prefix: string = "ratelimit:") {
    this.prefix = prefix;
  }

  async increment(
    key: string
  ): Promise<{ totalHits: number; resetTime: Date | undefined }> {
    if (!isHealthy) {
      // Fallback: return a value that will trigger rate limit
      return { totalHits: 0, resetTime: undefined };
    }

    const redisKey = `${this.prefix}${key}`;

    try {
      // Use Redis INCR with expiration
      const pipeline = redis.pipeline();
      pipeline.incr(redisKey);
      pipeline.expire(redisKey, 900); // 15 minutes default
      const results = await pipeline.exec();

      if (!results) {
        throw new Error("Redis pipeline execution failed");
      }

      const totalHits = results[0][1] as number;

      // Get TTL to calculate reset time
      const ttl = await redis.ttl(redisKey);
      const resetTime = ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined;

      return { totalHits, resetTime };
    } catch (error) {
      console.error("Redis store increment error:", error);
      // Fallback behavior
      return { totalHits: 0, resetTime: undefined };
    }
  }

  async decrement(key: string): Promise<void> {
    if (!isHealthy) return;

    try {
      await redis.decr(`${this.prefix}${key}`);
    } catch (error) {
      console.error("Redis store decrement error:", error);
    }
  }

  async resetKey(key: string): Promise<void> {
    if (!isHealthy) return;

    try {
      await redis.del(`${this.prefix}${key}`);
    } catch (error) {
      console.error("Redis store resetKey error:", error);
    }
  }

  async shutdown(): Promise<void> {
    // ioredis handles connection cleanup automatically
    // But we can close if needed
    if (isHealthy) {
      redis.disconnect();
    }
  }
}

// Custom key generator - use IP address or user ID if authenticated
const keyGenerator = (req: Request) => {
  if (req.admin?.adminId) {
    return `user:${req.admin.adminId}`;
  }
  // Use the ipKeyGenerator helper for proper IPv6 support
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip || req.socket.remoteAddress || "unknown";

  // Normalize IPv4 addresses to IPv6 format for consistent hashing
  if (ip.includes('.')) {
    return `ip::ffff:${ip}`;
  }
  return `ip:${ip}`;
};

const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    message: "Too many requests, please try again later.",
    retryAfter: req.rateLimit?.resetTime
      ? Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000)
      : 60,
  });
};

const redisStore = new RedisStore("ratelimit:");

export const authRateLimiter = rateLimit({
  store: isHealthy ? redisStore : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator,
  skip: (_req) => {
    return process.env.NODE_ENV === "production";
  },
});

export const refreshTokenRateLimiter = rateLimit({
  store: isHealthy ? redisStore : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator,
  skip: (_req) => {
    return process.env.NODE_ENV === "production";
  },
});

export const apiRateLimiter = rateLimit({
  store: isHealthy ? redisStore : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator,
});

export const strictRateLimiter = rateLimit({
  store: isHealthy ? redisStore : undefined,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator,
});

export const readRateLimiter = rateLimit({
  store: isHealthy ? redisStore : undefined,
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator,
});
