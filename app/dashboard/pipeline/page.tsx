import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";

export default async function PipelinePage() {
  const session = await auth();
  if (!session) return null;

  const outreaches = await db.outreach.findMany({
    where: { campaign: { userId: session.user.id } },
    include: {
      sponsor: { select: { companyName: true, contactEmail: true, contactName: true, industry: true } },
      campaign: { select: { name: true, festProfile: { select: { name: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-foreground-muted text-sm mt-1">
            Track every sponsor from first pitch to confirmed deal.
          </p>
        </div>
        <a
          href="/api/pipeline/export"
          className="text-sm font-semibold text-foreground-muted hover:text-foreground border border-border hover:border-border-hover px-4 py-2.5 rounded-xl transition-all"
        >
          🔄 Export CSV
        </a>
      </div>
      <PipelineBoard outreaches={outreaches} />
    </div>
  );
}
