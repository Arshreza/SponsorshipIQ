import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { searchParams } = req.nextUrl;
  const filter = searchParams.get("filter") || "ALL"; // ALL | SENT | RECEIVED
  const search = searchParams.get("q") || "";

  // Fetch sent outreaches
  const sentOutreaches =
    filter === "RECEIVED"
      ? []
      : await (db as any).outreach.findMany({
          where: {
            campaign: { userId },
            status: { in: ["SENT", "OPENED", "REPLIED", "INTERESTED", "CONVERTED", "REJECTED", "BOUNCED"] },
            ...(search
              ? {
                  OR: [
                    { subject: { contains: search, mode: "insensitive" } },
                    { sponsor: { companyName: { contains: search, mode: "insensitive" } } },
                    { sponsor: { contactEmail: { contains: search, mode: "insensitive" } } },
                  ],
                }
              : {}),
          },
          include: {
            sponsor: { select: { companyName: true, contactEmail: true, contactName: true } },
            campaign: { select: { name: true } },
            emailAccount: { select: { emailAddress: true, displayName: true } },
          },
          orderBy: { sentAt: "desc" },
          take: 200,
        });

  // Fetch received inbox messages
  const received =
    filter === "SENT"
      ? []
      : await (db as any).inboxMessage.findMany({
          where: {
            userId,
            direction: "RECEIVED",
            ...(search
              ? {
                  OR: [
                    { subject: { contains: search, mode: "insensitive" } },
                    { fromEmail: { contains: search, mode: "insensitive" } },
                    { fromName: { contains: search, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          include: {
            outreach: {
              include: {
                sponsor: { select: { companyName: true } },
                campaign: { select: { name: true } },
              },
            },
            emailAccount: { select: { emailAddress: true, displayName: true } },
          },
          orderBy: { receivedAt: "desc" },
          take: 200,
        });

  // Normalise into a unified shape
  const sentItems = sentOutreaches.map((o: any) => ({
    id: `sent-${o.id}`,
    type: "SENT" as const,
    outreachId: o.id,
    fromEmail: o.emailAccount?.emailAddress || "unknown",
    fromName: o.emailAccount?.displayName || null,
    toEmail: o.sponsor?.contactEmail || "",
    toName: o.sponsor?.contactName || o.sponsor?.companyName || "",
    companyName: o.sponsor?.companyName || "",
    campaignName: o.campaign?.name || "",
    subject: o.subject || "(no subject)",
    bodySnippet: o.body ? o.body.slice(0, 200).replace(/\n/g, " ") : "",
    status: o.status,
    date: o.sentAt || o.createdAt,
    isRead: true,
  }));

  const receivedItems = received.map((m: any) => ({
    id: `recv-${m.id}`,
    type: "RECEIVED" as const,
    inboxMessageId: m.id,
    outreachId: m.outreachId || null,
    fromEmail: m.fromEmail,
    fromName: m.fromName || null,
    toEmail: m.toEmail,
    toName: null,
    companyName: m.outreach?.sponsor?.companyName || m.fromName || m.fromEmail,
    campaignName: m.outreach?.campaign?.name || "",
    subject: m.subject || "(no subject)",
    bodySnippet: m.bodyText ? m.bodyText.slice(0, 200) : "",
    status: "REPLIED",
    date: m.receivedAt,
    isRead: m.isRead,
  }));

  // Merge and sort by date descending
  const all = [...sentItems, ...receivedItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const unreadCount = receivedItems.filter((m: { isRead: boolean }) => !m.isRead).length;

  return NextResponse.json({ messages: all, unreadCount });
}
