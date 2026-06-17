"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Package {
  tier: string;
  amount: string;
  benefits: string[];
}

interface FestProfileFormProps {
  defaultValues?: {
    id?: string;
    name?: string;
    festType?: string;
    college?: string;
    city?: string;
    theme?: string;
    edition?: string;
    eventDates?: string;
    expectedFootfall?: number;
    socialMediaReach?: number;
    websiteUrl?: string;
    instagramHandle?: string;
    packages?: Package[];
    pitchHighlights?: string;
  };
}

export function FestProfileForm({ defaultValues }: FestProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<Package[]>(
    defaultValues?.packages || [
      { tier: "Title Sponsor", amount: "2,00,000", benefits: ["Logo on all banners", "Stage time (15 min)", "Social media spotlight"] },
      { tier: "Co-Sponsor", amount: "1,00,000", benefits: ["Logo on banners", "Stall space", "Social mention"] },
      { tier: "Associate Sponsor", amount: "50,000", benefits: ["Logo on website", "Event materials"] },
    ]
  );

  function addPackage() {
    setPackages([...packages, { tier: "", amount: "", benefits: [""] }]);
  }

  function removePackage(i: number) {
    setPackages(packages.filter((_, idx) => idx !== i));
  }

  function updatePackage(i: number, field: keyof Package, value: string | string[]) {
    const updated = [...packages];
    updated[i] = { ...updated[i], [field]: value } as Package;
    setPackages(updated);
  }

  function addBenefit(pkgIdx: number) {
    const updated = [...packages];
    updated[pkgIdx].benefits.push("");
    setPackages(updated);
  }

  function updateBenefit(pkgIdx: number, bIdx: number, val: string) {
    const updated = [...packages];
    updated[pkgIdx].benefits[bIdx] = val;
    setPackages(updated);
  }

  function removeBenefit(pkgIdx: number, bIdx: number) {
    const updated = [...packages];
    updated[pkgIdx].benefits = updated[pkgIdx].benefits.filter((_, i) => i !== bIdx);
    setPackages(updated);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      festType: fd.get("festType"),
      college: fd.get("college"),
      city: fd.get("city"),
      theme: fd.get("theme"),
      edition: fd.get("edition"),
      eventDates: fd.get("eventDates"),
      expectedFootfall: fd.get("expectedFootfall") ? Number(fd.get("expectedFootfall")) : null,
      socialMediaReach: fd.get("socialMediaReach") ? Number(fd.get("socialMediaReach")) : null,
      websiteUrl: fd.get("websiteUrl"),
      instagramHandle: fd.get("instagramHandle"),
      pitchHighlights: fd.get("pitchHighlights"),
      packages: JSON.stringify(packages),
    };

    const url = defaultValues?.id
      ? `/api/fest-profiles/${defaultValues.id}`
      : "/api/fest-profiles";
    const method = defaultValues?.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (res.ok) {
      toast.success(defaultValues?.id ? "Fest profile updated!" : "Fest profile created!");
      router.push("/dashboard/fest-profiles");
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to save fest profile");
    }
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-background-secondary border border-border rounded-2xl p-6">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5 flex items-center gap-2">
          <span>🎪</span> Festival Details
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Festival Name *</label>
            <input name="name" defaultValue={defaultValues?.name} required placeholder="e.g. Synapse 2025" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Edition / Year</label>
            <input name="edition" defaultValue={defaultValues?.edition} placeholder="12th Edition" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Fest Type</label>
            <select name="festType" defaultValue={defaultValues?.festType || ""} className={inputClass}>
              <option value="">Select type</option>
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Management">Management</option>
              <option value="Sports">Sports</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>College / Institution</label>
            <input name="college" defaultValue={defaultValues?.college} placeholder="DAU - Dhirubhai Ambani University" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input name="city" defaultValue={defaultValues?.city} placeholder="Gandhinagar, Gujarat" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Event Dates</label>
            <input name="eventDates" defaultValue={defaultValues?.eventDates} placeholder="March 15-17, 2025" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Expected Footfall</label>
            <input name="expectedFootfall" type="number" defaultValue={defaultValues?.expectedFootfall} placeholder="3000" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Social Media Reach</label>
            <input name="socialMediaReach" type="number" defaultValue={defaultValues?.socialMediaReach} placeholder="15000" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Website URL</label>
            <input name="websiteUrl" defaultValue={defaultValues?.websiteUrl} placeholder="https://synapse.dau.ac.in" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Instagram Handle</label>
            <input name="instagramHandle" defaultValue={defaultValues?.instagramHandle} placeholder="@synapse_dau" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Theme / Tagline</label>
            <input name="theme" defaultValue={defaultValues?.theme} placeholder="e.g. 'Ignite the Future' — Innovation meets Culture" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Pitch Highlights & USPs</label>
            <textarea
              name="pitchHighlights"
              defaultValue={defaultValues?.pitchHighlights}
              rows={3}
              placeholder="e.g. 12-year legacy, past sponsors: Amazon, Flipkart, HDFC; 5,000+ Instagram followers, live coverage by local media"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Packages */}
      <div className="bg-background-secondary border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <span>📦</span> Sponsorship Packages
          </h2>
          <button
            type="button"
            onClick={addPackage}
            className="text-xs font-semibold text-brand-600 hover:text-brand-500 border border-brand-300 hover:border-brand-400 px-3 py-1.5 rounded-lg transition-all"
          >
            + Add Tier
          </button>
        </div>

        <div className="space-y-4">
          {packages.map((pkg, i) => (
            <div key={i} className="border border-border-hover rounded-xl p-4 bg-background">
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelClass}>Tier Name</label>
                  <input
                    value={pkg.tier}
                    onChange={(e) => updatePackage(i, "tier", e.target.value)}
                    placeholder="Title Sponsor"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Amount (₹)</label>
                  <input
                    value={pkg.amount}
                    onChange={(e) => updatePackage(i, "amount", e.target.value)}
                    placeholder="2,00,000"
                    className={inputClass}
                  />
                </div>
              </div>
              <label className={labelClass}>Benefits / Deliverables</label>
              <div className="space-y-2">
                {pkg.benefits.map((b, bi) => (
                  <div key={bi} className="flex gap-2">
                    <input
                      value={b}
                      onChange={(e) => updateBenefit(i, bi, e.target.value)}
                      placeholder="Logo on all banners"
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => removeBenefit(i, bi)}
                      className="text-foreground-muted hover:text-error-500 transition-colors p-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addBenefit(i)}
                  className="text-xs text-brand-600 hover:text-brand-500 font-semibold"
                >
                  + Add benefit
                </button>
              </div>
              {packages.length > 1 && (
                <div className="text-right mt-3">
                  <button
                    type="button"
                    onClick={() => removePackage(i)}
                    className="text-xs text-error-500 hover:text-error-600 font-semibold"
                  >
                    Remove tier
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-semibold text-foreground-muted hover:text-foreground border border-border hover:border-border-hover px-5 py-2.5 rounded-xl transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-shine gradient-brand text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 hover:scale-105 transition-all disabled:opacity-60 disabled:scale-100"
        >
          {loading ? "Saving…" : defaultValues?.id ? "Update Profile" : "Create Profile"}
        </button>
      </div>
    </form>
  );
}
