import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const campaign = await db.campaign.findFirst({
      where: { id, userId: (session.user as any).id },
    });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const outreaches = await db.outreach.findMany({
      where: { campaignId: id },
      include: { sponsor: true } as any,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ campaign, outreaches });
  } catch (err) {
    console.error("[Campaign Outreaches GET]", err);
    return NextResponse.json({ error: "Failed to fetch outreaches" }, { status: 500 });
  }
}

// Retry a FAILED outreach — reset to PENDING
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { outreachId } = await req.json();

  try {
    const campaign = await db.campaign.findFirst({
      where: { id, userId: (session.user as any).id },
    });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    await db.outreach.update({
      where: { id: outreachId },
      data: { status: "PENDING", generationError: null },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Campaign Outreach PATCH]", err);
    return NextResponse.json({ error: "Failed to retry outreach" }, { status: 500 });
  }
}
