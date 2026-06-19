import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [sponsorLists, emailAccounts] = await Promise.all([
      db.sponsorList.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      }),
      db.emailAccount.findMany({
        where: { userId: session.user.id, status: "CONNECTED" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    let finalLists = [...sponsorLists];

    // If no lists exist, create a default one and seed the mock sponsors into it
    if (sponsorLists.length === 0) {
      try {
        const defaultList = await db.sponsorList.create({
          data: {
            userId: session.user.id,
            name: "Premium Outreach List",
            description: "Default outreach target list.",
          },
        });

        // Find existing sponsors to associate
        const sponsors = await db.sponsor.findMany({
          where: { userId: session.user.id },
        });

        for (const sp of sponsors) {
          await db.sponsorListEntry.create({
            data: {
              sponsorId: sp.id,
              sponsorListId: defaultList.id,
            },
          });
        }

        finalLists = [defaultList];
      } catch (seedErr) {
        console.error("Seeding default sponsor list failed:", seedErr);
      }
    }

    return NextResponse.json({
      sponsorLists: finalLists,
      emailAccounts,
    });
  } catch (err) {
    console.error("[Campaign dependencies GET]", err);
    return NextResponse.json({ error: "Failed to load dependencies" }, { status: 500 });
  }
}
