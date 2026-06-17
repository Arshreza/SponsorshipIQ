import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { status, replyNotes } = await req.json();

    // Verify ownership
    const outreach = await db.outreach.findFirst({
      where: { id, campaign: { userId: session.user.id } },
    });
    if (!outreach) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.outreach.update({
      where: { id },
      data: {
        status,
        ...(replyNotes !== undefined && { replyNotes }),
        ...(status === "REPLIED" && !outreach.repliedAt && { repliedAt: new Date() }),
      },
    });

    // Update campaign stats if status changes to key states
    if (status === "CONVERTED" && outreach.status !== "CONVERTED") {
      await db.campaign.update({
        where: { id: outreach.campaignId },
        data: { converted: { increment: 1 } },
      });
    }
    if (status === "REPLIED" && !["REPLIED", "INTERESTED", "CONVERTED"].includes(outreach.status)) {
      await db.campaign.update({
        where: { id: outreach.campaignId },
        data: { replied: { increment: 1 } },
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[Outreach PATCH]", err);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
