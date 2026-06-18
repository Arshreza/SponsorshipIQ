"use client";

import { useState } from "react";
import { toast } from "sonner";

interface FormData {
  companyName: string;
  industry: string;
  contactName: string;
  festName: string;
  festTheme: string;
  festDate: string;
  expectedFootfall: string;
  sponsorTier: string;
  tierAmount: string;
  highlights: string;
  tone: string;
}

export default function AIEmailPage() {
  const [form, setForm] = useState<FormData>({
    companyName: "",
    industry: "",
    contactName: "",
    festName: "Synapse 2025",
    festTheme: "Ignite the Future",
    festDate: "March 15-17, 2025",
    expectedFootfall: "5000",
    sponsorTier: "Title Sponsor",
    tierAmount: "2,00,000",
    highlights: "12-year legacy, past sponsors Amazon & HDFC, 15,000 Instagram followers, live media coverage",
    tone: "Professional",
  });

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function setField(key: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function generateEmail() {
    if (!form.companyName || !form.contactName || !form.festName) {
      toast.error("Please fill in Company, Contact Name, and Fest Name");
      return;
    }
    setLoading(true);
    setEmail("");
    try {
      const res = await fetch("/api/ai/cold-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setEmail(data.email);
        toast.success("✨ AI email generated!");
      } else {
        toast.error(data.error || "Failed to generate email");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyEmail() {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center text-xl shadow-lg shadow-brand-500/30">🤖</div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Cold Email Generator</h1>
            <p className="text-foreground-muted text-sm">Powered by <span className="text-brand-400 font-semibold">Groq · LLaMA 3.1</span> — generates in under 3 seconds</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-background-secondary border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <span>✍️</span> Sponsor & Fest Details
          </h2>

          {/* Sponsor Details */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">About the Sponsor</p>
            <div>
              <label className={labelClass}>Company Name *</label>
              <input value={form.companyName} onChange={e => setField("companyName", e.target.value)} placeholder="e.g. Zomato" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Contact Person *</label>
                <input value={form.contactName} onChange={e => setField("contactName", e.target.value)} placeholder="Ananya Patel" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Industry</label>
                <input value={form.industry} onChange={e => setField("industry", e.target.value)} placeholder="Food Tech" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Sponsorship Tier</label>
                <select value={form.sponsorTier} onChange={e => setField("sponsorTier", e.target.value)} className={inputClass}>
                  {["Title Sponsor", "Co-Sponsor", "Associate Sponsor", "Stall Sponsor", "Digital Sponsor"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Tier Amount (₹)</label>
                <input value={form.tierAmount} onChange={e => setField("tierAmount", e.target.value)} placeholder="2,00,000" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Fest Details */}
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">About Your Fest</p>
            <div>
              <label className={labelClass}>Festival Name *</label>
              <input value={form.festName} onChange={e => setField("festName", e.target.value)} placeholder="Synapse 2025" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Theme / Tagline</label>
                <input value={form.festTheme} onChange={e => setField("festTheme", e.target.value)} placeholder="Ignite the Future" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Event Dates</label>
                <input value={form.festDate} onChange={e => setField("festDate", e.target.value)} placeholder="March 15-17, 2025" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Expected Footfall</label>
                <input value={form.expectedFootfall} onChange={e => setField("expectedFootfall", e.target.value)} placeholder="5000" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email Tone</label>
                <select value={form.tone} onChange={e => setField("tone", e.target.value)} className={inputClass}>
                  {["Professional", "Enthusiastic", "Formal", "Friendly & Casual", "Concise & Direct"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Fest Highlights & USPs</label>
              <textarea
                value={form.highlights}
                onChange={e => setField("highlights", e.target.value)}
                rows={2}
                placeholder="12-year legacy, past sponsors Amazon, 15K Instagram followers…"
                className={inputClass}
              />
            </div>
          </div>

          <button
            onClick={generateEmail}
            disabled={loading}
            className="w-full btn-shine gradient-brand text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-500/25 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating with Groq AI…
              </>
            ) : (
              <>✨ Generate Email with AI</>
            )}
          </button>
        </div>

        {/* Output */}
        <div className="bg-background-secondary border border-border rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span>📧</span> Generated Email
            </h2>
            {email && (
              <button
                onClick={copyEmail}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  copied
                    ? "bg-green-500/15 text-green-400 border-green-500/30"
                    : "bg-brand-500/10 text-brand-400 border-brand-500/30 hover:bg-brand-500/20"
                }`}
              >
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
            )}
          </div>

          {!email && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="text-5xl mb-4">✨</div>
              <p className="text-foreground-muted text-sm max-w-xs">
                Fill in the details on the left and click Generate — your personalized cold email will appear here in seconds.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-foreground-muted">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Groq LLaMA 3.1 · ~2-3 seconds
              </div>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4" />
              <p className="text-foreground-muted text-sm">Groq AI is crafting your personalized email…</p>
            </div>
          )}

          {email && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 bg-background rounded-xl p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap font-mono overflow-y-auto max-h-[500px] border border-border">
                {email}
              </div>
              <p className="text-xs text-foreground-muted mt-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Generated by Groq · LLaMA 3.1 70B — Review before sending
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
