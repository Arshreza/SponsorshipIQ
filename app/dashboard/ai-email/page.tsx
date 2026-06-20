"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface FormData {
  companyName: string;
  industry: string;
  contactName: string;
  festName: string;
  festTheme: string;
  festDate: string;
  expectedFootfall: string;
  highlights: string;
  tone: string;
}

interface EmailAccount {
  id: string;
  emailAddress: string;
  displayName: string | null;
  status: string;
}

function parseEmail(raw: string): { subject: string; body: string } {
  const lines = raw.split("\n");
  const subjectLine = lines.find(l => l.toLowerCase().startsWith("subject:"));
  const subject = subjectLine ? subjectLine.replace(/^subject:\s*/i, "").trim() : "";
  const bodyStart = subjectLine ? lines.indexOf(subjectLine) + 1 : 0;
  const body = lines.slice(bodyStart).join("\n").replace(/^\s*\n/, "").trim();
  return { subject, body };
}

export default function AIEmailPage() {
  const [form, setForm] = useState<FormData>({
    companyName: "",
    industry: "",
    contactName: "",
    festName: "Synapse 2025",
    festTheme: "Ignite the Future",
    festDate: "March 15-17, 2025",
    expectedFootfall: "5000",
    highlights: "12-year legacy, past sponsors Amazon & HDFC, 15,000 Instagram followers, live media coverage",
    tone: "Friendly & Casual",
  });

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/settings/email")
      .then(r => r.json())
      .then(data => {
        const connected = data.filter((a: EmailAccount) => a.status === "CONNECTED");
        setEmailAccounts(connected);
        if (connected.length > 0) setSelectedAccountId(connected[0].id);
      })
      .catch(() => {});
  }, []);

  function setField(key: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function sendGeneratedEmail() {
    if (!recipientEmail.trim()) { toast.error("Enter the recipient's email address"); return; }
    if (!selectedAccountId) { toast.error("Select a sender email account"); return; }
    if (!email) { toast.error("Generate an email first"); return; }

    const { subject, body } = parseEmail(email);
    if (!subject) { toast.error("Could not parse subject from generated email"); return; }

    setSending(true);
    try {
      const res = await fetch("/api/ai/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipientEmail.trim(), subject, body, emailAccountId: selectedAccountId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Email sent to ${recipientEmail}!`);
      } else {
        toast.error(data.error || "Failed to send email");
      }
    } catch {
      toast.error("Network error sending email");
    } finally {
      setSending(false);
    }
  }

  async function generateEmail() {
    if (!form.companyName || !form.contactName || !form.festName) {
      toast.error("Please fill in Company, Contact Name, and Fest Name");
      return;
    }
    setLoading(true);
    setEmail("");
    try {
      const res = await fetch("/api/ai/cold-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setEmail(data.email);
        toast.success("✨ Email generated!");
      } else {
        toast.error(data.error || "Failed to generate email");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyEmail() {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass = "w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all";
  const labelClass = "block text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center text-xl shadow-lg shadow-brand-500/30">🤖</div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Outreach Email</h1>
          <p className="text-foreground-muted text-sm">
            Powered by <span className="text-brand-400 font-semibold">Groq · LLaMA 3.3</span> — short, human, gets replies
          </p>
        </div>
      </div>

      {/* Tip banner */}
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-3 flex items-start gap-3">
        <span className="text-lg mt-0.5">💡</span>
        <p className="text-xs text-amber-300 leading-relaxed">
          <strong>Approach:</strong> This email builds curiosity and asks for a conversation — no money mentioned, no templates. 
          First email = get a reply. Money talk comes later when they're interested.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-background-secondary border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            ✍️ Fill in the details
          </h2>

          {/* Sponsor Details */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">About the Company</p>
            <div>
              <label className={labelClass}>Company Name *</label>
              <input value={form.companyName} onChange={e => setField("companyName", e.target.value)} placeholder="e.g. Zomato" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Contact Person *</label>
                <input value={form.contactName} onChange={e => setField("contactName", e.target.value)} placeholder="Ananya Patel" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Their Industry</label>
                <input value={form.industry} onChange={e => setField("industry", e.target.value)} placeholder="Food Tech" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Fest Details */}
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">About Your Fest</p>
            <div>
              <label className={labelClass}>Festival Name *</label>
              <input value={form.festName} onChange={e => setField("festName", e.target.value)} placeholder="Synapse 2025" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Theme / Tagline</label>
                <input value={form.festTheme} onChange={e => setField("festTheme", e.target.value)} placeholder="Ignite the Future" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Event Dates</label>
                <input value={form.festDate} onChange={e => setField("festDate", e.target.value)} placeholder="March 15-17, 2025" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Expected Footfall</label>
                <input value={form.expectedFootfall} onChange={e => setField("expectedFootfall", e.target.value)} placeholder="5000" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Writing Tone</label>
                <select value={form.tone} onChange={e => setField("tone", e.target.value)} className={inputClass}>
                  {["Friendly & Casual", "Professional", "Enthusiastic", "Concise & Direct", "Formal"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Fest Highlights (what makes it special)</label>
              <textarea
                value={form.highlights}
                onChange={e => setField("highlights", e.target.value)}
                rows={2}
                placeholder="12-year legacy, past sponsors Amazon, 15K Instagram followers…"
                className={inputClass}
              />
            </div>
          </div>

          <button
            onClick={generateEmail}
            disabled={loading}
            className="w-full btn-shine gradient-brand text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-500/25 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Writing your email…
              </>
            ) : (
              <>✨ Generate Email</>
            )}
          </button>
        </div>

        {/* Output */}
        <div className="bg-background-secondary border border-border rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              📧 Your Email
            </h2>
            {email && (
              <button
                onClick={copyEmail}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  copied
                    ? "bg-green-500/15 text-green-400 border-green-500/30"
                    : "bg-brand-500/10 text-brand-400 border-brand-500/30 hover:bg-brand-500/20"
                }`}
              >
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
            )}
          </div>

          {!email && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="text-5xl mb-4">✉️</div>
              <p className="text-foreground-muted text-sm max-w-xs">
                Fill in the details and hit Generate — AI will write a short, genuine email that actually gets replies.
              </p>
              <div className="mt-6 space-y-2 text-xs text-foreground-muted text-left max-w-xs">
                <div className="flex items-center gap-2"><span className="text-green-400">✓</span> Sounds human, not templated</div>
                <div className="flex items-center gap-2"><span className="text-green-400">✓</span> No money mentioned</div>
                <div className="flex items-center gap-2"><span className="text-green-400">✓</span> Max 150 words — busy people actually read it</div>
                <div className="flex items-center gap-2"><span className="text-green-400">✓</span> Ends with one easy ask</div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-foreground-muted">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Groq LLaMA 3.3 · ~2-3 seconds
              </div>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4" />
              <p className="text-foreground-muted text-sm">Writing something that actually gets a reply…</p>
            </div>
          )}

          {email && (
            <div className="flex-1 flex flex-col gap-4">
              <textarea
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 bg-background rounded-xl p-4 text-sm text-foreground leading-relaxed resize-none overflow-y-auto max-h-[360px] min-h-[200px] border border-border focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all w-full"
              />

              {/* Send directly */}
              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">Send This Email</p>
                <div>
                  <label className="block text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full bg-background border border-border text-foreground placeholder-foreground-muted rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                  />
                </div>
                {emailAccounts.length > 0 ? (
                  <div>
                    <label className="block text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-1">Send From</label>
                    <select
                      value={selectedAccountId}
                      onChange={e => setSelectedAccountId(e.target.value)}
                      className="w-full bg-background border border-border text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                    >
                      {emailAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.emailAddress}{a.displayName ? ` (${a.displayName})` : ""}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-amber-400">
                    No email accounts connected.{" "}
                    <a href="/dashboard/settings/email" className="text-brand-400 hover:underline font-bold">Connect one →</a>
                  </p>
                )}
                <button
                  onClick={sendGeneratedEmail}
                  disabled={sending || emailAccounts.length === 0}
                  className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <><span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" /> Sending…</>
                  ) : "Send Email →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
