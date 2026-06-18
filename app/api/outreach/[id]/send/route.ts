import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/sender";
import { syncCampaignStats } from "../route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const outreach = await db.outreach.findUnique({
      where: { id },
      include: {
        sponsor: true,
        campaign: {
          include: {
            emailAccount: true,
          },
        },
      },
    });

    if (!outreach || outreach.campaign.userId !== session.user.id) {
      return NextResponse.json({ error: "Outreach not found" }, { status: 404 });
    }

    if (!outreach.subject || !outreach.body) {
      return NextResponse.json({ error: "AI pitch is not yet generated for this outreach" }, { status: 400 });
    }

    const emailAccount = outreach.campaign.emailAccount;
    if (!emailAccount) {
      return NextResponse.json({ error: "No email account connected to this campaign" }, { status: 400 });
    }

    // Prepare HTML body
    const bodyHtml = outreach.body
      .split("\n")
      .map((line) => `<p>${line}</p>`)
      .join("");

    const info = await sendEmail({
      account: emailAccount,
      to: outreach.sponsor.contactEmail,
      subject: outreach.subject,
      html: bodyHtml,
      text: outreach.body,
    });

    // Update status to SENT
    const updated = await db.outreach.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        messageId: info.messageId,
      },
    });

    // Update campaign stats
    await syncCampaignStats(outreach.campaignId);

    return NextResponse.json({
      success: true,
      outreach: updated,
      messageId: info.messageId,
    });
  } catch (err) {
    console.error("[Outreach SEND SINGLE API]", err);
    return NextResponse.json({ error: "Failed to dispatch email pitch" }, { status: 500 });
  }
}
