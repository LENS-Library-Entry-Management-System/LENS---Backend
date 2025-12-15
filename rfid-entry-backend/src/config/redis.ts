import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisOptions = {
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
};

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, redisOptions)
  : new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || "changeme",
      ...redisOptions,
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
