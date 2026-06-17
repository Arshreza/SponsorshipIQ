import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.sponsorList.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ success: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Add sponsors to a list
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { sponsorIds } = await req.json() as { sponsorIds: string[] };
  const existing = await db.sponsorListEntry.findMany({
    where: {
      sponsorListId: id,
      sponsorId: { in: sponsorIds },
    },
    select: { sponsorId: true },
  });
  const existingIds = new Set(existing.map((e) => e.sponsorId));
  const newIds = sponsorIds.filter((sid) => !existingIds.has(sid));

  if (newIds.length > 0) {
    await db.sponsorListEntry.createMany({
      data: newIds.map((sponsorId) => ({ sponsorId, sponsorListId: id })),
    });
  }
  return NextResponse.json({ added: newIds.length });
}
