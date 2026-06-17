"use client";

import { useState } from "react";
import { toast } from "sonner";

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
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map((col) => (
          <div key={col.id} className={`w-64 shrink-0`}>
            <div className={`flex items-center gap-2 px-4 py-2.5 border-b-2 ${col.color} mb-3`}>
              <span>{col.icon}</span>
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">{col.label}</span>
              <span className="ml-auto text-xs font-bold text-foreground-muted bg-background-tertiary px-2 py-0.5 rounded-full">
                {grouped[col.id]?.length || 0}
              </span>
            </div>
            <div className="space-y-3">
              {(grouped[col.id] || []).map((o) => (
                <div
                  key={o.id}
                  className="bg-background-secondary border border-border rounded-xl p-4 hover:border-brand-300 transition-all group"
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
                    <div className="text-xs text-foreground-muted">{o.sponsor.contactName}</div>
                  )}
                  {o.sponsor.industry && (
                    <span className="inline-block mt-2 text-[10px] bg-background-tertiary border border-border px-2 py-0.5 rounded-full text-foreground-muted">
                      {o.sponsor.industry}
                    </span>
                  )}
                  <div className="mt-3 pt-3 border-t border-border text-[10px] text-foreground-muted">
                    {o.campaign.festProfile.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
