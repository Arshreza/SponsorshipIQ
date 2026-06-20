"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface Outreach {
  id: string;
  status: string;
  subject: string | null;
  body: string | null;
  sentAt: string | null;
  repliedAt: string | null;
  generationError: string | null;
  sponsor: {
    id: string;
    companyName: string;
    contactEmail: string;
    contactName: string | null;
    industry: string | null;
  };
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  totalSponsors: number;
  sent: number;
  drafted: number;
  replied: number;
  converted: number;
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:   { label: "Pending",   color: "bg-gray-500/15 text-gray-400 border-gray-500/30",      dot: "bg-gray-400" },
  DRAFTED:   { label: "Drafted",   color: "bg-purple-500/15 text-purple-400 border-purple-500/30", dot: "bg-purple-400" },
  SENT:      { label: "Sent",      color: "bg-blue-500/15 text-blue-400 border-blue-500/30",       dot: "bg-blue-400" },
  REPLIED:   { label: "Replied",   color: "bg-teal-500/15 text-teal-400 border-teal-500/30",       dot: "bg-teal-400" },
  CONVERTED: { label: "Converted", color: "bg-green-500/15 text-green-400 border-green-500/30",    dot: "bg-green-400" },
  FAILED:    { label: "Failed",    color: "bg-red-500/15 text-red-400 border-red-500/30",          dot: "bg-red-400" },
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [outreaches, setOutreaches] = useState<Outreach[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/outreaches`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data.campaign);
        setOutreaches(data.outreaches);
      } else {
        toast.error("Failed to load campaign");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function retryOutreach(outreachId: string) {
    setRetryingId(outreachId);
    try {
      const res = await fetch(`/api/campaigns/${id}/outreaches`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outreachId }),
      });
      if (res.ok) {
        toast.success("Outreach reset to Pending — it will be picked up on the next Send Now.");
        setOutreaches(prev => prev.map(o => o.id === outreachId ? { ...o, status: "PENDING", generationError: null } : o));
      } else {
        toast.error("Failed to retry outreach");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setRetryingId(null);
    }
  }

  const filtered = filter === "ALL" ? outreaches : outreaches.filter(o => o.status === filter);
  const counts = outreaches.reduce<Record<string, number>>((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-foreground-muted text-sm">Loading campaign…</p>
      </div>
    );
  }

  if (!campaign) {
    return <div className="text-center py-12 text-foreground-muted">Campaign not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/campaigns" className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 mb-2">
          ← Back to Campaigns
        </Link>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
              campaign.status === "ACTIVE" ? "bg-green-500/15 text-green-400 border-green-500/30" :
              campaign.status === "PAUSED" ? "bg-purple-500/15 text-purple-400 border-purple-500/30" :
              "bg-gray-500/15 text-gray-400 border-gray-500/30"
            }`}>
              {campaign.status}
            </span>
            <Link href={`/dashboard/campaigns/${id}/edit`} className="text-xs font-bold px-3 py-1.5 border border-border hover:bg-background-secondary text-foreground-muted rounded-xl transition-all">
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total", value: campaign.totalSponsors, color: "text-foreground" },
          { label: "Sent", value: campaign.sent, color: "text-blue-400" },
          { label: "Drafted", value: campaign.drafted, color: "text-purple-400" },
          { label: "Replied", value: campaign.replied, color: "text-teal-400" },
          { label: "Won", value: campaign.converted, color: "text-green-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-background-secondary border border-border rounded-xl p-4 text-center">
            <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-foreground-muted mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {campaign.totalSponsors > 0 && (
        <div>
          <div className="flex justify-between text-xs text-foreground-muted mb-1">
            <span>Outreach progress</span>
            <span>{campaign.sent} / {campaign.totalSponsors} sent</span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.round((campaign.sent / campaign.totalSponsors) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "PENDING", "DRAFTED", "SENT", "REPLIED", "CONVERTED", "FAILED"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
              filter === s
                ? "bg-brand-500/20 text-brand-400 border-brand-500/30"
                : "bg-background-secondary text-foreground-muted border-border hover:border-brand-500/30"
            }`}
          >
            {s === "ALL" ? `All (${outreaches.length})` : `${s.charAt(0) + s.slice(1).toLowerCase()} (${counts[s] || 0})`}
          </button>
        ))}
      </div>

      {/* Outreach list */}
      <div className="bg-background-secondary border border-border rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-foreground-muted text-sm">No outreaches in this status.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map(o => {
              const sc = statusConfig[o.status] || statusConfig["PENDING"];
              const isExpanded = expandedId === o.id;
              return (
                <div key={o.id} className="px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-foreground">{o.sponsor.companyName}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.color}`}>
                          <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </div>
                      <div className="text-xs text-foreground-muted">
                        {o.sponsor.contactName ? `${o.sponsor.contactName} · ` : ""}{o.sponsor.contactEmail}
                        {o.sponsor.industry ? ` · ${o.sponsor.industry}` : ""}
                      </div>
                      {o.subject && (
                        <div className="text-xs text-foreground-muted mt-1 truncate">
                          Subject: <span className="text-foreground">{o.subject}</span>
                        </div>
                      )}
                      {o.sentAt && (
                        <div className="text-[10px] text-foreground-muted mt-0.5">
                          Sent {new Date(o.sentAt).toLocaleString()}
                        </div>
                      )}
                      {o.generationError && (
                        <div className="text-[10px] text-red-400 mt-1 truncate">{o.generationError}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {o.status === "FAILED" && (
                        <button
                          disabled={retryingId === o.id}
                          onClick={() => retryOutreach(o.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all disabled:opacity-50"
                        >
                          {retryingId === o.id ? "Retrying…" : "Retry"}
                        </button>
                      )}
                      {(o.body || o.subject) && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : o.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground hover:border-brand-500/30 transition-all"
                        >
                          {isExpanded ? "Hide" : "View Email"}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && o.body && (
                    <div className="mt-3 bg-background rounded-xl p-4 text-xs text-foreground leading-relaxed whitespace-pre-wrap border border-border max-h-60 overflow-y-auto">
                      {o.body}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
