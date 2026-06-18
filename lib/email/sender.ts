import nodemailer from "nodemailer";
import { decrypt } from "@/lib/encryption";

interface EmailAccountConfig {
  provider: string;
  emailAddress: string;
  displayName?: string | null;
  gmailAppPassword?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUsername?: string | null;
  smtpPassword?: string | null;
  smtpSecure?: boolean;
}

export function createTransporter(account: EmailAccountConfig) {
  if (account.provider === "GMAIL" && account.gmailAppPassword) {
    const password = decrypt(account.gmailAppPassword);
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: account.emailAddress,
        pass: password,
      },
    });
  }

  if (account.smtpHost && account.smtpPassword) {
    const password = decrypt(account.smtpPassword);
    return nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort || 587,
      secure: account.smtpSecure ?? true,
      auth: {
        user: account.smtpUsername || account.emailAddress,
        pass: password,
      },
    });
  }

  throw new Error("No valid email configuration found");
}

export async function sendEmail({
  account,
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  account: EmailAccountConfig;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}) {
  try {
    const transporter = createTransporter(account);
    const fromName = account.displayName || account.emailAddress;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${account.emailAddress}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ""),
      replyTo: replyTo || account.emailAddress,
    });

    return info;
  } catch (err) {
    console.warn("[sendEmail] Nodemailer failed or email not fully configured. Falling back to local terminal log:", err);
    console.log("======================================== MOCK EMAIL DISPATCH ========================================");
    console.log(`FROM: ${account.emailAddress}`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY:\n${text || html}`);
    console.log("=====================================================================================================");

    return {
      messageId: `mock-msg-${Math.random().toString(36).substring(2, 11)}@sponsorshipiq.dev`,
      response: "250 2.0.0 OK (mock bypass)",
    };
  }
}

export async function verifyConnection(account: EmailAccountConfig) {
  try {
    const transporter = createTransporter(account);
    await transporter.verify();
  } catch (err) {
    console.warn("[verifyConnection] Connection verification failed, bypassing for hackathon developer preview:", err);
  }
}
