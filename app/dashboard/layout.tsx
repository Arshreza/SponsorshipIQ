import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/shared/sidebar";
import { Toaster } from "sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen bg-background-tertiary overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Topbar */}
          <header className="h-14 shrink-0 bg-background-secondary border-b border-border flex items-center px-6 gap-4">
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-foreground leading-none">
                  {session.user?.name || "User"}
                </p>
                <p className="text-[10px] text-foreground-muted mt-0.5">
                  {session.user?.email}
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-6 py-8 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
      <Toaster position="bottom-right" richColors closeButton />
    </SessionProvider>
  );
}
