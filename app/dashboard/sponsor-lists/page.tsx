import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SponsorListsClient } from "@/components/sponsor-lists/sponsor-lists-client";

export default async function SponsorListsPage() {
  const session = await auth();
  if (!session) return null;

  const lists = await db.sponsorList.findMany({
    where: { userId: session.user.id },
    include: {
      entries: {
        include: { sponsor: { select: { companyName: true, industry: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const sponsors = await db.sponsor.findMany({
    where: { userId: session.user.id },
    select: { id: true, companyName: true, contactEmail: true, industry: true },
    orderBy: { companyName: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sponsor Lists</h1>
        <p className="text-foreground-muted text-sm mt-1">
          Group sponsors into lists and attach them to campaigns.
        </p>
      </div>
      <SponsorListsClient lists={lists} allSponsors={sponsors} />
    </div>
  );
}
