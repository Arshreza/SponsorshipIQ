"use client";

import { useState } from "react";
import { toast } from "sonner";

interface LlmSettingsProps {
  defaultValues?: { apiBaseUrl?: string; modelName?: string | null; isValid?: boolean } | null;
}

export function LlmSettings({ defaultValues }: LlmSettingsProps) {
  const [form, setForm] = useState({
    apiBaseUrl: defaultValues?.apiBaseUrl || "https://api.anthropic.com/v1",
    apiKey: "",
    modelName: defaultValues?.modelName || "claude-3-5-sonnet-20241022",
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/settings/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) toast.success("LLM configuration saved!");
    else { const d = await res.json(); toast.error(d.error || "Failed to save"); }
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5";

  const presets = [
    { label: "Claude (Anthropic)", url: "https://api.anthropic.com/v1", model: "claude-3-5-sonnet-20241022" },
    { label: "Groq", url: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
    { label: "OpenAI", url: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  ];

  return (
    <div className="bg-background-secondary border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-xl">🤖</div>
        <div>
          <h2 className="font-bold text-foreground">LLM Configuration</h2>
          <p className="text-xs text-foreground-muted">Powers AI pitch generation for sponsors</p>
        </div>
        {defaultValues?.isValid && (
          <span className="ml-auto status-badge status-interested">✓ Connected</span>
        )}
      </div>

      {/* Presets */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setForm({ ...form, apiBaseUrl: p.url, modelName: p.model })}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              form.apiBaseUrl === p.url
                ? 'border-brand-400 bg-brand-500/10 text-brand-600'
                : 'border-border text-foreground-muted hover:border-border-hover hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className={labelClass}>API Base URL</label>
          <input value={form.apiBaseUrl} onChange={(e) => setForm({...form, apiBaseUrl: e.target.value})} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>API Key *</label>
          <input required type="password" value={form.apiKey} onChange={(e) => setForm({...form, apiKey: e.target.value})} placeholder="sk-ant-... or gsk_..." className={inputClass} />
          <p className="text-xs text-foreground-muted mt-1">Your key is encrypted before storage and never exposed in the UI.</p>
        </div>
        <div>
          <label className={labelClass}>Model Name</label>
          <input value={form.modelName} onChange={(e) => setForm({...form, modelName: e.target.value})} className={inputClass} />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-shine gradient-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60">
            {loading ? "Saving…" : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
