import { Queue } from "bullmq";
import connection from "../utils/redis.js";

export const emailQueue = new Queue("emailQueue", { connection });
