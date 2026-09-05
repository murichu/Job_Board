import nodemailer from "nodemailer";

const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== "false";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === "true" || SMTP_PORT === 465;
const EMAIL_USER = process.env.EMAIL_USER?.trim();
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD?.trim();

const normalizedPassword =
  SMTP_HOST === "smtp.gmail.com"
    ? EMAIL_PASSWORD?.replace(/\s+/g, "")
    : EMAIL_PASSWORD;

export const FROM = `"${process.env.EMAIL_FROM_NAME || "Job Portal"}" <${EMAIL_USER || "no-reply@example.com"}>`;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: EMAIL_USER,
    pass: normalizedPassword,
  },
});

if (!EMAIL_ENABLED) {
  console.warn("Email sending is disabled with EMAIL_ENABLED=false.");
} else if (!EMAIL_USER || !EMAIL_PASSWORD) {
  console.warn("Email transporter skipped: EMAIL_USER and EMAIL_PASSWORD are required.");
} else {
  transporter.verify((error) => {
    if (error) {
      console.error("Email transporter is NOT ready:", error.message);

      if (
        SMTP_HOST === "smtp.gmail.com" &&
        /Username and Password not accepted|BadCredentials/i.test(error.message)
      ) {
        console.error(
          "Gmail SMTP requires a valid app password. Enable 2-Step Verification, create an app password, and set EMAIL_PASSWORD to the 16-character app password."
        );
      }
    } else {
      console.log(`Email transporter ready, sending as ${FROM}`);
    }
  });
}

export default transporter;
