import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Expects: array of {companyName, contactEmail, ...}
    const { sponsors } = await req.json() as { sponsors: Array<{companyName: string; contactEmail: string; [key: string]: string}> };

    if (!Array.isArray(sponsors) || sponsors.length === 0) {
      return NextResponse.json({ error: "No sponsors provided" }, { status: 400 });
    }

    let created = 0;
    let updated = 0;

    for (const s of sponsors) {
      if (!s.contactEmail || !s.companyName) continue;
      const result = await db.sponsor.upsert({
        where: { userId_contactEmail: { userId: session.user.id, contactEmail: s.contactEmail.toLowerCase().trim() } },
        create: {
          userId: session.user.id,
          companyName: s.companyName,
          contactEmail: s.contactEmail.toLowerCase().trim(),
          contactName: s.contactName || s.name || null,
          jobTitle: s.jobTitle || s.title || null,
          website: s.website || s.url || null,
          industry: s.industry || null,
          city: s.city || s.location || null,
          notes: s.notes || null,
        },
        update: {
          companyName: s.companyName,
          contactName: s.contactName || s.name || undefined,
          industry: s.industry || undefined,
        },
      });
      // Simple heuristic: if created vs updated
      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        created++;
      } else {
        updated++;
      }
    }

    return NextResponse.json({ created, updated, total: sponsors.length });
  } catch (err) {
    console.error("[Sponsors Import]", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
