import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const fest = await db.festProfile.findFirst({
      where: { userId: (session.user as any).id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(fest || null);
  } catch (err) {
    console.error("[Fest GET]", err);
    return NextResponse.json({ error: "Failed to fetch fest profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, festType, college, city, theme, edition, eventDates, expectedFootfall, socialMediaReach, websiteUrl, instagramHandle, pitchHighlights, packages } = body;

    if (!name || !college) {
      return NextResponse.json({ error: "Fest name and college are required" }, { status: 400 });
    }

    const existing = await db.festProfile.findFirst({
      where: { userId: (session.user as any).id },
    });

    let fest;
    if (existing) {
      fest = await db.festProfile.update({
        where: { id: existing.id },
        data: {
          name, festType, college, city, theme, edition, eventDates,
          expectedFootfall: expectedFootfall ? Number(expectedFootfall) : null,
          socialMediaReach: socialMediaReach ? Number(socialMediaReach) : null,
          websiteUrl, instagramHandle, pitchHighlights,
          packages: packages || null,
          isActive: true,
        },
      });
    } else {
      fest = await db.festProfile.create({
        data: {
          userId: (session.user as any).id,
          name, festType, college, city, theme, edition, eventDates,
          expectedFootfall: expectedFootfall ? Number(expectedFootfall) : null,
          socialMediaReach: socialMediaReach ? Number(socialMediaReach) : null,
          websiteUrl, instagramHandle, pitchHighlights,
          packages: packages || null,
          isActive: true,
        },
      });
    }

    return NextResponse.json({ success: true, fest });
  } catch (err) {
    console.error("[Fest POST]", err);
    return NextResponse.json({ error: "Failed to save fest profile" }, { status: 500 });
  }
}
