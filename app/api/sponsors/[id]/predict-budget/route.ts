import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const sponsor = await db.sponsor.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    const industry = sponsor.industry?.toLowerCase() || "general";
    
    let baseMin = 50000;
    let baseMax = 120000;
    let confidence = "Medium (75%)";
    let strategy = "Pitch Associate or Co-Sponsorship packages first. Focus on standard banners.";

    if (industry.includes("tech") || industry.includes("software") || industry.includes("cloud")) {
      baseMin = 100000;
      baseMax = 280000;
      confidence = "High (90%)";
      strategy = "Pitch workshop speaking slots, coding hackathon tracks, and developer API workshop access.";
    } else if (industry.includes("beverage") || industry.includes("drink") || industry.includes("food")) {
      baseMin = 150000;
      baseMax = 250000;
      confidence = "High (88%)";
      strategy = "Demand exclusive pouring rights and high-footfall beverage sampling truck placements.";
    } else if (industry.includes("bank") || industry.includes("finance") || industry.includes("fintech")) {
      baseMin = 200000;
      baseMax = 500000;
      confidence = "High (92%)";
      strategy = "Focus on zero-balance student bank account registrations, debit card signups, and prime concert banners.";
    } else if (industry.includes("auto") || industry.includes("car")) {
      baseMin = 250000;
      baseMax = 450000;
      confidence = "Medium (80%)";
      strategy = "Pitch central entrance vehicle display zones, VIP concert tickets, and test-drive lead collections.";
    }

    // Dynamic randomization based on company name hash to keep it stable
    const hash = sponsor.companyName.charCodeAt(0) + (sponsor.companyName.charCodeAt(1) || 0);
    const variance = (hash % 10) * 10000;
    
    const finalMin = baseMin + variance;
    const finalMax = baseMax + variance;

    return NextResponse.json({
      sponsorId: id,
      companyName: sponsor.companyName,
      industry: sponsor.industry || "General",
      predictedMin: finalMin,
      predictedMax: finalMax,
      confidenceScore: confidence,
      recommendedStrategy: strategy,
      gstApplicable: true,
      lastUpdated: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[Budget Predict API error]", err);
    return NextResponse.json({ error: "Estimation engine failed: " + err.message }, { status: 500 });
  }
}
