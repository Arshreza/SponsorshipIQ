"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

const COLUMNS = [
  { id: "PENDING",    label: "Pending",    icon: "⏳", color: "border-slate-500" },
  { id: "DRAFTED",   label: "Drafted",    icon: "✍️",  color: "border-blue-500" },
  { id: "SENT",      label: "Sent",       icon: "📬", color: "border-brand-500" },
  { id: "REPLIED",   label: "Replied",    icon: "💬", color: "border-accent-500" },
  { id: "INTERESTED",label: "Interested", icon: "🔥", color: "border-green-400" },
  { id: "CONVERTED", label: "Converted",  icon: "🏆", color: "border-green-600" },
  { id: "REJECTED",  label: "Rejected",   icon: "❌", color: "border-red-500" },
];

type Outreach = {
  id: string;
  status: string;
  subject?: string | null;
  sentAt?: Date | null;
  sponsor: { companyName: string; contactEmail: string; contactName?: string | null; industry?: string | null };
  campaign: { name: string; festProfile: { name: string } };
};

export function PipelineBoard({ outreaches }: { outreaches: Outreach[] }) {
  const [items, setItems] = useState(outreaches);

  async function updateStatus(id: string, status: string) {
    const prev = items;
    setItems(items.map((o) => o.id === id ? { ...o, status } : o));
    const res = await fetch(`/api/outreach/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setItems(prev);
      toast.error("Failed to update status");
    } else {
      toast.success(`Moved to ${status}`);
    }
  }

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = items.filter((o) => o.status === col.id);
    return acc;
  }, {} as Record<string, Outreach[]>);

  if (items.length === 0) {
    return (
      <div className="bg-background-secondary border border-border rounded-2xl p-16 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-bold text-foreground mb-2">Pipeline is empty</h3>
        <p className="text-foreground-muted text-sm">Launch a campaign to start tracking sponsors.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max p-1">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="w-64 shrink-0 bg-background-secondary/30 border border-border/50 rounded-2xl p-3 flex flex-col min-h-[500px] hover:bg-background-secondary/40 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/plain");
              if (id) updateStatus(id, col.id);
            }}
          >
            <div className={`flex items-center gap-2 px-3 py-2 border-b-2 ${col.color} mb-4`}>
              <span>{col.icon}</span>
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">{col.label}</span>
              <span className="ml-auto text-xs font-bold text-foreground-muted bg-background-tertiary px-2 py-0.5 rounded-full">
                {grouped[col.id]?.length || 0}
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {(grouped[col.id] || []).map((o) => (
                <div
                  key={o.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", o.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="bg-background-secondary border border-border rounded-xl p-4 hover:border-brand-300 transition-all group cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-7 h-7 rounded-lg bg-background-tertiary flex items-center justify-center text-xs font-bold text-foreground-secondary shrink-0">
                      {o.sponsor.companyName[0]}
                    </div>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="text-[10px] bg-transparent text-foreground-muted border-0 focus:outline-none cursor-pointer hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="font-semibold text-sm text-foreground truncate">{o.sponsor.companyName}</div>
                  {o.sponsor.contactName && (
                    <div className="text-xs text-foreground-muted truncate mt-0.5">{o.sponsor.contactName}</div>
                  )}
                  {o.sponsor.industry && (
                    <span className="inline-block mt-2 text-[10px] bg-background-tertiary border border-border px-2 py-0.5 rounded-full text-foreground-muted">
                      {o.sponsor.industry}
                    </span>
                  )}
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-foreground-muted">
                    <span className="truncate max-w-[120px]">{o.campaign.festProfile.name}</span>
                    <Link
                      href={`/dashboard/sponsors/${o.id}`}
                      className="text-brand-600 hover:text-brand-500 font-semibold"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
              {(grouped[col.id] || []).length === 0 && (
                <div className="text-center py-8 text-[10px] text-foreground-muted border border-dashed border-border/40 rounded-xl flex-1 flex items-center justify-center h-24">
                  Drag cards here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
