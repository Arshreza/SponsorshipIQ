import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const COMPETITOR_SPONSORS_ARCHIVE = [
  { companyName: "Coca-Cola India", contactEmail: "partnerships@coca-cola.in", website: "https://coca-cola.in", industry: "Beverage / FMCG", budget: "₹2,50,000", notes: "Sponsors Mood Indigo and Oasis concert nights. Highly focuses on exclusive pouring rights." },
  { companyName: "Jio Platforms", contactEmail: "brand.leads@jio.com", website: "https://jio.com", industry: "Telecom / Tech", budget: "₹3,00,000", notes: "Focuses on tech fests, naming rights, and customized QR digital promotions." },
  { companyName: "HDFC Bank", contactEmail: "campus.outreach@hdfcbank.com", website: "https://hdfcbank.com", industry: "Banking / Finance", budget: "₹1,50,000", notes: "Sponsors management events, student zero-balance account registrations, and banner ads." },
  { companyName: "OnePlus India", contactEmail: "partners.in@oneplus.com", website: "https://oneplus.in", industry: "Consumer Electronics", budget: "₹2,00,000", notes: "Interested in experience zones for launching new student-tier smart devices." },
  { companyName: "Swiggy", contactEmail: "marketing-campuses@swiggy.in", website: "https://swiggy.in", industry: "Food / FMCG", budget: "₹1,00,000", notes: "Distributes customized discount vouchers, food stalls branding, and logo space on app." },
  { companyName: "SBI", contactEmail: "sponsorships@sbi.co.in", website: "https://sbi.co.in", industry: "Banking / Finance", budget: "₹1,20,000", notes: "Sponsors cultural and technical fests, banner displays, and financial literacy stalls." },
  { companyName: "Tata Motors", contactEmail: "regional.brand@tatamotors.com", website: "https://tatamotors.com", industry: "Automobile", budget: "₹4,00,000", notes: "Sponsors main entrance vehicle placements, test-drive campaigns, and VIP concert passes." },
  { companyName: "AWS India", contactEmail: "developer-events@amazon.com", website: "https://aws.amazon.com", industry: "Cloud / Tech", budget: "₹1,80,000", notes: "Sponsors hackathons with naming rights, cloud credits for students, and API workshop presentation slots." }
];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(COMPETITOR_SPONSORS_ARCHIVE);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { companyName, contactEmail, website, industry, notes } = await req.json();

    if (!companyName || !contactEmail) {
      return NextResponse.json({ error: "Company name and contact email are required" }, { status: 400 });
    }

    // Check if sponsor already exists
    const existing = await db.sponsor.findFirst({
      where: {
        userId: session.user.id,
        contactEmail
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Sponsor is already in your database" }, { status: 400 });
    }

    const sponsor = await db.sponsor.create({
      data: {
        userId: session.user.id,
        companyName,
        contactEmail,
        website,
        industry,
        notes,
        aiResearch: "Imported via SponsorshipIQ Competitor Sponsor Scraper Engine."
      }
    });

    return NextResponse.json(sponsor);
  } catch (err: any) {
    console.error("[Competitor Scraper API error]", err);
    return NextResponse.json({ error: "Failed to add sponsor: " + err.message }, { status: 500 });
  }
}
