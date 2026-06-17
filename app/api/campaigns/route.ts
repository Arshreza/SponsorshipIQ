import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await db.campaign.findMany({
    where: { userId: session.user.id },
    include: {
      festProfile: { select: { id: true, name: true } },
      sponsorList: { select: { id: true, name: true } },
      emailAccount: { select: { id: true, emailAddress: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      name, festProfileId, sponsorListId, emailAccountId,
      guidelines, toneOfVoice, emailWordLimit, subjectTemplate,
    } = body;

    if (!name || !festProfileId || !sponsorListId) {
      return NextResponse.json({ error: "name, festProfileId, sponsorListId required" }, { status: 400 });
    }

    // Get sponsors from the list
    const listEntries = await db.sponsorListEntry.findMany({
      where: { sponsorListId },
      include: { sponsor: true },
    });

    const campaign = await db.campaign.create({
      data: {
        name,
        userId: session.user.id,
        festProfileId,
        sponsorListId,
        emailAccountId: emailAccountId || null,
        guidelines,
        toneOfVoice,
        emailWordLimit: emailWordLimit || 200,
        subjectTemplate,
        totalSponsors: listEntries.length,
        status: "DRAFT",
      },
    });

    // Create outreach entries for each sponsor in the list
    if (listEntries.length > 0) {
      await db.outreach.createMany({
        data: listEntries.map((entry) => ({
          campaignId: campaign.id,
          sponsorId: entry.sponsorId,
          emailAccountId: emailAccountId || null,
          status: "PENDING",
        })),
      });
    }

    return NextResponse.json(campaign, { status: 201 });
  } catch (err) {
    console.error("[Campaigns POST]", err);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
