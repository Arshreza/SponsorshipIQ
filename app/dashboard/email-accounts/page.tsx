import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmailAccountsList } from "@/components/email-accounts/email-accounts-list";

export default async function EmailAccountsPage() {
  const session = await auth();
  if (!session) return null;

  const accounts = await db.emailAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Email Accounts</h1>
        <p className="text-foreground-muted text-sm mt-1">
          Connect a Gmail or SMTP account to send sponsorship emails from the dashboard.
        </p>
      </div>
      <EmailAccountsList accounts={accounts} />
    </div>
  );
}
