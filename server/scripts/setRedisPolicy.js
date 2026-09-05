import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const connection = new IORedis(redisUrl);

async function run() {
  try {
    const res = await connection.config("SET", "maxmemory-policy", "noeviction");
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    connection.disconnect();
  }
}
run();
