import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const bodyData = await req.json();
    const {
      companyName,
      contactEmail,
      contactName,
      jobTitle,
      website,
      industry,
      city,
      notes,
      aiResearch,
    } = bodyData;

    if (!companyName || !contactEmail) {
      return NextResponse.json({ error: "Company name and contact email are required" }, { status: 400 });
    }

    // Check if the sponsor email already exists for this user to avoid duplicates
    const existing = await db.sponsor.findFirst({
      where: {
        userId: session.user.id,
        contactEmail,
      },
    });

    if (existing) {
      return NextResponse.json({ 
        message: "Sponsor already exists in your database",
        sponsor: existing,
        isDuplicate: true 
      });
    }

    const newSponsor = await db.sponsor.create({
      data: {
        userId: session.user.id,
        companyName,
        contactEmail,
        contactName: contactName || "Marketing Team",
        jobTitle: jobTitle || "Partnerships Head",
        website: website || "",
        industry: industry || "General",
        city: city || "India",
        notes: notes || "",
        aiResearch: aiResearch || "",
        isVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      sponsor: newSponsor,
      isDuplicate: false
    });
  } catch (err) {
    console.error("[Sponsors Prospector POST API]", err);
    return NextResponse.json({ error: "Failed to add brand prospect to CRM" }, { status: 500 });
  }
}
