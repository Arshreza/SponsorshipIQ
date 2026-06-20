import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listId = req.nextUrl.searchParams.get("listId");
  if (!listId) return NextResponse.json({ error: "Missing listId" }, { status: 400 });

  try {
    const entries = await db.sponsorListEntry.findMany({
      where: { sponsorListId: listId },
      include: { sponsor: true } as any,
    });

    const sponsors = entries.map((e: any) => e.sponsor).filter(Boolean);
    return NextResponse.json(sponsors);
  } catch (err) {
    console.error("[Sponsors by-list GET]", err);
    return NextResponse.json({ error: "Failed to fetch sponsors" }, { status: 500 });
  }
}
