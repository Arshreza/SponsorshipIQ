"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface SponsorList {
  id: string;
  name: string;
  description: string | null;
}

interface EmailAccount {
  id: string;
  emailAddress: string;
  displayName: string | null;
}

interface Sponsor {
  id: string;
  companyName: string;
  contactEmail: string;
  contactName: string | null;
  industry: string | null;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dependencies
  const [lists, setLists] = useState<SponsorList[]>([]);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [festProfile, setFestProfile] = useState<{ id: string; name: string; college: string | null; city: string | null; eventDates: string | null; festType: string | null } | null>(null);

  // Sponsor selection
  const [listSponsors, setListSponsors] = useState<Sponsor[]>([]);
  const [selectedSponsorIds, setSelectedSponsorIds] = useState<Set<string>>(new Set());
  const [loadingSponsors, setLoadingSponsors] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [selectedList, setSelectedList] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [subjectTemplate, setSubjectTemplate] = useState("Partnership Opportunity: {{companyName}} x Synapse 2025");
  const [wordLimit, setWordLimit] = useState(150);
  const [tone, setTone] = useState("Professional");
  const [guidelines, setGuidelines] = useState("");

  useEffect(() => {
    async function loadDependencies() {
      try {
        const res = await fetch("/api/campaigns/dependencies");
        if (res.ok) {
          const data = await res.json();
          setLists(data.sponsorLists || []);
          setAccounts(data.emailAccounts || []);
          setFestProfile(data.festProfile || null);
          
          if (data.sponsorLists?.length > 0) {
            setSelectedList(data.sponsorLists[0].id);
            loadSponsorsForList(data.sponsorLists[0].id);
          }
          if (data.emailAccounts?.length > 0) {
            setSelectedAccount(data.emailAccounts[0].id);
          }
        } else {
          toast.error("Failed to load dependency data");
        }
      } catch {
        toast.error("Network error loading page");
      } finally {
        setLoading(false);
      }
    }
    loadDependencies();
  }, []);

  async function loadSponsorsForList(listId: string) {
    if (!listId) { setListSponsors([]); setSelectedSponsorIds(new Set()); return; }
    setLoadingSponsors(true);
    try {
      const res = await fetch(`/api/sponsors/by-list?listId=${listId}`);
      if (res.ok) {
        let data: Sponsor[] = await res.json();
        // If list is empty, fall back to all user's sponsors
        if (data.length === 0) {
          const fallback = await fetch("/api/sponsors");
          if (fallback.ok) data = await fallback.json();
        }
        setListSponsors(data);
        setSelectedSponsorIds(new Set(data.map(s => s.id)));
      }
    } catch {
      // silent
    } finally {
      setLoadingSponsors(false);
    }
  }

  function toggleSponsor(id: string) {
    setSelectedSponsorIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedSponsorIds.size === listSponsors.length) {
      setSelectedSponsorIds(new Set());
    } else {
      setSelectedSponsorIds(new Set(listSponsors.map(s => s.id)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Campaign name is required");
      return;
    }
    if (!selectedList) {
      toast.error("Please select a target sponsor list");
      return;
    }
    if (selectedSponsorIds.size === 0) {
      toast.error("Select at least one sponsor to target");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sponsorListId: selectedList,
          emailAccountId: selectedAccount || null,
          guidelines,
          toneOfVoice: tone,
          emailWordLimit: wordLimit,
          subjectTemplate,
          sponsorIds: Array.from(selectedSponsorIds),
        }),
      });

      if (res.ok) {
        toast.success("Campaign created! 📧");
        router.push("/dashboard/campaigns");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create campaign");
      }
    } catch {
      toast.error("Network error creating campaign");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5";

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-foreground-muted text-sm">Loading options…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/campaigns" className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 mb-2">
          ← Back to Campaigns
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Create New Campaign</h1>
        <p className="text-foreground-muted text-sm mt-1">
          Configure outreach settings, tone, and connect sponsor target lists.
        </p>
      </div>

      {/* Warning constraints banner */}
      <div className="bg-brand-500/10 border border-brand-500/20 text-brand-400 p-4 rounded-xl text-xs leading-relaxed flex gap-2">
        <span className="text-sm">🛡️</span>
        <div>
          <span className="font-bold block mb-0.5">Strict Auto-Outreach Guidelines Enabled</span>
          To protect sponsor relationships and align with local guidelines, the AI agent is hardcoded to <strong>never mention financial sponsorship tiers, pricing, or amounts</strong> in the initial cold emails. All emails are strictly designed to secure a calendar booking or initial call.
        </div>
      </div>

      {/* Fest Profile info card */}
      {festProfile ? (
        <div className="flex items-center justify-between gap-4 bg-brand-500/5 border border-brand-500/20 rounded-xl px-4 py-3">
          <div>
            <p className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-0.5">Using Fest Profile</p>
            <p className="text-sm font-semibold text-foreground">{festProfile.name}</p>
            <p className="text-xs text-foreground-muted">
              {[festProfile.college, festProfile.city, festProfile.eventDates].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Link href="/dashboard/settings/fest" className="text-xs font-bold text-brand-400 hover:text-brand-300 shrink-0 border border-brand-500/30 px-3 py-1.5 rounded-xl transition-colors">
            Edit Profile
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
          <div>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-0.5">No Fest Profile Set</p>
            <p className="text-xs text-foreground-muted">AI emails will use placeholder fest details. Set up your fest profile for better results.</p>
          </div>
          <Link href="/dashboard/settings/fest" className="text-xs font-bold text-amber-400 shrink-0 border border-amber-500/30 px-3 py-1.5 rounded-xl hover:bg-amber-500/10 transition-colors">
            Set Up Now →
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-background-secondary border border-border rounded-2xl p-6 space-y-5">
        {/* Campaign Name */}
        <div>
          <label className={labelClass}>Campaign Name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Tech Fest 2025 outreach - Hackathon Sponsors"
            className={inputClass}
            required
          />
        </div>

        {/* Sponsor List & Email Account */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Target Sponsor List *</label>
            {lists.length === 0 ? (
              <div className="text-xs text-red-400 mt-2">
                No sponsor lists found. Please import or add sponsors first.
              </div>
            ) : (
              <select
                value={selectedList}
                onChange={e => {
                  setSelectedList(e.target.value);
                  loadSponsorsForList(e.target.value);
                }}
                className={inputClass}
              >
                {lists.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.description || "No description"})</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className={labelClass}>Sender Email Account</label>
            {accounts.length === 0 ? (
              <div className="text-xs text-amber-400 mt-2">
                No connected emails. Emails will be drafted but cannot be sent automatically.{" "}
                <Link href="/dashboard/settings/email" className="text-brand-400 hover:underline font-bold">Connect email →</Link>
              </div>
            ) : (
              <select
                value={selectedAccount}
                onChange={e => setSelectedAccount(e.target.value)}
                className={inputClass}
              >
                <option value="">Draft only (Do not send automatically)</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.emailAddress} ({a.displayName})</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Sponsor Checklist */}
        {selectedList && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>
                Target Sponsors
                <span className="ml-2 text-brand-400 normal-case font-normal">
                  {selectedSponsorIds.size} / {listSponsors.length} selected
                </span>
              </label>
              {listSponsors.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-[10px] font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                >
                  {selectedSponsorIds.size === listSponsors.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            {loadingSponsors ? (
              <div className="flex items-center gap-2 text-xs text-foreground-muted py-3">
                <span className="w-4 h-4 border border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                Loading sponsors…
              </div>
            ) : listSponsors.length === 0 ? (
              <p className="text-xs text-amber-400 py-2">No sponsors found. <a href="/dashboard/sponsors" className="text-brand-400 hover:underline font-bold">Add sponsors first →</a></p>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                {listSponsors.map((s, i) => (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-background transition-colors ${i !== 0 ? "border-t border-border/50" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSponsorIds.has(s.id)}
                      onChange={() => toggleSponsor(s.id)}
                      className="accent-brand-500 w-4 h-4 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{s.companyName}</div>
                      <div className="text-[10px] text-foreground-muted truncate">
                        {s.contactName ? `${s.contactName} · ` : ""}{s.contactEmail}
                        {s.industry ? ` · ${s.industry}` : ""}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Template Subject & Word Limit */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Email Subject Template</label>
            <input
              value={subjectTemplate}
              onChange={e => setSubjectTemplate(e.target.value)}
              placeholder="e.g. Partnership Opportunity: {{companyName}}"
              className={inputClass}
            />
            <span className="text-[10px] text-foreground-muted mt-1 block">Use <code className="bg-background px-1 rounded">{"{{companyName}}"}</code> variable for personalization</span>
          </div>

          <div>
            <label className={labelClass}>Max Word Limit</label>
            <input
              type="number"
              value={wordLimit}
              onChange={e => setWordLimit(Number(e.target.value))}
              placeholder="150"
              className={inputClass}
              min={50}
              max={500}
            />
          </div>
        </div>

        {/* Tone and Prompt guidelines */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Tone of Voice</label>
            <select
              value={tone}
              onChange={e => setTone(e.target.value)}
              className={inputClass}
            >
              <option value="Professional">💼 Professional</option>
              <option value="Enthusiastic">🔥 Enthusiastic</option>
              <option value="Formal">🎓 Formal</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>AI Guidelines / Context (Optional)</label>
            <input
              value={guidelines}
              onChange={e => setGuidelines(e.target.value)}
              placeholder="e.g. Focus on our 15,000+ developer student reach"
              className={inputClass}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-4 border-t border-border/50">
          <Link
            href="/dashboard/campaigns"
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-center text-foreground-muted text-sm font-semibold hover:bg-background transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 btn-shine gradient-brand text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 hover:scale-105 transition-all disabled:opacity-50"
          >
            {saving ? "Creating Campaign…" : "Create Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}
