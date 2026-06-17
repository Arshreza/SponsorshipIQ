import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NewCampaignForm } from "@/components/campaigns/new-campaign-form";

export default async function NewCampaignPage() {
  const session = await auth();
  if (!session) return null;

  const [festProfiles, sponsorLists, emailAccounts] = await Promise.all([
    db.festProfile.findMany({
      where: { userId: session.user.id, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    db.sponsorList.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { entries: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.emailAccount.findMany({
      where: { userId: session.user.id, status: "CONNECTED" },
      select: { id: true, emailAddress: true, displayName: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Campaign</h1>
        <p className="text-foreground-muted text-sm mt-1">
          Link a fest profile with a sponsor list and let AI write the pitches.
        </p>
      </div>
      <NewCampaignForm
        festProfiles={festProfiles}
        sponsorLists={sponsorLists.map(l => ({ ...l, entryCount: l._count.entries }))}
        emailAccounts={emailAccounts}
      />
    </div>
  );
}
