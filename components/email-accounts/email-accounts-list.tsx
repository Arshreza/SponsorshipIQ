"use client";

import { useState } from "react";
import { toast } from "sonner";

type Account = {
  id: string;
  emailAddress: string;
  displayName?: string | null;
  provider: string;
  status: string;
  dailyLimit: number;
  sentToday: number;
  createdAt: Date;
};

export function EmailAccountsList({ accounts: initialAccounts }: { accounts: Account[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    emailAddress: "",
    provider: "GMAIL",
    gmailAppPassword: "",
    smtpHost: "",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: "",
    dailyLimit: "50",
  });
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/email-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      const newAccount = await res.json();
      setAccounts([newAccount, ...accounts]);
      setShowForm(false);
      toast.success("Email account connected!");
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed to connect account");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/email-accounts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAccounts(accounts.filter((a) => a.id !== id));
      toast.success("Account removed");
    } else toast.error("Failed to remove account");
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";

  return (
    <div className="space-y-5">
      {accounts.length === 0 && !showForm && (
        <div className="bg-background-secondary border border-border rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📬</div>
          <h3 className="text-lg font-bold text-foreground mb-2">No email accounts connected</h3>
          <p className="text-foreground-muted text-sm mb-6 max-w-sm mx-auto">
            Connect your Gmail account using an App Password to send sponsorship emails directly from SponsorshipIQ.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm">
            Connect Gmail
          </button>
        </div>
      )}

      {accounts.map((a) => (
        <div key={a.id} className="bg-background-secondary border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
            {a.emailAddress[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground truncate">{a.displayName || a.emailAddress}</div>
            <div className="text-xs text-foreground-muted">{a.emailAddress} · {a.provider}</div>
            <div className="text-xs text-foreground-muted mt-0.5">{a.sentToday}/{a.dailyLimit} emails today</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`status-badge ${a.status === 'CONNECTED' ? 'status-interested' : 'status-rejected'}`}>
              {a.status.toLowerCase()}
            </span>
            <button
              onClick={() => handleDelete(a.id)}
              className="text-xs text-foreground-muted hover:text-error-500 transition-colors font-semibold"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-semibold text-brand-600 hover:text-brand-500 border border-dashed border-brand-300 hover:border-brand-400 w-full py-3 rounded-2xl transition-all"
        >
          + Connect another account
        </button>
      ) : (
        <div className="bg-background-secondary border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-5 text-sm">Connect Email Account</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5">Display Name</label>
                <input value={form.displayName} onChange={(e) => setForm({...form, displayName: e.target.value})} placeholder="Synapse Sponsorship Team" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5">Email Address *</label>
                <input required type="email" value={form.emailAddress} onChange={(e) => setForm({...form, emailAddress: e.target.value})} placeholder="synapse@dau.ac.in" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5">Provider</label>
                <select value={form.provider} onChange={(e) => setForm({...form, provider: e.target.value})} className={inputClass}>
                  <option value="GMAIL">Gmail (App Password)</option>
                  <option value="SMTP">Custom SMTP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5">Daily Limit</label>
                <input type="number" value={form.dailyLimit} onChange={(e) => setForm({...form, dailyLimit: e.target.value})} className={inputClass} />
              </div>
              {form.provider === "GMAIL" ? (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5">Gmail App Password *</label>
                  <input required type="password" value={form.gmailAppPassword} onChange={(e) => setForm({...form, gmailAppPassword: e.target.value})} placeholder="xxxx xxxx xxxx xxxx" className={inputClass} />
                  <p className="text-xs text-foreground-muted mt-1">Generate at Google Account → Security → 2-Step Verification → App Passwords</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5">SMTP Host</label>
                    <input value={form.smtpHost} onChange={(e) => setForm({...form, smtpHost: e.target.value})} placeholder="smtp.gmail.com" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5">SMTP Port</label>
                    <input value={form.smtpPort} onChange={(e) => setForm({...form, smtpPort: e.target.value})} placeholder="587" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5">Username</label>
                    <input value={form.smtpUsername} onChange={(e) => setForm({...form, smtpUsername: e.target.value})} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5">Password</label>
                    <input type="password" value={form.smtpPassword} onChange={(e) => setForm({...form, smtpPassword: e.target.value})} className={inputClass} />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="text-sm font-semibold text-foreground-muted hover:text-foreground border border-border px-5 py-2.5 rounded-xl transition-all">Cancel</button>
              <button type="submit" disabled={loading} className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60">
                {loading ? "Connecting…" : "Connect & Verify"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
