"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",                icon: "📊", label: "Overview",       exact: true },
  { href: "/dashboard/fest-profiles",  icon: "🎪", label: "Fest Profiles" },
  { href: "/dashboard/sponsors",       icon: "🏢", label: "Sponsors" },
  { href: "/dashboard/sponsor-lists",  icon: "📋", label: "Sponsor Lists" },
  { href: "/dashboard/campaigns",      icon: "🚀", label: "Campaigns" },
  { href: "/dashboard/pipeline",       icon: "📊", label: "Pipeline" },
  { href: "/dashboard/email-accounts", icon: "📬", label: "Email Accounts" },
  { href: "/dashboard/settings",       icon: "⚙️", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <aside className="flex flex-col w-64 shrink-0 bg-sidebar-bg border-r border-sidebar-border h-screen overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-lg shadow-brand-500/30 shrink-0">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <div>
          <span className="text-sidebar-fg font-bold text-sm leading-none">SponsorshipIQ</span>
          <p className="text-sidebar-fg-muted text-[10px] mt-0.5">Sponsorship Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
              isActive(item)
                ? "bg-brand-600/20 text-brand-300 border border-brand-600/30"
                : "text-sidebar-fg-muted hover:text-sidebar-fg hover:bg-sidebar-hover"
            )}
          >
            <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
            <span>{item.label}</span>
            {isActive(item) && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-soft" />
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <Link
          href="/dashboard/pipeline/export"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-fg-muted hover:text-sidebar-fg hover:bg-sidebar-hover transition-all"
        >
          <span className="text-base w-5 text-center">🔄</span>
          <span>Handover Export</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-fg-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <span className="text-base w-5 text-center">🚪</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
