"use client";

import { useState } from "react";
import { toast } from "sonner";

type Sponsor = { id: string; companyName: string; contactEmail: string; industry?: string | null };
type SponsorListEntry = { sponsor: { companyName: string; industry?: string | null } };
type SponsorList = { id: string; name: string; description?: string | null; entries: SponsorListEntry[] };

export function SponsorListsClient({
  lists: initialLists,
  allSponsors,
}: {
  lists: SponsorList[];
  allSponsors: Sponsor[];
}) {
  const [lists, setLists] = useState(initialLists);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [loading, setLoading] = useState(false);

  async function createList() {
    if (!newListName.trim()) { toast.error("List name required"); return; }
    setLoading(true);
    const res = await fetch("/api/sponsor-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newListName, description: newListDesc }),
    });
    setLoading(false);
    if (res.ok) {
      const newList = await res.json();
      setLists([{ ...newList, entries: [] }, ...lists]);
      setShowCreateForm(false);
      setNewListName("");
      toast.success("Sponsor list created!");
    } else {
      toast.error("Failed to create list");
    }
  }

  async function deleteList(id: string) {
    const res = await fetch(`/api/sponsor-lists/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLists(lists.filter((l) => l.id !== id));
      toast.success("List deleted");
    } else {
      toast.error("Failed to delete list");
    }
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";

  return (
    <div className="space-y-5">
      {lists.length === 0 && !showCreateForm && (
        <div className="bg-background-secondary border border-border rounded-2xl p-16 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-bold text-foreground mb-2">No sponsor lists yet</h3>
          <p className="text-foreground-muted text-sm mb-6 max-w-sm mx-auto">
            Create named lists to group sponsors and attach them to campaigns.
          </p>
          <button onClick={() => setShowCreateForm(true)} className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm">
            Create first list
          </button>
        </div>
      )}

      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          className="text-sm font-semibold text-brand-600 hover:text-brand-500 border border-dashed border-brand-300 hover:border-brand-400 w-full py-3 rounded-2xl transition-all"
        >
          + New Sponsor List
        </button>
      ) : (
        <div className="bg-background-secondary border border-border rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-foreground text-sm">Create New List</h3>
          <div>
            <label className="block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5">List Name *</label>
            <input value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="e.g. Tech Brands — Synapse 2025" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5">Description</label>
            <input value={newListDesc} onChange={(e) => setNewListDesc(e.target.value)} placeholder="Optional description" className={inputClass} />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowCreateForm(false)} className="text-sm font-semibold text-foreground-muted hover:text-foreground border border-border px-5 py-2.5 rounded-xl transition-all">Cancel</button>
            <button onClick={createList} disabled={loading} className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60">
              {loading ? "Creating…" : "Create List"}
            </button>
          </div>
        </div>
      )}

      {lists.map((list) => (
        <div key={list.id} className="bg-background-secondary border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h3 className="font-bold text-foreground">{list.name}</h3>
              {list.description && <p className="text-xs text-foreground-muted mt-0.5">{list.description}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-foreground-muted">{list.entries.length} sponsors</span>
              <button onClick={() => deleteList(list.id)} className="text-xs text-foreground-muted hover:text-error-500 font-semibold transition-colors">
                Delete
              </button>
            </div>
          </div>
          <div className="px-6 py-4">
            {list.entries.length === 0 ? (
              <p className="text-xs text-foreground-muted italic">No sponsors in this list yet. Add them from the Sponsors page or via CSV import.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {list.entries.slice(0, 12).map((e, i) => (
                  <span key={i} className="text-xs bg-background-tertiary border border-border px-3 py-1 rounded-full text-foreground-muted">
                    {e.sponsor.companyName}
                  </span>
                ))}
                {list.entries.length > 12 && (
                  <span className="text-xs text-foreground-muted px-3 py-1">+{list.entries.length - 12} more</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
