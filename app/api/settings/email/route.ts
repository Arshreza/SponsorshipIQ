import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { displayName, emailAddress, provider, gmailAppPassword, smtpHost, smtpPort, smtpUsername, smtpPassword, smtpSecure } = body;

    if (!emailAddress) return NextResponse.json({ error: "Email address is required" }, { status: 400 });

    if (provider === "GMAIL" && !gmailAppPassword) {
      return NextResponse.json({ error: "Google App Password is required" }, { status: 400 });
    }
    if (provider === "SMTP" && (!smtpHost || !smtpPassword)) {
      return NextResponse.json({ error: "SMTP host and password are required" }, { status: 400 });
    }

    const account = await db.emailAccount.create({
      data: {
        userId: session.user.id,
        emailAddress,
        displayName: displayName || null,
        provider: provider === "SMTP" ? "SMTP" : "GMAIL",
        gmailAppPassword: gmailAppPassword ? encrypt(gmailAppPassword) : null,
        smtpHost: smtpHost || null,
        smtpPort: smtpPort ? Number(smtpPort) : null,
        smtpUsername: smtpUsername || null,
        smtpPassword: smtpPassword ? encrypt(smtpPassword) : null,
        smtpSecure: smtpSecure !== false,
        status: "CONNECTED",
      } as any,
    });

    return NextResponse.json({ success: true, id: account.id });
  } catch (err) {
    console.error("[EmailAccounts POST]", err);
    return NextResponse.json({ error: "Failed to save email account" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const accounts = await db.emailAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(accounts);
  } catch (err) {
    console.error("[EmailAccounts GET]", err);
    return NextResponse.json({ error: "Failed to load email accounts" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing account ID" }, { status: 400 });

    await db.emailAccount.delete({
      where: { id, userId: session.user.id } as any,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[EmailAccounts DELETE]", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
