import IORedis from 'ioredis';

// Prefer REDIS_URL (e.g. redis://:password@host:port) for simplicity. Fall back to explicit env vars.
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let connection;
if (process.env.REDIS_URL) {
  connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
  });
} else {
  connection = new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
  });
}

connection.on("connect", () => console.log("Redis connected successfully"));
connection.on("error", (err) => {
  console.warn("Redis unavailable; continuing without a queue backend:", err.message);
});

export default connection;
