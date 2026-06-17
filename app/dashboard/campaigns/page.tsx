import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  DRAFT:      'status-pending',
  GENERATING: 'status-drafted',
  READY:      'status-sent',
  ACTIVE:     'status-interested',
  PAUSED:     'status-replied',
  COMPLETED:  'status-converted',
};

export default async function CampaignsPage() {
  const session = await auth();
  if (!session) return null;

  const campaigns = await db.campaign.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      festProfile: { select: { name: true } },
      sponsorList: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-foreground-muted text-sm mt-1">
            Each campaign links a fest profile with a sponsor list and sends AI-generated pitches.
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 hover:scale-105 transition-all"
        >
          + New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-background-secondary border border-border rounded-2xl p-16 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-lg font-bold text-foreground mb-2">No campaigns yet</h3>
          <p className="text-foreground-muted text-sm mb-6 max-w-sm mx-auto">
            Create a campaign to start generating AI-personalized pitches for your sponsor list.
          </p>
          <Link href="/dashboard/campaigns/new" className="btn-shine gradient-brand text-white px-6 py-3 rounded-xl font-semibold text-sm inline-block">
            Launch your first campaign
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-background-secondary border border-border rounded-2xl p-6 spotlight-card hover:border-brand-300 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-xl">🚀</div>
                <span className={`status-badge ${statusColors[c.status] || 'status-pending'}`}>{c.status}</span>
              </div>
              <h3 className="font-bold text-foreground mb-1">{c.name}</h3>
              <p className="text-xs text-foreground-muted mb-4">
                {c.festProfile.name} · {c.sponsorList.name}
              </p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[['📝', c.drafted, 'Drafted'], ['📬', c.sent, 'Sent'], ['💬', c.replied, 'Replied'], ['🏆', c.converted, 'Won']].map(([icon, val, lbl]) => (
                  <div key={String(lbl)} className="text-center bg-background-tertiary rounded-xl py-2">
                    <div className="text-sm">{icon}</div>
                    <div className="font-bold text-sm text-foreground">{val}</div>
                    <div className="text-[10px] text-foreground-muted">{lbl}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-xs text-foreground-muted">{formatDate(c.createdAt)}</span>
                <Link href={`/dashboard/campaigns/${c.id}`} className="text-xs text-brand-600 hover:text-brand-500 font-semibold">
                  Open →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
