"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "status-pending",
  DRAFTED:    "status-drafted",
  SENT:       "status-sent",
  OPENED:     "status-opened",
  REPLIED:    "status-replied",
  INTERESTED: "status-interested",
  CONVERTED:  "status-converted",
  REJECTED:   "status-rejected",
  FAILED:     "status-failed",
};

const STATUS_OPTIONS = ["PENDING", "DRAFTED", "SENT", "OPENED", "REPLIED", "INTERESTED", "CONVERTED", "REJECTED"];

type Outreach = {
  id: string;
  status: string;
  subject?: string | null;
  body?: string | null;
  sentAt?: Date | null;
  generatedAt?: Date | null;
  replyNotes?: string | null;
  sponsor: { companyName: string; contactEmail: string; contactName?: string | null; industry?: string | null };
};

type Campaign = {
  id: string;
  name: string;
  status: string;
  totalSponsors: number;
  drafted: number;
  sent: number;
  replied: number;
  converted: number;
  createdAt: Date;
  launchedAt?: Date | null;
  festProfile: { name: string; college?: string | null };
  sponsorList: { name: string };
  emailAccount?: { emailAddress: string; displayName?: string | null } | null;
  outreaches: Outreach[];
};

export function CampaignDetail({ campaign: initialCampaign }: { campaign: Campaign }) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedOutreach, setSelectedOutreach] = useState<Outreach | null>(null);
  const [filter, setFilter] = useState("ALL");

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch(`/api/campaigns/${campaign.id}/generate`, { method: "POST" });
    const data = await res.json();
    setGenerating(false);
    if (res.ok) {
      toast.success(`✨ Queued ${data.queued} AI pitch generations!`);
      setCampaign({ ...campaign, status: "GENERATING" });
    } else {
      toast.error(data.error || "Failed to generate pitches");
    }
  }

  async function handleSend() {
    setSending(true);
    const res = await fetch(`/api/campaigns/${campaign.id}/send`, { method: "POST" });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      toast.success(`📬 Queued ${data.queued} emails for sending!`);
      setCampaign({ ...campaign, status: "ACTIVE" });
    } else {
      toast.error(data.error || "Failed to send emails");
    }
  }

  async function updateOutreachStatus(id: string, status: string) {
    const prev = campaign.outreaches;
    setCampaign({
      ...campaign,
      outreaches: campaign.outreaches.map((o) => o.id === id ? { ...o, status } : o),
    });
    const res = await fetch(`/api/outreach/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setCampaign({ ...campaign, outreaches: prev });
      toast.error("Failed to update status");
    }
  }

  const filtered = filter === "ALL"
    ? campaign.outreaches
    : campaign.outreaches.filter((o) => o.status === filter);

  const hasPending = campaign.outreaches.some((o) => o.status === "PENDING");
  const hasDrafted = campaign.outreaches.some((o) => o.status === "DRAFTED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-2">
            <Link href="/dashboard/campaigns" className="hover:text-foreground transition-colors">Campaigns</Link>
            <span>/</span>
            <span className="text-foreground">{campaign.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
          <p className="text-foreground-muted text-sm mt-1">
            {campaign.festProfile.name} · {campaign.sponsorList.name}
            {campaign.festProfile.college && ` · ${campaign.festProfile.college}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasPending && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 hover:scale-105 transition-all disabled:opacity-60 disabled:scale-100 flex items-center gap-2"
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>✨ Generate Pitches</>
              )}
            </button>
          )}
          {hasDrafted && campaign.emailAccount && (
            <button
              onClick={handleSend}
              disabled={sending}
              className="btn-shine bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition-all hover:scale-105 disabled:opacity-60 disabled:scale-100 flex items-center gap-2"
            >
              {sending ? "Sending…" : "📬 Send All Drafted"}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: campaign.totalSponsors || campaign.outreaches.length, icon: "🏢" },
          { label: "Drafted", value: campaign.drafted, icon: "✍️" },
          { label: "Sent", value: campaign.sent, icon: "📬" },
          { label: "Replied", value: campaign.replied, icon: "💬" },
          { label: "Won", value: campaign.converted, icon: "🏆" },
        ].map((s) => (
          <div key={s.label} className="bg-background-secondary border border-border rounded-2xl p-4 text-center">
            <div className="text-xl">{s.icon}</div>
            <div className="text-2xl font-extrabold text-foreground mt-1">{s.value}</div>
            <div className="text-xs text-foreground-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status alert */}
      {campaign.status === "GENERATING" && (
        <div className="bg-blue-500/10 border border-blue-500/25 text-blue-400 text-sm rounded-2xl px-5 py-4 flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
          AI is generating personalized pitches in the background. Refresh in a minute to see results.
        </div>
      )}

      {!campaign.emailAccount && hasDrafted && (
        <div className="bg-warning-500/10 border border-warning-500/25 text-warning-600 text-sm rounded-2xl px-5 py-4">
          ⚠️ No email account connected. Go to{" "}
          <Link href="/dashboard/email-accounts" className="underline font-semibold">
            Email Accounts
          </Link>{" "}
          to connect Gmail before sending.
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {["ALL", ...STATUS_OPTIONS].map((s) => {
          const count = s === "ALL" ? campaign.outreaches.length : campaign.outreaches.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                filter === s
                  ? "border-brand-400 bg-brand-500/10 text-brand-600"
                  : "border-border text-foreground-muted hover:text-foreground hover:border-border-hover"
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* Outreach table */}
      <div className="bg-background-secondary border border-border rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-foreground-muted text-sm">No outreaches in this category.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background-tertiary">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-foreground-secondary uppercase tracking-wider">Company</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-foreground-secondary uppercase tracking-wider hidden md:table-cell">Subject</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-foreground-secondary uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-foreground-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-background-tertiary transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background-tertiary border border-border flex items-center justify-center text-xs font-bold text-foreground-secondary shrink-0">
                        {o.sponsor.companyName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{o.sponsor.companyName}</div>
                        <div className="text-xs text-foreground-muted">{o.sponsor.contactEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="text-foreground-muted text-xs max-w-xs truncate">
                      {o.subject || <span className="italic">Not generated</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={o.status}
                      onChange={(e) => updateOutreachStatus(o.id, e.target.value)}
                      className={`status-badge ${STATUS_COLORS[o.status] || "status-pending"} cursor-pointer bg-transparent border-0 focus:outline-none`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.toLowerCase()}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {(o.subject || o.body) && (
                      <button
                        onClick={() => setSelectedOutreach(o)}
                        className="text-xs text-brand-600 hover:text-brand-500 font-semibold transition-colors"
                      >
                        Preview →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Email preview modal */}
      {selectedOutreach && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedOutreach(null)}
        >
          <div
            className="bg-background-secondary border border-border rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs text-foreground-muted mb-1">To: {selectedOutreach.sponsor.contactEmail}</div>
                <div className="font-bold text-foreground text-lg">{selectedOutreach.subject}</div>
              </div>
              <button
                onClick={() => setSelectedOutreach(null)}
                className="text-foreground-muted hover:text-foreground text-xl transition-colors p-1"
              >
                ✕
              </button>
            </div>
            <div className="bg-background border border-border rounded-xl p-5 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {selectedOutreach.body}
            </div>
            {selectedOutreach.generatedAt && (
              <p className="text-xs text-foreground-muted mt-3">
                Generated {formatRelativeTime(selectedOutreach.generatedAt)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
