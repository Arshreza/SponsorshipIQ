import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { DashboardWrapper } from "@/components/shared/dashboard-wrapper";
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
      <DashboardWrapper user={session.user}>
        {children}
      </DashboardWrapper>
      <Toaster position="bottom-right" richColors closeButton />
    </SessionProvider>
  );
}

