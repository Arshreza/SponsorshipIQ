import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const isUpstash =
  REDIS_URL.includes("upstash.io") || REDIS_URL.startsWith("rediss://");

export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(isUpstash ? { tls: {} } : {}),
});
