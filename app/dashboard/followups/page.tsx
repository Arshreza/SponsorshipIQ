"use client";

import { useState } from "react";
import { toast } from "sonner";

const MEMBERS = ["Priya", "Raj", "Meera", "Arjun", "Divya", "Siddharth"];

const NEXT_ACTIONS = [
  "Send cold email",
  "Call / WhatsApp",
  "Send proposal PDF",
  "Follow up on proposal",
  "Schedule meeting",
  "Send invoice",
  "Collect payment",
  "Send thank you",
];

interface FollowUp {
  id: string;
  company: string;
  contact: string;
  assignedTo: string;
  lastContact: string;
  nextAction: string;
  nextDate: string;
  status: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  notes: string;
}

const INITIAL: FollowUp[] = [
  { id: "1", company: "HDFC Bank",     contact: "Suresh Nair",  assignedTo: "Meera", lastContact: "2025-06-08", nextAction: "Call / WhatsApp",      nextDate: "2025-06-20", status: "CONTACTED",  priority: "HIGH",   notes: "Marketing head not available. Try again Monday morning." },
  { id: "2", company: "Zomato",        contact: "Ananya Patel", assignedTo: "Raj",   lastContact: "2025-06-12", nextAction: "Send proposal PDF",     nextDate: "2025-06-18", status: "INTERESTED", priority: "HIGH",   notes: "Loves stall concept. Send them the full proposal today." },
  { id: "3", company: "Amul",          contact: "Girish Dave",  assignedTo: "Priya", lastContact: "2025-06-14", nextAction: "Follow up on proposal", nextDate: "2025-06-21", status: "CONTACTED",  priority: "MEDIUM", notes: "Proposal sent. Waiting for their internal approval." },
  { id: "4", company: "Jio Platforms", contact: "Neha Kapoor",  assignedTo: "Raj",   lastContact: "2025-06-15", nextAction: "Schedule meeting",      nextDate: "2025-06-19", status: "INTERESTED", priority: "HIGH",   notes: "Very interested. Set up a face-to-face call ASAP." },
];

const PRIORITY_CONFIG = {
  HIGH:   { color: "bg-red-500/15 text-red-400 border-red-500/30",    dot: "bg-red-400" },
  MEDIUM: { color: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  LOW:    { color: "bg-green-500/15 text-green-400 border-green-500/30", dot: "bg-green-400" },
};

export default function FollowupsPage() {
  const [items, setItems] = useState<FollowUp[]>(INITIAL);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<FollowUp>>({});
  const [filterMember, setFilterMember] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");

  const filtered = items.filter(i => {
    const m = filterMember === "ALL" || i.assignedTo === filterMember;
    const p = filterPriority === "ALL" || i.priority === filterPriority;
    return m && p;
  });

  function openAdd() {
    setForm({ priority: "MEDIUM", assignedTo: MEMBERS[0], nextAction: NEXT_ACTIONS[0], lastContact: new Date().toISOString().slice(0, 10) });
    setShowAdd(true); setEditId(null);
  }
  function openEdit(item: FollowUp) { setForm({ ...item }); setEditId(item.id); setShowAdd(true); }
  function closeModal() { setShowAdd(false); setEditId(null); setForm({}); }

  function save() {
    if (!form.company || !form.contact) { toast.error("Company and contact are required"); return; }
    if (editId) {
      setItems(prev => prev.map(i => i.id === editId ? { ...i, ...form } as FollowUp : i));
      toast.success("Follow-up updated!");
    } else {
      setItems(prev => [{ ...form, id: Date.now().toString() } as FollowUp, ...prev]);
      toast.success("Follow-up added!");
    }
    closeModal();
  }

  function markDone(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success("Marked done! 🎉");
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5";

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📋 Follow-up Tracker</h1>
          <p className="text-foreground-muted text-sm mt-1">
            {items.length} active follow-ups · {items.filter(i => i.nextDate <= today).length} due today or overdue
          </p>
        </div>
        <button
          onClick={openAdd}
          className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 hover:scale-105 transition-all"
        >
          + Add Follow-up
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterMember}
          onChange={e => setFilterMember(e.target.value)}
          className="bg-background-secondary border border-border text-foreground text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          <option value="ALL">All Members</option>
          {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {["ALL", "HIGH", "MEDIUM", "LOW"].map(p => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              filterPriority === p
                ? "gradient-brand text-white border-transparent shadow-lg"
                : "bg-background-secondary border-border text-foreground-muted hover:border-brand-500/40"
            }`}
          >
            {p === "ALL" ? "All Priority" : `${p} Priority`}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-foreground-muted">
            No follow-ups found. <button onClick={openAdd} className="text-brand-400 hover:underline font-semibold">Add one →</button>
          </div>
        )}
        {filtered.map(item => {
          const pc = PRIORITY_CONFIG[item.priority];
          const isOverdue = item.nextDate < today;
          const isDueToday = item.nextDate === today;
          return (
            <div
              key={item.id}
              className={`bg-background-secondary border rounded-2xl p-5 spotlight-card transition-all ${
                isOverdue ? "border-red-500/40" : isDueToday ? "border-amber-500/40" : "border-border hover:border-brand-500/30"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-foreground">{item.company}</h3>
                  <p className="text-xs text-foreground-muted">{item.contact}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${pc.color}`}>
                  {item.priority}
                </span>
              </div>

              <div className="space-y-2 text-xs text-foreground-muted mb-4">
                <div className="flex items-center gap-2">
                  <span>👤</span>
                  <span>Assigned to <strong className="text-foreground">{item.assignedTo}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>Last contact: {item.lastContact}</span>
                </div>
                <div className={`flex items-center gap-2 font-semibold ${isOverdue ? "text-red-400" : isDueToday ? "text-amber-400" : "text-foreground-muted"}`}>
                  <span>{isOverdue ? "🚨" : isDueToday ? "⚠️" : "🗓️"}</span>
                  <span>Next: {item.nextDate} {isOverdue ? "(OVERDUE)" : isDueToday ? "(TODAY)" : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <span className="text-brand-400 font-semibold">{item.nextAction}</span>
                </div>
              </div>

              {item.notes && (
                <p className="text-xs text-foreground-muted bg-background rounded-xl px-3 py-2 mb-4 italic">
                  "{item.notes}"
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(item)}
                  className="flex-1 text-xs text-brand-400 font-semibold py-2 rounded-xl border border-brand-500/30 hover:bg-brand-500/10 transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => markDone(item.id)}
                  className="flex-1 text-xs text-green-400 font-semibold py-2 rounded-xl border border-green-500/30 hover:bg-green-500/10 transition-all"
                >
                  ✓ Done
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background-secondary border border-border rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editId ? "Edit Follow-up" : "Add Follow-up"}</h2>
              <button onClick={closeModal} className="text-foreground-muted hover:text-foreground text-xl">✕</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Company *</label>
                <input value={form.company || ""} onChange={e => setForm(f => ({...f, company: e.target.value}))} placeholder="Company name" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Contact Person *</label>
                <input value={form.contact || ""} onChange={e => setForm(f => ({...f, contact: e.target.value}))} placeholder="Full name" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Assigned To</label>
                <select value={form.assignedTo || MEMBERS[0]} onChange={e => setForm(f => ({...f, assignedTo: e.target.value}))} className={inputClass}>
                  {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <select value={form.priority || "MEDIUM"} onChange={e => setForm(f => ({...f, priority: e.target.value as "HIGH"|"MEDIUM"|"LOW"}))} className={inputClass}>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Last Contact Date</label>
                <input type="date" value={form.lastContact || ""} onChange={e => setForm(f => ({...f, lastContact: e.target.value}))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Next Follow-up Date</label>
                <input type="date" value={form.nextDate || ""} onChange={e => setForm(f => ({...f, nextDate: e.target.value}))} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Next Action</label>
                <select value={form.nextAction || NEXT_ACTIONS[0]} onChange={e => setForm(f => ({...f, nextAction: e.target.value}))} className={inputClass}>
                  {NEXT_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Notes</label>
                <textarea value={form.notes || ""} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={3} placeholder="What happened in last call? What to discuss next?" className={inputClass} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground-muted text-sm font-semibold hover:bg-background transition-all">Cancel</button>
              <button onClick={save} className="flex-1 btn-shine gradient-brand text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 hover:scale-105 transition-all">
                {editId ? "Save Changes" : "Add Follow-up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
