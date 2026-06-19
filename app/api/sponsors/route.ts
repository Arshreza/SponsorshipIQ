import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sponsors = await db.sponsor.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(sponsors);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      companyName,
      contactEmail,
      contactName,
      jobTitle,
      website,
      industry,
      city,
      phone,
      notes,
      status,
      amount,
      assignedTo,
      lastContact,
    } = body;

    if (!companyName || !contactEmail) {
      return NextResponse.json({ error: "companyName and contactEmail are required" }, { status: 400 });
    }

    const sponsor = await db.sponsor.upsert({
      where: { userId_contactEmail: { userId: session.user.id, contactEmail } },
      create: {
        userId: session.user.id,
        companyName,
        contactEmail,
        contactName,
        jobTitle,
        website,
        industry,
        city,
        phone,
        notes,
        status: status || "CONTACTED",
        amount: amount || 0,
        assignedTo,
        lastContact,
      },
      update: {
        companyName,
        contactName,
        jobTitle,
        website,
        industry,
        city,
        phone,
        notes,
        status,
        amount,
        assignedTo,
        lastContact,
      },
    });

    return NextResponse.json(sponsor, { status: 201 });
  } catch (err) {
    console.error("[Sponsors POST]", err);
    return NextResponse.json({ error: "Failed to save sponsor" }, { status: 500 });
  }
}
