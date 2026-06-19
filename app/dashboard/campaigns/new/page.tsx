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

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dependencies
  const [lists, setLists] = useState<SponsorList[]>([]);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);

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
          
          if (data.sponsorLists?.length > 0) {
            setSelectedList(data.sponsorLists[0].id);
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
                onChange={e => setSelectedList(e.target.value)}
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
