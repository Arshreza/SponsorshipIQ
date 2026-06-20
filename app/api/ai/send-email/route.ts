import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/sender";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { to, subject, body, emailAccountId } = await req.json();

    if (!to || !subject || !body || !emailAccountId) {
      return NextResponse.json({ error: "Missing required fields: to, subject, body, emailAccountId" }, { status: 400 });
    }

    const account = await db.emailAccount.findUnique({
      where: { id: emailAccountId } as any,
    });

    if (!account || account.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Email account not found" }, { status: 404 });
    }

    if (account.status !== "CONNECTED") {
      return NextResponse.json({ error: "Email account is not connected" }, { status: 400 });
    }

    const info = await sendEmail({
      account,
      to,
      subject,
      html: body.replace(/\n/g, "<br>"),
      text: body,
    });

    return NextResponse.json({ success: true, messageId: (info as any)?.messageId });
  } catch (err: any) {
    console.error("[AI Send Email]", err);
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 });
  }
}
