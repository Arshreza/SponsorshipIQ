import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Follow-ups are stored as a JSON blob in the user's GlobalSettings row
// to avoid requiring a DB migration for a new table.

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await db.globalSettings.findFirst({
    where: { userId: session.user.id },
  });

  let followups = [];
  try {
    const raw = (settings as any)?.followupsData;
    if (raw) followups = JSON.parse(raw);
  } catch {
    followups = [];
  }

  return NextResponse.json(followups);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const followups = await req.json();

    await db.globalSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        dailyEmailLimit: 100,
        followupsData: JSON.stringify(followups),
      } as any,
      update: {
        followupsData: JSON.stringify(followups),
      } as any,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Followups PUT]", err);
    return NextResponse.json({ error: "Failed to save follow-ups" }, { status: 500 });
  }
}
