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
  emailAccountId?: string | null;
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
  const [emailAccounts, setEmailAccounts] = useState<{ id: string; emailAddress: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  const loadEmails = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/email");
      if (res.ok) {
        const data = await res.json();
        setEmailAccounts(data.filter((a: any) => a.status === "CONNECTED"));
      }
    } catch {
      // quiet fallback
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
    loadEmails();
  }, [loadCampaigns, loadEmails]);

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

  async function handleProcessNow(campaignId: string) {
    setProcessingId(campaignId);
    try {
      const res = await fetch("/api/cron/process-outreach");
      if (res.ok) {
        const data = await res.json();
        const sent = data.details?.filter((d: any) => d.status === "SENT").length || 0;
        const drafted = data.details?.filter((d: any) => d.status === "DRAFTED").length || 0;
        if (sent > 0) toast.success(`⚡ Sent ${sent} email${sent > 1 ? "s" : ""} successfully!`);
        else if (drafted > 0) toast.info(`📝 Drafted ${drafted} email${drafted > 1 ? "s" : ""} (no sender connected)`);
        else toast.info("No pending outreaches to process.");
        loadCampaigns();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to process outreach");
      }
    } catch {
      toast.error("Network error processing outreach");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleAssignEmail(campaignId: string, emailAccountId: string) {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAccountId: emailAccountId || null }),
      });
      if (res.ok) {
        toast.success("Email sender updated successfully! 📧");
        setCampaigns(campaigns.map(c => c.id === campaignId ? { ...c, emailAccountId } : c));
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update email account");
      }
    } catch {
      toast.error("Network error updating email account");
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
                    <Link href={`/dashboard/campaigns/${c.id}`} className="font-bold text-lg text-foreground hover:text-brand-400 transition-colors">
                      {c.name}
                    </Link>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>

                  {/* Sender Account Selector */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-foreground-muted uppercase tracking-wider mb-1">
                      Sender Email Account
                    </label>
                    {emailAccounts.length === 0 ? (
                      <div className="text-xs text-amber-400">
                        No connected emails. <Link href="/dashboard/settings/email" className="text-brand-400 hover:underline font-bold">Connect one →</Link>
                      </div>
                    ) : (
                      <select
                        value={c.emailAccountId || ""}
                        onChange={(e) => handleAssignEmail(c.id, e.target.value)}
                        disabled={c.status === "ACTIVE" || c.status === "COMPLETED"}
                        className="w-full bg-background border border-border/80 text-foreground rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        <option value="">-- No sender linked (Drafts only) --</option>
                        {emailAccounts.map(a => (
                          <option key={a.id} value={a.id}>{a.emailAddress}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-2 bg-background/50 border border-border/50 rounded-xl p-3 mb-3">
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

                  {/* Progress Bar */}
                  {c.totalSponsors > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] text-foreground-muted mb-1">
                        <span>Outreach progress</span>
                        <span>{c.sent} / {c.totalSponsors} sent</span>
                      </div>
                      <div className="h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((c.sent / c.totalSponsors) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="text-xs text-foreground-muted">
                    Created {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/campaigns/${c.id}/edit`}
                      className="text-xs font-bold px-3 py-2 border border-border hover:bg-background text-foreground-muted rounded-xl transition-all"
                    >
                      Edit
                    </Link>
                    {c.status === "ACTIVE" ? (
                      <>
                        <button
                          disabled={processingId === c.id}
                          onClick={() => handleProcessNow(c.id)}
                          className="text-xs font-bold px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow shadow-brand-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {processingId === c.id ? (
                            <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Sending…</>
                          ) : "⚡ Send Now"}
                        </button>
                        <button
                          disabled={actioningId === c.id}
                          onClick={() => handleAction(c.id, "pause")}
                          className="text-xs font-bold px-4 py-2 border border-purple-500/30 hover:bg-purple-500/10 text-purple-400 rounded-xl transition-all"
                        >
                          Pause
                        </button>
                      </>
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
