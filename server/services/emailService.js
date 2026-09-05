import transporter, { FROM } from "../config/nodemailer.js";

export const sendEmail = async ({ to, subject, html, text }) => {
  if (process.env.EMAIL_ENABLED === "false") {
    return { skipped: true, reason: "EMAIL_ENABLED=false" };
  }

  return transporter.sendMail({
    from: FROM,
    to,
    subject,
    text,
    html,
  });
};
