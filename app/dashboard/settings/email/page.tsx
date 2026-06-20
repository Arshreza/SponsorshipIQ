"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Provider = "GMAIL" | "SMTP";

interface EmailAccount {
  id: string;
  emailAddress: string;
  displayName: string | null;
  provider: Provider;
  dailyLimit: number;
  sentToday: number;
  status: "CONNECTED" | "ERROR" | "DISCONNECTED";
  lastError: string | null;
  isActive: boolean;
  createdAt: string;
}

function EmailSettingsContent() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const [provider, setProvider] = useState<Provider>("GMAIL");
  const [displayName, setDisplayName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [gmailAppPassword, setGmailAppPassword] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");

  const router = useRouter();

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/email");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      } else {
        toast.error("Failed to load email accounts");
      }
    } catch {
      toast.error("Network error loading email accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  function resetForm() {
    setProvider("GMAIL");
    setDisplayName("");
    setEmailAddress("");
    setGmailAppPassword("");
    setSmtpHost("");
    setSmtpPort("587");
    setSmtpUsername("");
    setSmtpPassword("");
  }

  async function handleSave() {
    if (!emailAddress.trim()) { toast.error("Email address is required"); return; }
    if (provider === "GMAIL" && !gmailAppPassword.trim()) { toast.error("Google App Password is required"); return; }
    if (provider === "SMTP" && (!smtpHost.trim() || !smtpPassword.trim())) { toast.error("SMTP host and password are required"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          emailAddress: emailAddress.trim(),
          provider,
          gmailAppPassword: provider === "GMAIL" ? gmailAppPassword.trim() : undefined,
          smtpHost: provider === "SMTP" ? smtpHost.trim() : undefined,
          smtpPort: provider === "SMTP" ? Number(smtpPort) : undefined,
          smtpUsername: provider === "SMTP" ? (smtpUsername.trim() || emailAddress.trim()) : undefined,
          smtpPassword: provider === "SMTP" ? smtpPassword.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Email account connected successfully!");
        setShowForm(false);
        resetForm();
        loadAccounts();
      } else {
        toast.error(data.error || "Failed to save account");
      }
    } catch {
      toast.error("Network error saving account");
    } finally {
      setSaving(false);
    }
  }

  async function removeAccount(id: string, email: string) {
    if (!confirm(`Disconnect and remove ${email}? This will pause campaigns using this account.`)) return;
    setDisconnectingId(id);
    try {
      const res = await fetch(`/api/settings/email?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Account disconnected");
        setAccounts(accounts.filter((a) => a.id !== id));
      } else {
        toast.error("Failed to disconnect account");
      }
    } catch {
      toast.error("Network error disconnecting account");
    } finally {
      setDisconnectingId(null);
    }
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Email Accounts</h1>
            <p className="text-foreground-muted text-sm mt-1">Connect your inboxes to start sending outreach.</p>
          </div>
          <button
            onClick={() => { setShowForm(false); resetForm(); }}
            className="px-4 py-2 rounded-xl bg-background-secondary border border-border text-foreground text-sm font-semibold hover:bg-background transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-background-secondary border border-border rounded-2xl p-6 space-y-6">
          <h2 className="text-base font-bold text-foreground">Connect a New Mailbox</h2>

          <hr className="border-border" />

          {/* Connection Type */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Connection Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setProvider("GMAIL")}
                className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                  provider === "GMAIL"
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-border bg-background hover:border-border/80"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${provider === "GMAIL" ? "text-red-400" : "text-foreground-muted"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span className={`text-sm font-semibold ${provider === "GMAIL" ? "text-foreground" : "text-foreground-muted"}`}>Google / Gmail</span>
              </button>

              <button
                onClick={() => setProvider("SMTP")}
                className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                  provider === "SMTP"
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-border bg-background hover:border-border/80"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${provider === "SMTP" ? "text-brand-400" : "text-foreground-muted"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                <span className={`text-sm font-semibold ${provider === "SMTP" ? "text-foreground" : "text-foreground-muted"}`}>SMTP / SendGrid</span>
              </button>
            </div>
          </div>

          {/* Name + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Sender Name (Display Name)</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Email Address</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
          </div>

          {/* Gmail App Password */}
          {provider === "GMAIL" && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Google App Password</label>
              <input
                type="password"
                value={gmailAppPassword}
                onChange={(e) => setGmailAppPassword(e.target.value)}
                placeholder="16-character app password"
                maxLength={19}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
              <p className="text-xs text-foreground-muted mt-2">
                Enable 2-Step Verification in Google, then generate an App Password.{" "}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:underline"
                >
                  Open Google App Passwords →
                </a>{" "}
                Do not use your normal account password.
              </p>
            </div>
          )}

          {/* SMTP Fields */}
          {provider === "SMTP" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.sendgrid.net"
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Port</label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="587"
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Username</label>
                  <input
                    type="text"
                    value={smtpUsername}
                    onChange={(e) => setSmtpUsername(e.target.value)}
                    placeholder="apikey or username"
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Password / API Key</label>
                  <input
                    type="password"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Connecting…" : "Connect Mailbox"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Accounts</h1>
          <p className="text-foreground-muted text-sm mt-1">Connect your inboxes to start sending outreach.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
        >
          + Connect Mailbox
        </button>
      </div>

      {/* Connected Accounts List */}
      <div className="bg-background-secondary border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Connected Senders</h2>
          <span className="text-xs text-foreground-muted">{accounts.length} account(s)</span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-foreground-muted text-sm">Loading accounts…</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-12 text-center text-foreground-muted text-sm space-y-3">
            <div className="text-3xl">📭</div>
            <div className="font-semibold text-foreground">No mailboxes connected yet</div>
            <p className="text-xs max-w-sm mx-auto">
              Connect a Gmail account using a Google App Password to start sending personalized pitches.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
            >
              + Connect Mailbox
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Email Address</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Daily Limit</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Sent Today</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-foreground-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} className="border-b border-border/50 hover:bg-background transition-colors">
                    <td className="px-5 py-4 font-semibold text-foreground">
                      <div>{acc.emailAddress}</div>
                      {acc.displayName && (
                        <div className="text-xs text-foreground-muted font-normal mt-0.5">{acc.displayName}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-foreground-muted text-xs uppercase font-mono">{acc.provider}</td>
                    <td className="px-5 py-4 text-foreground text-xs">{acc.dailyLimit} emails</td>
                    <td className="px-5 py-4 text-foreground text-xs">{acc.sentToday} / {acc.dailyLimit}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        acc.status === "CONNECTED"
                          ? "bg-green-500/15 text-green-400 border-green-500/30"
                          : "bg-red-500/15 text-red-400 border-red-500/30"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${acc.status === "CONNECTED" ? "bg-green-400" : "bg-red-400"}`} />
                        {acc.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        disabled={disconnectingId === acc.id}
                        onClick={() => removeAccount(acc.id, acc.emailAddress)}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-all disabled:opacity-50"
                      >
                        {disconnectingId === acc.id ? "Removing…" : "Disconnect"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmailSettingsPage() {
  return (
    <Suspense fallback={
      <div className="py-12 text-center">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-foreground-muted text-sm">Loading email settings…</p>
      </div>
    }>
      <EmailSettingsContent />
    </Suspense>
  );
}
