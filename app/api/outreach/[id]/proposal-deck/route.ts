import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const outreach = await db.outreach.findUnique({
      where: { id },
      include: {
        sponsor: true,
        campaign: {
          include: {
            festProfile: true,
          },
        },
      },
    });

    if (!outreach || outreach.campaign.userId !== session.user.id) {
      return NextResponse.json({ error: "Outreach not found" }, { status: 404 });
    }

    const { campaign, sponsor } = outreach;
    const { festProfile } = campaign;

    // Parse packages list
    let packagesList: any[] = [];
    if (festProfile.packages) {
      try {
        packagesList = JSON.parse(festProfile.packages);
      } catch {
        packagesList = [{ tier: "Sponsor Partner", amount: "Negotiable", benefits: ["Logo visibility", "Stall space"] }];
      }
    }

    // Curate tailored brand pitch deliverables based on industry type
    let brandCustomDeliverables = "Premium logo placement on main festival entry backdrops, social media partner announcements, and digital poster credits.";
    if (sponsor.industry?.toLowerCase().includes("beverage")) {
      brandCustomDeliverables = "Exclusive beverage retail rights at all food stalls, high-visibility energy beverage sampling booths near main entrance, and DJ night sponsor logo banners.";
    } else if (sponsor.industry?.toLowerCase().includes("software") || sponsor.industry?.toLowerCase().includes("tech")) {
      brandCustomDeliverables = "Exclusive CS hackathon naming rights, api key workshop presentations slot (15-min), recruiting resume collections drive, and hackathon banner backdrops.";
    } else if (sponsor.industry?.toLowerCase().includes("sports")) {
      brandCustomDeliverables = "Official sports jerseys branding, customized trophy presentations rights, Decathlon sports zone activation slots, and physical arena posters.";
    }

    const slides = [
      {
        slideNum: 1,
        title: `${festProfile.name} x ${sponsor.companyName}`,
        subtitle: `Personalized Sponsorship Proposal for ${sponsor.companyName}`,
        background: "gradient-brand",
        type: "cover",
        bullets: [
          `Prepared for: ${sponsor.contactName || "Brand Partnerships team"}`,
          `College Host: ${festProfile.college || "University Campus"}`,
          `Event City: ${festProfile.city || "India"}`
        ]
      },
      {
        slideNum: 2,
        title: "🎪 Festival Overview",
        subtitle: `About ${festProfile.name} ${festProfile.edition || ""}`,
        background: "bg-background-secondary",
        type: "overview",
        bullets: [
          `Theme Tagline: "${festProfile.theme || "Culture meets Innovation"}"`,
          `Dates: ${festProfile.eventDates || "Coming Soon"}`,
          `Expected Campus Footfall: ${festProfile.expectedFootfall?.toLocaleString() || "5,000+"} student attendees`,
          `Social Media reach: ${festProfile.socialMediaReach?.toLocaleString() || "15,000+"} followers across portals`
        ]
      },
      {
        slideNum: 3,
        title: "🎯 Brand Custom Deliverables",
        subtitle: `Custom activation channels proposed for ${sponsor.companyName}`,
        background: "bg-background-secondary",
        type: "activation",
        bullets: [
          `Industry sector: ${sponsor.industry || "General"}`,
          `Proposed Deliverables: ${brandCustomDeliverables}`,
          `USP Highlights: ${festProfile.pitchHighlights || "High youth engagement, organic student activations."}`
        ]
      },
      {
        slideNum: 4,
        title: "📦 Sponsorship Tiers",
        subtitle: "Flexible support budget packages",
        background: "bg-background-secondary",
        type: "packages",
        bullets: packagesList.map(p => `${p.tier} (₹${p.amount}): ${p.benefits.slice(0, 3).join(", ")}`)
      },
      {
        slideNum: 5,
        title: "🤝 Let's Collaborate!",
        subtitle: "Confirm details or request changes",
        background: "gradient-brand-subtle",
        type: "contact",
        bullets: [
          `Brand contact: ${sponsor.contactEmail}`,
          `Negotiator email: ${campaign.emailAccount?.emailAddress || "sponsorship-team@sponsorshipiq.com"}`,
          "Status: Proposal ready for review"
        ]
      }
    ];

    return NextResponse.json({
      outreachId: id,
      companyName: sponsor.companyName,
      festName: festProfile.name,
      slides,
    });
  } catch (err) {
    console.error("[Outreach Proposal Deck GET Error]", err);
    return NextResponse.json({ error: "Failed to generate proposal slide deck" }, { status: 500 });
  }
}
