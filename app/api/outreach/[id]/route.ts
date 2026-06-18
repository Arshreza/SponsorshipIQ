import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Helper to keep campaign statistics accurately in sync
export async function syncCampaignStats(campaignId: string) {
  const [drafted, sent, replied, converted] = await Promise.all([
    db.outreach.count({ where: { campaignId, status: "DRAFTED" } }),
    db.outreach.count({ where: { campaignId, status: { in: ["SENT", "OPENED", "REPLIED", "INTERESTED", "CONVERTED"] } } }),
    db.outreach.count({ where: { campaignId, status: { in: ["REPLIED", "INTERESTED", "CONVERTED"] } } }),
    db.outreach.count({ where: { campaignId, status: "CONVERTED" } }),
  ]);

  await db.campaign.update({
    where: { id: campaignId },
    data: { drafted, sent, replied, converted },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const bodyData = await req.json();
    const { subject, body, status, replyNotes, replyCategory } = bodyData;

    // Verify ownership
    const outreach = await db.outreach.findFirst({
      where: { id, campaign: { userId: session.user.id } },
    });
    if (!outreach) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.outreach.update({
      where: { id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(body !== undefined && { body }),
        ...(status !== undefined && { status }),
        ...(replyNotes !== undefined && { replyNotes }),
        ...(replyCategory !== undefined && { replyCategory }),
        ...(status === "REPLIED" && !outreach.repliedAt && { repliedAt: new Date() }),
      },
    });

    // Sync stats
    await syncCampaignStats(outreach.campaignId);

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[Outreach PATCH general]", err);
    return NextResponse.json({ error: "Failed to update outreach" }, { status: 500 });
  }
}
