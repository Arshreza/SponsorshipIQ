import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const campaigns = await db.campaign.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(campaigns);
  } catch (err) {
    console.error("[Campaigns GET]", err);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, sponsorListId, emailAccountId, guidelines, toneOfVoice, emailWordLimit, subjectTemplate, sponsorIds } = await req.json();

    if (!name || !sponsorListId) {
      return NextResponse.json({ error: "Campaign name and Sponsor List are required" }, { status: 400 });
    }

    // Ensure user has at least one FestProfile. If not, create a default one
    let festProfile = await db.festProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!festProfile) {
      festProfile = await db.festProfile.create({
        data: {
          userId: session.user.id,
          name: "Annual Fest 2026",
          college: "University College",
          city: "Metro City",
          isActive: true,
        },
      });
    }

    // Create the campaign
    const campaign = await db.campaign.create({
      data: {
        userId: session.user.id,
        name,
        festProfileId: festProfile.id,
        sponsorListId,
        emailAccountId: emailAccountId || null,
        status: "DRAFT",
        guidelines: guidelines || "",
        toneOfVoice: toneOfVoice || "Professional",
        emailWordLimit: emailWordLimit || 200,
        subjectTemplate: subjectTemplate || "Partnership Opportunity: {{festName}}",
      },
    });

    // Load sponsor list entries — filter by selected sponsorIds if provided
    const entries = await db.sponsorListEntry.findMany({
      where: {
        sponsorListId,
        ...(sponsorIds?.length ? { sponsorId: { in: sponsorIds } } : {}),
      },
    });

    // Create outreach entries sequentially to avoid mock DB issues
    for (const entry of entries) {
      await db.outreach.create({
        data: {
          campaignId: campaign.id,
          sponsorId: entry.sponsorId,
          emailAccountId: emailAccountId || null,
          status: "PENDING",
        },
      });
    }

    // Update total sponsors count on the campaign
    await db.campaign.update({
      where: { id: campaign.id },
      data: {
        totalSponsors: entries.length,
      },
    });

    return NextResponse.json({ success: true, campaignId: campaign.id });
  } catch (err) {
    console.error("[Campaigns POST]", err);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
