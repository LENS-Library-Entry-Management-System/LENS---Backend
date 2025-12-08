import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;
const enableTls =
  process.env.REDIS_TLS === "true" ||
  (redisUrl ? redisUrl.startsWith("rediss://") : false);

const baseOptions = {
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  tls: enableTls ? {} : undefined,
};

const redis = redisUrl
  ? new Redis(redisUrl, baseOptions)
  : new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || "admin",
      ...baseOptions,
    });

let isHealthy = false;

redis.on("connect", () => {
  console.log("Redis connection established successfully.");
  isHealthy = true;
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error);
  isHealthy = false;
});

redis.on("close", () => {
  console.log("Redis connection closed.");
  isHealthy = false;
});

export const testRedisConnection = async (): Promise<void> => {
  try {
    await redis.connect();
    await redis.ping();
    console.log("Redis connection test successful.");
  } catch (error) {
    console.error("Redis connection test failed:", error);
    throw error;
  }
};

export { redis, isHealthy };
export default redis;
