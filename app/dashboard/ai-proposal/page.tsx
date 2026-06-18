"use client";

import { useState } from "react";
import { toast } from "sonner";

interface ProposalForm {
  festName: string;
  festType: string;
  college: string;
  city: string;
  edition: string;
  theme: string;
  dates: string;
  footfall: string;
  socialReach: string;
  instagramHandle: string;
  website: string;
  highlights: string;
  pastSponsors: string;
  packages: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export default function AIProposalPage() {
  const [form, setForm] = useState<ProposalForm>({
    festName: "Synapse 2025",
    festType: "Technical",
    college: "Dhirubhai Ambani University",
    city: "Gandhinagar, Gujarat",
    edition: "12th Edition",
    theme: "Ignite the Future",
    dates: "March 15-17, 2025",
    footfall: "5000",
    socialReach: "15000",
    instagramHandle: "@synapse_dau",
    website: "synapse.dau.ac.in",
    highlights: "12-year legacy, nationally recognized technical fest, live coverage by local media, hackathon, robotics, cultural performances",
    pastSponsors: "Amazon, HDFC Bank, Flipkart, Jio, Amul",
    packages: JSON.stringify([
      { tier: "Title Sponsor", amount: "₹2,00,000", benefits: ["Logo on all banners & backdrops", "15-min stage time", "Social media spotlight (5 posts)", "Stall space (20x20 ft)", "Branding on event t-shirts"] },
      { tier: "Co-Sponsor", amount: "₹1,00,000", benefits: ["Logo on main banners", "Stall space (10x10 ft)", "3 social media posts", "Certificate of sponsorship"] },
      { tier: "Associate Sponsor", amount: "₹50,000", benefits: ["Logo on website & brochure", "Social media mention", "Certificate of sponsorship"] },
    ]),
    contactName: "Priya Sharma",
    contactEmail: "sponsorship@synapse.dau.ac.in",
    contactPhone: "9876543210",
  });

  const [proposal, setProposal] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [printing, setPrinting] = useState(false);

  function setField(key: keyof ProposalForm, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function generateProposal() {
    if (!form.festName || !form.college) {
      toast.error("Please fill in Festival Name and College");
      return;
    }
    setLoading(true);
    setProposal("");
    try {
      const res = await fetch("/api/ai/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setProposal(data.proposal);
        toast.success("📄 Proposal generated!");
      } else {
        toast.error(data.error || "Failed to generate proposal");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyProposal() {
    navigator.clipboard.writeText(proposal);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadPDF() {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center text-xl shadow-lg shadow-brand-500/30">📄</div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Sponsorship Proposal Generator</h1>
          <p className="text-foreground-muted text-sm">Powered by <span className="text-brand-400 font-semibold">Groq · LLaMA 3.1</span> — professional brochure in seconds</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Form (2/5) */}
        <div className="lg:col-span-2 bg-background-secondary border border-border rounded-2xl p-5 space-y-4 h-fit">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">🎪 Festival Details</h2>

          <div>
            <label className={labelClass}>Festival Name *</label>
            <input value={form.festName} onChange={e => setField("festName", e.target.value)} className={inputClass} placeholder="Synapse 2025" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Fest Type</label>
              <select value={form.festType} onChange={e => setField("festType", e.target.value)} className={inputClass}>
                {["Technical", "Cultural", "Management", "Sports", "Mixed"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Edition</label>
              <input value={form.edition} onChange={e => setField("edition", e.target.value)} className={inputClass} placeholder="12th Edition" />
            </div>
          </div>
          <div>
            <label className={labelClass}>College *</label>
            <input value={form.college} onChange={e => setField("college", e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>City</label>
              <input value={form.city} onChange={e => setField("city", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Event Dates</label>
              <input value={form.dates} onChange={e => setField("dates", e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Theme / Tagline</label>
            <input value={form.theme} onChange={e => setField("theme", e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Footfall</label>
              <input value={form.footfall} onChange={e => setField("footfall", e.target.value)} className={inputClass} placeholder="5000" />
            </div>
            <div>
              <label className={labelClass}>Social Reach</label>
              <input value={form.socialReach} onChange={e => setField("socialReach", e.target.value)} className={inputClass} placeholder="15000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Instagram</label>
              <input value={form.instagramHandle} onChange={e => setField("instagramHandle", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Website</label>
              <input value={form.website} onChange={e => setField("website", e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Highlights & USPs</label>
            <textarea value={form.highlights} onChange={e => setField("highlights", e.target.value)} rows={2} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Past Sponsors</label>
            <input value={form.pastSponsors} onChange={e => setField("pastSponsors", e.target.value)} className={inputClass} placeholder="Amazon, Flipkart, HDFC…" />
          </div>

          <div className="pt-2 border-t border-border space-y-3">
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Contact Person</p>
            <input value={form.contactName} onChange={e => setField("contactName", e.target.value)} className={inputClass} placeholder="Your name" />
            <input value={form.contactEmail} onChange={e => setField("contactEmail", e.target.value)} className={inputClass} placeholder="email@fest.com" />
            <input value={form.contactPhone} onChange={e => setField("contactPhone", e.target.value)} className={inputClass} placeholder="9876543210" />
          </div>

          <button
            onClick={generateProposal}
            disabled={loading}
            className="w-full btn-shine gradient-brand text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-500/25 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Proposal…
              </>
            ) : (
              <>📄 Generate Full Proposal</>
            )}
          </button>
        </div>

        {/* Right: Output (3/5) */}
        <div className="lg:col-span-3 bg-background-secondary border border-border rounded-2xl p-6 flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">📋 Generated Proposal</h2>
            {proposal && (
              <div className="flex gap-2">
                <button
                  onClick={copyProposal}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    copied ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-brand-500/10 text-brand-400 border-brand-500/30 hover:bg-brand-500/20"
                  }`}
                >
                  {copied ? "✓ Copied!" : "📋 Copy"}
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={printing}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20 transition-all"
                >
                  🖨️ Print / Save PDF
                </button>
              </div>
            )}
          </div>

          {!proposal && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="text-5xl mb-4">📄</div>
              <p className="text-foreground-muted text-sm max-w-sm">
                Fill in your fest details on the left and click Generate — Groq AI will write a complete professional sponsorship proposal.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-foreground-muted">
                {["Cover Letter", "Sponsorship Tiers", "Benefits & ROI"].map(s => (
                  <div key={s} className="bg-background border border-border rounded-xl p-3 text-center">
                    <div className="text-xl mb-1">✨</div>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4" />
              <p className="text-foreground-muted text-sm">Groq AI is writing your full sponsorship proposal…</p>
              <p className="text-xs text-foreground-muted mt-2 opacity-60">Usually takes 4-8 seconds</p>
            </div>
          )}

          {proposal && (
            <div className="flex-1 flex flex-col">
              <div
                id="proposal-content"
                className="flex-1 bg-background rounded-xl p-5 text-sm text-foreground leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[600px] border border-border"
              >
                {proposal}
              </div>
              <p className="text-xs text-foreground-muted mt-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Generated by Groq · LLaMA 3.1 70B — Review and customize before sharing
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
