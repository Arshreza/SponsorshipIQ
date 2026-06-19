import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Payments / Money tracker stored as JSON blob in GlobalSettings
// to avoid requiring a DB migration.

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await db.globalSettings.findFirst({
    where: { userId: session.user.id },
  });

  let payments = [];
  try {
    const raw = (settings as any)?.paymentsData;
    if (raw) payments = JSON.parse(raw);
  } catch {
    payments = [];
  }

  return NextResponse.json(payments);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payments = await req.json();

    await db.globalSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        dailyEmailLimit: 100,
        paymentsData: JSON.stringify(payments),
      } as any,
      update: {
        paymentsData: JSON.stringify(payments),
      } as any,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Money PUT]", err);
    return NextResponse.json({ error: "Failed to save payment data" }, { status: 500 });
  }
}
