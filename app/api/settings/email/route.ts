import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
