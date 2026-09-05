import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

// BullMQ accepts plain connection options and manages its own client internally,
// so we build options here instead of constructing a client ourselves.
function parseRedisUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    tls: parsed.protocol === "rediss:" ? {} : undefined,
  };
}

const baseOptions = redisUrl
  ? parseRedisUrl(redisUrl)
  : {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      username: process.env.REDIS_USERNAME || undefined,
      password: process.env.REDIS_PASSWORD || undefined,
    };

const connection = {
  ...baseOptions,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  retryStrategy(times) {
    return Math.min(times * 1000, 10000);
  },
};

function buildStatusUrl() {
  if (redisUrl) return redisUrl;
  const { host, port, username, password } = baseOptions;
  const auth = username || password ? `${encodeURIComponent(username || "")}:${encodeURIComponent(password || "")}@` : "";
  return `redis://${auth}${host}:${port}`;
}

// Lightweight `redis` client used only to observe and log connection status;
// BullMQ builds its own separate client from `connection` above.
const statusClient = createClient({
  url: buildStatusUrl(),
  socket: {
    tls: !!baseOptions.tls,
    reconnectStrategy: (retries) => Math.min(retries * 1000, 10000),
  },
});

let redisAvailable = false;
let hasLoggedInitialError = false;

statusClient.on("ready", () => {
  redisAvailable = true;
  hasLoggedInitialError = false;
  console.log("Redis connected successfully");
});

statusClient.on("error", (err) => {
  if (redisAvailable) {
    console.warn("Redis connection lost:", err.message);
  } else if (!hasLoggedInitialError) {
    console.warn("Redis unavailable; continuing without a queue backend:", err.message);
    hasLoggedInitialError = true;
  }
  redisAvailable = false;
});

statusClient.on("end", () => {
  redisAvailable = false;
});

statusClient.connect().catch(() => {});

export { redisAvailable };
export default connection;
