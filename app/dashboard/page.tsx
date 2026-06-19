import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  CONFIRMED:  { label: "Confirmed",  color: "bg-green-500/15 text-green-400 border-green-500/30",  dot: "bg-green-400" },
  INTERESTED: { label: "Interested", color: "bg-blue-500/15 text-blue-400 border-blue-500/30",    dot: "bg-blue-400" },
  CONTACTED:  { label: "Contacted",  color: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  REJECTED:   { label: "Rejected",   color: "bg-red-500/15 text-red-400 border-red-500/30",       dot: "bg-red-400" },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  // Fetch real data from DB
  const [sponsors, globalSettings] = await Promise.all([
    db.sponsor.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.globalSettings.findFirst({
      where: { userId: session.user.id },
    }),
  ]);

  const confirmed   = sponsors.filter(s => s.status === "CONFIRMED");
  const interested  = sponsors.filter(s => s.status === "INTERESTED");
  const contacted   = sponsors.filter(s => s.status === "CONTACTED");

  // Pull real payment totals from stored money data
  let totalRaised = 0;
  try {
    const raw = (globalSettings as any)?.paymentsData;
    if (raw) {
      const payments = JSON.parse(raw) as Array<{ status: string; amount: number }>;
      totalRaised = payments
        .filter(p => p.status === "PAID")
        .reduce((sum, p) => sum + p.amount, 0);
    } else {
      // Fallback: sum confirmed sponsor amounts
      totalRaised = confirmed.reduce((sum, s) => sum + s.amount, 0);
    }
  } catch {
    totalRaised = confirmed.reduce((sum, s) => sum + s.amount, 0);
  }

  const target   = 750000;
  const progress = Math.min(Math.round((totalRaised / target) * 100), 100);

  const stats = [
    { label: "Total Sponsors",  value: sponsors.length,    icon: "🏢", color: "text-brand-400" },
    { label: "Confirmed",       value: confirmed.length,   icon: "✅", color: "text-green-400" },
    { label: "Interested",      value: interested.length,  icon: "🔥", color: "text-blue-400" },
    { label: "In Follow-up",    value: contacted.length,   icon: "📞", color: "text-amber-400" },
    { label: "Funds Raised",    value: `₹${(totalRaised/1000).toFixed(0)}K`, icon: "💰", color: "text-purple-400" },
    { label: "Target Progress", value: `${progress}%`,     icon: "🎯", color: "text-pink-400" },
  ];

  const quickActions = [
    { label: "Add Sponsor",      href: "/dashboard/sponsors",     icon: "➕", desc: "Track a new company" },
    { label: "AI Cold Email",    href: "/dashboard/ai-email",     icon: "🤖", desc: "Generate pitch in 3 seconds" },
    { label: "AI Proposal PDF",  href: "/dashboard/ai-proposal",  icon: "📄", desc: "Full brochure in one click" },
    { label: "Money Tracker",    href: "/dashboard/money",        icon: "💰", desc: "See confirmed amounts" },
  ];

  // Recent 5 sponsors
  const recentSponsors = sponsors.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {session.user?.name?.split(" ")[0] || "Committee"} 👋
          </h1>
          <p className="text-foreground-muted text-sm mt-1">
            AI-powered sponsorship CRM — built for your fest, by AI Club.
          </p>
        </div>
        <Link
          href="/dashboard/sponsors"
          className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 hover:scale-105 transition-all"
        >
          + Add Sponsor
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-background-secondary border border-border rounded-2xl p-4 spotlight-card hover:border-brand-300 transition-all">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-foreground-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Target Progress Bar */}
      <div className="bg-background-secondary border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">💰 Sponsorship Target Progress</h2>
          <span className="text-sm font-bold text-brand-400">₹{(totalRaised/1000).toFixed(0)}K / ₹{(target/1000).toFixed(0)}K</span>
        </div>
        <div className="w-full bg-background rounded-full h-4 overflow-hidden">
          <div
            className="h-full gradient-brand rounded-full transition-all duration-700 flex items-center justify-end pr-2"
            style={{ width: `${Math.max(progress, 3)}%` }}
          >
            <span className="text-[10px] font-bold text-white">{progress}%</span>
          </div>
        </div>
        <p className="text-xs text-foreground-muted mt-2">
          {totalRaised >= target
            ? "🎉 Target reached!"
            : `₹${((target - totalRaised)/1000).toFixed(0)}K remaining to target`}
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-4">⚡ Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="bg-background-secondary border border-border rounded-2xl p-5 flex items-start gap-4 hover:border-brand-300 hover:shadow-md transition-all group spotlight-card"
            >
              <div className="text-2xl shrink-0 group-hover:scale-110 transition-transform">{a.icon}</div>
              <div>
                <div className="text-sm font-bold text-foreground group-hover:text-brand-400 transition-colors">{a.label}</div>
                <div className="text-xs text-foreground-muted mt-0.5">{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Sponsors */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">🏢 Recent Sponsors</h2>
          <Link href="/dashboard/sponsors" className="text-xs text-brand-400 hover:text-brand-300 font-semibold">View all →</Link>
        </div>
        <div className="bg-background-secondary border border-border rounded-2xl overflow-hidden">
          {recentSponsors.length === 0 ? (
            <div className="py-12 text-center text-foreground-muted text-sm">
              No sponsors yet.{" "}
              <Link href="/dashboard/sponsors" className="text-brand-400 hover:underline font-semibold">Add your first one →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Company</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSponsors.map((s) => {
                    const sc = statusConfig[s.status] || statusConfig["CONTACTED"];
                    return (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-background transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{s.companyName}</td>
                        <td className="px-4 py-3 text-foreground-muted text-xs">{s.contactName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-foreground">
                          {s.amount > 0 ? `₹${s.amount.toLocaleString()}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-foreground-muted text-xs">{s.assignedTo || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
