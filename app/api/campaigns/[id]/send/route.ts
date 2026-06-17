import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { outreachQueue } from "@/lib/queue/queue";

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

  await outreachQueue.addBulk(jobs as any);

  await db.campaign.update({
    where: { id },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json({ queued: outreaches.length });
}
