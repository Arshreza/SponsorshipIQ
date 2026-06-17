import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function SponsorsPage() {
  const session = await auth();
  if (!session) return null;

  const sponsors = await db.sponsor.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { outreaches: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sponsors</h1>
          <p className="text-foreground-muted text-sm mt-1">
            Your brand contact database — {sponsors.length} company{sponsors.length !== 1 ? 'ies' : 'y'} total.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/sponsors/import"
            className="text-sm font-semibold text-foreground-muted hover:text-foreground border border-border hover:border-border-hover px-4 py-2.5 rounded-xl transition-all"
          >
            📂 Import CSV
          </Link>
          <Link
            href="/dashboard/sponsors/new"
            className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 hover:scale-105 transition-all"
          >
            + Add Sponsor
          </Link>
        </div>
      </div>

      {sponsors.length === 0 ? (
        <div className="bg-background-secondary border border-border rounded-2xl p-16 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-bold text-foreground mb-2">No sponsors yet</h3>
          <p className="text-foreground-muted text-sm mb-6 max-w-sm mx-auto">
            Import a CSV of brand contacts or add them manually. Include company name, contact email, website, and industry.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/dashboard/sponsors/import" className="text-sm font-semibold border border-border hover:border-border-hover px-5 py-2.5 rounded-xl transition-all text-foreground">
              Import CSV
            </Link>
            <Link href="/dashboard/sponsors/new" className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm inline-block">
              Add Sponsor
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-background-secondary border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background-tertiary">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-foreground-secondary uppercase tracking-wider">Company</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-foreground-secondary uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-foreground-secondary uppercase tracking-wider hidden lg:table-cell">Industry</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-foreground-secondary uppercase tracking-wider hidden xl:table-cell">Outreaches</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-foreground-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sponsors.map((s) => (
                <tr key={s.id} className="hover:bg-background-tertiary transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background-tertiary border border-border flex items-center justify-center text-xs font-bold text-foreground-secondary shrink-0">
                        {s.companyName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{s.companyName}</div>
                        {s.website && <div className="text-xs text-foreground-muted">{s.website}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="text-foreground">{s.contactName || '—'}</div>
                    <div className="text-xs text-foreground-muted">{s.contactEmail}</div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-xs bg-background-tertiary border border-border px-2.5 py-0.5 rounded-full text-foreground-muted font-medium">
                      {s.industry || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden xl:table-cell">
                    <span className="text-foreground-muted">{s._count.outreaches}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/dashboard/sponsors/${s.id}`}
                      className="text-xs text-brand-600 hover:text-brand-500 font-semibold transition-colors"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
