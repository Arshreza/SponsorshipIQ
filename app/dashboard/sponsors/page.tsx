"use client";

import { useState } from "react";
import { toast } from "sonner";

const MEMBERS = ["Priya", "Raj", "Meera", "Arjun", "Divya", "Siddharth"];

const STATUS_OPTIONS = [
  { value: "CONTACTED",  label: "Contacted",  color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { value: "INTERESTED", label: "Interested", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { value: "CONFIRMED",  label: "Confirmed",  color: "bg-green-500/15 text-green-400 border-green-500/30" },
  { value: "REJECTED",   label: "Rejected",   color: "bg-red-500/15 text-red-400 border-red-500/30" },
];

interface Sponsor {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  industry: string;
  status: string;
  amount: number;
  assignedTo: string;
  lastContact: string;
  notes: string;
}

const INITIAL_SPONSORS: Sponsor[] = [
  { id: "1", company: "TechCorp India",  contact: "Ravi Sharma",   email: "ravi@techcorp.in",    phone: "9876543210", industry: "Technology",  status: "CONFIRMED",  amount: 150000, assignedTo: "Priya",    lastContact: "2025-06-10", notes: "Title sponsor confirmed. Invoice sent." },
  { id: "2", company: "Zomato",          contact: "Ananya Patel",  email: "ananya@zomato.com",   phone: "9123456789", industry: "Food Tech",   status: "INTERESTED", amount: 75000,  assignedTo: "Raj",      lastContact: "2025-06-12", notes: "Interested in stall space + social shoutouts." },
  { id: "3", company: "HDFC Bank",       contact: "Suresh Nair",   email: "suresh@hdfc.com",     phone: "9988776655", industry: "Banking",     status: "CONTACTED",  amount: 200000, assignedTo: "Meera",    lastContact: "2025-06-08", notes: "Need follow-up call this week." },
  { id: "4", company: "Amul",            contact: "Girish Dave",   email: "girish@amul.coop",    phone: "9765432100", industry: "FMCG",        status: "CONTACTED",  amount: 50000,  assignedTo: "Priya",    lastContact: "2025-06-14", notes: "Waiting for their marketing head response." },
  { id: "5", company: "Jio Platforms",   contact: "Neha Kapoor",   email: "neha@jio.com",        phone: "9900112233", industry: "Telecom",     status: "INTERESTED", amount: 100000, assignedTo: "Raj",      lastContact: "2025-06-15", notes: "Loves the footfall numbers. Needs proposal." },
  { id: "6", company: "Myntra",          contact: "Kiran Bhat",    email: "kiran@myntra.com",    phone: "9456789012", industry: "E-Commerce",  status: "REJECTED",   amount: 0,      assignedTo: "Meera",    lastContact: "2025-06-05", notes: "Budget freeze this quarter." },
];

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>(INITIAL_SPONSORS);
  const [filter, setFilter] = useState("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Partial<Sponsor>>({});

  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    CONFIRMED:  { label: "Confirmed",  color: "bg-green-500/15 text-green-400 border-green-500/30",  dot: "bg-green-400" },
    INTERESTED: { label: "Interested", color: "bg-blue-500/15 text-blue-400 border-blue-500/30",    dot: "bg-blue-400" },
    CONTACTED:  { label: "Contacted",  color: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
    REJECTED:   { label: "Rejected",   color: "bg-red-500/15 text-red-400 border-red-500/30",       dot: "bg-red-400" },
  };

  const filtered = sponsors.filter(s => {
    const matchFilter = filter === "ALL" || s.status === filter;
    const matchSearch = !search || 
      s.company.toLowerCase().includes(search.toLowerCase()) ||
      s.contact.toLowerCase().includes(search.toLowerCase()) ||
      s.industry.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  function openAdd() { setForm({ status: "CONTACTED", assignedTo: MEMBERS[0], amount: 0 }); setShowAdd(true); setEditId(null); }
  function openEdit(s: Sponsor) { setForm({ ...s }); setEditId(s.id); setShowAdd(true); }
  function closeModal() { setShowAdd(false); setEditId(null); setForm({}); }

  function saveForm() {
    if (!form.company || !form.contact || !form.email) { toast.error("Company, contact and email are required"); return; }
    if (editId) {
      setSponsors(prev => prev.map(s => s.id === editId ? { ...s, ...form } as Sponsor : s));
      toast.success("Sponsor updated!");
    } else {
      const newSponsor: Sponsor = { ...form, id: Date.now().toString(), lastContact: new Date().toISOString().slice(0, 10) } as Sponsor;
      setSponsors(prev => [newSponsor, ...prev]);
      toast.success("Sponsor added!");
    }
    closeModal();
  }

  function deleteSponsor(id: string) {
    setSponsors(prev => prev.filter(s => s.id !== id));
    toast.success("Sponsor removed");
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🏢 Sponsors</h1>
          <p className="text-foreground-muted text-sm mt-1">{sponsors.length} companies tracked · {sponsors.filter(s => s.status === "CONFIRMED").length} confirmed</p>
        </div>
        <button
          onClick={openAdd}
          className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 hover:scale-105 transition-all"
        >
          + Add Sponsor
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

      {/* Table */}
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
                    No sponsors found. <button onClick={openAdd} className="text-brand-400 hover:underline font-semibold">Add one →</button>
                  </td>
                </tr>
              )}
              {filtered.map(s => {
                const sc = statusConfig[s.status];
                return (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-background transition-colors group">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{s.company}</div>
                      <div className="text-xs text-foreground-muted">{s.notes?.slice(0, 40)}{s.notes?.length > 40 ? "…" : ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground text-xs font-medium">{s.contact}</div>
                      <div className="text-foreground-muted text-xs">{s.email}</div>
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
                      <span className="text-xs bg-brand-500/10 text-brand-400 px-2 py-1 rounded-lg font-semibold">{s.assignedTo}</span>
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

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background-secondary border border-border rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editId ? "Edit Sponsor" : "Add Sponsor"}</h2>
              <button onClick={closeModal} className="text-foreground-muted hover:text-foreground text-xl transition-colors">✕</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Company Name *</label>
                <input value={form.company || ""} onChange={e => setForm(f => ({...f, company: e.target.value}))} placeholder="e.g. Zomato" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Contact Person *</label>
                <input value={form.contact || ""} onChange={e => setForm(f => ({...f, contact: e.target.value}))} placeholder="Full name" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Industry</label>
                <input value={form.industry || ""} onChange={e => setForm(f => ({...f, industry: e.target.value}))} placeholder="e.g. Food Tech" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input type="email" value={form.email || ""} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="contact@company.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input value={form.phone || ""} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="9876543210" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select value={form.status || "CONTACTED"} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={inputClass}>
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Amount (₹)</label>
                <input type="number" value={form.amount || 0} onChange={e => setForm(f => ({...f, amount: Number(e.target.value)}))} placeholder="100000" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Assigned To</label>
                <select value={form.assignedTo || MEMBERS[0]} onChange={e => setForm(f => ({...f, assignedTo: e.target.value}))} className={inputClass}>
                  {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Last Contact Date</label>
                <input type="date" value={form.lastContact || ""} onChange={e => setForm(f => ({...f, lastContact: e.target.value}))} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Notes</label>
                <textarea value={form.notes || ""} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={3} placeholder="Follow-up notes, interests, next steps…" className={inputClass} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground-muted text-sm font-semibold hover:bg-background transition-all">Cancel</button>
              <button onClick={saveForm} className="flex-1 btn-shine gradient-brand text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 hover:scale-105 transition-all">
                {editId ? "Save Changes" : "Add Sponsor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
