"use client";

import { useState } from "react";

const MOCK_PAYMENTS = [
  { id: "1", company: "TechCorp India",  tier: "Title Sponsor",     amount: 150000, status: "PAID",    date: "2025-06-10", mode: "NEFT",     receipt: "RCP-001" },
  { id: "2", company: "Jio Platforms",   tier: "Co-Sponsor",        amount: 100000, status: "PENDING", date: "2025-06-15", mode: "Cheque",   receipt: "" },
  { id: "3", company: "Zomato",          tier: "Associate Sponsor",  amount: 75000,  status: "PENDING", date: "2025-06-12", mode: "UPI",      receipt: "" },
  { id: "4", company: "HDFC Bank",       tier: "Title Sponsor",     amount: 200000, status: "INVOICE", date: "2025-06-08", mode: "NEFT",     receipt: "" },
  { id: "5", company: "Amul",            tier: "Stall Sponsor",     amount: 50000,  status: "PAID",    date: "2025-06-14", mode: "UPI",      receipt: "RCP-002" },
];

const TARGET = 750000;

export default function MoneyPage() {
  const [payments, setPayments] = useState(MOCK_PAYMENTS);

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

  function markPaid(id: string) {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: "PAID", receipt: `RCP-00${Date.now().toString().slice(-3)}` } : p));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">💰 Money Tracker</h1>
        <p className="text-foreground-muted text-sm mt-1">Track confirmed amounts, payment status, and your overall funding progress.</p>
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
            style={{ width: `${progress}%` }}
          >
            <span className="text-[11px] font-bold text-white">₹{(totalPaid/1000).toFixed(0)}K</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-foreground-muted mt-2">
          <span>₹0</span>
          <span>₹{(totalTarget/1000).toFixed(0)}K target</span>
        </div>
      </div>

      {/* Payment Table */}
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
                    {p.status !== "PAID" && (
                      <button
                        onClick={() => markPaid(p.id)}
                        className="text-xs text-green-400 hover:text-green-300 font-semibold px-3 py-1 rounded-lg hover:bg-green-500/10 border border-green-500/30 transition-all"
                      >
                        Mark Paid ✓
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GST Summary */}
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
    </div>
  );
}
