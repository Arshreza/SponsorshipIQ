"use client";

import { useState, useEffect } from "react";

interface AdvisorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryType = "smtp" | "packages" | "prompts" | "variables";

export function AdvisorSidebar({ isOpen, onClose }: AdvisorSidebarProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>("smtp");

  // Prevent background scroll when sidebar is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end no-print">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-background-secondary border-l border-border h-full shadow-2xl flex flex-col animate-slide-in-right z-10">
        
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-background-tertiary">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💡</span>
            <div>
              <h2 className="text-base font-bold text-foreground">Sponsorship Strategist</h2>
              <p className="text-[10px] text-foreground-muted">Context-aware guides & helper cheatsheets</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground p-2 hover:bg-background rounded-xl transition-all"
          >
            ✕
          </button>
        </div>

        {/* Tab Selectors */}
        <div className="flex border-b border-border bg-background/50 text-xs font-semibold overflow-x-auto shrink-0">
          {[
            { id: "smtp", label: "📧 SMTP Setup", desc: "Gmail Passwords" },
            { id: "packages", label: "📦 India Packages", desc: "Pricing tiers" },
            { id: "prompts", label: "🤖 AI Prompting", desc: "Prompt guidelines" },
            { id: "variables", label: "🔑 Variables", desc: "Subject templates" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as CategoryType)}
              className={`flex-1 py-3 px-2 border-b-2 text-center transition-all min-w-[90px] ${
                activeCategory === tab.id
                  ? "border-brand-500 text-brand-600 bg-background-secondary"
                  : "border-transparent text-foreground-muted hover:text-foreground hover:bg-background-secondary/30"
              }`}
            >
              <div>{tab.label}</div>
            </button>
          ))}
        </div>

        {/* Advisor Content Scroll area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* SMTP GUIDE */}
          {activeCategory === "smtp" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>📧</span> Google Account App Password Setup
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Standard Gmail credentials will be blocked by Google security. You must generate a secure 16-character App Password to connect.
              </p>

              <div className="space-y-3">
                {[
                  { step: "01", text: "Go to Google Account Settings (myaccount.google.com)." },
                  { step: "02", text: "Ensure 2-Step Verification is turned ON in the Security tab." },
                  { step: "03", text: "Search for 'App Passwords' in the search bar." },
                  { step: "04", text: "Enter 'SponsorshipIQ' as the App name and click Create." },
                  { step: "05", text: "Copy the yellow 16-character code (exclude spaces)." },
                ].map((s) => (
                  <div key={s.step} className="flex gap-3 bg-background border border-border p-3 rounded-xl items-start">
                    <span className="text-xs font-mono font-bold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-lg">{s.step}</span>
                    <p className="text-xs text-foreground-secondary leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>

              <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 text-xs text-brand-400 leading-relaxed">
                ℹ️ <strong>Alternative SMTP:</strong> You can also connect custom university email addresses. Input host: <code>smtp.gmail.com</code>, port: <code>587</code>, username: your full email, secure: checked.
              </div>
            </div>
          )}

          {/* SPONSORSHIP PACKAGES */}
          {activeCategory === "packages" && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>📦</span> Indian College Fest Pricing Guide
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Brand marketing teams analyze college sponsorships relative to their industry. Tailor your packages appropriately:
              </p>

              <div className="space-y-4">
                {[
                  {
                    tier: "Title Sponsor (₹2,00,000 - ₹5,00,000)",
                    sectors: "Automobile, Tech giants, FinTech, Telecom",
                    deliverables: "Exclusive stage branding, live product launching, social media coverage (15K reach), 15-min keynote panel presentation slot.",
                  },
                  {
                    tier: "Co-Sponsor / Event Sponsor (₹1,00,000 - ₹2,00,000)",
                    sectors: "Beverage partners, clothing lines, FMCG brands",
                    deliverables: "Banner display across high-footfall spots, digital branding, interactive booth stall in food courts (10x10 space).",
                  },
                  {
                    tier: "Stall / Associate Sponsor (₹30,000 - ₹60,000)",
                    sectors: "Local restaurants, stationery, bookshops, local startups",
                    deliverables: "Small visual logo on backdrops, stall placement near ticketing booths, flyers distribution.",
                  },
                ].map((p, idx) => (
                  <div key={idx} className="border border-border rounded-xl p-4 bg-background space-y-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-500" /> {p.tier}
                    </h4>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-foreground-muted tracking-wider block">Target Industries</span>
                      <p className="text-xs text-brand-600 font-semibold">{p.sectors}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-foreground-muted tracking-wider block">Key Deliverables</span>
                      <p className="text-[11px] text-foreground-secondary leading-relaxed">{p.deliverables}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI PROMPTING GUIDELINES */}
          {activeCategory === "prompts" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>🤖</span> Prompt Guidelines Blueprint
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Guidelines direct Claude to reference specific USPs and avoid generic cold email templates. Use these formats:
              </p>

              <div className="space-y-3">
                {[
                  {
                    title: "Writing a good Hook instruction",
                    example: "Open with a reference to the brand's focus on sustainable energy or tech integration in youth culture.",
                  },
                  {
                    title: "Instructing package references",
                    example: "For beverages, emphasize food court footprints. For coding platforms, emphasize hackathon sponsor slots (₹75K).",
                  },
                  {
                    title: "Anti-Prompting (What to avoid)",
                    example: "Never start with generic greetings. Never sound corporate or apologetic. Do not write more than 3 paragraphs.",
                  },
                ].map((g, idx) => (
                  <div key={idx} className="border border-border rounded-xl p-4 bg-background space-y-1">
                    <h4 className="text-xs font-bold text-foreground">{g.title}</h4>
                    <p className="text-[10px] text-foreground-muted italic">Example guideline rule:</p>
                    <p className="text-xs text-foreground-secondary font-medium leading-relaxed">&quot;{g.example}&quot;</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEMPLATE VARIABLES */}
          {activeCategory === "variables" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>🔑</span> Subject Template Variables
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Subject line templates can use dynamic placeholders, which will automatically inject values per sponsor.
              </p>

              <div className="space-y-3">
                <div className="bg-background border border-border rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs border-b border-border pb-1.5">
                    <span className="font-mono text-brand-600 font-bold">{"{companyName}"}</span>
                    <span className="text-foreground-muted">Sponsor&apos;s company name</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-brand-600 font-bold">{"{festName}"}</span>
                    <span className="text-foreground-muted">Festival profile name</span>
                  </div>
                </div>

                <div className="border border-border-hover rounded-xl p-4 bg-background/50 space-y-2">
                  <h4 className="text-xs font-bold text-foreground">High Performing Examples:</h4>
                  {[
                    "Outreach: {companyName} x {festName} 2025",
                    "Marketing activation at {festName} — {companyName}",
                    "Sponsoring {festName} coding arena ({companyName})",
                  ].map((ex) => (
                    <div key={ex} className="font-mono text-[10px] text-foreground-secondary bg-background border border-border p-2.5 rounded-lg select-all">
                      {ex}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-background-tertiary text-center text-[10px] text-foreground-muted select-none">
          SponsorshipIQ Outreach Advisor • Built for student success
        </div>
      </div>
    </div>
  );
}
