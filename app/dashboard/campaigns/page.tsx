"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  status: "DRAFT" | "GENERATING" | "READY" | "ACTIVE" | "PAUSED" | "COMPLETED";
  totalSponsors: number;
  drafted: number;
  sent: number;
  replied: number;
  converted: number;
  launchedAt: string | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  DRAFT:      { label: "Draft",       color: "bg-gray-500/15 text-gray-400 border-gray-500/30",   dot: "bg-gray-400" },
  GENERATING: { label: "Generating",  color: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400 animate-pulse" },
  READY:      { label: "Ready",       color: "bg-blue-500/15 text-blue-400 border-blue-500/30",    dot: "bg-blue-400" },
  ACTIVE:     { label: "Active",      color: "bg-green-500/15 text-green-400 border-green-500/30",  dot: "bg-green-400 animate-ping-slow" },
  PAUSED:     { label: "Paused",      color: "bg-purple-500/15 text-purple-400 border-purple-500/30", dot: "bg-purple-400" },
  COMPLETED:  { label: "Completed",   color: "bg-brand-500/15 text-brand-400 border-brand-500/30",  dot: "bg-brand-400" },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      } else {
        toast.error("Failed to load campaigns");
      }
    } catch {
      toast.error("Network error loading campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  async function handleAction(id: string, action: "start" | "pause") {
    setActioningId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(action === "start" ? "Campaign launched! 🚀 Sending emails autonomously in the background." : "Campaign paused.");
        setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: data.status } : c));
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to execute campaign action");
      }
    } catch {
      toast.error("Network error executing action");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📧 Email Campaigns</h1>
          <p className="text-foreground-muted text-sm mt-1">
            Build and monitor autonomous outreach sequences to secure event sponsorships.
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 hover:scale-105 transition-all"
        >
          + Create Campaign
        </Link>
      </div>

      {/* Campaigns Listing */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-foreground-muted text-sm">Loading campaigns…</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-background-secondary border border-border rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="text-4xl">📧</div>
          <h2 className="text-lg font-bold text-foreground">Launch Your First Email Campaign</h2>
          <p className="text-foreground-muted text-sm leading-relaxed">
            Select a target sponsor brand list, connect your Gmail account, and let the AI coordinator draft and send personalized, safe first-touch pitches completely autonomously.
          </p>
          <div className="pt-4">
            <Link
              href="/dashboard/campaigns/new"
              className="gradient-brand text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-500/25 inline-block hover:scale-105 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {campaigns.map((c) => {
            const sc = statusConfig[c.status] || statusConfig["DRAFT"];
            return (
              <div key={c.id} className="bg-background-secondary border border-border rounded-2xl p-6 spotlight-card hover:border-brand-500/30 transition-all flex flex-col justify-between">
                <div>
                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3 className="font-bold text-lg text-foreground hover:text-brand-400 transition-colors">
                      {c.name}
                    </h3>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-2 bg-background/50 border border-border/50 rounded-xl p-3 mb-6">
                    <div className="text-center">
                      <div className="text-xs text-foreground-muted">Sponsors</div>
                      <div className="text-sm font-extrabold text-foreground mt-0.5">{c.totalSponsors}</div>
                    </div>
                    <div className="text-center border-l border-border/50">
                      <div className="text-xs text-foreground-muted">Sent</div>
                      <div className="text-sm font-extrabold text-brand-400 mt-0.5">{c.sent}</div>
                    </div>
                    <div className="text-center border-l border-border/50">
                      <div className="text-xs text-foreground-muted">Replied</div>
                      <div className="text-sm font-extrabold text-blue-400 mt-0.5">{c.replied}</div>
                    </div>
                    <div className="text-center border-l border-border/50">
                      <div className="text-xs text-foreground-muted">Won</div>
                      <div className="text-sm font-extrabold text-green-400 mt-0.5">{c.converted}</div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="text-xs text-foreground-muted">
                    Created {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    {c.status === "ACTIVE" ? (
                      <button
                        disabled={actioningId === c.id}
                        onClick={() => handleAction(c.id, "pause")}
                        className="text-xs font-bold px-4 py-2 border border-purple-500/30 hover:bg-purple-500/10 text-purple-400 rounded-xl transition-all"
                      >
                        Pause Campaign
                      </button>
                    ) : (
                      <button
                        disabled={actioningId === c.id || c.status === "COMPLETED"}
                        onClick={() => handleAction(c.id, "start")}
                        className="text-xs font-bold px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow shadow-brand-500/20 transition-all disabled:opacity-50"
                      >
                        Launch Campaign 🚀
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
