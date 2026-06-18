"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

type Outreach = {
  id: string;
  subject: string | null;
  body: string | null;
  status: string;
  sentAt: string | null;
  repliedAt: string | null;
  campaign: { name: string };
};

type Sponsor = {
  id: string;
  companyName: string;
  contactEmail: string;
  contactName: string | null;
  jobTitle: string | null;
  website: string | null;
  industry: string | null;
  city: string | null;
  notes: string | null;
  aiResearch: string | null;
  outreaches: Outreach[];
};

interface SponsorDetailClientProps {
  sponsor: Sponsor;
}

export function SponsorDetailClient({ sponsor: initialSponsor }: SponsorDetailClientProps) {
  const router = useRouter();
  const [sponsor, setSponsor] = useState<Sponsor>(initialSponsor);
  const [activeTab, setActiveTab] = useState<"research" | "history">("research");
  const [notes, setNotes] = useState(sponsor.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [researching, setResearching] = useState(false);
  const [editing, setEditing] = useState(false);
  const [previewOutreach, setPreviewOutreach] = useState<Outreach | null>(null);

  // Simple edit form state
  const [form, setForm] = useState({
    companyName: sponsor.companyName,
    contactEmail: sponsor.contactEmail,
    contactName: sponsor.contactName || "",
    jobTitle: sponsor.jobTitle || "",
    website: sponsor.website || "",
    industry: sponsor.industry || "",
    city: sponsor.city || "",
  });

  async function handleUpdateNotes() {
    setSavingNotes(true);
    const res = await fetch(`/api/sponsors/${sponsor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSavingNotes(false);
    if (res.ok) {
      toast.success("Notes updated!");
      router.refresh();
    } else {
      toast.error("Failed to update notes");
    }
  }

  async function handleResearch() {
    setResearching(true);
    const res = await fetch(`/api/sponsors/${sponsor.id}/research`, {
      method: "POST",
    });
    setResearching(false);
    if (res.ok) {
      const updated = await res.json();
      setSponsor((prev) => ({ ...prev, aiResearch: updated.aiResearch }));
      toast.success("AI Research completed!");
      router.refresh();
    } else {
      toast.error("Failed to research brand");
    }
  }

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/sponsors/${sponsor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setSponsor((prev) => ({ ...prev, ...updated }));
      setEditing(false);
      toast.success("Brand details updated!");
      router.refresh();
    } else {
      toast.error("Failed to update details");
    }
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete ${sponsor.companyName}?`)) return;
    const res = await fetch(`/api/sponsors/${sponsor.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Sponsor deleted");
      router.push("/dashboard/sponsors");
      router.refresh();
    } else {
      toast.error("Failed to delete sponsor");
    }
  }

  // Pure Client simple Markdown Renderer (handles headers, bold, bullet points, numbers)
  function renderMarkdown(md: string) {
    return md.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return <h4 key={i} className="text-sm font-bold text-white mt-4 mb-2 uppercase tracking-wide">{trimmed.replace("###", "")}</h4>;
      }
      if (trimmed.startsWith("##")) {
        return <h3 key={i} className="text-base font-bold text-white mt-5 mb-2">{trimmed.replace("##", "")}</h3>;
      }
      if (trimmed.startsWith("1.") || trimmed.startsWith("2.") || trimmed.startsWith("3.")) {
        return <p key={i} className="text-sm text-foreground-secondary ml-2 pl-2 border-l-2 border-brand-500/30 my-1">{trimmed}</p>;
      }
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        return <li key={i} className="text-sm text-foreground-muted ml-5 list-disc my-0.5">{trimmed.substring(1).trim()}</li>;
      }
      if (trimmed) {
        // Basic bold replacement
        const boldRegex = /\*\*(.*?)\*\*/g;
        if (boldRegex.test(trimmed)) {
          const parts = trimmed.split(boldRegex);
          return (
            <p key={i} className="text-sm text-foreground-muted my-1">
              {parts.map((p, idx) => idx % 2 === 1 ? <strong key={idx} className="text-foreground font-semibold">{p}</strong> : p)}
            </p>
          );
        }
        return <p key={i} className="text-sm text-foreground-muted my-1">{trimmed}</p>;
      }
      return <div key={i} className="h-2" />;
    });
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-background-secondary border border-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-3xl font-extrabold text-white shadow-lg shadow-brand-500/20">
            {sponsor.companyName[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{sponsor.companyName}</h1>
              {sponsor.aiResearch && (
                <span className="text-[10px] bg-brand-500/10 text-brand-600 border border-brand-500/20 px-2 py-0.5 rounded-full font-semibold">
                  AI Researched
                </span>
              )}
            </div>
            <p className="text-sm text-foreground-muted mt-0.5">
              {sponsor.industry || "General"} • {sponsor.city || "Remote"}
            </p>
            {sponsor.website && (
              <a
                href={sponsor.website.startsWith("http") ? sponsor.website : `https://${sponsor.website}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-600 hover:underline inline-block mt-1 font-semibold"
              >
                🔗 Visit Website
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-foreground-muted hover:text-foreground border border-border hover:border-border-hover px-4 py-2 rounded-xl transition-all"
          >
            ✏️ Edit Details
          </button>
          <button
            onClick={handleDelete}
            className="text-xs font-semibold text-error-500 hover:text-error-600 border border-error-500/10 hover:border-error-500/20 bg-error-500/5 px-4 py-2 rounded-xl transition-all"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Contact Details & Negotiation Notes */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-background-secondary border border-border rounded-2xl p-6">
            <h2 className="text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-4">
              👤 Brand Contact Info
            </h2>
            <div className="space-y-3.5">
              <div>
                <span className="block text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">Contact Person</span>
                <span className="text-sm font-semibold text-foreground">{sponsor.contactName || "—"}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">Job Title</span>
                <span className="text-sm text-foreground-secondary">{sponsor.jobTitle || "—"}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">Email Address</span>
                <span className="text-sm text-brand-600 font-semibold select-all">{sponsor.contactEmail}</span>
              </div>
            </div>
          </div>

          <div className="bg-background-secondary border border-border rounded-2xl p-6">
            <h2 className="text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>📝 Negotiation Notes</span>
              <button
                onClick={handleUpdateNotes}
                disabled={savingNotes}
                className="text-[10px] font-semibold text-brand-600 hover:text-brand-500 disabled:opacity-60"
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Talked on call. Interested in Co-Sponsor package. Requested customizable gaming activation slots. Will follow up next Monday."
              rows={6}
              className="w-full bg-background border border-border text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-foreground placeholder-foreground-muted transition-all"
            />
          </div>
        </div>

        {/* Right Column - Tabs (Research vs History) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-background-secondary border border-border rounded-2xl overflow-hidden">
            {/* Tabs Selector */}
            <div className="border-b border-border bg-background-tertiary flex">
              <button
                onClick={() => setActiveTab("research")}
                className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === "research"
                    ? "border-brand-500 text-brand-600 bg-background-secondary"
                    : "border-transparent text-foreground-muted hover:text-foreground hover:bg-background-secondary/50"
                }`}
              >
                🔍 AI Brand Insights
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === "history"
                    ? "border-brand-500 text-brand-600 bg-background-secondary"
                    : "border-transparent text-foreground-muted hover:text-foreground hover:bg-background-secondary/50"
                }`}
              >
                📬 Outreach History ({sponsor.outreaches.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              {activeTab === "research" ? (
                <div className="space-y-4">
                  {sponsor.aiResearch ? (
                    <div className="space-y-2">
                      <div className="prose prose-invert max-w-none text-foreground-muted">
                        {renderMarkdown(sponsor.aiResearch)}
                      </div>
                      <div className="pt-4 border-t border-border mt-4 flex items-center justify-between">
                        <span className="text-[10px] text-foreground-muted">AI models analyze public brand marketing data.</span>
                        <button
                          onClick={handleResearch}
                          disabled={researching}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-500 flex items-center gap-1.5"
                        >
                          🔄 {researching ? "Regenerating..." : "Regenerate AI Analysis"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">💡</div>
                      <h3 className="text-base font-bold text-foreground mb-2">No AI Research Yet</h3>
                      <p className="text-xs text-foreground-muted max-w-sm mx-auto mb-6">
                        Analyze this brand's product lines, current campaigns, and audience alignment before writing your sponsorship pitch.
                      </p>
                      <button
                        onClick={handleResearch}
                        disabled={researching}
                        className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-lg shadow-brand-500/20 inline-block disabled:opacity-60"
                      >
                        {researching ? "Performing AI Research..." : "⚡ Research Brand with Claude"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {sponsor.outreaches.length === 0 ? (
                    <div className="text-center py-12 text-foreground-muted text-sm">
                      📭 No outreach campaigns have contacted this brand yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-border rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-background-tertiary border-b border-border text-foreground-secondary uppercase tracking-wider font-bold">
                          <tr>
                            <th className="px-4 py-3">Campaign</th>
                            <th className="px-4 py-3">Email Subject</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-foreground-muted">
                          {sponsor.outreaches.map((o) => (
                            <tr key={o.id} className="hover:bg-background-tertiary transition-colors">
                              <td className="px-4 py-3 font-semibold text-foreground">{o.campaign.name}</td>
                              <td className="px-4 py-3 max-w-[200px] truncate">
                                {o.subject ? (
                                  <button
                                    onClick={() => setPreviewOutreach(o)}
                                    className="text-brand-600 hover:underline font-medium text-left"
                                  >
                                    {o.subject}
                                  </button>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-4 py-3">{o.sentAt ? formatDate(new Date(o.sentAt)) : "Not sent"}</td>
                              <td className="px-4 py-3">
                                <span className={`status-badge text-[10px] ${
                                  o.status === "CONVERTED"
                                    ? "status-converted bg-green-500/10 text-green-600"
                                    : o.status === "REPLIED"
                                    ? "status-replied bg-amber-500/10 text-amber-600"
                                    : o.status === "SENT"
                                    ? "status-sent bg-brand-500/10 text-brand-600"
                                    : "status-pending bg-foreground-muted/15 text-foreground-muted"
                                }`}>
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Details Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background-secondary border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-white">Edit Brand Details</h3>
              <button onClick={() => setEditing(false)} className="text-foreground-muted hover:text-white text-lg">✕</button>
            </div>
            <form onSubmit={handleSaveDetails} className="space-y-3.5">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Company Name *</label>
                  <input
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Contact Email *</label>
                  <input
                    required
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Contact Name</label>
                  <input
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Job Title</label>
                  <input
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Website URL</label>
                  <input
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Industry</label>
                  <input
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>City / Location</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-xs font-semibold text-foreground-muted hover:text-foreground border border-border px-4 py-2 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-shine gradient-brand text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-brand-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {previewOutreach && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background-secondary border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Outreach Email Preview</h3>
                <p className="text-[10px] text-foreground-muted mt-0.5">Sent for campaign: {previewOutreach.campaign.name}</p>
              </div>
              <button onClick={() => setPreviewOutreach(null)} className="text-foreground-muted hover:text-white text-lg">✕</button>
            </div>
            <div className="space-y-3">
              <div className="bg-background border border-border p-3.5 rounded-xl">
                <span className="text-xs font-bold text-foreground-secondary uppercase tracking-wider block">Subject:</span>
                <span className="text-sm font-semibold text-white">{previewOutreach.subject || "—"}</span>
              </div>
              <div className="bg-background border border-border p-4 rounded-xl max-h-[300px] overflow-y-auto whitespace-pre-wrap text-sm text-foreground-muted select-all leading-relaxed">
                {previewOutreach.body || "No email body has been generated."}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                onClick={() => setPreviewOutreach(null)}
                className="btn-shine gradient-brand text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
