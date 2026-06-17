import { Worker, Job } from "bullmq";
import { redisConnection } from "./connection";
import { QUEUE_NAME, type OutreachJob } from "./queue";
import { db } from "@/lib/db";
import { generatePitch } from "@/lib/llm/pitch-generator";
import { sendEmail } from "@/lib/email/sender";
import { decrypt } from "@/lib/encryption";

async function processJob(job: Job<OutreachJob>) {
  const data = job.data;

  if (data.type === "generate-pitch") {
    await handleGeneratePitch(data.outreachId, data.userId);
  } else if (data.type === "send-email") {
    await handleSendEmail(data.outreachId, data.userId);
  }
}

async function handleGeneratePitch(outreachId: string, userId: string) {
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

  if (!outreach) throw new Error(`Outreach ${outreachId} not found`);

  const llmConfig = await db.llmConfig.findUnique({ where: { userId } });
  if (!llmConfig) throw new Error("LLM not configured. Please set up in Settings.");

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
      apiBaseUrl: llmConfig.apiBaseUrl,
      apiKey: decrypt(llmConfig.apiKey),
      modelName: llmConfig.modelName,
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
    where: { id: outreach.campaignId },
    data: { drafted: { increment: 1 } },
  });
}

async function handleSendEmail(outreachId: string, _userId: string) {
  const outreach = await db.outreach.findUnique({
    where: { id: outreachId },
    include: {
      sponsor: true,
      emailAccount: true,
    },
  });

  if (!outreach) throw new Error(`Outreach ${outreachId} not found`);
  if (!outreach.subject || !outreach.body) {
    throw new Error("Email not generated yet");
  }
  if (!outreach.emailAccount) throw new Error("No email account configured");

  const bodyHtml = outreach.body
    .split("\n")
    .map((line) => `<p>${line}</p>`)
    .join("");

  const info = await sendEmail({
    account: outreach.emailAccount,
    to: outreach.sponsor.contactEmail,
    subject: outreach.subject,
    html: bodyHtml,
    text: outreach.body,
  });

  await db.outreach.update({
    where: { id: outreachId },
    data: {
      status: "SENT",
      sentAt: new Date(),
      messageId: info.messageId,
    },
  });

  await db.campaign.update({
    where: { id: outreach.campaignId },
    data: { sent: { increment: 1 } },
  });
}

let worker: Worker | null = null;

export function startWorker() {
  if (worker) return worker;

  worker = new Worker<OutreachJob>(QUEUE_NAME, processJob, {
    connection: redisConnection as any,
    concurrency: 3,
  });

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} (${job.data.type}) completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  console.log("[Worker] SponsorshipIQ outreach worker started");
  return worker;
}
