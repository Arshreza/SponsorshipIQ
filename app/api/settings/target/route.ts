import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await db.globalSettings.findFirst({
      where: { userId: session.user.id },
    });
    const targetAmount = settings?.targetAmount ?? 750000;
    return NextResponse.json({ targetAmount });
  } catch (err) {
    console.error("[Target GET]", err);
    return NextResponse.json({ targetAmount: 750000 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { targetAmount } = await req.json();
    if (typeof targetAmount !== "number" || targetAmount < 0) {
      return NextResponse.json({ error: "Invalid target amount" }, { status: 400 });
    }

    await db.globalSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        dailyEmailLimit: 100,
        targetAmount,
      } as any,
      update: {
        targetAmount,
      } as any,
    });

    return NextResponse.json({ success: true, targetAmount });
  } catch (err) {
    console.error("[Target PUT]", err);
    return NextResponse.json({ error: "Failed to update target settings" }, { status: 500 });
  }
}
