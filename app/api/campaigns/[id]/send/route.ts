import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { outreachQueue } from "@/lib/queue/queue";
import { sendEmail } from "@/lib/email/sender";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const campaign = await db.campaign.findFirst({
    where: { id, userId: session.user.id },
    include: { emailAccount: true },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (!campaign.emailAccount) {
    return NextResponse.json({ error: "No email account connected to this campaign" }, { status: 400 });
  }

  // Get drafted outreaches
  const outreaches = await db.outreach.findMany({
    where: { campaignId: id, status: "DRAFTED" },
    select: { id: true },
  });

  if (outreaches.length === 0) {
    return NextResponse.json({ message: "No drafted emails ready to send", queued: 0 });
  }

  // Queue send jobs
  const jobs = outreaches.map((o) => ({
    name: "send-email",
    data: {
      type: "send-email" as const,
      outreachId: o.id,
      campaignId: id,
      userId: session.user.id,
    },
    opts: { delay: 0 },
  }));

  let isQueuedInRedis = false;

  try {
    await outreachQueue.addBulk(jobs as any);
    isQueuedInRedis = true;
  } catch (err) {
    console.warn("[Campaign Send API] Redis connection failed, running sync fallback in background:", err);
    runSendJobsSync(jobs, id);
  }

  await db.campaign.update({
    where: { id },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json({ 
    queued: outreaches.length,
    message: isQueuedInRedis 
      ? `Queued ${outreaches.length} email dispatches in Redis.` 
      : `Queued ${outreaches.length} email dispatches locally (Redis connection bypassed).` 
  });
}

// Local Sync Fallback runner to process dispatches without Redis
async function runSendJobsSync(jobs: any[], campaignId: string) {
  // Execute in background promise so response returns immediately
  (async () => {
    try {
      console.log(`[Sync Fallback] Starting send for ${jobs.length} jobs...`);
      for (const job of jobs) {
        const { outreachId } = job.data;

        const outreach = await db.outreach.findUnique({
          where: { id: outreachId },
          include: {
            sponsor: true,
            emailAccount: true,
          },
        });
        if (!outreach || !outreach.subject || !outreach.body || !outreach.emailAccount) continue;

        const bodyHtml = outreach.body
          .split("\n")
          .map((line) => `<p>${line}</p>`)
          .join("");

        const info = await sendEmail({
          account: outreach.emailAccount,
          to: outreach.sponsor.contactEmail,
          subject: outreach.subject,
          html: bodyHtml,
          text: outreach.body,
        });

        await db.outreach.update({
          where: { id: outreachId },
          data: {
            status: "SENT",
            sentAt: new Date(),
            messageId: info.messageId,
          },
        });

        // Update campaign stats
        await db.campaign.update({
          where: { id: campaignId },
          data: { sent: { increment: 1 } },
        });
      }

      await db.campaign.update({
        where: { id: campaignId },
        data: { status: "ACTIVE" },
      });
      console.log("[Sync Fallback] All local sends completed!");
    } catch (e) {
      console.error("[Sync Fallback] Error in local job send runner:", e);
    }
  })();
}
