"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type FestProfile = { id: string; name: string; college?: string | null };
type SponsorList = { id: string; name: string; entryCount: number };
type EmailAccount = { id: string; emailAddress: string; displayName?: string | null };

interface NewCampaignFormProps {
  festProfiles: FestProfile[];
  sponsorLists: SponsorList[];
  emailAccounts: EmailAccount[];
}

const TONES = ["Professional", "Enthusiastic", "Formal", "Friendly & Casual", "Concise"];

export function NewCampaignForm({ festProfiles, sponsorLists, emailAccounts }: NewCampaignFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    festProfileId: "",
    sponsorListId: "",
    emailAccountId: "",
    guidelines: "",
    toneOfVoice: "Professional",
    emailWordLimit: 200,
    subjectTemplate: "",
  });

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5";

  async function handleSubmit() {
    if (!form.name || !form.festProfileId || !form.sponsorListId) {
      toast.error("Please complete all required fields");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      const campaign = await res.json();
      toast.success("Campaign created! 🚀");
      router.push(`/dashboard/campaigns/${campaign.id}`);
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed to create campaign");
    }
  }

  const steps = [
    { num: 1, label: "Campaign setup" },
    { num: 2, label: "Sponsor list" },
    { num: 3, label: "AI settings" },
  ];

  const selectedFest = festProfiles.find((f) => f.id === form.festProfileId);
  const selectedList = sponsorLists.find((l) => l.id === form.sponsorListId);

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              onClick={() => step > s.num && setStep(s.num)}
              className={`w-7 h-7 rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                step === s.num
                  ? "gradient-brand text-white shadow-lg shadow-brand-500/30"
                  : step > s.num
                  ? "bg-brand-100 text-brand-700 border border-brand-300 cursor-pointer"
                  : "bg-background-tertiary text-foreground-muted border border-border"
              }`}
            >
              {step > s.num ? "✓" : s.num}
            </button>
            <span className={`text-xs font-semibold hidden sm:block ${step === s.num ? "text-foreground" : "text-foreground-muted"}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="text-border-hover mx-1">—</span>}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="bg-background-secondary border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">🚀 Campaign setup</h2>
          <div>
            <label className={labelClass}>Campaign Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Synapse 2025 — Tech Brand Outreach"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Fest Profile *</label>
            {festProfiles.length === 0 ? (
              <div className="text-sm text-foreground-muted bg-background-tertiary border border-border rounded-xl p-4">
                No fest profiles yet.{" "}
                <a href="/dashboard/fest-profiles/new" className="text-brand-600 font-semibold underline">Create one first →</a>
              </div>
            ) : (
              <select value={form.festProfileId} onChange={(e) => setForm({ ...form, festProfileId: e.target.value })} className={inputClass}>
                <option value="">Select a fest profile…</option>
                {festProfiles.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}{f.college ? ` — ${f.college}` : ""}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className={labelClass}>Sending Email Account</label>
            {emailAccounts.length === 0 ? (
              <div className="text-sm text-foreground-muted bg-background-tertiary border border-border rounded-xl p-4">
                No email accounts connected.{" "}
                <a href="/dashboard/email-accounts" className="text-brand-600 font-semibold underline">Connect Gmail →</a>
              </div>
            ) : (
              <select value={form.emailAccountId} onChange={(e) => setForm({ ...form, emailAccountId: e.target.value })} className={inputClass}>
                <option value="">Select an email account… (optional)</option>
                {emailAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.displayName || a.emailAddress}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                if (!form.name || !form.festProfileId) { toast.error("Fill in campaign name and fest profile"); return; }
                setStep(2);
              }}
              className="btn-shine gradient-brand text-white px-6 py-2.5 rounded-xl font-semibold text-sm"
            >
              Next: Sponsors →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="bg-background-secondary border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">🏢 Choose Sponsor List</h2>
          {sponsorLists.length === 0 ? (
            <div className="text-sm text-foreground-muted bg-background-tertiary border border-border rounded-xl p-4">
              No sponsor lists yet.{" "}
              <a href="/dashboard/sponsor-lists" className="text-brand-600 font-semibold underline">Create a list →</a>
            </div>
          ) : (
            <div className="space-y-3">
              {sponsorLists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setForm({ ...form, sponsorListId: l.id })}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                    form.sponsorListId === l.id
                      ? "border-brand-400 bg-brand-500/10"
                      : "border-border hover:border-border-hover"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-foreground">{l.name}</div>
                    <div className="text-xs text-foreground-muted">{l.entryCount} sponsors</div>
                  </div>
                  {form.sponsorListId === l.id && (
                    <span className="text-brand-500 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)} className="text-sm font-semibold text-foreground-muted hover:text-foreground border border-border px-5 py-2.5 rounded-xl transition-all">
              ← Back
            </button>
            <button
              onClick={() => {
                if (!form.sponsorListId) { toast.error("Select a sponsor list"); return; }
                setStep(3);
              }}
              className="btn-shine gradient-brand text-white px-6 py-2.5 rounded-xl font-semibold text-sm"
            >
              Next: AI Settings →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="bg-background-secondary border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">🤖 AI Pitch Settings</h2>

          <div>
            <label className={labelClass}>Tone of Voice</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, toneOfVoice: t })}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                    form.toneOfVoice === t
                      ? "border-brand-400 bg-brand-500/10 text-brand-600"
                      : "border-border text-foreground-muted hover:border-border-hover hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Email Word Limit</label>
            <input
              type="number"
              value={form.emailWordLimit}
              onChange={(e) => setForm({ ...form, emailWordLimit: Number(e.target.value) })}
              min={100}
              max={500}
              className={inputClass}
            />
            <p className="text-xs text-foreground-muted mt-1">Recommended: 150-200 words for higher response rates</p>
          </div>

          <div>
            <label className={labelClass}>Custom Guidelines (optional)</label>
            <textarea
              value={form.guidelines}
              onChange={(e) => setForm({ ...form, guidelines: e.target.value })}
              rows={4}
              placeholder="e.g. Always mention our past sponsors Amazon and Flipkart. Focus on our 12-year legacy. Avoid mentioning competitor fests."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Subject Line Template (optional)</label>
            <input
              value={form.subjectTemplate}
              onChange={(e) => setForm({ ...form, subjectTemplate: e.target.value })}
              placeholder="e.g. Synapse 2025 — Sponsorship Opportunity for {companyName}"
              className={inputClass}
            />
          </div>

          {/* Summary */}
          <div className="bg-background-tertiary border border-border rounded-xl p-4 text-xs space-y-1">
            <div className="font-bold text-foreground mb-2">Campaign Summary</div>
            <div className="text-foreground-muted">🎪 Fest: <span className="text-foreground font-semibold">{selectedFest?.name}</span></div>
            <div className="text-foreground-muted">🏢 List: <span className="text-foreground font-semibold">{selectedList?.name} ({selectedList?.entryCount} sponsors)</span></div>
            <div className="text-foreground-muted">🤖 Will generate <span className="text-brand-600 font-bold">{selectedList?.entryCount} personalized pitches</span></div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(2)} className="text-sm font-semibold text-foreground-muted hover:text-foreground border border-border px-5 py-2.5 rounded-xl transition-all">
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-shine gradient-brand text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Creating…
                </>
              ) : "🚀 Create Campaign"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
