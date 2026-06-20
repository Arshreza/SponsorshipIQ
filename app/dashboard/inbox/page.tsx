"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";

type MessageType = "SENT" | "RECEIVED";

interface InboxItem {
  id: string;
  type: MessageType;
  outreachId: string | null;
  inboxMessageId?: string;
  fromEmail: string;
  fromName: string | null;
  toEmail: string;
  toName: string | null;
  companyName: string;
  campaignName: string;
  subject: string;
  bodySnippet: string;
  status: string;
  date: string;
  isRead: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  SENT:       "bg-blue-500/15 text-blue-400 border-blue-500/30",
  REPLIED:    "bg-teal-500/15 text-teal-400 border-teal-500/30",
  OPENED:     "bg-amber-500/15 text-amber-400 border-amber-500/30",
  CONVERTED:  "bg-green-500/15 text-green-400 border-green-500/30",
  INTERESTED: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  REJECTED:   "bg-red-500/15 text-red-400 border-red-500/30",
  BOUNCED:    "bg-red-500/15 text-red-400 border-red-500/30",
};

function Avatar({ name, type }: { name: string; type: MessageType }) {
  const letter = name?.charAt(0)?.toUpperCase() || "?";
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
      type === "RECEIVED"
        ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
        : "bg-brand-500/20 text-brand-400 border border-brand-500/30"
    }`}>
      {letter}
    </div>
  );
}

function formatDate(d: string) {
  const dt = new Date(d);
  const now = new Date();
  const diff = now.getTime() - dt.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return dt.toLocaleDateString();
}

export default function InboxPage() {
  const [messages, setMessages] = useState<InboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "SENT" | "RECEIVED">("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter });
      if (search) params.set("q", search);
      const res = await fetch(`/api/inbox?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      toast.error("Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/inbox/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const count = data.totalSynced || 0;
        toast.success(count > 0 ? `Synced ${count} new message${count !== 1 ? "s" : ""}!` : "Inbox up to date.");
        setLastSynced(new Date().toLocaleTimeString());
        await load();
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch {
      toast.error("Network error during sync");
    } finally {
      setSyncing(false);
    }
  }

  async function handleSelect(msg: InboxItem) {
    setSelected(msg);
    if (msg.type === "RECEIVED" && !msg.isRead && msg.inboxMessageId) {
      await fetch(`/api/inbox/${msg.inboxMessageId}/read`, { method: "PATCH" });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }

  const tabs: { key: "ALL" | "SENT" | "RECEIVED"; label: string; icon: string }[] = [
    { key: "ALL",      label: "All",     icon: "📬" },
    { key: "RECEIVED", label: "Replies", icon: "↩️" },
    { key: "SENT",     label: "Sent",    icon: "📤" },
  ];

  const sentCount = messages.filter(m => m.type === "SENT").length;
  const receivedCount = messages.filter(m => m.type === "RECEIVED").length;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -m-6">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background-secondary shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">📬 Unified Inbox</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastSynced && <span className="text-xs text-foreground-muted hidden sm:block">Last synced {lastSynced}</span>}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 btn-shine gradient-brand text-white rounded-xl shadow shadow-brand-500/20 transition-all disabled:opacity-60"
          >
            {syncing ? (
              <><span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" /> Syncing…</>
            ) : (
              "↻ Sync Now"
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left panel */}
        <div className="w-full sm:w-96 flex flex-col border-r border-border shrink-0">
          {/* Search */}
          <div className="px-4 py-3 border-b border-border">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sender, subject…"
              className="w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex border-b border-border">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
                  filter === t.key
                    ? "border-brand-500 text-brand-400"
                    : "border-transparent text-foreground-muted hover:text-foreground"
                }`}
              >
                {t.icon} {t.label}
                {t.key === "RECEIVED" && receivedCount > 0 && (
                  <span className="ml-1 text-[9px] bg-teal-500/20 text-teal-400 rounded-full px-1.5 py-0.5">{receivedCount}</span>
                )}
                {t.key === "SENT" && sentCount > 0 && (
                  <span className="ml-1 text-[9px] bg-brand-500/20 text-brand-400 rounded-full px-1.5 py-0.5">{sentCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center">
                <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-foreground-muted text-xs">Loading…</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <p className="text-3xl mb-3">📭</p>
                <p className="text-foreground-muted text-sm">
                  {filter === "RECEIVED" ? "No replies yet. Click Sync Now to check." : "No messages found."}
                </p>
                {filter === "ALL" && (
                  <p className="text-xs text-foreground-muted mt-2">Launch a campaign and send emails — they'll appear here.</p>
                )}
              </div>
            ) : (
              messages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={`w-full text-left px-4 py-3.5 border-b border-border/50 hover:bg-background/60 transition-all ${
                    selected?.id === msg.id ? "bg-brand-500/5 border-l-2 border-l-brand-500" : ""
                  } ${!msg.isRead && msg.type === "RECEIVED" ? "bg-teal-500/5" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={msg.type === "RECEIVED" ? msg.fromName || msg.fromEmail : msg.companyName} type={msg.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`text-sm font-semibold truncate ${!msg.isRead && msg.type === "RECEIVED" ? "text-foreground" : "text-foreground-muted"}`}>
                          {msg.type === "RECEIVED" ? (msg.fromName || msg.fromEmail) : msg.companyName}
                          {!msg.isRead && msg.type === "RECEIVED" && (
                            <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
                          )}
                        </span>
                        <span className="text-[10px] text-foreground-muted shrink-0">{formatDate(msg.date)}</span>
                      </div>
                      <p className="text-xs font-medium text-foreground truncate">{msg.subject}</p>
                      <p className="text-[11px] text-foreground-muted truncate mt-0.5">{msg.bodySnippet || "—"}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                          msg.type === "RECEIVED" ? "bg-teal-500/10 text-teal-400 border-teal-500/25" : "bg-brand-500/10 text-brand-400 border-brand-500/25"
                        }`}>
                          {msg.type === "RECEIVED" ? "↩ Reply" : "↗ Sent"}
                        </span>
                        {msg.campaignName && (
                          <span className="text-[9px] text-foreground-muted truncate">{msg.campaignName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer stats */}
          <div className="px-4 py-2 border-t border-border text-[10px] text-foreground-muted flex gap-4 shrink-0">
            <span>{sentCount} sent</span>
            <span>{receivedCount} received</span>
            {unreadCount > 0 && <span className="text-teal-400 font-bold">{unreadCount} unread</span>}
          </div>
        </div>

        {/* Right panel — message detail */}
        <div className="flex-1 overflow-y-auto hidden sm:flex flex-col">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <p className="text-5xl mb-4">📬</p>
              <h2 className="text-lg font-bold text-foreground mb-2">Select a message</h2>
              <p className="text-sm text-foreground-muted max-w-sm">
                Click any message on the left to read it here. Sent pitches and sponsor replies are unified in one view.
              </p>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="mt-6 text-sm font-bold px-5 py-2.5 btn-shine gradient-brand text-white rounded-xl shadow shadow-brand-500/20 disabled:opacity-60"
              >
                {syncing ? "Syncing…" : "↻ Sync Gmail Replies"}
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-6 max-w-3xl">
              {/* Message header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-bold text-foreground leading-tight">{selected.subject}</h2>
                  <span className={`shrink-0 inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_COLOR[selected.status] || "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}>
                    {selected.status}
                  </span>
                </div>

                <div className="bg-background-secondary border border-border rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex gap-3">
                    <span className="text-foreground-muted w-12 shrink-0">From</span>
                    <span className="text-foreground font-medium">
                      {selected.type === "RECEIVED"
                        ? `${selected.fromName ? selected.fromName + " " : ""}<${selected.fromEmail}>`
                        : `${selected.fromName ? selected.fromName + " " : ""}<${selected.fromEmail}>`}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-foreground-muted w-12 shrink-0">To</span>
                    <span className="text-foreground">
                      {selected.type === "RECEIVED"
                        ? `<${selected.toEmail}>`
                        : `${selected.toName ? selected.toName + " " : ""}<${selected.toEmail}>`}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-foreground-muted w-12 shrink-0">Date</span>
                    <span className="text-foreground">{new Date(selected.date).toLocaleString()}</span>
                  </div>
                  {selected.campaignName && (
                    <div className="flex gap-3">
                      <span className="text-foreground-muted w-12 shrink-0">Campaign</span>
                      <span className="text-brand-400 font-medium">{selected.campaignName}</span>
                    </div>
                  )}
                  {selected.companyName && (
                    <div className="flex gap-3">
                      <span className="text-foreground-muted w-12 shrink-0">Brand</span>
                      <span className="text-foreground">{selected.companyName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Body */}
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-sans bg-background-secondary border border-border rounded-xl p-5">
                  {selected.bodySnippet || "(Email body not available — it may not have been synced or stored yet.)"}
                </pre>
              </div>

              {/* Actions */}
              {selected.outreachId && (
                <div className="flex gap-3 pt-2">
                  <Link
                    href={`/dashboard/sponsors`}
                    className="text-xs font-bold px-4 py-2 border border-border rounded-xl text-foreground-muted hover:bg-background transition-all"
                  >
                    View Sponsor
                  </Link>
                  {selected.type === "RECEIVED" && (
                    <span className="text-xs text-teal-400 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      Reply matched to outreach — status updated to Replied
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
