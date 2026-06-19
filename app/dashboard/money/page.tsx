"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface Payment {
  id: string;
  company: string;
  tier: string;
  amount: number;
  status: "PAID" | "PENDING" | "INVOICE";
  date: string;
  mode: string;
  receipt: string;
}

const TIER_OPTIONS = [
  "Title Sponsor",
  "Co-Sponsor",
  "Associate Sponsor",
  "Stall Sponsor",
  "Digital Sponsor",
  "Other",
];

const MODE_OPTIONS = ["NEFT", "UPI", "Cheque", "RTGS", "Bank Transfer", "Cash"];

const TARGET = 750000;

const emptyForm: Omit<Payment, "id"> = {
  company: "",
  tier: "Title Sponsor",
  amount: 0,
  status: "PENDING",
  date: new Date().toISOString().slice(0, 10),
  mode: "NEFT",
  receipt: "",
};

export default function MoneyPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Omit<Payment, "id">>(emptyForm);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/money");
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      } else {
        toast.error("Failed to load payments");
      }
    } catch {
      toast.error("Network error loading payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  async function persistPayments(newPayments: Payment[]) {
    setSaving(true);
    try {
      const res = await fetch("/api/money", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPayments),
      });
      if (!res.ok) toast.error("Failed to save changes");
    } catch {
      toast.error("Network error saving payments");
    } finally {
      setSaving(false);
    }
  }

  const totalTarget    = TARGET;
  const totalPaid      = payments.filter(p => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const totalPending   = payments.filter(p => p.status !== "PAID").reduce((s, p) => s + p.amount, 0);
  const totalConfirmed = payments.reduce((s, p) => s + p.amount, 0);
  const progress       = Math.min(Math.round((totalPaid / totalTarget) * 100), 100);

  const statusConfig: Record<string, string> = {
    PAID:    "bg-green-500/15 text-green-400 border-green-500/30",
    PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    INVOICE: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };

  async function markPaid(id: string) {
    const newPayments = payments.map(p =>
      p.id === id ? { ...p, status: "PAID" as const, receipt: `RCP-${Date.now().toString().slice(-4)}` } : p
    );
    setPayments(newPayments);
    toast.success("Marked as paid ✅");
    await persistPayments(newPayments);
  }

  async function addPayment() {
    if (!form.company || form.amount <= 0) {
      toast.error("Company and a valid amount are required");
      return;
    }
    const newPayment: Payment = { ...form, id: Date.now().toString() };
    const newPayments = [newPayment, ...payments];
    setPayments(newPayments);
    toast.success("Payment entry added!");
    setShowAdd(false);
    setForm(emptyForm);
    await persistPayments(newPayments);
  }

  async function removePayment(id: string) {
    if (!confirm("Remove this payment entry?")) return;
    const newPayments = payments.filter(p => p.id !== id);
    setPayments(newPayments);
    toast.success("Entry removed");
    await persistPayments(newPayments);
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">💰 Money Tracker</h1>
          <p className="text-foreground-muted text-sm mt-1">
            Track confirmed amounts, payment status, and your overall funding progress.
            {saving && <span className="ml-2 text-brand-400 animate-pulse">· Saving…</span>}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/25 hover:scale-105 transition-all"
        >
          + Add Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Raised",     value: `₹${(totalPaid/1000).toFixed(0)}K`,      icon: "✅", color: "text-green-400" },
          { label: "Pending / Invoice", value: `₹${(totalPending/1000).toFixed(0)}K`,   icon: "⏳", color: "text-amber-400" },
          { label: "Total Confirmed",   value: `₹${(totalConfirmed/1000).toFixed(0)}K`, icon: "🏆", color: "text-brand-400" },
          { label: "Target",            value: `₹${(totalTarget/1000).toFixed(0)}K`,   icon: "🎯", color: "text-purple-400" },
        ].map((c, i) => (
          <div key={i} className="bg-background-secondary border border-border rounded-2xl p-5 spotlight-card">
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className={`text-2xl font-extrabold ${c.color}`}>{c.value}</div>
            <div className="text-xs text-foreground-muted mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="bg-background-secondary border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">🎯 Target Progress</h2>
          <span className="text-sm font-bold text-brand-400">{progress}% of ₹{(totalTarget/1000).toFixed(0)}K collected</span>
        </div>
        <div className="w-full bg-background rounded-full h-5 overflow-hidden">
          <div
            className="h-full gradient-brand rounded-full transition-all duration-700 flex items-center justify-end pr-3"
            style={{ width: `${Math.max(progress, 4)}%` }}
          >
            <span className="text-[11px] font-bold text-white">₹{(totalPaid/1000).toFixed(0)}K</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-foreground-muted mt-2">
          <span>₹0</span>
          <span>₹{(totalTarget/1000).toFixed(0)}K target</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-background-secondary border border-border rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-foreground-muted text-sm">Loading payment data…</p>
        </div>
      )}

      {/* Payment Table */}
      {!loading && (
        <div className="bg-background-secondary border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">📋 Payment Ledger</h2>
            <span className="text-xs text-foreground-muted">{payments.length} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Company", "Sponsorship Tier", "Amount", "Status", "Mode", "Date", "Receipt", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-foreground-muted text-sm">
                      No payment entries yet.{" "}
                      <button onClick={() => setShowAdd(true)} className="text-brand-400 hover:underline font-semibold">Add one →</button>
                    </td>
                  </tr>
                )}
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-background transition-colors group">
                    <td className="px-4 py-3 font-semibold text-foreground">{p.company}</td>
                    <td className="px-4 py-3 text-foreground-muted text-xs">{p.tier}</td>
                    <td className="px-4 py-3 font-bold text-foreground">₹{p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusConfig[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted text-xs">{p.mode}</td>
                    <td className="px-4 py-3 text-foreground-muted text-xs">{p.date}</td>
                    <td className="px-4 py-3 text-xs">
                      {p.receipt ? (
                        <span className="text-green-400 font-mono">{p.receipt}</span>
                      ) : (
                        <span className="text-foreground-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {p.status !== "PAID" && (
                          <button
                            onClick={() => markPaid(p.id)}
                            className="text-xs text-green-400 hover:text-green-300 font-semibold px-3 py-1 rounded-lg hover:bg-green-500/10 border border-green-500/30 transition-all"
                          >
                            Mark Paid ✓
                          </button>
                        )}
                        <button
                          onClick={() => removePayment(p.id)}
                          className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded-lg hover:bg-red-500/10 border border-red-500/30 transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GST Summary */}
      {!loading && payments.length > 0 && (
        <div className="bg-background-secondary border border-border rounded-2xl p-6 grid sm:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-extrabold text-foreground">₹{(totalPaid * 0.18).toFixed(0)}</div>
            <div className="text-xs text-foreground-muted mt-1">GST @18% on Paid</div>
          </div>
          <div>
            <div className="text-lg font-extrabold text-foreground">₹{(totalPaid + totalPaid * 0.18).toFixed(0)}</div>
            <div className="text-xs text-foreground-muted mt-1">Total with GST (Paid)</div>
          </div>
          <div>
            <div className="text-lg font-extrabold text-foreground">{payments.filter(p => p.status === "PAID").length}/{payments.length}</div>
            <div className="text-xs text-foreground-muted mt-1">Payments Collected</div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background-secondary border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Add Payment Entry</h2>
              <button onClick={() => { setShowAdd(false); setForm(emptyForm); }} className="text-foreground-muted hover:text-foreground text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Company *</label>
                <input value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} placeholder="e.g. Zomato" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Tier</label>
                  <select value={form.tier} onChange={e => setForm(f => ({...f, tier: e.target.value}))} className={inputClass}>
                    {TIER_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Amount (₹) *</label>
                  <input type="number" value={form.amount || ""} onChange={e => setForm(f => ({...f, amount: Number(e.target.value)}))} placeholder="100000" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value as Payment["status"]}))} className={inputClass}>
                    <option value="PENDING">Pending</option>
                    <option value="INVOICE">Invoice Sent</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Payment Mode</label>
                  <select value={form.mode} onChange={e => setForm(f => ({...f, mode: e.target.value}))} className={inputClass}>
                    {MODE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Receipt No.</label>
                  <input value={form.receipt} onChange={e => setForm(f => ({...f, receipt: e.target.value}))} placeholder="RCP-001" className={inputClass} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowAdd(false); setForm(emptyForm); }} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground-muted text-sm font-semibold hover:bg-background transition-all">Cancel</button>
              <button onClick={addPayment} className="flex-1 btn-shine gradient-brand text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 hover:scale-105 transition-all">
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
