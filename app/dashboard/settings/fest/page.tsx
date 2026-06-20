"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface FestProfile {
  id: string;
  name: string;
  festType: string | null;
  college: string | null;
  city: string | null;
  theme: string | null;
  edition: string | null;
  eventDates: string | null;
  expectedFootfall: number | null;
  socialMediaReach: number | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
  pitchHighlights: string | null;
}

export default function FestSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [festType, setFestType] = useState("Technical");
  const [college, setCollege] = useState("");
  const [city, setCity] = useState("");
  const [theme, setTheme] = useState("");
  const [edition, setEdition] = useState("");
  const [eventDates, setEventDates] = useState("");
  const [expectedFootfall, setExpectedFootfall] = useState("");
  const [socialMediaReach, setSocialMediaReach] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [pitchHighlights, setPitchHighlights] = useState("");

  useEffect(() => {
    fetch("/api/fest")
      .then(r => r.json())
      .then((data: FestProfile | null) => {
        if (data) {
          setName(data.name || "");
          setFestType(data.festType || "Technical");
          setCollege(data.college || "");
          setCity(data.city || "");
          setTheme(data.theme || "");
          setEdition(data.edition || "");
          setEventDates(data.eventDates || "");
          setExpectedFootfall(data.expectedFootfall?.toString() || "");
          setSocialMediaReach(data.socialMediaReach?.toString() || "");
          setWebsiteUrl(data.websiteUrl || "");
          setInstagramHandle(data.instagramHandle || "");
          setPitchHighlights(data.pitchHighlights || "");
        }
      })
      .catch(() => toast.error("Failed to load fest profile"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!name.trim() || !college.trim()) {
      toast.error("Fest name and college are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/fest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, festType, college, city, theme, edition, eventDates,
          expectedFootfall: expectedFootfall || null,
          socialMediaReach: socialMediaReach || null,
          websiteUrl, instagramHandle, pitchHighlights,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Fest profile saved! AI pitches will now use these details.");
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Network error saving fest profile");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1.5";

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-foreground-muted text-sm">Loading fest profile…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fest Profile</h1>
        <p className="text-foreground-muted text-sm mt-1">
          This information powers all AI-generated pitches and campaign emails. Keep it accurate.
        </p>
      </div>

      <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3 text-xs text-brand-400 leading-relaxed">
        <strong>Why this matters:</strong> Every cold email the AI generates uses your fest name, college, theme, footfall, and highlights to personalize the pitch. Without this filled in, emails use placeholder defaults.
      </div>

      <div className="bg-background-secondary border border-border rounded-2xl p-6 space-y-5">
        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Basic Info</p>

        <div>
          <label className={labelClass}>Festival Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Synapse 2025" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Fest Type</label>
            <select value={festType} onChange={e => setFestType(e.target.value)} className={inputClass}>
              {["Technical", "Cultural", "Management", "Sports", "Mixed"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Edition</label>
            <input value={edition} onChange={e => setEdition(e.target.value)} placeholder="12th Edition" className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>College / University *</label>
          <input value={college} onChange={e => setCollege(e.target.value)} placeholder="Dhirubhai Ambani University" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>City</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Gandhinagar, Gujarat" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Event Dates</label>
            <input value={eventDates} onChange={e => setEventDates(e.target.value)} placeholder="March 15–17, 2026" className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Theme / Tagline</label>
          <input value={theme} onChange={e => setTheme(e.target.value)} placeholder="Ignite the Future" className={inputClass} />
        </div>

        <hr className="border-border" />
        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Reach & Social</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Expected Footfall</label>
            <input type="number" value={expectedFootfall} onChange={e => setExpectedFootfall(e.target.value)} placeholder="5000" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Social Media Reach</label>
            <input type="number" value={socialMediaReach} onChange={e => setSocialMediaReach(e.target.value)} placeholder="15000" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Website URL</label>
            <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="synapse.dau.ac.in" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Instagram Handle</label>
            <input value={instagramHandle} onChange={e => setInstagramHandle(e.target.value)} placeholder="@synapse_dau" className={inputClass} />
          </div>
        </div>

        <hr className="border-border" />
        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">AI Pitch Context</p>

        <div>
          <label className={labelClass}>Highlights & USPs</label>
          <textarea
            value={pitchHighlights}
            onChange={e => setPitchHighlights(e.target.value)}
            rows={3}
            placeholder="12-year legacy, past sponsors Amazon & HDFC, 15,000 Instagram followers, live media coverage, hackathon, robotics…"
            className={inputClass}
          />
          <p className="text-[10px] text-foreground-muted mt-1">This goes directly into every AI-generated cold email as your fest's selling points.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? (
            <><span className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
          ) : "Save Fest Profile"}
        </button>
      </div>
    </div>
  );
}
