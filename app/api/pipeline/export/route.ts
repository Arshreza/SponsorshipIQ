import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const outreaches = await db.outreach.findMany({
    where: { campaign: { userId: session.user.id } },
    include: {
      sponsor: { select: { companyName: true, contactEmail: true, contactName: true, industry: true } },
      campaign: { select: { name: true, festProfile: { select: { name: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Build CSV
  const header = "Fest,Campaign,Company,Contact Name,Contact Email,Industry,Status,Reply Notes,Sent At,Updated At";
  const rows = outreaches.map((o) => {
    const fields = [
      o.campaign.festProfile.name,
      o.campaign.name,
      o.sponsor.companyName,
      o.sponsor.contactName || "",
      o.sponsor.contactEmail,
      o.sponsor.industry || "",
      o.status,
      (o.replyNotes || "").replace(/,/g, ";").replace(/\n/g, " "),
      o.sentAt ? o.sentAt.toISOString() : "",
      o.updatedAt.toISOString(),
    ];
    return fields.map((f) => `"${f}"`).join(",");
  });

  const csv = [header, ...rows].join("\n");
  const filename = `sponsorshipiq-pipeline-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
