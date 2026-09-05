import { Worker } from "bullmq";
import connection from "../utils/redis.js";
import { sendEmail } from "../services/emailService.js";

new Worker("emailQueue", async job => {
  const { to, subject, html } = job.data;
  await sendEmail({ to, subject, html });
}, { connection });
