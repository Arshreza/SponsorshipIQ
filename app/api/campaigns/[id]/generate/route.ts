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
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const llmConfig = await db.llmConfig.findUnique({ where: { userId: session.user.id } });
  if (!llmConfig) {
    return NextResponse.json(
      { error: "LLM not configured. Please go to Settings and add your API key." },
      { status: 400 }
    );
  }

  // Get pending outreaches
  const outreaches = await db.outreach.findMany({
    where: { campaignId: id, status: "PENDING" },
    select: { id: true, sponsorId: true },
  });

  if (outreaches.length === 0) {
    return NextResponse.json({ message: "No pending outreaches to generate", queued: 0 });
  }

  // Queue generation jobs
  const jobs = outreaches.map((o) => ({
    name: "generate-pitch",
    data: {
      type: "generate-pitch" as const,
      outreachId: o.id,
      campaignId: id,
      sponsorId: o.sponsorId,
      userId: session.user.id,
    },
    opts: { delay: 0 },
  }));

  await outreachQueue.addBulk(jobs as any);

  await db.campaign.update({
    where: { id },
    data: { status: "GENERATING", launchedAt: new Date() },
  });

  return NextResponse.json({ queued: outreaches.length, message: `Queued ${outreaches.length} pitch generations` });
}
