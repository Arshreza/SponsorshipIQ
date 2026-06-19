"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface EmailAccount {
  id: string;
  emailAddress: string;
  displayName: string | null;
  provider: "GMAIL" | "SMTP";
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
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
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

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true") {
      toast.success("Google account connected successfully! 🎉");
      // Clear parameters
      router.replace("/dashboard/settings/email");
      loadAccounts();
    } else if (error) {
      toast.error(`Failed to connect: ${error.replace(/_/g, " ")}`);
      router.replace("/dashboard/settings/email");
    }
  }, [searchParams, router, loadAccounts]);

  async function removeAccount(id: string, email: string) {
    if (!confirm(`Disconnect and remove ${email}? This will pause campaigns using this account.`)) return;
    setDisconnectingId(id);
    try {
      const res = await fetch(`/api/settings/email?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Account disconnected");
        setAccounts(accounts.filter(a => a.id !== id));
      } else {
        toast.error("Failed to disconnect account");
      }
    } catch {
      toast.error("Network error disconnecting account");
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">⚙️ Email Settings</h1>
        <p className="text-foreground-muted text-sm mt-1">
          Connect and manage Google accounts to send personalized cold emails autonomously.
        </p>
      </div>

      {/* Integration Info Card */}
      <div className="bg-background-secondary border border-border rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
          <span>📧</span> Google OAuth Integration Details
        </h2>
        <div className="space-y-3 text-xs text-foreground-muted max-w-3xl leading-relaxed">
          <p>
            To send emails on your behalf, this app requests the <code className="bg-background border border-border px-1.5 py-0.5 rounded text-brand-400">gmail.send</code> scope. 
            This allows us to send drafts and final pitches directly from your Google account.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <span className="font-bold block">Developer Mode Fallback Active</span>
              If you haven't configured a Google OAuth App in your <code className="bg-black/20 px-1 py-0.5 rounded text-foreground">.env</code> file, clicking "Connect Google Account" will immediately connect a <strong>Mock Account</strong> for testing campaign creation and cold emailing.
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <a
            href="/api/auth/google-gmail"
            className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-brand-500/25 hover:scale-105 transition-all inline-flex items-center gap-2"
          >
            <span>🔗</span> Connect Google Account
          </a>
        </div>
      </div>

      {/* Connected Accounts List */}
      <div className="bg-background-secondary border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">📋 Connected Senders</h2>
          <span className="text-xs text-foreground-muted">{accounts.length} account(s)</span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-foreground-muted text-sm">Loading accounts…</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-12 text-center text-foreground-muted text-sm space-y-2">
            <div>No Google accounts connected yet.</div>
            <p className="text-xs text-foreground-muted max-w-sm mx-auto">
              You need at least one connected email account to launch autonomous campaigns and send pitches.
            </p>
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
                {accounts.map(acc => {
                  const isMock = acc.emailAddress === "coordinator.pr@gmail.com";
                  return (
                    <tr key={acc.id} className="border-b border-border/50 hover:bg-background transition-colors">
                      <td className="px-5 py-4 font-semibold text-foreground flex flex-col">
                        <span>{acc.emailAddress}</span>
                        {isMock && (
                          <span className="text-[10px] text-amber-400 font-bold mt-0.5">⚠️ MOCK TEST ACCOUNT</span>
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
                          {disconnectingId === acc.id ? "Disconnecting…" : "Disconnect"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
