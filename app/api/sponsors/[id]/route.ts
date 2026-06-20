import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const sponsor = await db.sponsor.findFirst({
    where: { id, userId: session.user.id },
    include: {
      outreaches: {
        include: {
          campaign: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!sponsor) {
    return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
  }

  return NextResponse.json(sponsor);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

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
      description,
      status,
      amount,
      assignedTo,
      lastContact,
    } = body;

    const sponsor = await db.sponsor.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    const updated = await db.sponsor.update({
      where: { id },
      data: {
        ...(companyName !== undefined && { companyName }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactName !== undefined && { contactName }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(website !== undefined && { website }),
        ...(industry !== undefined && { industry }),
        ...(city !== undefined && { city }),
        ...(phone !== undefined && { phone }),
        ...(notes !== undefined && { notes }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(amount !== undefined && { amount }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(lastContact !== undefined && { lastContact }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[Sponsors PATCH]", err);
    return NextResponse.json({ error: "Failed to update sponsor" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const sponsor = await db.sponsor.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    await db.sponsor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Sponsors DELETE]", err);
    return NextResponse.json({ error: "Failed to delete sponsor" }, { status: 500 });
  }
}
