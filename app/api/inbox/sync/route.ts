import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncInboxForAccount } from "@/lib/email/imap-sync";

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const accounts = await db.emailAccount.findMany({
    where: { userId, status: "CONNECTED", provider: "GMAIL" },
  });

  if (accounts.length === 0) {
    return NextResponse.json({ message: "No connected Gmail accounts to sync.", synced: 0 });
  }

  let totalSynced = 0;
  const results: { account: string; synced: number; error?: string }[] = [];

  for (const account of accounts) {
    try {
      const count = await syncInboxForAccount(account as any);
      totalSynced += count;
      results.push({ account: account.emailAddress, synced: count });
    } catch (err: any) {
      results.push({ account: account.emailAddress, synced: 0, error: err.message });
    }
  }

  return NextResponse.json({ success: true, totalSynced, results });
}
