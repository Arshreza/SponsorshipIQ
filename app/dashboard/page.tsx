import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const userId = session.user.id;

  const [festCount, sponsorCount, campaignCount, outreaches] =
    await Promise.all([
      db.festProfile.count({ where: { userId } }),
      db.sponsor.count({ where: { userId } }),
      db.campaign.count({ where: { userId } }),
      db.outreach.findMany({
        where: { campaign: { userId } },
        select: { status: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
    ]);

  const stats = {
    total: outreaches.length,
    sent: outreaches.filter((o) => ["SENT", "OPENED", "REPLIED", "INTERESTED", "CONVERTED"].includes(o.status)).length,
    replied: outreaches.filter((o) => ["REPLIED", "INTERESTED", "CONVERTED"].includes(o.status)).length,
    converted: outreaches.filter((o) => o.status === "CONVERTED").length,
  };

  const replyRate = stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 100) : 0;

  const quickActions = [
    { label: "New Fest Profile", href: "/dashboard/fest-profiles/new", icon: "🎪", desc: "Create a new festival profile" },
    { label: "Import Sponsors", href: "/dashboard/sponsors/import", icon: "📂", desc: "Upload a CSV of brand contacts" },
    { label: "Launch Campaign", href: "/dashboard/campaigns/new", icon: "🚀", desc: "Start an outreach campaign" },
    { label: "View Pipeline", href: "/dashboard/pipeline", icon: "📊", desc: "Track all sponsor statuses" },
  ];

  const metricCards = [
    { label: "Fest Profiles", value: festCount, icon: "🎪", color: "brand", sub: "Active fests" },
    { label: "Sponsors in DB", value: sponsorCount, icon: "🏢", color: "accent", sub: "Brand contacts" },
    { label: "Emails Sent", value: stats.sent, icon: "📬", color: "info", sub: "Total outreach" },
    { label: "Replied", value: stats.replied, icon: "💬", color: "success", sub: `${replyRate}% reply rate` },
    { label: "Converted", value: stats.converted, icon: "🏆", color: "warning", sub: "Confirmed sponsors" },
    { label: "Campaigns", value: campaignCount, icon: "🚀", color: "brand", sub: "Total campaigns" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {session.user?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-foreground-muted text-sm mt-1">
          Here&apos;s your sponsorship pipeline at a glance.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((m, i) => (
          <div
            key={i}
            className="bg-background-secondary border border-border rounded-2xl p-4 spotlight-card hover:border-brand-300 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{m.icon}</span>
            </div>
            <div className="text-2xl font-extrabold text-foreground">{m.value}</div>
            <div className="text-xs font-semibold text-foreground-secondary mt-1">{m.label}</div>
            <div className="text-[10px] text-foreground-muted mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-foreground-secondary uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="bg-background-secondary border border-border rounded-2xl p-5 flex items-start gap-4 hover:border-brand-300 hover:shadow-md transition-all group spotlight-card"
            >
              <div className="text-2xl shrink-0 group-hover:scale-110 transition-transform">{a.icon}</div>
              <div>
                <div className="text-sm font-bold text-foreground group-hover:text-brand-600 transition-colors">
                  {a.label}
                </div>
                <div className="text-xs text-foreground-muted mt-0.5">{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started (if no data) */}
      {festCount === 0 && (
        <div className="border-gradient rounded-3xl p-8 bg-background-secondary text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-foreground mb-2">Let&apos;s get started!</h3>
          <p className="text-foreground-muted text-sm max-w-md mx-auto mb-6">
            SponsorshipIQ is ready to revolutionize your fest&apos;s sponsorship outreach. Start by creating your fest profile.
          </p>
          <Link
            href="/dashboard/fest-profiles/new"
            className="btn-shine gradient-brand text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 inline-block hover:scale-105 transition-all"
          >
            Create Fest Profile →
          </Link>
        </div>
      )}

      {/* Pipeline summary */}
      {stats.total > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground-secondary uppercase tracking-wider">
              Pipeline Summary
            </h2>
            <Link href="/dashboard/pipeline" className="text-xs text-brand-600 hover:text-brand-500 font-semibold">
              View full pipeline →
            </Link>
          </div>
          <div className="bg-background-secondary border border-border rounded-2xl p-6">
            <div className="flex items-center gap-1 h-8 rounded-xl overflow-hidden">
              {[
                { label: "Drafted", count: outreaches.filter(o => o.status === "DRAFTED").length, color: "bg-blue-500" },
                { label: "Sent", count: outreaches.filter(o => o.status === "SENT").length, color: "bg-brand-500" },
                { label: "Replied", count: stats.replied, color: "bg-accent-500" },
                { label: "Converted", count: stats.converted, color: "bg-green-500" },
              ].filter(s => s.count > 0).map((s) => (
                <div
                  key={s.label}
                  className={`${s.color} h-full flex items-center justify-center text-xs font-bold text-white transition-all`}
                  style={{ flex: s.count }}
                  title={`${s.label}: ${s.count}`}
                >
                  {s.count > 0 && s.count}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {[
                { label: "Drafted",   color: "bg-blue-500",    count: outreaches.filter(o => o.status === "DRAFTED").length },
                { label: "Sent",      color: "bg-brand-500",   count: stats.sent },
                { label: "Replied",   color: "bg-accent-500",  count: stats.replied },
                { label: "Converted", color: "bg-green-500",   count: stats.converted },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5 text-xs text-foreground-muted">
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  {s.label} ({s.count})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
