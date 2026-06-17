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
}

export async function verifyConnection(account: EmailAccountConfig) {
  const transporter = createTransporter(account);
  await transporter.verify();
}
