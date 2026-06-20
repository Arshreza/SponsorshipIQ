"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

const TONE_OPTIONS = ["Professional", "Enthusiastic", "Formal", "Conversational", "Friendly"];
const ALL_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const label = i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`;
  return { value: i, label: `${label} (${String(i).padStart(2, "0")}:00 UTC)` };
});

interface CampaignData {
  id: string;
  name: string;
  status: string;
  guidelines: string | null;
  toneOfVoice: string | null;
  emailWordLimit: number;
  subjectTemplate: string | null;
  scheduleEnabled: boolean;
  scheduledHour: number;
  scheduledDays: string;
  batchSize: number;
  festProfile: { name: string };
  sponsorList: { name: string };
}

export default function EditCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("Professional");
  const [emailWordLimit, setEmailWordLimit] = useState(200);
  const [subjectTemplate, setSubjectTemplate] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledHour, setScheduledHour] = useState(9);
  const [scheduledDays, setScheduledDays] = useState<string[]>(["MON", "TUE", "WED", "THU", "FRI"]);
  const [batchSize, setBatchSize] = useState(3);

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then(r => r.json())
      .then((data: CampaignData) => {
        setCampaign(data);
        setName(data.name);
        setGuidelines(data.guidelines || "");
        setToneOfVoice(data.toneOfVoice || "Professional");
        setEmailWordLimit(data.emailWordLimit || 200);
        setSubjectTemplate(data.subjectTemplate || "");
        setScheduleEnabled(data.scheduleEnabled ?? false);
        setScheduledHour(data.scheduledHour ?? 9);
        setScheduledDays((data.scheduledDays || "MON,TUE,WED,THU,FRI").split(",").map(d => d.trim()));
        setBatchSize(data.batchSize ?? 3);
      })
      .catch(() => toast.error("Failed to load campaign"))
      .finally(() => setLoading(false));
  }, [id]);

  function toggleDay(day: string) {
    setScheduledDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Campaign name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          guidelines: guidelines || null,
          toneOfVoice,
          emailWordLimit: Number(emailWordLimit),
          subjectTemplate: subjectTemplate || null,
          scheduleEnabled,
          scheduledHour,
          scheduledDays: scheduledDays.join(","),
          batchSize,
        }),
      });
      if (res.ok) {
        toast.success("Campaign updated!");
        router.push(`/dashboard/campaigns/${id}`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save campaign");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-1.5";

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-foreground-muted text-sm">Loading campaign…</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12 text-foreground-muted">Campaign not found.</div>
    );
  }

  const isLocked = campaign.status === "ACTIVE" || campaign.status === "COMPLETED";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/dashboard/campaigns/${id}`} className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors">
        ← Back to Campaign
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Campaign</h1>
        <p className="text-foreground-muted text-sm mt-1">
          {campaign.festProfile.name} · {campaign.sponsorList.name}
        </p>
      </div>

      {isLocked && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-400 font-medium">
          This campaign is {campaign.status.toLowerCase()}. Pause it before editing AI settings.
        </div>
      )}

      <div className="bg-background-secondary border border-border rounded-2xl p-6 space-y-5">
        <div>
          <label className={labelClass}>Campaign Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Synapse 2025 — Tech Sponsors Round 1"
            className={inputClass}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tone of Voice</label>
            <select value={toneOfVoice} onChange={e => setToneOfVoice(e.target.value)} className={inputClass}>
              {TONE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Email Word Limit</label>
            <input
              type="number"
              value={emailWordLimit}
              onChange={e => setEmailWordLimit(Number(e.target.value))}
              min={100}
              max={600}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Subject Line Template</label>
          <input
            value={subjectTemplate}
            onChange={e => setSubjectTemplate(e.target.value)}
            placeholder="e.g. Sponsorship Opportunity — {festName} × {companyName}"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-foreground-muted">Use {"{festName}"} and {"{companyName}"} as placeholders.</p>
        </div>

        <div>
          <label className={labelClass}>AI Guidelines</label>
          <textarea
            value={guidelines}
            onChange={e => setGuidelines(e.target.value)}
            rows={5}
            placeholder="e.g. Focus on our 3000+ footfall, emphasize tech brand fit, avoid mentioning competing sponsors…"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-foreground-muted">These instructions guide the AI when generating all outreach emails for this campaign.</p>
        </div>
      </div>

      {/* Auto-Schedule */}
      <div className="bg-background-secondary border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">⏰ Auto-Schedule</h2>
            <p className="text-xs text-foreground-muted mt-0.5">Automatically send batches of emails on a set schedule. Vercel cron triggers hourly and matches your settings.</p>
          </div>
          <button
            type="button"
            onClick={() => setScheduleEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${scheduleEnabled ? "bg-brand-500" : "bg-border"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${scheduleEnabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        {scheduleEnabled && (
          <div className="space-y-4 pt-1">
            <div>
              <label className={labelClass}>Send Time (UTC)</label>
              <select value={scheduledHour} onChange={e => setScheduledHour(Number(e.target.value))} className={inputClass}>
                {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
              <p className="mt-1 text-xs text-foreground-muted">The cron runs every hour; emails send only when the UTC hour matches.</p>
            </div>

            <div>
              <label className={labelClass}>Active Days</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ALL_DAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      scheduledDays.includes(day)
                        ? "bg-brand-500 border-brand-500 text-white"
                        : "border-border text-foreground-muted hover:border-brand-500/50"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Batch Size (sponsors per trigger)</label>
              <input
                type="number"
                value={batchSize}
                onChange={e => setBatchSize(Number(e.target.value))}
                min={1}
                max={20}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-foreground-muted">How many sponsors to email each time the schedule fires. Keep low to stay within daily limits.</p>
            </div>

            <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl px-4 py-3 text-xs text-brand-400">
              <span className="font-bold">Schedule preview:</span> Send {batchSize} email{batchSize !== 1 ? "s" : ""} every {scheduledDays.length > 0 ? scheduledDays.join(", ") : "—"} at {HOURS.find(h => h.value === scheduledHour)?.label?.split(" (")[0] || `${scheduledHour}:00`} UTC.
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href={`/dashboard/campaigns/${id}`}
          className="flex-1 text-center px-4 py-2.5 rounded-xl border border-border text-foreground-muted text-sm font-semibold hover:bg-background transition-all"
        >
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={saving || isLocked}
          className="flex-1 btn-shine gradient-brand text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
        >
          {saving ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
          ) : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
