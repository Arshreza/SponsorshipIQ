import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function FestProfilesPage() {
  const session = await auth();
  if (!session) return null;

  const profiles = await db.festProfile.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { campaigns: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fest Profiles</h1>
          <p className="text-foreground-muted text-sm mt-1">
            Manage your festival profiles — theme, footfall, packages, and deck.
          </p>
        </div>
        <Link
          href="/dashboard/fest-profiles/new"
          className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 hover:scale-105 transition-all"
        >
          + New Profile
        </Link>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-background-secondary border border-border rounded-2xl p-16 text-center">
          <div className="text-6xl mb-4">🎪</div>
          <h3 className="text-lg font-bold text-foreground mb-2">No fest profiles yet</h3>
          <p className="text-foreground-muted text-sm mb-6 max-w-sm mx-auto">
            Create a profile for each of your festivals — Synapse, I-Fest, Concours — with their theme, packages, and deliverables.
          </p>
          <Link
            href="/dashboard/fest-profiles/new"
            className="btn-shine gradient-brand text-white px-6 py-3 rounded-xl font-semibold text-sm inline-block"
          >
            Create your first profile
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="bg-background-secondary border border-border rounded-2xl p-6 spotlight-card hover:border-brand-300 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center text-2xl shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform">
                  🎪
                </div>
                <span className={`status-badge ${p.isActive ? 'status-sent' : 'status-rejected'}`}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <h3 className="text-base font-bold text-foreground mb-1">{p.name}</h3>
              {p.edition && <p className="text-xs text-foreground-muted mb-3">{p.edition}</p>}

              <div className="space-y-1.5 text-xs text-foreground-muted mb-4">
                {p.college && <div className="flex items-center gap-2"><span>🏫</span> {p.college}</div>}
                {p.city && <div className="flex items-center gap-2"><span>📍</span> {p.city}</div>}
                {p.expectedFootfall && <div className="flex items-center gap-2"><span>👥</span> {p.expectedFootfall.toLocaleString()} expected footfall</div>}
                {p.eventDates && <div className="flex items-center gap-2"><span>📅</span> {p.eventDates}</div>}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-xs text-foreground-muted">
                  {p._count.campaigns} campaign{p._count.campaigns !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/fest-profiles/${p.id}`}
                    className="text-xs text-brand-600 hover:text-brand-500 font-semibold transition-colors"
                  >
                    View →
                  </Link>
                  <Link
                    href={`/dashboard/fest-profiles/${p.id}/edit`}
                    className="text-xs text-foreground-muted hover:text-foreground font-semibold transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
