import { google } from "googleapis";
import { decrypt } from "./encryption";

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${nextAuthUrl}/api/auth/google-gmail/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth environment variables");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Sends a cold email using Gmail API.
 * Supports mock fallback if using a mock email account.
 */
export async function sendGmail({
  to,
  subject,
  body,
  encryptedRefreshToken,
  senderEmail,
}: {
  to: string;
  subject: string;
  body: string;
  encryptedRefreshToken: string;
  senderEmail: string;
}): Promise<{ messageId: string }> {
  const decryptedToken = decrypt(encryptedRefreshToken);

  // Handle mock mode
  if (decryptedToken.startsWith("mock-")) {
    console.log(`[MOCK EMAIL SEND]`);
    console.log(`From: ${senderEmail}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body.substring(0, 100)}...`);
    
    // Simulate a brief delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return { messageId: `mock-msg-${Date.now()}` };
  }

  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: decryptedToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Format MIME email content
    // We encode subject to base64 to safely handle any special characters
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
    const messageParts = [
      `From: ${senderEmail}`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      "",
      body,
    ];
    
    const rawMessage = messageParts.join("\r\n");
    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return { messageId: response.data.id || `msg-${Date.now()}` };
  } catch (err: any) {
    console.error(`[Gmail API Send Error to ${to}]`, err);
    throw new Error(err.message || "Failed to send email via Gmail API");
  }
}
