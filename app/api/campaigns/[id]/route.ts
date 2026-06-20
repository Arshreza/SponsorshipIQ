import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaign = await db.campaign.findFirst({
    where: { id, userId: session.user.id } as any,
    include: { festProfile: true, sponsorList: true, emailAccount: true },
  });

  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  return NextResponse.json(campaign);
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { emailAccountId, name, guidelines, toneOfVoice, emailWordLimit, subjectTemplate } = body;

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
        ...(emailAccountId !== undefined && { emailAccountId: emailAccountId || null }),
        ...(name !== undefined && { name }),
        ...(guidelines !== undefined && { guidelines }),
        ...(toneOfVoice !== undefined && { toneOfVoice }),
        ...(emailWordLimit !== undefined && { emailWordLimit: Number(emailWordLimit) }),
        ...(subjectTemplate !== undefined && { subjectTemplate }),
      } as any,
    });

    // If email account changed, update all pending outreaches too
    if (emailAccountId !== undefined) {
      await db.outreach.updateMany({
        where: { campaignId: id, status: "PENDING" },
        data: { emailAccountId: emailAccountId || null } as any,
      });
    }

    return NextResponse.json({ success: true, campaign: updated });
  } catch (err) {
    console.error("[Campaign PATCH]", err);
    return NextResponse.json({ error: "Failed to update campaign settings" }, { status: 500 });
  }
}
