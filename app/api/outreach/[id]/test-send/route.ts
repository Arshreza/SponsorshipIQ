import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/sender";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const bodyData = await req.json();
    const testEmailRecipient = bodyData.testEmail || session.user.email;

    if (!testEmailRecipient) {
      return NextResponse.json({ error: "No recipient email address specified" }, { status: 400 });
    }

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
      return NextResponse.json({ error: "No sending email account connected to this campaign" }, { status: 400 });
    }

    // Prepare HTML body
    const bodyHtml = outreach.body
      .split("\n")
      .map((line) => `<p>${line}</p>`)
      .join("");

    const subjectLine = `[TEST] ${outreach.subject}`;

    const info = await sendEmail({
      account: emailAccount,
      to: testEmailRecipient,
      subject: subjectLine,
      html: bodyHtml,
      text: outreach.body,
    });

    return NextResponse.json({
      success: true,
      recipient: testEmailRecipient,
      messageId: info.messageId,
    });
  } catch (err) {
    console.error("[Outreach TEST SEND API]", err);
    return NextResponse.json({ error: "Failed to dispatch test email" }, { status: 500 });
  }
}
