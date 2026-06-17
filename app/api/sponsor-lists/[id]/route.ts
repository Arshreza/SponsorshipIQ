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
  if (!sponsorIds?.length) return NextResponse.json({ error: "No sponsor IDs" }, { status: 400 });

  await db.sponsorListEntry.createMany({
    data: sponsorIds.map((sponsorId) => ({ sponsorId, sponsorListId: id })),
    skipDuplicates: true,
  });
  return NextResponse.json({ added: sponsorIds.length });
}
