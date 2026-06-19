import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { emailAccountId } = await req.json();

    const campaign = await db.campaign.findUnique({
      where: { id, userId: session.user.id } as any,
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Verify email account is connected if linking one
    if (emailAccountId) {
      const emailAcc = await db.emailAccount.findFirst({
        where: { id: emailAccountId, userId: session.user.id },
      });
      if (!emailAcc || emailAcc.status !== "CONNECTED") {
        return NextResponse.json({ error: "Selected email account is invalid or disconnected" }, { status: 400 });
      }
    }

    const updated = await db.campaign.update({
      where: { id },
      data: {
        emailAccountId: emailAccountId || null,
      } as any,
    });

    // Update all pending outreaches associated with this campaign
    await db.outreach.updateMany({
      where: { campaignId: id, status: "PENDING" },
      data: { emailAccountId: emailAccountId || null } as any,
    });

    return NextResponse.json({ success: true, emailAccountId: updated.emailAccountId });
  } catch (err) {
    console.error("[Campaign PATCH]", err);
    return NextResponse.json({ error: "Failed to update campaign settings" }, { status: 500 });
  }
}
