"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { AdvisorSidebar } from "./advisor-sidebar";

interface DashboardWrapperProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function DashboardWrapper({ children, user }: DashboardWrapperProps) {
  const [advisorOpen, setAdvisorOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background-tertiary overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar Header */}
        <header className="h-14 shrink-0 bg-background-secondary border-b border-border flex items-center px-6 justify-between gap-4 z-20">
          
          {/* Breadcrumbs / Page Context indicator */}
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <span className="font-semibold text-foreground">SponsorshipIQ Portal</span>
            <span>•</span>
            <span className="text-[10px] bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full font-bold text-brand-600 animate-pulse-soft">
              Active CRM Mode
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Outreach Advisor Button */}
            <button
              onClick={() => setAdvisorOpen(true)}
              className="flex items-center gap-2 border border-brand-400 bg-brand-500/5 hover:bg-brand-500/15 text-brand-600 hover:text-brand-500 transition-all text-xs font-bold px-3.5 py-1.5 rounded-xl hover:scale-105"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              <span>💡 Outreach Advisor</span>
            </button>

            {/* User Profile Info */}
            <div className="flex items-center gap-2 border-l border-border pl-4">
              <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center text-white text-xs font-extrabold shadow-md shadow-brand-500/15">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-foreground leading-none">
                  {user.name || "User"}
                </p>
                <p className="text-[9px] text-foreground-muted mt-0.5 max-w-[120px] truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Scrolling Window */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Slideout Strategist Advisor Panel */}
      <AdvisorSidebar 
        isOpen={advisorOpen} 
        onClose={() => setAdvisorOpen(false)} 
      />
    </div>
  );
}
