import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LlmSettings } from "@/components/settings/llm-settings";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) return null;

  const llmConfig = await db.llmConfig.findUnique({
    where: { userId: session.user.id },
    select: { apiBaseUrl: true, modelName: true, isValid: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-foreground-muted text-sm mt-1">Configure your LLM connection and global preferences.</p>
      </div>
      <LlmSettings defaultValues={llmConfig} />
    </div>
  );
}
