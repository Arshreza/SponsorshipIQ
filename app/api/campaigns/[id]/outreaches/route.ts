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

// Add a lead to the campaign (creates a new PENDING outreach)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { sponsorId } = await req.json();

  try {
    const campaign = await db.campaign.findFirst({
      where: { id, userId: (session.user as any).id },
    });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const sponsor = await db.sponsor.findFirst({
      where: { id: sponsorId, userId: (session.user as any).id },
    });
    if (!sponsor) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    // Check not already in campaign
    const existing = await db.outreach.findFirst({ where: { campaignId: id, sponsorId } });
    if (existing) return NextResponse.json({ error: "Lead already in this campaign" }, { status: 409 });

    const outreach = await db.outreach.create({
      data: { campaignId: id, sponsorId, status: "PENDING", emailAccountId: campaign.emailAccountId } as any,
      include: { sponsor: true } as any,
    });

    await db.campaign.update({
      where: { id },
      data: { totalSponsors: { increment: 1 } } as any,
    });

    return NextResponse.json({ success: true, outreach });
  } catch (err: any) {
    console.error("[Campaign Outreach POST]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Remove a lead (delete PENDING outreach) OR retry a FAILED outreach
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

// Remove a PENDING lead from the campaign
export async function DELETE(
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

    const outreach = await db.outreach.findFirst({ where: { id: outreachId, campaignId: id } });
    if (!outreach) return NextResponse.json({ error: "Outreach not found" }, { status: 404 });

    if (!["PENDING", "DRAFTED", "FAILED"].includes(outreach.status)) {
      return NextResponse.json({ error: "Cannot remove an already-sent outreach" }, { status: 400 });
    }

    await db.outreach.delete({ where: { id: outreachId } });
    await db.campaign.update({
      where: { id },
      data: { totalSponsors: { decrement: 1 } } as any,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Campaign Outreach DELETE]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
