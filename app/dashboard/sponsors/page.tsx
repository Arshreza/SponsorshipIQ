"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const MEMBERS = ["Priya", "Raj", "Meera", "Arjun", "Divya", "Siddharth"];

const STATUS_OPTIONS = [
  { value: "CONTACTED",  label: "Contacted",  color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { value: "INTERESTED", label: "Interested", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { value: "CONFIRMED",  label: "Confirmed",  color: "bg-green-500/15 text-green-400 border-green-500/30" },
  { value: "REJECTED",   label: "Rejected",   color: "bg-red-500/15 text-red-400 border-red-500/30" },
];

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  CONFIRMED:  { label: "Confirmed",  color: "bg-green-500/15 text-green-400 border-green-500/30",  dot: "bg-green-400" },
  INTERESTED: { label: "Interested", color: "bg-blue-500/15 text-blue-400 border-blue-500/30",    dot: "bg-blue-400" },
  CONTACTED:  { label: "Contacted",  color: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  REJECTED:   { label: "Rejected",   color: "bg-red-500/15 text-red-400 border-red-500/30",       dot: "bg-red-400" },
};

interface Sponsor {
  id: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string;
  phone: string | null;
  industry: string | null;
  status: string;
  amount: number;
  assignedTo: string | null;
  lastContact: string | null;
  notes: string | null;
  description: string | null;
}

type SponsorForm = {
  companyName: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  industry: string;
  status: string;
  amount: number;
  assignedTo: string;
  lastContact: string;
  notes: string;
  description: string;
};

const emptyForm: SponsorForm = {
  companyName: "",
  contactName: "",
  contactEmail: "",
  phone: "",
  industry: "",
  status: "CONTACTED",
  amount: 0,
  assignedTo: MEMBERS[0],
  lastContact: new Date().toISOString().slice(0, 10),
  notes: "",
  description: "",
};

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<SponsorForm>(emptyForm);

  const loadSponsors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sponsors");
      if (res.ok) {
        const data = await res.json();
        setSponsors(data);
      } else {
        toast.error("Failed to load sponsors");
      }
    } catch {
      toast.error("Network error loading sponsors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSponsors();
  }, [loadSponsors]);

  const filtered = sponsors.filter(s => {
    const matchFilter = filter === "ALL" || s.status === filter;
    const matchSearch = !search ||
      s.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (s.contactName || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.industry || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  function openAdd() {
    setForm({ ...emptyForm, lastContact: new Date().toISOString().slice(0, 10) });
    setEditId(null);
    setShowAdd(true);
  }

  function openEdit(s: Sponsor) {
    setForm({
      companyName: s.companyName,
      contactName: s.contactName || "",
      contactEmail: s.contactEmail,
      phone: s.phone || "",
      industry: s.industry || "",
      status: s.status,
      amount: s.amount,
      assignedTo: s.assignedTo || MEMBERS[0],
      lastContact: s.lastContact || new Date().toISOString().slice(0, 10),
      notes: s.notes || "",
      description: s.description || "",
    });
    setEditId(s.id);
    setShowAdd(true);
  }

  function closeModal() { setShowAdd(false); setEditId(null); setForm(emptyForm); }

  async function saveForm() {
    if (!form.companyName || !form.contactEmail) {
      toast.error("Company name and email are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        companyName: form.companyName,
        contactEmail: form.contactEmail,
        contactName: form.contactName || null,
        phone: form.phone || null,
        industry: form.industry || null,
        notes: form.notes || null,
        description: form.description || null,
        status: form.status,
        amount: form.amount,
        assignedTo: form.assignedTo || null,
        lastContact: form.lastContact || null,
      };

      let res: Response;
      if (editId) {
        res = await fetch(`/api/sponsors/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/sponsors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success(editId ? "Lead updated!" : "Lead added!");
        closeModal();
        await loadSponsors();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save lead");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSponsor(id: string) {
    if (!confirm("Remove this lead?")) return;
    try {
      const res = await fetch(`/api/sponsors/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Lead removed");
        setSponsors(prev => prev.filter(s => s.id !== id));
      } else {
        toast.error("Failed to delete lead");
      }
    } catch {
      toast.error("Network error");
    }
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🏢 Leads</h1>
          <p className="text-foreground-muted text-sm mt-1">
            {loading ? "Loading…" : `${sponsors.length} companies tracked · ${sponsors.filter(s => s.status === "CONFIRMED").length} confirmed`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 hover:scale-105 transition-all"
        >
          + Add Lead
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search company, contact, industry…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-background-secondary border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all"
        />
        <div className="flex gap-2 flex-wrap">
          {["ALL", "CONTACTED", "INTERESTED", "CONFIRMED", "REJECTED"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                filter === f
                  ? "gradient-brand text-white border-transparent shadow-lg shadow-brand-500/25"
                  : "bg-background-secondary border-border text-foreground-muted hover:border-brand-500/40"
              }`}
            >
              {f === "ALL" ? "All" : statusConfig[f]?.label}
              <span className="ml-1.5 opacity-70">
                ({f === "ALL" ? sponsors.length : sponsors.filter(s => s.status === f).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-background-secondary border border-border rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-foreground-muted text-sm">Loading sponsors…</p>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-background-secondary border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Industry</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Assigned To</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Last Contact</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-foreground-muted text-sm">
                      {search || filter !== "ALL" ? "No sponsors match your filter." : "No sponsors yet."}{" "}
                      <button onClick={openAdd} className="text-brand-400 hover:underline font-semibold">Add one →</button>
                    </td>
                  </tr>
                )}
                {filtered.map(s => {
                  const sc = statusConfig[s.status] || statusConfig["CONTACTED"];
                  return (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-background transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{s.companyName}</div>
                        <div className="text-xs text-foreground-muted">{s.notes?.slice(0, 40)}{(s.notes?.length || 0) > 40 ? "…" : ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-foreground text-xs font-medium">{s.contactName}</div>
                        <div className="text-foreground-muted text-xs">{s.contactEmail}</div>
                        <div className="text-foreground-muted text-xs">{s.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-foreground-muted text-xs">{s.industry}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-foreground">
                        {s.amount > 0 ? `₹${s.amount.toLocaleString()}` : <span className="text-foreground-muted">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {s.assignedTo && (
                          <span className="text-xs bg-brand-500/10 text-brand-400 px-2 py-1 rounded-lg font-semibold">{s.assignedTo}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground-muted text-xs">{s.lastContact}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(s)} className="text-xs text-brand-400 hover:text-brand-300 font-semibold px-2 py-1 rounded-lg hover:bg-brand-500/10 transition-all">Edit</button>
                          <button onClick={() => deleteSponsor(s.id)} className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background-secondary border border-border rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editId ? "Edit Lead" : "Add Lead"}</h2>
              <button onClick={closeModal} className="text-foreground-muted hover:text-foreground text-xl transition-colors">✕</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Company Name *</label>
                <input value={form.companyName} onChange={e => setForm(f => ({...f, companyName: e.target.value}))} placeholder="e.g. Zomato" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Contact Person</label>
                <input value={form.contactName} onChange={e => setForm(f => ({...f, contactName: e.target.value}))} placeholder="Full name" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Industry</label>
                <input value={form.industry} onChange={e => setForm(f => ({...f, industry: e.target.value}))} placeholder="e.g. Food Tech" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({...f, contactEmail: e.target.value}))} placeholder="contact@company.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="9876543210" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={inputClass}>
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Amount (₹)</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: Number(e.target.value)}))} placeholder="100000" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Assigned To</label>
                <select value={form.assignedTo} onChange={e => setForm(f => ({...f, assignedTo: e.target.value}))} className={inputClass}>
                  {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Last Contact Date</label>
                <input type="date" value={form.lastContact} onChange={e => setForm(f => ({...f, lastContact: e.target.value}))} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={3} placeholder="Follow-up notes, interests, next steps…" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>AI Email Context</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} placeholder="e.g. This company targets college students and recently ran a campus ambassador program — focus on hackathon sponsorship angle" className={inputClass} />
                <p className="mt-1 text-xs text-foreground-muted">This context is passed to the AI when generating outreach emails for this sponsor.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground-muted text-sm font-semibold hover:bg-background transition-all">Cancel</button>
              <button
                onClick={saveForm}
                disabled={saving}
                className="flex-1 btn-shine gradient-brand text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                ) : (
                  editId ? "Save Changes" : "Add Lead"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
