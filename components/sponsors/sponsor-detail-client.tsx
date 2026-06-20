"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  CONFIRMED:  { label: "Confirmed",  color: "bg-green-500/15 text-green-400 border-green-500/30",  dot: "bg-green-400" },
  INTERESTED: { label: "Interested", color: "bg-blue-500/15 text-blue-400 border-blue-500/30",    dot: "bg-blue-400" },
  CONTACTED:  { label: "Contacted",  color: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  REJECTED:   { label: "Rejected",   color: "bg-red-500/15 text-red-400 border-red-500/30",       dot: "bg-red-400" },
  PENDING:    { label: "Pending",    color: "bg-gray-500/15 text-gray-400 border-gray-500/30",    dot: "bg-gray-400" },
  DRAFTED:    { label: "Drafted",    color: "bg-purple-500/15 text-purple-400 border-purple-500/30", dot: "bg-purple-400" },
  SENT:       { label: "Sent",       color: "bg-blue-500/15 text-blue-400 border-blue-500/30",    dot: "bg-blue-400" },
  REPLIED:    { label: "Replied",    color: "bg-teal-500/15 text-teal-400 border-teal-500/30",    dot: "bg-teal-400" },
  CONVERTED:  { label: "Converted",  color: "bg-green-500/15 text-green-400 border-green-500/30", dot: "bg-green-400" },
};

interface Outreach {
  id: string;
  status: string;
  subject: string | null;
  body: string | null;
  sentAt: string | null;
  repliedAt: string | null;
  replyNotes: string | null;
  campaign: { name: string } | null;
}

interface Sponsor {
  id: string;
  companyName: string;
  contactEmail: string;
  contactName: string | null;
  jobTitle: string | null;
  website: string | null;
  industry: string | null;
  city: string | null;
  phone: string | null;
  notes: string | null;
  status: string;
  amount: number;
  assignedTo: string | null;
  lastContact: string | null;
  aiResearch: string | null;
  outreaches: Outreach[];
}

export function SponsorDetailClient({ sponsor: initialSponsor }: { sponsor: Sponsor }) {
  const [sponsor, setSponsor] = useState<Sponsor>(initialSponsor);
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState(initialSponsor.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [researching, setResearching] = useState(false);

  const sc = statusConfig[sponsor.status] || statusConfig["CONTACTED"];

  async function saveNotes() {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/sponsors/${sponsor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setSponsor(s => ({ ...s, notes }));
        setEditNotes(false);
        toast.success("Notes saved!");
      } else {
        toast.error("Failed to save notes");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSavingNotes(false);
    }
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link */}
      <Link href="/dashboard/sponsors" className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors">
        ← Back to Sponsors
      </Link>

      {/* Header */}
      <div className="bg-background-secondary border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-5">
        <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-brand-500/30 shrink-0">
          {sponsor.companyName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">{sponsor.companyName}</h1>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
          </div>
          {sponsor.industry && <p className="text-foreground-muted text-sm">{sponsor.industry}</p>}
          {sponsor.city && <p className="text-foreground-muted text-xs">{sponsor.city}</p>}
        </div>
        {sponsor.amount > 0 && (
          <div className="text-right shrink-0">
            <div className="text-2xl font-extrabold text-green-400">₹{sponsor.amount.toLocaleString()}</div>
            <div className="text-xs text-foreground-muted">Deal value</div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="bg-background-secondary border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">👤 Contact Information</h2>
          <div className="space-y-3">
            {[
              { label: "Contact Name", value: sponsor.contactName },
              { label: "Job Title", value: sponsor.jobTitle },
              { label: "Email", value: sponsor.contactEmail },
              { label: "Phone", value: sponsor.phone },
              { label: "Website", value: sponsor.website },
              { label: "Assigned To", value: sponsor.assignedTo },
              { label: "Last Contact", value: sponsor.lastContact },
            ].map(({ label, value }) =>
              value ? (
                <div key={label}>
                  <div className="text-[10px] font-bold text-foreground-secondary uppercase tracking-wider mb-0.5">{label}</div>
                  <div className="text-sm text-foreground">{value}</div>
                </div>
              ) : null
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-background-secondary border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">📝 Notes</h2>
            {!editNotes && (
              <button onClick={() => setEditNotes(true)} className="text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                Edit
              </button>
            )}
          </div>
          {editNotes ? (
            <div className="space-y-3">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={6}
                placeholder="Add notes about this sponsor…"
                className={inputClass}
              />
              <div className="flex gap-2">
                <button onClick={() => { setEditNotes(false); setNotes(sponsor.notes || ""); }} className="flex-1 text-xs text-foreground-muted border border-border rounded-xl py-2 hover:bg-background transition-all font-semibold">Cancel</button>
                <button onClick={saveNotes} disabled={savingNotes} className="flex-1 text-xs btn-shine gradient-brand text-white rounded-xl py-2 font-bold disabled:opacity-50">
                  {savingNotes ? "Saving…" : "Save Notes"}
                </button>
              </div>
            </div>
          ) : (
            <p className={`text-sm ${sponsor.notes ? "text-foreground" : "text-foreground-muted italic"}`}>
              {sponsor.notes || "No notes yet. Click Edit to add some."}
            </p>
          )}
        </div>
      </div>

      {/* AI Research */}
      <div className="bg-brand-500/5 border border-brand-500/20 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-brand-400 uppercase tracking-wider">🤖 AI Brand Research</h2>
          <button
            onClick={async () => {
              setResearching(true);
              try {
                const res = await fetch(`/api/sponsors/${sponsor.id}/research`, { method: "POST" });
                if (res.ok) {
                  const data = await res.json();
                  setSponsor(s => ({ ...s, aiResearch: data.aiResearch }));
                  toast.success("AI research complete!");
                } else {
                  toast.error("Research failed");
                }
              } catch {
                toast.error("Network error");
              } finally {
                setResearching(false);
              }
            }}
            disabled={researching}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {researching ? (
              <><span className="w-3 h-3 border border-brand-400/40 border-t-brand-400 rounded-full animate-spin" /> Researching…</>
            ) : sponsor.aiResearch ? "Re-research" : "Run AI Research"}
          </button>
        </div>
        {sponsor.aiResearch ? (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{sponsor.aiResearch}</p>
        ) : (
          <p className="text-xs text-foreground-muted italic">
            Click "Run AI Research" to get a brand dossier — target demographics, marketing angle, and outreach suggestions tailored to {sponsor.companyName}.
          </p>
        )}
      </div>

      {/* Outreach History */}
      <div>
        <h2 className="text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-4">📧 Outreach History</h2>
        {sponsor.outreaches.length === 0 ? (
          <div className="bg-background-secondary border border-border rounded-2xl p-8 text-center text-foreground-muted text-sm">
            No outreach emails sent to this sponsor yet.
          </div>
        ) : (
          <div className="space-y-3">
            {sponsor.outreaches.map(o => {
              const osc = statusConfig[o.status] || statusConfig["PENDING"];
              const isExpanded = expandedEmail === o.id;
              return (
                <div key={o.id} className="bg-background-secondary border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${osc.color}`}>
                          <span className={`w-1 h-1 rounded-full ${osc.dot}`} />
                          {osc.label}
                        </span>
                        {o.campaign && <span className="text-xs text-foreground-muted">Campaign: {o.campaign.name}</span>}
                      </div>
                      {o.subject && <p className="text-sm font-semibold text-foreground truncate">{o.subject}</p>}
                      <div className="flex gap-3 mt-1 text-xs text-foreground-muted">
                        {o.sentAt && <span>Sent: {new Date(o.sentAt).toLocaleDateString()}</span>}
                        {o.repliedAt && <span>Replied: {new Date(o.repliedAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    {o.body && (
                      <button onClick={() => setExpandedEmail(isExpanded ? null : o.id)} className="text-xs text-brand-400 hover:text-brand-300 font-semibold shrink-0 transition-colors">
                        {isExpanded ? "Collapse" : "View Email"}
                      </button>
                    )}
                  </div>
                  {isExpanded && o.body && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <pre className="text-xs text-foreground-muted whitespace-pre-wrap leading-relaxed">{o.body}</pre>
                    </div>
                  )}
                  {o.replyNotes && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <span className="text-xs text-foreground-muted">Reply notes: </span>
                      <span className="text-xs text-foreground">{o.replyNotes}</span>
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
