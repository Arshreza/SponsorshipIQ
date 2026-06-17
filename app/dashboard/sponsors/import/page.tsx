"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Papa from "papaparse";

type ParsedRow = Record<string, string>;

export default function SponsorImportPage() {
  const router = useRouter();
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({
    companyName: "",
    contactEmail: "",
    contactName: "",
    jobTitle: "",
    website: "",
    industry: "",
    city: "",
  });
  const [listName, setListName] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsed(results.data);
        setHeaders(results.meta.fields || []);
        // Auto-map common column names
        const autoMap: Record<string, string> = {};
        const auto = {
          companyName: ["company", "company name", "companyname", "organization", "brand"],
          contactEmail: ["email", "email address", "contact email", "contactemail"],
          contactName: ["name", "contact name", "contactname", "full name", "contact"],
          jobTitle: ["title", "job title", "jobtitle", "position", "role"],
          website: ["website", "url", "domain", "web"],
          industry: ["industry", "sector", "vertical"],
          city: ["city", "location", "place"],
        };
        for (const [field, aliases] of Object.entries(auto)) {
          const match = (results.meta.fields || []).find((h) =>
            aliases.includes(h.toLowerCase().trim())
          );
          if (match) autoMap[field] = match;
        }
        setFieldMap((prev) => ({ ...prev, ...autoMap }));
        toast.success(`Loaded ${results.data.length} rows`);
      },
    });
  }

  async function handleImport() {
    if (!fieldMap.companyName || !fieldMap.contactEmail) {
      toast.error("Map Company Name and Contact Email fields first");
      return;
    }

    setLoading(true);

    const sponsors = parsed.map((row) => ({
      companyName: row[fieldMap.companyName] || "",
      contactEmail: row[fieldMap.contactEmail] || "",
      contactName: fieldMap.contactName ? row[fieldMap.contactName] || "" : "",
      jobTitle: fieldMap.jobTitle ? row[fieldMap.jobTitle] || "" : "",
      website: fieldMap.website ? row[fieldMap.website] || "" : "",
      industry: fieldMap.industry ? row[fieldMap.industry] || "" : "",
      city: fieldMap.city ? row[fieldMap.city] || "" : "",
    })).filter((s) => s.companyName && s.contactEmail);

    const res = await fetch("/api/sponsors/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sponsors }),
    });
    const data = await res.json();

    // Optionally create a sponsor list
    if (res.ok && listName.trim()) {
      const listRes = await fetch("/api/sponsor-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: listName }),
      });
      if (listRes.ok) {
        const list = await listRes.json();
        // Get newly created sponsor IDs — simplified: add all by re-fetching
        toast.info("Sponsor list created. Add sponsors to it from the Sponsors page.");
        void list;
      }
    }

    setLoading(false);

    if (res.ok) {
      toast.success(`Imported ${data.created} new sponsors, updated ${data.updated}`);
      router.push("/dashboard/sponsors");
    } else {
      toast.error(data.error || "Import failed");
    }
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5";

  const requiredFields = [
    { key: "companyName", label: "Company Name *" },
    { key: "contactEmail", label: "Contact Email *" },
  ];
  const optionalFields = [
    { key: "contactName", label: "Contact Name" },
    { key: "jobTitle", label: "Job Title" },
    { key: "website", label: "Website" },
    { key: "industry", label: "Industry" },
    { key: "city", label: "City" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import Sponsors from CSV</h1>
        <p className="text-foreground-muted text-sm mt-1">
          Upload a CSV file with your brand contacts. Map columns and optionally create a sponsor list.
        </p>
      </div>

      {/* Upload */}
      <div className="bg-background-secondary border border-border rounded-2xl p-6">
        <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4">📂 Upload CSV</h2>
        <div
          className="border-2 border-dashed border-brand-300 hover:border-brand-400 rounded-2xl p-10 text-center cursor-pointer transition-all bg-brand-500/5 hover:bg-brand-500/10"
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-4xl mb-3">📁</div>
          <p className="text-sm font-semibold text-foreground">Click to upload CSV file</p>
          <p className="text-xs text-foreground-muted mt-1">Any CSV with company and email columns</p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </div>
        {parsed.length > 0 && (
          <p className="text-sm text-brand-600 font-semibold mt-3 text-center">✓ {parsed.length} rows loaded</p>
        )}
      </div>

      {/* Field mapping */}
      {headers.length > 0 && (
        <div className="bg-background-secondary border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">🗂️ Map CSV Columns</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-3">Required Fields</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {requiredFields.map((f) => (
                  <div key={f.key}>
                    <label className={labelClass}>{f.label}</label>
                    <select
                      value={fieldMap[f.key]}
                      onChange={(e) => setFieldMap({ ...fieldMap, [f.key]: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">— select column —</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-3">Optional Fields</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {optionalFields.map((f) => (
                  <div key={f.key}>
                    <label className={labelClass}>{f.label}</label>
                    <select
                      value={fieldMap[f.key]}
                      onChange={(e) => setFieldMap({ ...fieldMap, [f.key]: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">— skip —</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          {parsed.length > 0 && fieldMap.companyName && fieldMap.contactEmail && (
            <div>
              <h3 className="text-xs font-bold text-foreground-secondary uppercase tracking-wider mb-3">Preview (first 3 rows)</h3>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-background-tertiary">
                      <th className="text-left px-4 py-2.5 text-foreground-secondary font-bold">Company</th>
                      <th className="text-left px-4 py-2.5 text-foreground-secondary font-bold">Email</th>
                      <th className="text-left px-4 py-2.5 text-foreground-secondary font-bold hidden sm:table-cell">Industry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsed.slice(0, 3).map((row, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 text-foreground">{row[fieldMap.companyName]}</td>
                        <td className="px-4 py-2.5 text-foreground-muted">{row[fieldMap.contactEmail]}</td>
                        <td className="px-4 py-2.5 text-foreground-muted hidden sm:table-cell">{fieldMap.industry ? row[fieldMap.industry] : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create list option */}
      {parsed.length > 0 && (
        <div className="bg-background-secondary border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4">📋 Create Sponsor List (Optional)</h2>
          <div>
            <label className={labelClass}>List Name</label>
            <input
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="e.g. Tech Brands — Synapse 2025"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Submit */}
      {parsed.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="text-sm font-semibold text-foreground-muted hover:text-foreground border border-border px-5 py-2.5 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !fieldMap.companyName || !fieldMap.contactEmail}
            className="btn-shine gradient-brand text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
                Importing…
              </>
            ) : `Import ${parsed.length} Sponsors →`}
          </button>
        </div>
      )}
    </div>
  );
}
