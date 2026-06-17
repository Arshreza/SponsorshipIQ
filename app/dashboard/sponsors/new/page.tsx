"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function NewSponsorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    contactEmail: "",
    contactName: "",
    jobTitle: "",
    website: "",
    industry: "",
    city: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/sponsors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Sponsor added!");
      router.push("/dashboard/sponsors");
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed to add sponsor");
    }
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5";

  const industries = [
    "Technology", "E-Commerce", "FMCG", "Banking & Finance", "Telecom",
    "Automotive", "Education", "Healthcare", "Media & Entertainment",
    "Fashion & Apparel", "Food & Beverage", "Real Estate", "Energy", "Other",
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-foreground-muted mb-2">
          <Link href="/dashboard/sponsors" className="hover:text-foreground transition-colors">Sponsors</Link>
          <span>/</span>
          <span>Add Sponsor</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Add Sponsor</h1>
        <p className="text-foreground-muted text-sm mt-1">Add a brand contact manually. Or use CSV import for bulk uploads.</p>
      </div>

      <div className="bg-background-secondary border border-border rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company Name *</label>
              <input required value={form.companyName} onChange={(e) => setForm({...form, companyName: e.target.value})} placeholder="Amazon India" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contact Email *</label>
              <input required type="email" value={form.contactEmail} onChange={(e) => setForm({...form, contactEmail: e.target.value})} placeholder="marketing@amazon.in" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contact Name</label>
              <input value={form.contactName} onChange={(e) => setForm({...form, contactName: e.target.value})} placeholder="Rahul Sharma" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Job Title</label>
              <input value={form.jobTitle} onChange={(e) => setForm({...form, jobTitle: e.target.value})} placeholder="Brand Partnerships Manager" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Website</label>
              <input value={form.website} onChange={(e) => setForm({...form, website: e.target.value})} placeholder="https://amazon.in" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Industry</label>
              <select value={form.industry} onChange={(e) => setForm({...form, industry: e.target.value})} className={inputClass}>
                <option value="">Select industry…</option>
                {industries.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} placeholder="Mumbai" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
              rows={3}
              placeholder="Any context about this brand — past interest in sponsorships, referral source, etc."
              className={inputClass}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="text-sm font-semibold text-foreground-muted hover:text-foreground border border-border px-5 py-2.5 rounded-xl transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-shine gradient-brand text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 disabled:opacity-60">
              {loading ? "Saving…" : "Add Sponsor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
