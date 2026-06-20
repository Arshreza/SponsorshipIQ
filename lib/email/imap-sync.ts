import { ImapFlow } from "imapflow";
import { decrypt } from "@/lib/encryption";
import { db } from "@/lib/db";

interface EmailAccountRecord {
  id: string;
  userId: string;
  emailAddress: string;
  displayName: string | null;
  provider: string;
  gmailAppPassword: string | null;
  smtpPassword: string | null;
  smtpHost: string | null;
  smtpUsername: string | null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function syncInboxForAccount(account: EmailAccountRecord): Promise<number> {
  let password: string;
  try {
    if (account.provider === "GMAIL" && account.gmailAppPassword) {
      password = decrypt(account.gmailAppPassword);
    } else {
      return 0; // SMTP accounts can't receive via IMAP here
    }
  } catch {
    return 0;
  }

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: account.emailAddress,
      pass: password,
    },
    logger: false,
  });

  let synced = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Fetch messages from last 45 days
      const since = new Date();
      since.setDate(since.getDate() - 45);

      const uids = await client.search({ since });
      const uidList = uids === false ? [] : (uids as number[]);
      if (uidList.length === 0) { lock.release(); return 0; }

      // Fetch only the most recent 100
      const fetchUids = uidList.slice(-100);

      // Get all outreach messageIds for this account to match replies
      const outreaches = await db.outreach.findMany({
        where: {
          emailAccountId: account.id,
          messageId: { not: null },
          status: { in: ["SENT", "OPENED", "REPLIED", "INTERESTED", "CONVERTED"] },
        },
        select: { id: true, messageId: true },
      } as any);

      const messageIdToOutreachId = new Map(
        outreaches.map((o: any) => [o.messageId as string, o.id as string])
      );

      for await (const msg of client.fetch(fetchUids, {
        envelope: true,
        bodyParts: ["TEXT"],
        headers: ["in-reply-to", "references", "message-id"],
      })) {
        try {
          const envelope = msg.envelope;
          if (!envelope) continue;

          const msgId = (envelope as any).messageId as string | undefined;
          if (!msgId) continue;

          const headersMap = msg.headers as Map<string, string> | undefined;
          const inReplyTo = headersMap?.get?.("in-reply-to") || "";
          const fromAddr = envelope.from?.[0]?.address || "";
          const fromName = envelope.from?.[0]?.name || "";
          const toAddr = envelope.to?.[0]?.address || "";
          const subject = envelope.subject || "(no subject)";
          const date = envelope.date ? new Date(envelope.date) : new Date();

          // Only process emails NOT from our own account (i.e. received replies)
          if (fromAddr.toLowerCase() === account.emailAddress.toLowerCase()) continue;

          // Match to an outreach via In-Reply-To header
          const cleanReplyTo = inReplyTo.replace(/^<|>$/g, "").trim();
          const matchedOutreachId = messageIdToOutreachId.get(cleanReplyTo) || null;

          // Get text body snippet
          let bodyText = "";
          try {
            const textPart = msg.bodyParts?.get("TEXT");
            if (textPart) {
              bodyText = textPart.toString().slice(0, 2000);
              if (bodyText.includes("<html") || bodyText.includes("<div")) {
                bodyText = stripHtml(bodyText);
              }
            }
          } catch { /* skip body parse errors */ }

          // Upsert — avoid duplicates
          await (db as any).inboxMessage.upsert({
            where: { emailAccountId_messageId: { emailAccountId: account.id, messageId: msgId } },
            create: {
              userId: account.userId,
              emailAccountId: account.id,
              outreachId: matchedOutreachId,
              messageId: msgId,
              inReplyTo: cleanReplyTo || null,
              direction: "RECEIVED",
              fromEmail: fromAddr,
              fromName: fromName || null,
              toEmail: toAddr || account.emailAddress,
              subject,
              bodyText: bodyText || null,
              isRead: false,
              receivedAt: date,
            },
            update: {
              outreachId: matchedOutreachId,
              bodyText: bodyText || null,
            },
          });

          // If matched to an outreach, update its status to REPLIED
          if (matchedOutreachId) {
            await (db as any).outreach.update({
              where: { id: matchedOutreachId },
              data: { status: "REPLIED", repliedAt: date },
            });
          }

          synced++;
        } catch { /* skip individual message errors */ }
      }
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error(`[IMAP sync] Failed for ${account.emailAddress}:`, err);
  } finally {
    try { await client.logout(); } catch { /* ignore */ }
  }

  return synced;
}
