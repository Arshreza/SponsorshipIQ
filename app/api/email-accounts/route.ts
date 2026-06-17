import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      displayName,
      emailAddress,
      provider,
      gmailAppPassword,
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      dailyLimit,
    } = body;

    if (!emailAddress) {
      return NextResponse.json({ error: "Email address required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {
      userId: session.user.id,
      emailAddress,
      displayName,
      provider: provider || "GMAIL",
      dailyLimit: Number(dailyLimit) || 50,
      status: "CONNECTED",
    };

    if (gmailAppPassword) {
      data.gmailAppPassword = encrypt(gmailAppPassword);
    }
    if (smtpHost) {
      data.smtpHost = smtpHost;
      data.smtpPort = Number(smtpPort) || 587;
      data.smtpUsername = smtpUsername;
    }
    if (smtpPassword) {
      data.smtpPassword = encrypt(smtpPassword);
    }

    const account = await db.emailAccount.create({ data: data as Parameters<typeof db.emailAccount.create>[0]["data"] });
    
    // Return without encrypted password
    const { gmailAppPassword: _, smtpPassword: __, ...safeAccount } = account as Record<string, unknown>;
    void _; void __;
    return NextResponse.json(safeAccount, { status: 201 });
  } catch (err) {
    console.error("[EmailAccounts POST]", err);
    return NextResponse.json({ error: "Failed to connect account" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await db.emailAccount.findMany({
    where: { userId: session.user.id },
    select: {
      id: true, emailAddress: true, displayName: true, provider: true,
      status: true, dailyLimit: true, sentToday: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(accounts);
}
