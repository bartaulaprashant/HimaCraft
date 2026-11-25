
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import logger from "../config/logger.js";

function getTransporter() {
  if (
    !env.SMTP_HOST ||
    !env.SMTP_USER ||
    !env.SMTP_PASSWORD ||
    !env.MAIL_FROM
  ) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });
}

export async function sendPasswordResetOtp(
  email: string,
  otp: string
): Promise<void> {
  const transporter = getTransporter();

  if (!transporter || !env.MAIL_FROM) {
    logger.error("Password reset email service is not configured");
    throw new Error("Email service is unavailable");
  }

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: "Your HimaCraft password reset code",
    text: [
      `Your HimaCraft password reset code is: ${otp}`,
      "",
      "This code expires in 10 minutes.",
      "If you did not request a password reset, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
        <h2>Reset your HimaCraft password</h2>
        <p>Use the following verification code to reset your password:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 8px; padding: 16px 0;">
          ${otp}
        </div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
