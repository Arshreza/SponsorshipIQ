import { Queue } from "bullmq";
import { redisConnection } from "./connection";

export const QUEUE_NAME = "sponsorshipiq-outreach";

export interface GeneratePitchJob {
  type: "generate-pitch";
  outreachId: string;
  campaignId: string;
  sponsorId: string;
  userId: string;
}

export interface SendEmailJob {
  type: "send-email";
  outreachId: string;
  campaignId: string;
  userId: string;
}

export type OutreachJob = GeneratePitchJob | SendEmailJob;

export const outreachQueue = new Queue<OutreachJob>(QUEUE_NAME, {
  connection: redisConnection as any,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  },
});
