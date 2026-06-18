import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { outreachQueue } from "@/lib/queue/queue";
import { generatePitch } from "@/lib/llm/pitch-generator";
import { decrypt } from "@/lib/encryption";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const campaign = await db.campaign.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  // Get pending outreaches
  const outreaches = await db.outreach.findMany({
    where: { campaignId: id, status: "PENDING" },
    select: { id: true, sponsorId: true },
  });

  if (outreaches.length === 0) {
    return NextResponse.json({ message: "No pending outreaches to generate", queued: 0 });
  }

  // Queue generation jobs
  const jobs = outreaches.map((o) => ({
    name: "generate-pitch",
    data: {
      type: "generate-pitch" as const,
      outreachId: o.id,
      campaignId: id,
      sponsorId: o.sponsorId,
      userId: session.user.id,
    },
    opts: { delay: 0 },
  }));

  let isQueuedInRedis = false;

  try {
    await outreachQueue.addBulk(jobs as any);
    isQueuedInRedis = true;
  } catch (err) {
    console.warn("[Campaign Generate API] Redis connection failed, running sync fallback in background:", err);
    runGenerateJobsSync(jobs, id);
  }

  await db.campaign.update({
    where: { id },
    data: { 
      status: "GENERATING", 
      launchedAt: new Date() 
    },
  });

  return NextResponse.json({ 
    queued: outreaches.length, 
    message: isQueuedInRedis 
      ? `Queued ${outreaches.length} pitch generations in Redis.` 
      : `Queued ${outreaches.length} pitch generations locally (Redis connection bypassed).` 
  });
}

// Local Sync Fallback runner to process generations without Redis
async function runGenerateJobsSync(jobs: any[], campaignId: string) {
  // Execute in background promise so response returns immediately
  (async () => {
    try {
      console.log(`[Sync Fallback] Starting generation for ${jobs.length} jobs...`);
      for (const job of jobs) {
        const { outreachId, userId } = job.data;

        const outreach = await db.outreach.findUnique({
          where: { id: outreachId },
          include: {
            sponsor: true,
            campaign: {
              include: {
                festProfile: true,
                emailAccount: true,
              },
            },
          },
        });
        if (!outreach) continue;

        // Load configuration
        const llmConfig = await db.llmConfig.findUnique({ where: { userId } });
        const apiKey = llmConfig?.apiKey ? (llmConfig.apiKey === "mock" ? "mock" : decrypt(llmConfig.apiKey)) : "mock";

        const { festProfile } = outreach.campaign;
        const { sponsor } = outreach;

        const result = await generatePitch(
          {
            festName: festProfile.name,
            festType: festProfile.festType,
            college: festProfile.college,
            city: festProfile.city,
            theme: festProfile.theme,
            edition: festProfile.edition,
            eventDates: festProfile.eventDates,
            expectedFootfall: festProfile.expectedFootfall,
            socialMediaReach: festProfile.socialMediaReach,
            packages: festProfile.packages,
            pitchHighlights: festProfile.pitchHighlights,
            companyName: sponsor.companyName,
            industry: sponsor.industry,
            website: sponsor.website,
            contactName: sponsor.contactName,
            aiResearch: sponsor.aiResearch,
            senderName: outreach.campaign.emailAccount?.displayName,
            senderEmail: outreach.campaign.emailAccount?.emailAddress || "",
            guidelines: outreach.campaign.guidelines,
            toneOfVoice: outreach.campaign.toneOfVoice,
            emailWordLimit: outreach.campaign.emailWordLimit,
            subjectTemplate: outreach.campaign.subjectTemplate,
          },
          {
            apiBaseUrl: llmConfig?.apiBaseUrl || "https://api.anthropic.com/v1",
            apiKey: apiKey,
            modelName: llmConfig?.modelName,
          }
        );

        await db.outreach.update({
          where: { id: outreachId },
          data: {
            subject: result.subject,
            body: result.body,
            status: "DRAFTED",
            generatedAt: new Date(),
          },
        });

        // Update campaign stats
        await db.campaign.update({
          where: { id: campaignId },
          data: { drafted: { increment: 1 } },
        });
      }

      // Mark campaign as ready when all are finished
      await db.campaign.update({
        where: { id: campaignId },
        data: { status: "READY" },
      });
      console.log("[Sync Fallback] All local generations completed!");
    } catch (e) {
      console.error("[Sync Fallback] Error in local job generation runner:", e);
    }
  })();
}
